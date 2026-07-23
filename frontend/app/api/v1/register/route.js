import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import {
  createOtpSession,
  getOtpSession,
  updateOtpSession,
  clearOtpSession,
  OTP_MAX_ATTEMPTS,
} from "@/utils/registerOtp";
import { sendRegistrationOtpEmail, sendRegistrationEmail } from "@/utils/email";
import { signToken, hashPassword } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";
import { DISPOSABLE_DOMAINS, AVAILABLE_TEAMS } from "@/utils/constants";

const PLAYER_COOKIE = "player_token";

function buildPlayerTokenCookie(token) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${PLAYER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${maxAge}`;
}

function jsonError(status, code, message, details = null) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status },
  );
}

const DOMAINS = ["Coder", "Creative", "Maker", "Strategist"];
const TEAMS = AVAILABLE_TEAMS;

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
    .toLowerCase()
    .refine((val) => !val.includes("+"), {
      message: "Plus addressing (using + symbols) is not allowed.",
    })
    .refine(
      (val) => {
        const domain = val.split("@")[1];
        return !DISPOSABLE_DOMAINS.includes(domain);
      },
      {
        message: "Temporary/disposable email addresses are not allowed.",
      },
    ),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .regex(
      /^(?:\+91|91|0)?[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian phone number",
    ),
  domain: z.enum(DOMAINS, {
    errorMap: () => ({
      message:
        "Invalid domain selected. Must be Maker, Creative, Coder, or Strategist.",
    }),
  }),
  team: z.enum(TEAMS, {
    errorMap: () => ({
      message: "Invalid team selected. Must be a valid FIFA country team.",
    }),
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

        return jsonError(
          400,
          "VALIDATION_ERROR",
          "Request parameters failed validation.",
          fieldErrors,
        );
      }

      const { name, email, phone, domain, team, referralId } =
        validationResult.data;
      const userId = email.split("@")[0];

      if (action === "resend_otp") {
        const existingSession = await getOtpSession(email);
        if (!existingSession) {
          return jsonError(
            400,
            "SESSION_EXPIRED",
            "OTP session has expired or does not exist. Please request a new OTP.",
          );
        }
        if (Date.now() < existingSession.resendAvailableAt) {
          const secondsLeft = Math.ceil(
            (existingSession.resendAvailableAt - Date.now()) / 1000,
          );
          return jsonError(
            429,
            "TOO_MANY_REQUESTS",
            `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
          );
        }
      }

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      };

      // Run all three duplicate checks concurrently instead of one-at-a-time to
      // cut latency from ~750ms (3 serial round-trips) down to ~250ms (1 parallel batch).
      const [emailRes, userRes, phoneRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(email)}&select=id`, { method: "GET", headers }),
        fetch(`${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=id`, { method: "GET", headers }),
        fetch(`${supabaseUrl}/rest/v1/registrations?phone=eq.${encodeURIComponent(phone)}&select=id`, { method: "GET", headers }),
      ]);

      if (!emailRes.ok) throw new Error(`Supabase email check failed: ${await emailRes.text()}`);
      if (!userRes.ok)  throw new Error(`Supabase user_id check failed: ${await userRes.text()}`);
      if (!phoneRes.ok) throw new Error(`Supabase phone check failed: ${await phoneRes.text()}`);

      const [emailRows, userRows, phoneRows] = await Promise.all([
        emailRes.json(),
        userRes.json(),
        phoneRes.json(),
      ]);

      if (emailRows?.length > 0) {
        return jsonError(409, "CONFLICT_ERROR", "This email address has already been registered.");
      }
      if (userRows?.length > 0) {
        return jsonError(409, "CONFLICT_ERROR", "This email address or user ID has already been registered.");
      }
      if (phoneRows?.length > 0) {
        return jsonError(409, "CONFLICT_ERROR", "This phone number has already been registered.");
      }
      const otp = crypto.randomInt(100000, 1000000).toString();
      const session = await createOtpSession(
        email,
        { name, email, phone, domain, team, referralId },
        otp,
      );

      const mailSent = await sendRegistrationOtpEmail({ email, name, otp });
      if (!mailSent) {
        return jsonError(
          500,
          "EMAIL_SEND_FAILED",
          "Failed to send verification email. Please try again.",
        );
      }

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully to your email.",
        data: {
          email: email,
          resendAvailableAt: session.resendAvailableAt,
          expiresAt: session.expiresAt,
          resendAvailableInMs: Math.max(
            session.resendAvailableAt - Date.now(),
            0,
          ),
          expiresInMs: Math.max(session.expiresAt - Date.now(), 0),
        },
      });
    }

    // Cancel registration flow.
    if (action === "cancel_otp") {
      const { email } = body;
      if (!email) {
        return jsonError(
          400,
          "BAD_REQUEST",
          "Email is required for cancellation.",
        );
      }
      await clearOtpSession(email);
      return NextResponse.json({
        success: true,
        message: "OTP session cancelled.",
      });
    }

    // Validate the OTP, write player data, and issue session cookies.
    if (action === "verify_otp") {
      const { email, otp } = body;
      if (!email || !otp) {
        return jsonError(400, "BAD_REQUEST", "Email and OTP are required.");
      }

      const session = await getOtpSession(email);
      if (!session) {
        return jsonError(
          400,
          "EXPIRED_OR_NOT_FOUND",
          "OTP session has expired or does not exist.",
        );
      }

      if (session.otp !== otp) {
        let maxAttemptsReached = false;
        const updated = await updateOtpSession(email, (curr) => {
          const nextAttempts = curr.attempts + 1;
          if (nextAttempts >= OTP_MAX_ATTEMPTS) {
            maxAttemptsReached = true;
          }
          return { ...curr, attempts: nextAttempts };
        });

        if (maxAttemptsReached) {
          await clearOtpSession(email);
          return jsonError(
            400,
            "MAX_ATTEMPTS_REACHED",
            "Too many failed attempts. Please request a new OTP.",
          );
        }

        const remaining = OTP_MAX_ATTEMPTS - (updated ? updated.attempts : 0);
        return jsonError(
          400,
          "INVALID_OTP",
          `Invalid OTP. ${remaining} attempts remaining.`,
        );
      }

      const {
        name,
        email: sessionEmail,
        phone,
        domain,
        team,
        referralId,
      } = session.payload;
      const userId = sessionEmail.split("@")[0];

      // Generate random 8-character password using crypto-safe randomness
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const randomBuf = crypto.randomBytes(8);
      let plainPassword = "";
      for (let i = 0; i < 8; i++) {
        plainPassword += chars.charAt(randomBuf[i] % chars.length);
      }
      const hashedPassword = await hashPassword(plainPassword);

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      // Resolve the referrer if a referral ID was provided
      let referrer = null;
      if (referralId && referralId.trim()) {
        try {
          const refQuery = `${supabaseUrl}/rest/v1/registrations?referal_id=eq.${encodeURIComponent(referralId.trim())}&select=id,user_id,email,team,mu_points,tasks`;
          const refRes = await fetch(refQuery, {
            method: "GET",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          });
          if (refRes.ok) {
            const refRows = await refRes.json();
            if (refRows && refRows.length > 0) {
              referrer = refRows[0];
            }
          }
        } catch (refErr) {
          console.error("Referral lookup failed (non-fatal):", refErr);
        }
      }

      const registrationPayload = {
        name,
        email: sessionEmail,
        user_id: userId,
        phone,
        domain,
        team,
        mu_points: 10,
        password_hash: hashedPassword,
        referred_by: referrer ? referrer.id : null,
      };

      const dbRes = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
        method: "POST",
        headers,
        body: JSON.stringify(registrationPayload),
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text();
        console.error("Database registration failed response:", errText);
        try {
          const errObj = JSON.parse(errText);
          if (
            errObj.code === "23505" ||
            errText.includes("duplicate") ||
            errText.includes("unique")
          ) {
            let conflictMsg =
              "This email address, user ID, or phone number has already been registered.";
            const errMsg = errObj.message || errText;
            if (errMsg.includes("phone")) {
              conflictMsg = "This phone number has already been registered.";
            } else if (errMsg.includes("email")) {
              conflictMsg = "This email address has already been registered.";
            } else if (errMsg.includes("user_id")) {
              conflictMsg =
                "This user ID/email prefix has already been registered.";
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

      // Pass the generated plain-text password to the email template
      player.plainPassword = plainPassword;

      await clearOtpSession(email);

      if (player.team) {
        await adjustSquadPoints(supabaseUrl, supabaseKey, player.team, 10);
      }

      // Award referral bonus: increment referal count, +5 μPoints to referrer, +5 squad points
      if (referrer) {
        try {
          let tasksObj = {};
          if (referrer.tasks) {
            if (typeof referrer.tasks === "string") {
              try {
                tasksObj = JSON.parse(referrer.tasks);
              } catch (e) {
                console.error("Failed to parse referrer tasks JSON string:", e);
              }
            } else if (typeof referrer.tasks === "object") {
              tasksObj = referrer.tasks;
            }
          }

          let prevReferalCount = 0;
          if (tasksObj && typeof tasksObj.referal === "number") {
            prevReferalCount = tasksObj.referal;
          } else if (tasksObj && typeof tasksObj.referal === "string") {
            const parsedVal = parseInt(tasksObj.referal, 10);
            if (!isNaN(parsedVal)) prevReferalCount = parsedVal;
          }

          const newReferalCount = prevReferalCount + 1;
          const newPoints = (referrer.mu_points || 0) + 5;
          const updatedTasks = {
            ...tasksObj,
            referal: newReferalCount,
          };

          const referrerPatchUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${referrer.id}`;
          await fetch(referrerPatchUrl, {
            method: "PATCH",
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mu_points: newPoints,
              tasks: updatedTasks,
            }),
          });

          // Award +5 squad points to the referrer's team
          if (referrer.team) {
            await adjustSquadPoints(supabaseUrl, supabaseKey, referrer.team, 5);
          }

          console.log(
            `Referral bonus awarded: +5 μPoints to ${referrer.user_id}, referal count now ${newReferalCount}`,
          );
        } catch (referralErr) {
          console.error(
            "Referral bonus award failed (non-fatal):",
            referralErr,
          );
        }
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

      // Strip sensitive fields before sending to client
      const {
        password_hash: _ph,
        plainPassword: _pp,
        phone: _phn,
        referred_by: _rb,
        ...safePlayer
      } = player;

      const response = NextResponse.json(
        {
          success: true,
          message: "Registration completed successfully.",
          data: safePlayer,
        },
        { status: 201 },
      );

      response.headers.set("Set-Cookie", buildPlayerTokenCookie(token));
      return response;
    }

    return jsonError(400, "BAD_REQUEST", `Unsupported action: ${action}`);
  } catch (error) {
    console.error("[Register API] Error:", error);
    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred.",
    );
  }
}

export async function GET(request) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return jsonError(400, "BAD_REQUEST", "Email is required.");
    }

    const session = await getOtpSession(email);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "No active OTP session found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: session.payload.email,
        resendAvailableAt: session.resendAvailableAt,
        expiresAt: session.expiresAt,
        resendAvailableInMs: Math.max(
          session.resendAvailableAt - Date.now(),
          0,
        ),
        expiresInMs: Math.max(session.expiresAt - Date.now(), 0),
        attempts: session.attempts,
      },
    });
  } catch (error) {
    console.error("[Register GET] Error:", error);
    return jsonError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred.",
    );
  }
}
