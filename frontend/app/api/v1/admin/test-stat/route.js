import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    // 1. Authenticate Admin
    const auth = requireRole(request, "admin", "superadmin", "viewer");
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: "Database not configured." }, { status: 503 });
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // 2. Fetch all registrations (id, user_id, name, team, referred_by, mu_points, tasks)
    const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?select=id,user_id,name,team,referred_by,mu_points,tasks&limit=5000`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!regRes.ok) throw new Error(`Failed to fetch registrations: ${await regRes.text()}`);
    const registrations = await regRes.json();

    // 3. Fetch all task completions (user_id, task_id, points_awarded, xp_execution)
    const completionsRes = await fetch(`${supabaseUrl}/rest/v1/user_completed_tasks?select=user_id,task_id,points_awarded,xp_execution&limit=5000`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!completionsRes.ok) throw new Error(`Failed to fetch completions: ${await completionsRes.text()}`);
    const completions = await completionsRes.json();

    // 4. Fetch all predictions (user_id, outcome)
    const predictionsRes = await fetch(`${supabaseUrl}/rest/v1/match_predictions?select=user_id,outcome&limit=5000`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    if (!predictionsRes.ok) throw new Error(`Failed to fetch predictions: ${await predictionsRes.text()}`);
    const predictions = await predictionsRes.json();

    // 4b. Fetch live Kuzhiundo individuals leaderboard
    let kuzhiundoApiReports = {};
    try {
      const kuzhiRes = await fetch("https://kuzhiundo.com/api/leaderboard/individuals", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (kuzhiRes.ok) {
        const kuzhiData = await kuzhiRes.json();
        const users = kuzhiData.users || [];
        users.forEach((u) => {
          if (u.id) {
            kuzhiundoApiReports[u.id] = parseInt(u.reports || "0", 10);
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch Kuzhiundo individuals in test-stat:", err);
    }

    // 5. Fetch actual squads table points for comparison
    const squadsRes = await fetch(`${supabaseUrl}/rest/v1/squads?select=name,points`, {
      method: "GET",
      headers,
      next: { revalidate: 0 }
    });
    let squads = [];
    if (squadsRes.ok) {
      squads = await squadsRes.json();
    }

    // 6. Aggregate Calculations
    // Mapping user_id to user details
    const usersMap = {};
    const userIdToDbId = {};
    registrations.forEach((r) => {
      usersMap[r.user_id] = r;
      userIdToDbId[r.id] = r.user_id; // Map DB id to user_id for referral tracking
    });

    // Count referrals received by each user (from their tasks JSON column, referal key)
    const referralCounts = {};
    registrations.forEach((r) => {
      let tasksObj = {};
      if (r.tasks) {
        if (typeof r.tasks === "string") {
          try {
            tasksObj = JSON.parse(r.tasks);
          } catch (e) {
            console.error("Failed to parse tasks JSON string for user:", r.user_id, e);
          }
        } else if (typeof r.tasks === "object") {
          tasksObj = r.tasks;
        }
      }

      let referalVal = 0;
      if (tasksObj && typeof tasksObj.referal === "number") {
        referalVal = tasksObj.referal;
      } else if (tasksObj && typeof tasksObj.referal === "string") {
        const parsedVal = parseInt(tasksObj.referal, 10);
        if (!isNaN(parsedVal)) referalVal = parsedVal;
      }

      if (referalVal > 0) {
        referralCounts[r.user_id] = referalVal;
      }
    });

    // Count actual foreign key referrals received by each user registration ID
    const dbIdReferralCounts = {};
    registrations.forEach((r) => {
      if (r.referred_by) {
        dbIdReferralCounts[r.referred_by] = (dbIdReferralCounts[r.referred_by] || 0) + 1;
      }
    });

    // Calculate per-user task points and Kuzhiundo points
    const userTaskPoints = {};
    const userKuzhiundoPoints = {};
    const userKuzhiundoSubmissions = {};
    const userTask4Completed = {};
    completions.forEach((c) => {
      const taskId = Number(c.task_id);
      const points = Number(c.points_awarded) || 0;
      if (taskId === 4 || taskId === 100) {
        userKuzhiundoPoints[c.user_id] = (userKuzhiundoPoints[c.user_id] || 0) + points;
        if (taskId === 4) {
          userTask4Completed[c.user_id] = true;
        }
        if (taskId === 100) {
          userKuzhiundoSubmissions[c.user_id] = Number(c.xp_execution) || 0;
        }
      } else {
        userTaskPoints[c.user_id] = (userTaskPoints[c.user_id] || 0) + points;
      }
    });

    // Calculate per-user prediction points
    const userPredictionPoints = {};
    predictions.forEach((p) => {
      let points = 0;
      if (p.outcome === "exact") points = 25;
      else if (p.outcome === "correct_outcome") points = 2;
      else if (p.outcome === "incorrect") points = -1;
      
      userPredictionPoints[p.user_id] = (userPredictionPoints[p.user_id] || 0) + points;
    });

    // Group points by team
    const teamStats = {};
    
    // Initialize stats for all known teams from squads table
    squads.forEach((s) => {
      teamStats[s.name] = {
        name: s.name,
        membersCount: 0,
        basePoints: 0,
        referralPoints: 0,
        taskPoints: 0,
        kuzhiundoPoints: 0,
        kuzhiDbSubmissions: 0,
        kuzhiApiSubmissions: 0,
        predictionPoints: 0,
        calculatedTotal: 0,
        actualSquadPoints: s.points || 0,
        totalPlayersPoints: 0,
        members: [],
      };
    });

    // Process registrations to assign points to teams
    registrations.forEach((r) => {
      const team = r.team;
      if (!team) return;

      if (!teamStats[team]) {
        teamStats[team] = {
          name: team,
          membersCount: 0,
          basePoints: 0,
          referralPoints: 0,
          taskPoints: 0,
          kuzhiundoPoints: 0,
          kuzhiDbSubmissions: 0,
          kuzhiApiSubmissions: 0,
          predictionPoints: 0,
          calculatedTotal: 0,
          actualSquadPoints: 0,
          totalPlayersPoints: 0,
          members: [],
        };
      }

      const stats = teamStats[team];
      stats.membersCount++;
      stats.basePoints += 10; // 10 base points per player registration
      stats.totalPlayersPoints += Number(r.mu_points) || 0; // Sum of members' stored mu_points

      const referrals = referralCounts[r.user_id] || 0;
      stats.referralPoints += referrals * 5; // +5 points per referral

      const userTasksVal = userTaskPoints[r.user_id] || 0;
      stats.taskPoints += userTasksVal;

      const userKuzhiVal = userKuzhiundoPoints[r.user_id] || 0;
      stats.kuzhiundoPoints += userKuzhiVal;

      const userPredsVal = userPredictionPoints[r.user_id] || 0;
      stats.predictionPoints += userPredsVal;

      const kuzhiDbCount = userKuzhiundoSubmissions[r.user_id] !== undefined
        ? userKuzhiundoSubmissions[r.user_id]
        : (userTask4Completed[r.user_id] ? 1 : 0);
      const kuzhiApiCount = kuzhiundoApiReports[r.id] || 0;

      stats.kuzhiDbSubmissions += kuzhiDbCount;
      stats.kuzhiApiSubmissions += kuzhiApiCount;

      stats.members.push({
        id: r.id,
        user_id: r.user_id,
        name: r.name || "Unknown User",
        muPoints: Number(r.mu_points) || 0,
        basePoints: 10,
        referredByCount: dbIdReferralCounts[r.id] || 0,
        tasksReferralCount: referrals,
        referralPoints: referrals * 5,
        taskPoints: userTasksVal,
        kuzhiundoPoints: userKuzhiVal,
        kuzhiundoUuid: r.id,
        kuzhiundoSubmissions: kuzhiDbCount,
        kuzhiDbSubmissions: kuzhiDbCount,
        kuzhiApiSubmissions: kuzhiApiCount,
        predictionPoints: userPredsVal,
        totalPoints: 10 + referrals * 5 + userTasksVal + userKuzhiVal + userPredsVal,
      });
    });

    // Calculate calculatedTotal
    Object.keys(teamStats).forEach((teamName) => {
      const stats = teamStats[teamName];
      stats.calculatedTotal = stats.basePoints + stats.referralPoints + stats.taskPoints + stats.kuzhiundoPoints + stats.predictionPoints;
    });

    const sortedStats = Object.values(teamStats).sort((a, b) => b.calculatedTotal - a.calculatedTotal);

    return NextResponse.json({
      success: true,
      data: sortedStats,
    });
  } catch (error) {
    console.error("Test stat calculations error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
