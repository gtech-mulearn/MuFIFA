import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOtpSession,
  getOtpSession,
  updateOtpSession,
  clearOtpSession,
  OTP_MAX_ATTEMPTS,
} from "@/utils/registerOtp";
import { sendRegistrationOtpEmail, sendRegistrationEmail } from "@/utils/email";
import { signToken } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";

const PLAYER_COOKIE = "player_token";

function buildPlayerTokenCookie(token) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  return `${PLAYER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function jsonError(status, code, message, details = null) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}

const DOMAINS = ["Maker", "Creative", "Coder", "Strategist"];
const TEAMS = [
  "Brazil",
  "Argentina",
  "Portugal",
  "Germany",
  "France",
  "England",
  "Spain",
  "Netherlands",
  "Belgium",
  "Croatia",
  "Uruguay",
  "Japan",
];

const RegisterSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  domain: z.enum(DOMAINS, {
    errorMap: () => ({ message: "Invalid domain selected. Must be Maker, Creative, Coder, or Strategist." }),
  }),
  team: z.enum(TEAMS, {
    errorMap: () => ({ message: "Invalid team selected. Must be a valid FIFA country team." }),
  }),
  referralId: z.string().trim().optional(),
});

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "BAD_REQUEST", "Malformed JSON body.");
    }

    const { action } = body || {};

    if (!action) {
      return jsonError(400, "BAD_REQUEST", "Action parameter is required.");
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonError(503, "SERVICE_UNAVAILABLE", "Database not configured.");
    }

    // Validate parameters and initialize a new verification flow.
    if (action === "request_otp" || action === "resend_otp") {
      const validationResult = RegisterSchema.safeParse(body);

      if (!validationResult.success) {
        const fieldErrors = {};
        validationResult.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(err.message);
        });

        return jsonError(400, "VALIDATION_ERROR", "Request parameters failed validation.", fieldErrors);
      }

      const { name, email, phone, domain, team, referralId } = validationResult.data;
      const userId = email.split("@")[0];

      if (action === "resend_otp") {
        const existingSession = getOtpSession(email);
        if (!existingSession) {
          return jsonError(400, "SESSION_EXPIRED", "OTP session has expired or does not exist. Please request a new OTP.");
        }
        if (Date.now() < existingSession.resendAvailableAt) {
          const secondsLeft = Math.ceil((existingSession.resendAvailableAt - Date.now()) / 1000);
          return jsonError(429, "TOO_MANY_REQUESTS", `Please wait ${secondsLeft} seconds before requesting a new OTP.`);
        }
      }

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      };

      // Check if this email is already registered.
      const emailQuery = `${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&select=id`;
      const emailRes = await fetch(emailQuery, { method: "GET", headers });
      if (!emailRes.ok) {
        throw new Error(`Supabase duplicate check failed: ${await emailRes.text()}`);
      }
      const emailRows = await emailRes.json();
      if (emailRows && emailRows.length > 0) {
        return jsonError(409, "CONFLICT_ERROR", "This email address has already been registered.");
      }

      // Check if user ID derived from the email prefix is already taken.
      const userQuery = `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=id`;
      const userRes = await fetch(userQuery, { method: "GET", headers });
      if (!userRes.ok) {
        throw new Error(`Supabase duplicate check failed: ${await userRes.text()}`);
      }
      const userRows = await userRes.json();
      if (userRows && userRows.length > 0) {
        return jsonError(409, "CONFLICT_ERROR", "This email address or user ID has already been registered.");
      }

      // Check if this phone number is already registered.
      const phoneQuery = `${supabaseUrl}/rest/v1/registrations?phone=eq.${encodeURIComponent(phone)}&select=id`;
      const phoneRes = await fetch(phoneQuery, { method: "GET", headers });
      if (!phoneRes.ok) {
        throw new Error(`Supabase duplicate check failed: ${await phoneRes.text()}`);
      }
      const phoneRows = await phoneRes.json();
      if (phoneRows && phoneRows.length > 0) {
        return jsonError(409, "CONFLICT_ERROR", "This phone number has already been registered.");
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const session = createOtpSession(email, { name, email, phone, domain, team, referralId }, otp);

      const mailSent = await sendRegistrationOtpEmail({ email, name, otp });
      if (!mailSent) {
        return jsonError(500, "EMAIL_SEND_FAILED", "Failed to send verification email. Please try again.");
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully to your email.",
        data: {
          email: email,
          resendAvailableAt: session.resendAvailableAt,
          expiresAt: session.expiresAt,
          resendAvailableInMs: Math.max(session.resendAvailableAt - Date.now(), 0),
          expiresInMs: Math.max(session.expiresAt - Date.now(), 0),
        },
      });
    }

    // Cancel registration flow.
    if (action === "cancel_otp") {
      const { email } = body;
      if (!email) {
        return jsonError(400, "BAD_REQUEST", "Email is required for cancellation.");
      }
      clearOtpSession(email);
      return NextResponse.json({ success: true, message: "OTP session cancelled." });
    }

    // Validate the OTP, write player data, and issue session cookies.
    if (action === "verify_otp") {
      const { email, otp } = body;
      if (!email || !otp) {
        return jsonError(400, "BAD_REQUEST", "Email and OTP are required.");
      }

      const session = getOtpSession(email);
      if (!session) {
        return jsonError(400, "EXPIRED_OR_NOT_FOUND", "OTP session has expired or does not exist.");
      }

      if (session.otp !== otp) {
        let maxAttemptsReached = false;
        const updated = updateOtpSession(email, (curr) => {
          const nextAttempts = curr.attempts + 1;
          if (nextAttempts >= OTP_MAX_ATTEMPTS) {
            maxAttemptsReached = true;
          }
          return { ...curr, attempts: nextAttempts };
        });

        if (maxAttemptsReached) {
          clearOtpSession(email);
          return jsonError(400, "MAX_ATTEMPTS_REACHED", "Too many failed attempts. Please request a new OTP.");
        }

        const remaining = OTP_MAX_ATTEMPTS - (updated ? updated.attempts : 0);
        return jsonError(400, "INVALID_OTP", `Invalid OTP. ${remaining} attempts remaining.`);
      }

      const { name, email: sessionEmail, phone, domain, team } = session.payload;
      const userId = sessionEmail.split("@")[0];

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      const dbRes = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          email: sessionEmail,
          user_id: userId,
          phone,
          domain,
          team,
          mu_points: 10,
        }),
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        console.error("Database registration failed response:", errText);
        try {
          const errObj = JSON.parse(errText);
          if (errObj.code === "23505" || errText.includes("duplicate") || errText.includes("unique")) {
            let conflictMsg = "This email address, user ID, or phone number has already been registered.";
            const errMsg = errObj.message || errText;
            if (errMsg.includes("phone")) {
              conflictMsg = "This phone number has already been registered.";
            } else if (errMsg.includes("email")) {
              conflictMsg = "This email address has already been registered.";
            } else if (errMsg.includes("user_id")) {
              conflictMsg = "This user ID/email prefix has already been registered.";
            }
            return jsonError(409, "CONFLICT_ERROR", conflictMsg);
          }
        } catch (parseErr) {
          console.error("Failed to parse database error:", parseErr);
        }
        throw new Error(`Database registration failed: ${errText}`);
      }

      const dbData = await dbRes.json();
      const player = dbData[0];

      clearOtpSession(email);

      if (player.team) {
        await adjustSquadPoints(supabaseUrl, supabaseKey, player.team, 10);
      }

      // Trigger the access pass rendering, Supabase storage upload, and SMTP backend routing.
      await sendRegistrationEmail(player);

      const token = signToken({
        id: player.id,
        name: player.name,
        user_id: player.user_id,
        email: player.email,
        role: "player",
      });

      const response = NextResponse.json({
        success: true,
        message: "Registration completed successfully.",
        data: player,
      }, { status: 201 });

      response.headers.set("Set-Cookie", buildPlayerTokenCookie(token));
      return response;
    }

    return jsonError(400, "BAD_REQUEST", `Unsupported action: ${action}`);
  } catch (error) {
    console.error("[Register API] Error:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
  }
}

export async function GET(request) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return jsonError(400, "BAD_REQUEST", "Email is required.");
    }

    const session = getOtpSession(email);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: "No active OTP session found.",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        email: session.payload.email,
        resendAvailableAt: session.resendAvailableAt,
        expiresAt: session.expiresAt,
        resendAvailableInMs: Math.max(session.resendAvailableAt - Date.now(), 0),
        expiresInMs: Math.max(session.expiresAt - Date.now(), 0),
        attempts: session.attempts,
      },
    });
  } catch (error) {
    console.error("[Register GET] Error:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
  }
}
