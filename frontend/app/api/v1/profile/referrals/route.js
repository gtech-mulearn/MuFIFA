import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
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

    // Fetch all registrations referred by this player
    const queryUrl = `${supabaseUrl}/rest/v1/registrations?referred_by=eq.${decoded.id}&select=id,name,user_id,created_at&order=created_at.desc`;
    const res = await fetch(queryUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to query referrals: ${await res.text()}`);
    }

    const referrals = await res.json();
    return NextResponse.json({
      success: true,
      data: referrals,
    }, { status: 200 });

  } catch (error) {
    console.error("Profile referrals API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
