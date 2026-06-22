import { NextResponse } from "next/server";
import { signToken, comparePassword } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

// --- Rate Limiter (per-instance, resets on cold start) ---
const LOGIN_ATTEMPTS = new Map(); // key: IP, value: { count, resetAt }
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = LOGIN_ATTEMPTS.get(ip);
  if (!entry || now > entry.resetAt) {
    LOGIN_ATTEMPTS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false };
  }
  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }
  return { limited: false };
}
// Evict stale entries periodically (max 500 tracked IPs)
if (LOGIN_ATTEMPTS.size > 500) {
  const now = Date.now();
  for (const [key, val] of LOGIN_ATTEMPTS) {
    if (now > val.resetAt) LOGIN_ATTEMPTS.delete(key);
  }
}

function buildPlayerTokenCookie(token) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${PLAYER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${maxAge}`;
}

export async function POST(request) {
  try {
    // Rate limit check
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateCheck = checkRateLimit(clientIp);
    if (rateCheck.limited) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: `Too many login attempts. Please try again in ${rateCheck.retryAfter} seconds.`,
          },
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Malformed JSON body.",
          },
        },
        { status: 400 }
      );
    }

    const { identifier, phone } = body || {};

    if (!identifier || !identifier.trim() || !phone || !phone.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Email/Player ID and Password are required.",
          },
        },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database credentials are not configured.",
          },
        },
        { status: 503 }
      );
    }

    const isEmail = cleanIdentifier.includes("@");
    let query;
    if (isEmail) {
      query = `${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(cleanIdentifier.toLowerCase())}&select=*&limit=1`;
    } else {
      // Remove optional @ prefix if entered by user (e.g. @player_id)
      const cleanedUserId = cleanIdentifier.startsWith("@") ? cleanIdentifier.slice(1) : cleanIdentifier;
      query = `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(cleanedUserId)}&select=*&limit=1`;
    }

    const res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase query failed: ${await res.text()}`);
    }

    const rows = await res.json();

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Registration not found. Please register first.",
          },
        },
        { status: 404 }
      );
    }

    const player = rows[0];

    // Verify credential (either password_hash if set, otherwise phone fallback)
    let authenticated = false;
    let authErrorMsg = "";

    if (player.password_hash) {
      authenticated = await comparePassword(phone.trim(), player.password_hash);
      authErrorMsg = "Verification failed. Incorrect password.";
    } else {
      // Fallback: Verify phone number (compare last 10 digits to bypass +91 / 0 prefix variations)
      const cleanSubmittedPhone = phone.trim().replace(/\D/g, "");
      const cleanPlayerPhone = player.phone.trim().replace(/\D/g, "");
      authenticated = cleanSubmittedPhone.slice(-10) === cleanPlayerPhone.slice(-10);
      authErrorMsg = "Verification failed. Incorrect password.";
    }

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: authErrorMsg,
          },
        },
        { status: 401 }
      );
    }

    const token = signToken({
      id: player.id,
      name: player.name,
      user_id: player.user_id,
      email: player.email,
      role: "player",
    });

    // Strip sensitive fields before sending to client
    const { password_hash, phone: _phone, referred_by, ...safePlayer } = player;

    const response = NextResponse.json({
      success: true,
      data: safePlayer,
    });

    response.headers.set("Set-Cookie", buildPlayerTokenCookie(token));
    return response;
  } catch (error) {
    console.error("Player login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}
