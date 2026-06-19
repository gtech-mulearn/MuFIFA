import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { adjustSquadPoints } from "@/utils/squad";
import {
  KUZHIUNDO_PER_SUBMISSION,
  KUZHIUNDO_SUBMISSION_TASK_ID,
} from "@/utils/kuzhiundo";

const PLAYER_COOKIE = "player_token";

export async function POST(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 }
      );
    }

    // 1. Authenticate Player
    let userId = null;
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`)
    );
    if (!cookieMatch) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const decoded = verifyToken(cookieMatch[1]);
    if (!decoded || decoded.role !== "player") {
      return NextResponse.json(
        { success: false, error: "Invalid session." },
        { status: 401 }
      );
    }
    userId = decoded.user_id;

    // 2. Fetch User Registration Details
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!userRes.ok) {
      throw new Error(`Fetch user failed: ${await userRes.text()}`);
    }
    const users = await userRes.json();
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: "Player not found." },
        { status: 404 }
      );
    }
    const player = users[0];

    // Parse socials JSON
    const socials = (() => {
      if (!player.socials) return {};
      if (typeof player.socials === "object") return player.socials;
      try {
        return JSON.parse(player.socials);
      } catch {
        return {};
      }
    })();

    const uuid = socials.kuzhiundo_uuid;
    if (!uuid) {
      return NextResponse.json({
        success: true,
        linked: false,
        message: "No Kuzhiundo ID linked to your profile.",
      });
    }

    // 3. Fetch history from Kuzhiundo API
    let history;
    try {
      const kuzhiRes = await fetch(
        `https://kuzhiundo.com/api/user/${encodeURIComponent(uuid)}/history`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (!kuzhiRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch stats from Kuzhiundo.",
          },
          { status: 400 }
        );
      }
      history = await kuzhiRes.json();
    } catch (err) {
      console.error("External Kuzhiundo API error during sync:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Kuzhiundo API server is temporarily unreachable.",
        },
        { status: 502 }
      );
    }

    if (!history || !Array.isArray(history.reports)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid history data returned from Kuzhiundo.",
        },
        { status: 400 }
      );
    }

    const newSubmissions = history.reports.length;

    // Fetch user's completion for Task 100 to determine actual old submissions
    const task100CompRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(player.user_id)}&task_id=eq.${KUZHIUNDO_SUBMISSION_TASK_ID}&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    if (!task100CompRes.ok) {
      throw new Error(`Failed to fetch Task 100 completion: ${await task100CompRes.text()}`);
    }
    const task100Completions = await task100CompRes.json();
    const task100Comp = task100Completions.length > 0 ? task100Completions[0] : null;

    const oldSubmissions = task100Comp ? (task100Comp.points_awarded / KUZHIUNDO_PER_SUBMISSION) : 0;
    const delta = newSubmissions - oldSubmissions;

    if (delta <= 0 && task100Comp) {
      return NextResponse.json({
        success: true,
        linked: true,
        delta: 0,
        message: "Your stats are already up to date!",
        data: {
          submissions: oldSubmissions,
          points: oldSubmissions * KUZHIUNDO_PER_SUBMISSION,
        },
      });
    }

    const deltaPoints = delta * KUZHIUNDO_PER_SUBMISSION;

    // 4. Upsert the repeatable task completion row
    const upsertRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?on_conflict=user_id,task_id`,
      {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_id: player.user_id,
          task_id: KUZHIUNDO_SUBMISSION_TASK_ID,
          points_awarded: newSubmissions * KUZHIUNDO_PER_SUBMISSION,
          xp_creativity: 0,
          xp_branding: 0,
          xp_innovation: 0,
          xp_teamwork: 0,
          xp_execution: newSubmissions, // 1 XP per submission
          completed_at: new Date().toISOString(),
        }),
      }
    );
    if (!upsertRes.ok) {
      throw new Error(`Failed to upsert task completion: ${await upsertRes.text()}`);
    }

    // 5. Update user's registrations (socials and mu_points)
    const updatedSocials = {
      ...socials,
      kuzhiundo_submissions: newSubmissions,
    };
    const newMuPoints = (player.mu_points || 0) + deltaPoints;

    const patchUserRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${player.id}`,
      {
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
      }
    );
    if (!patchUserRes.ok) {
      throw new Error(`Failed to update player stats: ${await patchUserRes.text()}`);
    }

    // 6. Update Squad Standings if player has a team
    if (player.team && deltaPoints > 0) {
      await adjustSquadPoints(
        supabaseUrl,
        supabaseKey,
        player.team,
        deltaPoints
      );
    }

    return NextResponse.json({
      success: true,
      linked: true,
      delta: delta,
      message: `Sync successful! Processed ${delta} new pothole mappings. Awarded +${deltaPoints} uPoints.`,
      data: {
        submissions: newSubmissions,
        points: newSubmissions * KUZHIUNDO_PER_SUBMISSION,
        mu_points: newMuPoints,
      },
    });
  } catch (error) {
    console.error("Kuzhiundo sync error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
