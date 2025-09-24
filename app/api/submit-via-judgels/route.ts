import { NextRequest } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";
import { redis } from "@/lib/redis";
import { randomUUID } from "crypto";
import { CODE_FILE_MAX_SIZE, CODE_FILE_EXTENSIONS } from "@/lib/consts";
import { createCORSHeaders, handleCORS, createErrorResponse, createSuccessResponse, verifyJudgelsUser } from "@/lib/api-utils";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

export async function OPTIONS(req: NextRequest) {
  return handleCORS(req);
}

// Convert extensions from .ext format to ext format for comparison
const ALLOWED_EXTENSIONS = CODE_FILE_EXTENSIONS.map(ext => ext.substring(1));
const ENABLE_JUDGELS_PLUGIN = process.env.ENABLE_JUDGELS_PLUGIN?.toLowerCase() === "true";

export async function POST(req: NextRequest) {
  if (ENABLE_JUDGELS_PLUGIN !== true) {
    return new Response("Judgels plugin integration is disabled", { status: 503 });
  }
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);
  let file: File | null = null;
  let teamname = "anonymous";
  let judgelsToken: string | null = null;
  let judgelsUserInfo: { jid: string; username: string; email: string } = { jid: "", username: "", email: "" };
  try {
    const formData = await req.formData();
    file = formData.get("file") as File;
    judgelsToken = req.headers.get("x-judgels-bearer-token");
    judgelsUserInfo = JSON.parse(req.headers.get("x-judgels-user-info") || "{}");
    teamname = judgelsUserInfo['username']
  } catch (error) {
    // detect if its because the form is not filled
    if (error instanceof TypeError) {
      return createErrorResponse("Invalid form data", 400, corsHeaders);
    }
    console.error("Error processing request:", error);
    return createErrorResponse("Error processing request", 500, corsHeaders);
  }
  // console.log(judgelsUserInfo)
  
  if (!judgelsToken) {
    return createErrorResponse("Missing Judgels token", 401, corsHeaders);
  }

  if (!await verifyJudgelsUser(judgelsToken, judgelsUserInfo)) {
    return createErrorResponse("Unauthorized Judgels user", 403, corsHeaders);
  }
  // console.log("1")
  // return createErrorResponse("Not implemented yet", 501, corsHeaders);

  if (!file) {
    return createErrorResponse("No file uploaded", 400, corsHeaders);
  }

  // File size check
  if (file.size > CODE_FILE_MAX_SIZE) {
    return createErrorResponse("File too large", 413, corsHeaders);
  }

  // Extension check
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return createErrorResponse("File type not allowed", 415, corsHeaders);
  }

  console.log("Uploading file:", file.name, "from team:", teamname);

  // Upload to Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  let upload: UploadApiResponse;
  try {
    upload = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: CLOUDINARY_FOLDER,
          public_id: `${teamname}_${Date.now()}`,
        },
        (err: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (err) return reject(err);
          if (!result) return reject(new Error("No upload result"));
          resolve(result);
        }
      ).end(buffer);
    });
  } catch {
    return createErrorResponse("Cloudinary upload failed", 500, corsHeaders);
  }

  // console.log("Cloudinary upload result:", upload);
  
  // Push to Redis queue
  if (!redis.isOpen) {
    await redis.connect();
  }
  // # Data format: {"id": "Some_ID", "filename": "code.cpp", "teamname": "Team A", "code_url": "http://example.com/code.cpp"}
  const taskString = JSON.stringify({
    id: randomUUID(),
    filename: file.name,
    teamname,
    code_url: upload.secure_url,
  });

  // console.log(taskString);
  console.log("Pushing task to Redis queue:", taskString);
  await redis.lPush(`task_queue`, taskString);

  return createSuccessResponse({
    success: true,
    teamname,
    file: file.name,
    cloudinary: upload,
  }, corsHeaders);
}
