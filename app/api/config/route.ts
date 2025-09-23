import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const CORS_ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGIN || "*")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

function createCORSHeaders(requestOrigin: string | null): HeadersInit {
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

export async function GET(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  try {
    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Get the CSS string from Redis config hash
    const cssString = await redis.hGet("config", "css_string") || "";

    return new NextResponse(JSON.stringify({
      success: true,
      css_string: cssString,
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Redis operation failed:", err);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch configuration" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function POST(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  const formData = await req.formData();
  const cssString = formData.get("css_string") as string;
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

  if (!cssString) {
    return new NextResponse(JSON.stringify({ error: "CSS string is required" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Set the CSS string in Redis config hash
    await redis.hSet("config", "css_string", cssString);

    console.log("Updated CSS configuration in Redis");

    return new NextResponse(JSON.stringify({
      success: true,
      message: "CSS configuration updated successfully",
      css_string: cssString,
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Redis operation failed:", err);
    return new NextResponse(JSON.stringify({ error: "Failed to update configuration" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function DELETE(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  const formData = await req.formData();
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

  try {
    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Delete the CSS string from Redis config hash
    await redis.hDel("config", "css_string");

    console.log("Reset CSS configuration in Redis");

    return new NextResponse(JSON.stringify({
      success: true,
      message: "CSS configuration reset successfully",
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Redis operation failed:", err);
    return new NextResponse(JSON.stringify({ error: "Failed to reset configuration" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}