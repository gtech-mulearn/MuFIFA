import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { sendRegistrationEmail, sendRegistrationOtpEmail } from "@/utils/email";
import { adjustSquadPoints } from "@/utils/squad";
import { signToken } from "@/utils/auth";
import {
  OTP_MAX_ATTEMPTS,
  clearOtpSession,
  createOtpSession,
  getOtpSession,
  updateOtpSession,
} from "@/utils/registerOtp";

const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;

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

const registrationSchema = z.object({
  name: z.string({ required_error: "Name is required." }).trim().min(2, "Name must be between 2 and 100 characters.").max(100, "Name must be between 2 and 100 characters."),
  email: z.string({ required_error: "Email is required." }).trim().email("Please enter a valid email address.").toLowerCase(),
  phone: z.string({ required_error: "Phone number is required." }).trim().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number."),
  domain: z.enum(DOMAINS, { errorMap: () => ({ message: "Invalid domain selected." }) }),
  team: z.enum(TEAMS, { errorMap: () => ({ message: "Invalid team selected." }) }),
  referralId: z.string().trim().optional().or(z.literal("")),
});

function isRateLimited(ip) {
  const now = Date.now();
  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, []);
  }
  const timestamps = rateLimitCache.get(ip).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitCache.set(ip, timestamps);
  if (timestamps.length >= MAX_REQUESTS) {
    return true;
  }
  timestamps.push(now);
  return false;
}

function validateRegistrationBody(body) {
  const result = registrationSchema.safeParse(body);
  if (!result.success) {
    const errors = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0];
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(err.message);
    });
    return { valid: false, errors };
  }

  return {
    valid: true,
    payload: result.data,
  };
}


async function ensureRegistrationNotTaken(supabaseUrl, supabaseKey, email, phone) {
  const userId = email.split("@")[0];
  const query = `${supabaseUrl}/rest/v1/registrations?select=id,email,phone,user_id&or=(email.eq.${encodeURIComponent(email)},phone.eq.${encodeURIComponent(phone)},user_id.eq.${encodeURIComponent(userId)})&limit=1`;
  const res = await fetch(query, {
    method: "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase lookup error: ${await res.text()}`);
  }

  const rows = await res.json();
  if (!rows.length) {
    return { available: true };
  }

  const existing = rows[0];
  if (existing.email === email) {
    return {
      available: false,
      code: "EMAIL_ALREADY_REGISTERED",
      message: "This email address has already been registered.",
    };
  }

  if (existing.phone === phone) {
    return {
      available: false,
      code: "PHONE_ALREADY_REGISTERED",
      message: "This phone number has already been registered.",
    };
  }

  return {
    available: false,
    code: "CONFLICT_ERROR",
    message: "This email address or user ID has already been registered.",
  };
}

async function createRegistration(supabaseUrl, supabaseKey, payload) {
  const userId = payload.email.split("@")[0];
  const targetUrl = `${supabaseUrl}/rest/v1/registrations`;
  const res = await fetch(targetUrl, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([{
      name: payload.name,
      email: payload.email,
      user_id: userId,
      phone: payload.phone,
      domain: payload.domain,
      team: payload.team,
      mu_points: 10,
    }]),
  });

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 409 || errorText.includes("duplicate") || errorText.includes("unique")) {
      return { conflict: true };
    }
    throw new Error(`Supabase REST error: ${errorText}`);
  }

  const data = await res.json();
  return { data: data[0] };
}

