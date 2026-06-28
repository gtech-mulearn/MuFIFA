import { NextResponse } from "next/server";
import { comparePassword, isPlayerBanned, hashPassword } from "@/utils/auth";

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

    const { email, password, pass } = body || {};
    const inputPassword = password || pass;

    if (!email || !email.trim() || !inputPassword || !inputPassword.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Email and Password are required.",
          },
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = inputPassword.trim();

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

    // Query registrations by email
    const query = `${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(cleanEmail)}&select=email,name,muid,password_hash,phone,banned&limit=1`;
    
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
            code: "UNAUTHORIZED",
            message: "Incorrect email or password.",
          },
        },
        { status: 401 }
      );
    }

    const player = rows[0];

    // Verify credential (either password_hash if set, otherwise phone fallback)
    let authenticated = false;

    if (player.password_hash) {
      authenticated = await comparePassword(cleanPassword, player.password_hash);
    } else {
      // Fallback: Verify phone number (compare last 10 digits to bypass +91 / 0 prefix variations)
      const cleanSubmittedPhone = cleanPassword.replace(/\D/g, "");
      const cleanPlayerPhone = player.phone ? player.phone.trim().replace(/\D/g, "") : "";
      authenticated = cleanSubmittedPhone.length >= 10 && cleanPlayerPhone.length >= 10 && cleanSubmittedPhone.slice(-10) === cleanPlayerPhone.slice(-10);

      if (authenticated) {
        try {
          const hashedPassword = await hashPassword(cleanPassword);
          const updateQuery = `${supabaseUrl}/rest/v1/registrations?email=eq.${encodeURIComponent(cleanEmail)}`;
          await fetch(updateQuery, {
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
        } catch (updateError) {
          console.error("Failed to auto-encrypt fallback password:", updateError);
        }
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Incorrect email or password.",
          },
        },
        { status: 401 }
      );
    }

    // Verify ban status
    const banCheck = isPlayerBanned(player.banned);
    if (banCheck.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BANNED",
            message: banCheck.message,
          },
        },
        { status: 403 }
      );
    }

    // Return the response as requested
    return NextResponse.json({
      success: true,
      email: player.email,
      name: player.name,
      muid: player.muid || null,
    });
  } catch (error) {
    console.error("AI-IG auth error:", error);
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
