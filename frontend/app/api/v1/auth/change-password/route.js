import { NextResponse } from "next/server";
import { verifyToken, comparePassword, hashPassword } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function POST(request) {
  try {
    // 1. Authenticate user
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Authentication required to change password." },
        { status: 401 }
      );
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON body." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = body || {};

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database credentials are not configured." },
        { status: 503 }
      );
    }

    // 3. Fetch player's current registration details
    const selectFields = "id,user_id,phone,password_hash";
    const query = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=${selectFields}&limit=1`;
    const res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch user registration: ${await res.text()}`);
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 404 }
      );
    }

    const player = rows[0];

    // 4. Verify current password
    let currentPasswordMatches = false;
    if (player.password_hash) {
      currentPasswordMatches = await comparePassword(currentPassword.trim(), player.password_hash);
    } else {
      // Fallback: compare last 10 digits of currentPassword with player's phone number
      const cleanSubmitted = currentPassword.trim().replace(/\D/g, "");
      const cleanPhone = player.phone.trim().replace(/\D/g, "");
      currentPasswordMatches = cleanSubmitted.slice(-10) === cleanPhone.slice(-10);
    }

    if (!currentPasswordMatches) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password." },
        { status: 401 }
      );
    }

    // 5. Hash new password and update in database
    const newHashedPassword = await hashPassword(newPassword.trim());
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password_hash: newHashedPassword,
      }),
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to update password_hash: ${await patchRes.text()}`);
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password route error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
