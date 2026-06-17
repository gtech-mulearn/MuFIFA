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

    // Re-query Supabase to get the latest points and data
    const query = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=*&limit=1`;
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
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const player = rows[0];

    // Fetch user predictions count from Supabase
    let predictionsCount = 0;
    try {
      const predQuery = `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(player.user_id)}&limit=1`;
      const predRes = await fetch(predQuery, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Prefer": "count=exact",
        },
      });
      if (predRes.ok) {
        const contentRange = predRes.headers.get("content-range");
        if (contentRange) {
          const parts = contentRange.split("/");
          if (parts.length === 2) {
            predictionsCount = parseInt(parts[1], 10);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch player predictions count:", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...player,
        predictions_count: predictionsCount,
      },
    });
  } catch (error) {
    console.error("Player auth check error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
