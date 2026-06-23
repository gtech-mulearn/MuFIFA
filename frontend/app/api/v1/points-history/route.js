import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";

const PLAYER_COOKIE = "player_token";

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured." },
        { status: 503 },
      );
    }

    // Authenticate player via player_token cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${PLAYER_COOKIE}=([^;]*)`),
    );

    if (!cookieMatch) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const token = cookieMatch[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "player") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const userId = decoded.user_id;

    // Fetch user details first to get the correct numeric database id and latest mu_points
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=id,mu_points,referal_id&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      },
    );

    if (!userRes.ok) {
      throw new Error(`Failed to query user profile: ${await userRes.text()}`);
    }

    const users = await userRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 404 },
      );
    }

    const userDbId = users[0].id;

    const totalPoints = Number(users[0].mu_points ?? 0);

    // 1. Fetch completed tasks with task details
    const completedTasksRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(userId)}&select=id,task_id,completed_at,points_awarded,xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution,tasks(title)&order=completed_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      },
    );

    let taskEntries = [];
    if (completedTasksRes.ok) {
      const completedTasks = await completedTasksRes.json();
      taskEntries = completedTasks
        .filter((ct) => ct.task_id !== 100)
        .map((ct) => ({
          id: `task-${ct.id}`,
          type: "task",
          title: ct.tasks?.title || `Task #${ct.task_id}`,
          points: ct.points_awarded || 0,
          date: ct.completed_at,
          xp: {
            creativity: ct.xp_creativity || 0,
            branding: ct.xp_branding || 0,
            innovation: ct.xp_innovation || 0,
            teamwork: ct.xp_teamwork || 0,
            execution: ct.xp_execution || 0,
          },
        }));
    }

    // 2. Fetch all predictions of the user
    const predictionsRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(userId)}&select=id,match_id,predicted_outcome,predicted_home_goals,predicted_away_goals,updated_at,outcome&order=updated_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      },
    );

    // Fetch rewarded matches list from match_cache
    let rewardedMatchIds = [];
    const cacheRewardedRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.rewarded_matches&select=match_data`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      },
    );
    if (cacheRewardedRes.ok) {
      const rows = await cacheRewardedRes.json();
      if (rows.length > 0) {
        rewardedMatchIds = rows[0].match_data?.match_ids || [];
      }
    }

    // Fetch WC season match details to check actual scores
    let matchesList = [];
    const wcRes = await fetch(
      `${supabaseUrl}/rest/v1/match_cache?match_id=eq.WC_season&select=match_data`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      },
    );
    if (wcRes.ok) {
      const rows = await wcRes.json();
      if (rows.length > 0) {
        matchesList = rows[0].match_data?.matches || [];
      }
    }

    const matchesMap = {};
    matchesList.forEach((m) => {
      matchesMap[String(m.id)] = m;
    });

    const rewardedSet = new Set(rewardedMatchIds.map(String));
    let predictionEntries = [];
    if (predictionsRes.ok) {
      const predictions = await predictionsRes.json();
      predictionEntries = predictions.map((p) => {
        const match = matchesMap[String(p.match_id)];
        let points = null;
        if (p.outcome === "exact") {
          points = 25;
        } else if (p.outcome === "correct_outcome") {
          points = 2;
        } else if (p.outcome === "incorrect") {
          points = -1;
        }

        const isRewarded = p.outcome !== null && p.outcome !== undefined;

        return {
          id: `pred-${p.id}`,
          type: "prediction",
          title: match
            ? `Prediction: ${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`
            : `Match Prediction #${p.match_id}`,
          points: points,
          date: p.updated_at,
          details: {
            predicted_outcome: p.predicted_outcome,
            predicted_home_goals: p.predicted_home_goals,
            predicted_away_goals: p.predicted_away_goals,
            is_rewarded: isRewarded,
          },
        };
      });
    }

    // 3. Fetch referral bonuses (each referral = +5 points)
    // The registrations table uses `referred_by` with the numeric `id`
    const referralsRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?referred_by=eq.${encodeURIComponent(userDbId)}&select=id,name,user_id,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      },
    );

    let referralEntries = [];
    if (referralsRes.ok) {
      const referrals = await referralsRes.json();
      referralEntries = referrals.map((r) => ({
        id: `ref-${r.id}`,
        type: "referral",
        title: `Referral: ${r.name || r.user_id}`,
        points: 5,
        date: r.created_at,
        referral: {
          name: r.name || "Unknown",
          user_id: r.user_id,
        },
      }));
    }

    // 4. Combine, sort by date (most recent first)
    const allEntries = [
      ...taskEntries,
      ...predictionEntries,
      ...referralEntries,
    ];
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      success: true,
      data: {
        total_points: totalPoints,
        history: allEntries,
        summary: {
          tasks_completed: taskEntries.length,
          predictions_scored: predictionEntries.filter(
            (e) => e.details?.is_rewarded,
          ).length,
          referrals_made: referralEntries.length,
          task_points: taskEntries.reduce((sum, e) => sum + (e.points ?? 0), 0),
          prediction_points: predictionEntries.reduce(
            (sum, e) => sum + (e.points ?? 0),
            0,
          ),
          referral_points: referralEntries.reduce(
            (sum, e) => sum + (e.points ?? 0),
            0,
          ),
        },
      },
    });
  } catch (error) {
    console.error("Points history error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
