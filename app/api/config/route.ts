import { NextRequest } from "next/server";
import { redis } from "@/lib/redis";
import { createCORSHeaders, handleCORS, validateSecretKey, createErrorResponse, createSuccessResponse } from "@/lib/api-utils";

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

    // Get the CSS string and quotes from Redis config hash
    const cssString = await redis.hGet("config", "css_string") || "";
    const quotesString = await redis.hGet("config", "quotes") || "";

    return createSuccessResponse({
      success: true,
      css_string: cssString,
      quotes: quotesString,
    }, corsHeaders);
  } catch (err) {
    console.error("Redis operation failed:", err);
    return createErrorResponse("Failed to fetch configuration", 500, corsHeaders);
  }
}

export async function POST(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  const formData = await req.formData();
  const cssString = formData.get("css_string") as string;
  const quotesString = formData.get("quotes") as string;
  const secretKey = formData.get("secretKey") as string;

  // Validate secret key
  const secretKeyError = validateSecretKey(secretKey, corsHeaders);
  if (secretKeyError) return secretKeyError;

  // Validate quotes JSON if provided
  if (quotesString) {
    try {
      const quotes = JSON.parse(quotesString);
      if (!Array.isArray(quotes)) {
        return createErrorResponse("Quotes must be a JSON array", 400, corsHeaders);
      }
      // Validate quote structure
      for (const quote of quotes) {
        if (!quote.author || !quote.quote) {
          return createErrorResponse("Each quote must have 'author' and 'quote' fields", 400, corsHeaders);
        }
      }
    } catch (err) {
      return createErrorResponse("Invalid JSON format for quotes", 400, corsHeaders);
    }
  }

  try {
    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Set the CSS string and quotes in Redis config hash
    const updates: { [key: string]: string } = {};
    if (cssString) updates.css_string = cssString;
    if (quotesString) updates.quotes = quotesString;
    
    if (Object.keys(updates).length > 0) {
      await redis.hSet("config", updates);
    }

    console.log("Updated configuration in Redis:", Object.keys(updates));

    return createSuccessResponse({
      success: true,
      message: "Configuration updated successfully",
      css_string: cssString,
      quotes: quotesString,
    }, corsHeaders);
  } catch (err) {
    console.error("Redis operation failed:", err);
    return createErrorResponse("Failed to update configuration", 500, corsHeaders);
  }
}

export async function DELETE(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);

  const formData = await req.formData();
  const secretKey = formData.get("secretKey") as string;

  // Validate secret key
  const secretKeyError = validateSecretKey(secretKey, corsHeaders);
  if (secretKeyError) return secretKeyError;

  try {
    // Connect to Redis if not connected
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Delete the CSS string and quotes from Redis config hash
    await redis.hDel("config", ["css_string", "quotes"]);

    console.log("Reset CSS and quotes configuration in Redis");

    return createSuccessResponse({
      success: true,
      message: "CSS configuration reset successfully",
    }, corsHeaders);
  } catch (err) {
    console.error("Redis operation failed:", err);
    return createErrorResponse("Failed to reset configuration", 500, corsHeaders);
  }
}