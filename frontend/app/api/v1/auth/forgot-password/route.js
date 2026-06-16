import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { sendPlayerForgotPasswordEmail } from "@/utils/email";

export async function POST(request) {
  try {
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

    const { email, phone } = body || {};

    if (!email || !email.trim() || !phone || !phone.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Email and Phone Number are required.",
          },
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\D/g, "");

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

    // Look up the player in registrations table
    const query = `${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(cleanEmail)}&select=*&limit=1`;
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
            message: "Mismatch in details.",
          },
        },
        { status: 404 }
      );
    }

    const player = rows[0];

    // Verify phone number (compare last 10 digits to bypass +91 / 0 prefix variations)
    const cleanPlayerPhone = player.phone.trim().replace(/\D/g, "");

    if (cleanPhone.slice(-10) !== cleanPlayerPhone.slice(-10)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Mismatch in details.",
          },
        },
        { status: 401 }
      );
    }

    // Generate random 8-character password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newPassword = "";
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Hash the password
    const hashedPassword = await hashPassword(newPassword);

    // Save the new password_hash to db
    console.log(`[Forgot Password] Generating new password for user: ${player.user_id}`);
    const patchUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password_hash: hashedPassword,
      }),
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to update password_hash in registrations: ${await patchRes.text()}`);
    }

    // Send the password via email
    const emailSent = await sendPlayerForgotPasswordEmail({
      email: player.email,
      name: player.name,
      password: newPassword,
    });

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send the new password. Please contact admin.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A new password has been successfully sent to your registered email address.",
    });
  } catch (error) {
    console.error("Player forgot password route error:", error);
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
