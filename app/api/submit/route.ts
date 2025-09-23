import { NextRequest, NextResponse } from "next/server";

const CORS_ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGIN || "*")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

function createCORSHeaders(requestOrigin: string | null): HeadersInit {
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Secret-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

function getAllowedOrigin(requestOrigin: string | null): string | null {
  // Allow wildcard
  if (CORS_ALLOW_ORIGINS.includes("*")) return "*";
  
  // No origin (direct request)
  if (!requestOrigin) return null;
  
  // Check exact match
  if (CORS_ALLOW_ORIGINS.includes(requestOrigin)) return requestOrigin;
  
  // Check for localhost development patterns
  if (requestOrigin.match(/^https?:\/\/localhost(:\d+)?$/) && 
      CORS_ALLOW_ORIGINS.some(origin => origin.includes("localhost"))) {
    return requestOrigin;
  }
  
  return null;
}

function handleCORS(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);
  
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function OPTIONS(req: NextRequest) {
  return handleCORS(req);
}
import cloudinary from "@/lib/cloudinary";
import { redis } from "@/lib/redis";
import { randomUUID } from "crypto";
import { CODE_FILE_MAX_SIZE, CODE_FILE_EXTENSIONS } from "@/lib/consts";

// Convert extensions from .ext format to ext format for comparison
const ALLOWED_EXTENSIONS = CODE_FILE_EXTENSIONS.map(ext => ext.substring(1));

export async function POST(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const teamname = (formData.get("username") as string) || "anonymous";
  const secretKey = formData.get("secretKey") as string;

  // Check secret key (bypass in development mode)
  const isProduction = process.env.NODE_ENV === "production";
  const requiredSecretKey = process.env.API_SECRET_KEY;
  
  if (isProduction && (!secretKey || secretKey !== requiredSecretKey)) {
    return new NextResponse(JSON.stringify({ error: "Invalid or missing secret key" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  if (!file) {
    return new NextResponse(JSON.stringify({ error: "No file uploaded" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // File size check
  if (file.size > CODE_FILE_MAX_SIZE) {
    return new NextResponse(JSON.stringify({ error: "File too large" }), {
      status: 413,
      headers: corsHeaders,
    });
  }

  // Extension check
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return new NextResponse(JSON.stringify({ error: "File type not allowed" }), {
      status: 415,
      headers: corsHeaders,
    });
  }
  console.log("Uploading file:", file.name, "from team:", teamname);

  // Upload to Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  let upload;
  try {
    upload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "contest_uploads",
          public_id: `${teamname}_${Date.now()}`,
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      ).end(buffer);
    });
  } catch (err) {
    return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });
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
    code_url: (upload as any).secure_url,
  });

  // console.log(taskString);
  console.log("Pushing task to Redis queue:", taskString);
  await redis.lPush(`task_queue`, taskString);

  return new NextResponse(JSON.stringify({
    success: true,
    teamname,
    file: file.name,
    cloudinary: upload,
  }), {
    status: 200,
    headers: corsHeaders,
  });
}
