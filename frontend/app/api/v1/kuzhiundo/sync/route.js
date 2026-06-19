import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";
import { kuzhiundoCache } from "@/utils/kuzhiundoCache";

const PLAYER_COOKIE = "player_token";

export async function POST(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    // 1. Authenticate Player
    let userId = null;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`));
    if (!cookieMatch) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const decoded = verifyToken(cookieMatch[1]);
    if (!decoded || decoded.role !== "player") {
      return NextResponse.json({ success: false, error: "Invalid session." }, { status: 401 });
    }
    userId = decoded.user_id;

    // 2. Fetch User Registration Details
    const userRes = await fetch(`${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!userRes.ok) throw new Error(`Fetch user failed: ${await userRes.text()}`);
    const users = await userRes.json();
    if (users.length === 0) return NextResponse.json({ success: false, error: "Player not found." }, { status: 404 });
    const player = users[0];

    // Parse socials JSON
    const socials = (() => {
      if (!player.socials) return {};
      if (typeof player.socials === "object") return player.socials;
      try { return JSON.parse(player.socials); } catch { return {}; }
    })();

    const uuid = socials.kuzhiundo_uuid;
    if (!uuid) {
      return NextResponse.json({ success: false, error: "No Kuzhiundo ID linked to your profile. Please go to Challenges and verify the Kuzhiyundo task first." }, { status: 400 });
    }

    // 3. Query Kuzhiundo API for latest stats
    let kuzhiData;
    try {
      const kuzhiRes = await fetch(`https://www.kuzhiundo.com/api/stats/${encodeURIComponent(uuid)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
      });
      if (!kuzhiRes.ok) {
        return NextResponse.json({ success: false, error: "Failed to fetch stats from Kuzhiundo. Please verify your linked ID is correct." }, { status: 400 });
      }
      kuzhiData = await kuzhiRes.json();
    } catch (err) {
      console.error("External Kuzhiundo API error during sync:", err);
      return NextResponse.json({ success: false, error: "Kuzhiundo API server is temporarily unreachable." }, { status: 502 });
    }

    if (!kuzhiData || typeof kuzhiData.submission_count !== "number") {
      return NextResponse.json({ success: false, error: "Invalid stats data returned from Kuzhiundo." }, { status: 400 });
    }

    const newSubmissions = kuzhiData.submission_count;
    const oldSubmissions = parseInt(socials.kuzhiundo_submissions || "0", 10);
    const delta = newSubmissions - oldSubmissions;

    if (delta <= 0) {
      return NextResponse.json({
        success: true,
        message: "Your stats are already up to date!",
        data: {
          submissions: oldSubmissions,
          points: oldSubmissions,
        }
      });
    }

    const deltaPoints = delta * 1;

    // 4. Update registrations table (socials and mu_points)
    const updatedSocials = {
      ...socials,
      kuzhiundo_submissions: newSubmissions,
    };

    const newMuPoints = (player.mu_points || 0) + deltaPoints;

    const patchUserRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        socials: updatedSocials,
        mu_points: newMuPoints,
      }),
    });
    if (!patchUserRes.ok) throw new Error(`Failed to update player stats: ${await patchUserRes.text()}`);

    // 5. Update user_completed_tasks points_awarded for task 4
    const compRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(userId)}&task_id=eq.4&select=*`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (compRes.ok) {
      const completions = await compRes.json();
      if (completions.length > 0) {
        const currentPoints = completions[0].points_awarded || 0;
        const newPoints = currentPoints + deltaPoints;
        
        await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?id=eq.${completions[0].id}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ points_awarded: newPoints }),
        });
      }
    }

    // 6. Update Squad Standings if player has a team
    if (player.team && deltaPoints > 0) {
      await adjustSquadPoints(supabaseUrl, supabaseKey, player.team, deltaPoints);
    }

    // 7. Clear the cached leaderboards
    kuzhiundoCache.clear();

    return NextResponse.json({
      success: true,
      message: `Sync successful! Processed ${delta} new pothole mappings. Awarded +${deltaPoints} uPoints.`,
      data: {
        submissions: newSubmissions,
        points: newSubmissions,
        mu_points: newMuPoints,
      }
    });

  } catch (error) {
    console.error("Kuzhiundo sync error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
