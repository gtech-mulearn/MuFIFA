import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { sendForgotPasswordEmail } from "@/utils/email";

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
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const { identifier } = body || {};

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Username or Email is required.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database not configured.",
            details: null,
          },
        },
        { status: 503 }
      );
    }

    // Look up user by username or email
    const encodedIdentifier = encodeURIComponent(identifier.trim());
    const queryUrl = `${supabaseUrl}/rest/v1/admin_users?or=(username.eq.${encodedIdentifier},email.eq.${encodedIdentifier})&select=id,username,email`;

    const res = await fetch(queryUrl, {
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
            message: "No administrator found with the provided Username or Email.",
            details: null,
          },
        },
        { status: 404 }
      );
    }

    const admin = rows[0];

    if (!admin.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "This administrator account does not have a registered email address.",
            details: null,
          },
        },
        { status: 400 }
      );
    }

    // Set a fixed temporary password as requested
    const tempPassword = "μFifaReset2026!";
    const hashedPassword = await hashPassword(tempPassword);

    // Patch database
    const patchUrl = `${supabaseUrl}/rest/v1/admin_users?id=eq.${admin.id}`;
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
      throw new Error(`Failed to update password in database: ${await patchRes.text()}`);
    }

    // Send the email
    const emailSent = await sendForgotPasswordEmail({
      email: admin.email,
      name: admin.username,
      tempPassword,
    });

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to dispatch email. Please check server logs.",
            details: null,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Temporary password successfully sent to your registered email address.",
    });
  } catch (error) {
    console.error("Forgot password route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
