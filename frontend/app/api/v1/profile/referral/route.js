import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function POST(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!match) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }

    // 1. Fetch user to check if they already have a referal_id
    const queryUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=id,user_id,referal_id`;
    const getRes = await fetch(queryUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!getRes.ok) {
      throw new Error(`Failed to query user: ${await getRes.text()}`);
    }

    const rows = await getRes.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const player = rows[0];

    // If already generated, return it
    if (player.referal_id) {
      return NextResponse.json({
        success: true,
        data: { referal_id: player.referal_id },
      });
    }

    // Generate a unique 6-character random uppercase alphanumeric referral ID
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let generatedReferralId = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      generatedReferralId = "";
      for (let i = 0; i < 6; i++) {
        generatedReferralId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const checkUrl = `${supabaseUrl}/rest/v1/registrations?referal_id=eq.${generatedReferralId}&select=id`;
      const checkRes = await fetch(checkUrl, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (checkRes.ok) {
        const checkRows = await checkRes.json();
        if (!checkRows || checkRows.length === 0) {
          isUnique = true;
        }
      }
      attempts++;
    }

    // 2. Patch database with the new referal_id
    const patchUrl = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}`;
    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ referal_id: generatedReferralId }),
    });

    if (!patchRes.ok) {
      throw new Error(`Failed to update user referral code: ${await patchRes.text()}`);
    }

    return NextResponse.json({
      success: true,
      message: "Referral code generated successfully.",
      data: { referal_id: generatedReferralId },
    }, { status: 200 });

  } catch (error) {
    console.error("Referral generator API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
