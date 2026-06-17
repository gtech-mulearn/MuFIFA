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
        { status: 503 }
      );
    }

    // Authenticate player via player_token cookie
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

    const token = cookieMatch[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "player") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = decoded.user_id;

    // 1. Fetch completed tasks with task details
    const completedTasksRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?user_id=eq.${encodeURIComponent(userId)}&select=id,task_id,completed_at,points_awarded,xp_creativity,xp_branding,xp_innovation,xp_teamwork,xp_execution,tasks(title)&order=completed_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      }
    );

    let taskEntries = [];
    if (completedTasksRes.ok) {
      const completedTasks = await completedTasksRes.json();
      taskEntries = completedTasks.map((ct) => ({
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

    // 2. Fetch scored predictions (those with points_earned set)
    const predictionsRes = await fetch(
      `${supabaseUrl}/rest/v1/match_predictions?user_id=eq.${encodeURIComponent(userId)}&select=id,match_id,predicted_outcome,predicted_home_goals,predicted_away_goals,points_earned,scored_at,updated_at&order=updated_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      }
    );

    let predictionEntries = [];
    if (predictionsRes.ok) {
      const predictions = await predictionsRes.json();
      predictionEntries = predictions
        .filter((p) => p.points_earned !== null && p.points_earned !== undefined)
        .map((p) => ({
          id: `pred-${p.id}`,
          type: "prediction",
          title: `Match Prediction #${p.match_id}`,
          points: p.points_earned || 0,
          date: p.scored_at || p.updated_at,
          details: {
            predicted_outcome: p.predicted_outcome,
            predicted_home_goals: p.predicted_home_goals,
            predicted_away_goals: p.predicted_away_goals,
          },
        }));
    }

    // 3. Fetch referral bonuses (each referral = +5 points)
    // The registrations table uses `referred_by` with the numeric `id` from the JWT
    const referralsRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?referred_by=eq.${decoded.id}&select=id,name,user_id,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 0 },
      }
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

    // 4. Fetch current total mu_points
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?user_id=eq.${encodeURIComponent(userId)}&select=mu_points&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    let totalPoints = 0;
    if (userRes.ok) {
      const users = await userRes.json();
      totalPoints = Number(users?.[0]?.mu_points ?? 0);
    }

    // 5. Combine, sort by date (most recent first)
    const allEntries = [...taskEntries, ...predictionEntries, ...referralEntries];
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      success: true,
      data: {
        total_points: totalPoints,
        history: allEntries,
        summary: {
          tasks_completed: taskEntries.length,
          predictions_scored: predictionEntries.length,
          referrals_made: referralEntries.length,
          task_points: taskEntries.reduce((sum, e) => sum + e.points, 0),
          prediction_points: predictionEntries.reduce((sum, e) => sum + e.points, 0),
          referral_points: referralEntries.reduce((sum, e) => sum + e.points, 0),
        },
      },
    });
  } catch (error) {
    console.error("Points history error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