function jsonError(status, code, message, details = null) {
  return NextResponse.json({
    success: false,
    error: { code, message, details },
  }, { status });
}

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (isRateLimited(ip)) {
      return jsonError(429, "TOO_MANY_REQUESTS", "Too many requests. Please try again after 1 minute.");
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "BAD_REQUEST", "Malformed JSON body.");
    }

    const { action = "request_otp" } = body || {};
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonError(503, "SERVICE_UNAVAILABLE", "Database credentials are not configured in environment variables.");
    }

    if (action === "request_otp" || action === "resend_otp") {
      const validation = validateRegistrationBody(body);
      if (!validation.valid) {
        return jsonError(400, "VALIDATION_ERROR", "Request parameters failed validation.", validation.errors);
      }

      const payload = validation.payload;
      const existing = getOtpSession(payload.email);

      if (action === "resend_otp") {
        if (!existing) {
          return jsonError(404, "OTP_SESSION_NOT_FOUND", "OTP session not found. Please submit the form again.");
        }
        if (Date.now() < existing.resendAvailableAt) {
          const waitMs = existing.resendAvailableAt - Date.now();
          return NextResponse.json({
            success: false,
            error: {
              code: "OTP_RESEND_BLOCKED",
              message: "You can request a new OTP after 2 minutes.",
              details: { retryAfterMs: waitMs },
            },
          }, { status: 429 });
        }
      }

      const availability = await ensureRegistrationNotTaken(
        supabaseUrl,
        supabaseKey,
        payload.email,
        payload.phone
      );
      if (!availability.available) {
        return jsonError(409, availability.code, availability.message);
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const session = createOtpSession(payload.email, payload, otp);
      const otpSent = await sendRegistrationOtpEmail({
        email: payload.email,
        name: payload.name,
        otp,
      });

      if (!otpSent) {
        clearOtpSession(payload.email);
        return jsonError(503, "EMAIL_DELIVERY_FAILED", "Unable to send OTP email right now. Please try again.");
      }

      return NextResponse.json({
        success: true,
        message: action === "resend_otp" ? "A new OTP has been sent to your email." : "OTP sent to your email.",
        data: {
          email: payload.email,
          resendAvailableAt: session.resendAvailableAt,
          expiresAt: session.expiresAt,
        },
      }, { status: 200 });
    }

    if (action === "verify_otp") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

      if (!email || !otp) {
        return jsonError(400, "VALIDATION_ERROR", "Email and OTP are required.", {
          email: !email ? ["Email is required."] : undefined,
          otp: !otp ? ["OTP is required."] : undefined,
        });
      }

      const session = getOtpSession(email);
      if (!session) {
        return jsonError(404, "OTP_SESSION_NOT_FOUND", "OTP expired or session not found. Please request a new OTP.");
      }

      if (session.attempts >= OTP_MAX_ATTEMPTS) {
        clearOtpSession(email);
        return jsonError(429, "OTP_ATTEMPTS_EXCEEDED", "Too many incorrect OTP attempts. Please request a new OTP.");
      }

      if (session.otp !== otp) {
        updateOtpSession(email, (current) => ({
          ...current,
          attempts: current.attempts + 1,
        }));
        return jsonError(400, "OTP_MISMATCH", "The OTP you entered is incorrect.");
      }

      const creation = await createRegistration(supabaseUrl, supabaseKey, session.payload);
      if (creation.conflict) {
        clearOtpSession(email);
        return jsonError(409, "CONFLICT_ERROR", "This email address or user ID has already been registered.");
      }

      await adjustSquadPoints(supabaseUrl, supabaseKey, session.payload.team, 10);

      // Award referral points if referred
      if (session.payload.referralId) {
        try {
          const refCode = session.payload.referralId.trim().toUpperCase();
          if (refCode) {
            // Find the referrer by referal_id
            const getRefUrl = `${supabaseUrl}/rest/v1/registrations?referal_id=eq.${encodeURIComponent(refCode)}&select=id,mu_points,team,tasks`;
            const getRefRes = await fetch(getRefUrl, {
              method: "GET",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            });

            if (getRefRes.ok) {
              const refRows = await getRefRes.json();
              if (refRows && refRows.length > 0) {
                const referrer = refRows[0];
                const newRefPoints = (referrer.mu_points || 0) + 5;

                // Build updated tasks JSONB with incremented referal count
                const currentTasks = referrer.tasks || {};
                const updatedTasks = {
                  ...currentTasks,
                  referal: (currentTasks.referal || 0) + 1,
                };

                // 1. Award +5 points to referrer and increment tasks.referal
                const patchRefUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${referrer.id}`;
                const patchRefRes = await fetch(patchRefUrl, {
                  method: "PATCH",
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ mu_points: newRefPoints, tasks: updatedTasks }),
                });

                if (patchRefRes.ok) {
                  // 2. Award +5 points to referrer's squad
                  await adjustSquadPoints(supabaseUrl, supabaseKey, referrer.team, 5);
                  console.log(`Referral points awarded successfully to user ${referrer.id} (tasks.referal: ${updatedTasks.referal}) and squad ${referrer.team}`);
                } else {
                  console.error("Failed to patch referrer points:", await patchRefRes.text());
                }
              } else {
                console.warn(`Referrer not found for referral code: ${refCode}`);
              }
            } else {
              console.error("Referrer lookup request failed:", await getRefRes.text());
            }
          }
        } catch (refErr) {
          console.error("Error processing referral points:", refErr);
        }
      }

      clearOtpSession(email);

      if (creation.data) {
        await sendRegistrationEmail(creation.data).catch((err) => {
          console.error("Background registration email error:", err);
        });
      }

      const response = NextResponse.json({
        success: true,
        message: "Registration completed successfully.",
        data: creation.data,
      }, { status: 201 });

      if (creation.data) {
        try {
          const token = signToken({
            id: creation.data.id,
            name: creation.data.name,
            user_id: creation.data.user_id,
            email: creation.data.email,
            role: "player",
          });
          const maxAge = 30 * 24 * 60 * 60; // 30 days
          response.headers.set("Set-Cookie", `player_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`);
        } catch (authErr) {
          console.error("Failed to auto-sign token on registration:", authErr);
        }
      }

      return response;
    }

    if (action === "cancel_otp") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (email) {
        clearOtpSession(email);
      }
      return NextResponse.json({
        success: true,
        message: "OTP session cancelled.",
      });
    }

    return jsonError(400, "BAD_REQUEST", "Unsupported registration action.");
  } catch (error) {
    console.error("Next.js registration API error:", error);
    return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred. Please try again later.");
  }
}

export async function GET(request) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return jsonError(400, "BAD_REQUEST", "Email is required.");
  }

  const session = getOtpSession(email);
  if (!session) {
    return jsonError(404, "OTP_SESSION_NOT_FOUND", "OTP session not found.");
  }

  return NextResponse.json({
    success: true,
    data: {
      email: session.payload.email,
      expiresAt: session.expiresAt,
      resendAvailableAt: session.resendAvailableAt,
      retryAfterMs: Math.max(session.resendAvailableAt - Date.now(), 0),
      expiresInMs: Math.max(session.expiresAt - Date.now(), 0),
    },
  });
}
