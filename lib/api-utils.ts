import { NextRequest, NextResponse } from "next/server";

const CORS_ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGIN || "*")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

const JUDGELS_BASE_API_URL = process.env.JUDGELS_BASE_API_URL!;
const WHITELISTED_JUDGELS_USERS = (process.env.WHITELISTED_JUDGELS_USERS || "").split(",").map(user => user.trim()).filter(Boolean);

export function createCORSHeaders(requestOrigin: string | null): HeadersInit {
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Secret-Key, x-judgels-bearer-token, x-judgels-user-info",
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

export function handleCORS(req: NextRequest) {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = createCORSHeaders(requestOrigin);
  
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function validateSecretKey(
  secretKey: string,
  corsHeaders: HeadersInit
): NextResponse | null {
  // Check secret key (bypass in development mode)
  const isProduction = process.env.NODE_ENV === "production" && process.env.MODE === "production";
  const requiredSecretKey = process.env.API_SECRET_KEY;
  
  if (isProduction && (!secretKey || secretKey !== requiredSecretKey)) {
    return new NextResponse(JSON.stringify({ error: "Invalid or missing secret key" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  return null; // Valid secret key
}

export async function verifyJudgelsUser(token: string, userInfo: { jid: string; username: string; email: string }): Promise<boolean | object> {
  try {
    // Call Judgels API to verify token and get user info
    const response = await fetch(`${JUDGELS_BASE_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const verifiedUser = await response.json();
      if (verifiedUser.username !== userInfo.username || verifiedUser.jid !== userInfo.jid || verifiedUser.email !== userInfo.email) {
        return false;
      }
      return (!WHITELISTED_JUDGELS_USERS.length || WHITELISTED_JUDGELS_USERS.includes(verifiedUser.username));
    }
    return false;
  } catch {
    return false;
  }
}


export function createErrorResponse(
  error: string,
  status: number,
  corsHeaders: HeadersInit
): NextResponse {
  return new NextResponse(JSON.stringify({ error }), {
    status,
    headers: corsHeaders,
  });
}

export function createSuccessResponse(
  data: unknown,
  corsHeaders: HeadersInit
): NextResponse {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: corsHeaders,
  });
}