import { NextResponse } from "next/server";
import { verifyToken, isPlayerBanned } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`),
    );
    if (!match) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 },
      );
    }

    // Re-query Supabase to get the latest points and data concurrently with predictions count
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

        const query = `${supabaseUrl}/rest/v1/registrations?id=eq.${decoded.id}&select=id,name,user_id,email,team,domain,mu_points,avatar_url,created_at,referal_id,tasks,ticket_url,bio,muid,banned&limit=1`;
    const predQuery = `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(decoded.user_id)}&limit=1`;
    const compQuery = `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(decoded.user_id)}&select=xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution`;

    const [res, predRes, compRes] = await Promise.all([
      fetch(query, {
        method: "GET",
        headers,
      }),
      fetch(predQuery, {
        method: "GET",
        headers: {
          ...headers,
          Prefer: "count=exact",
        },
      }).catch((err) => {
        console.error("Failed to fetch player predictions count (async):", err);
        return null;
      }),
      fetch(compQuery, {
        method: "GET",
        headers,
      }).catch((err) => {
        console.error("Failed to fetch player completed tasks for XP (async):", err);
        return null;
      }),
    ]);

    if (!res.ok) {
      throw new Error(`Supabase query failed: ${await res.text()}`);
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const player = rows[0];

    // Verify ban status
    const banCheck = isPlayerBanned(player.banned);
    if (banCheck.isBanned) {
      const response = NextResponse.json(
        { success: false, error: banCheck.message, code: "BANNED" },
        { status: 403 }
      );
      const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
      response.headers.set("Set-Cookie", `${PLAYER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=0`);
      return response;
    }

    // Parse user predictions count from the resolved response
    let predictionsCount = 0;
    if (predRes && predRes.ok) {
      const contentRange = predRes.headers.get("content-range");
      if (contentRange) {
        const parts = contentRange.split("/");
        if (parts.length === 2) {
          predictionsCount = parseInt(parts[1], 10);
        }
      }
    }

    // Sum domain XP values
    let xp_creativity = 0;
    let xp_branding = 0;
    let xp_innovation = 0;
    let xp_teamwork = 0;
    let xp_execution = 0;
    if (compRes && compRes.ok) {
      const completions = await compRes.json();
      completions.forEach((c) => {
        xp_creativity += c.xp_creativity || 0;
        xp_branding += c.xp_branding || 0;
        xp_innovation += c.xp_innovation || 0;
        xp_teamwork += c.xp_teamwork || 0;
        xp_execution += c.xp_execution || 0;
      });
    }

    const xpBreakdown = {
      creativity: xp_creativity,
      branding: xp_branding,
      innovation: xp_innovation,
      teamwork: xp_teamwork,
      execution: xp_execution,
    };

    // Strip sensitive fields before sending to client
    const { password_hash, phone, referred_by, ...safePlayer } = player;

    return NextResponse.json({
      success: true,
      data: {
        ...safePlayer,
        predictions_count: predictionsCount,
        xp_breakdown: xpBreakdown,
      },
    });
  } catch (error) {
    console.error("Player auth check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
