import { NextRequest } from "next/server";
import cloudinary, { CLOUDINARY_FOLDER } from "@/lib/cloudinary";
import { redis } from "@/lib/redis";
import { randomUUID } from "crypto";
import { CODE_FILE_MAX_SIZE, CODE_FILE_EXTENSIONS } from "@/lib/consts";
import { createCORSHeaders, handleCORS, validateSecretKey, createErrorResponse, createSuccessResponse } from "@/lib/api-utils";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

export async function OPTIONS(req: NextRequest) {
  return handleCORS(req);
}

// Convert extensions from .ext format to ext format for comparison
const ALLOWED_EXTENSIONS = CODE_FILE_EXTENSIONS.map(ext => ext.substring(1));

export async function POST(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const teamname = (formData.get("username") as string) || "anonymous";
  const secretKey = formData.get("secretKey") as string;

  // Validate secret key
  const secretKeyError = validateSecretKey(secretKey, corsHeaders);
  if (secretKeyError) return secretKeyError;

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
  await redis.rPush(`task_queue`, taskString);

  return createSuccessResponse({
    success: true,
    teamname,
    file: file.name,
    cloudinary: upload,
  }, corsHeaders);
}
