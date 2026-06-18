import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";

export async function GET(request) {
  try {
    const auth = requireRole(request, "viewer", "admin", "superadmin");
    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
            message: auth.message,
            details: null,
          },
        },
        { status: auth.status }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database not configured.",
            details: null,
          },
        },
        { status: 503 }
      );
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    const regRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?select=id,name,email,team,domain,mu_points,created_at`,
      { method: "GET", headers, next: { revalidate: 0 } }
    );

    if (!regRes.ok) {
      throw new Error(`Failed to fetch registrations: ${await regRes.text()}`);
    }

    const registrations = await regRes.json();

    const squadsRes = await fetch(
      `${supabaseUrl}/rest/v1/squads?select=name,points`,
      { method: "GET", headers, next: { revalidate: 0 } }
    );

    let squads = [];
    if (squadsRes.ok) {
      squads = await squadsRes.json();
    }

    const tasksRes = await fetch(
      `${supabaseUrl}/rest/v1/tasks?select=id,title`,
      { method: "GET", headers, next: { revalidate: 0 } }
    );
    let tasksList = [];
    if (tasksRes.ok) {
      tasksList = await tasksRes.json();
    }

    const compRes = await fetch(
      `${supabaseUrl}/rest/v1/user_completed_tasks?select=task_id`,
      { method: "GET", headers, next: { revalidate: 0 } }
    );
    let completionsList = [];
    if (compRes.ok) {
      completionsList = await compRes.json();
    }

    const totalUsers = registrations.length;
    const teamCounts = {};
    const domainCounts = {};
    const dailyRegistrations = {};

    registrations.forEach((r) => {
      if (r.team) {
        teamCounts[r.team] = (teamCounts[r.team] || 0) + 1;
      }
      if (r.domain) {
        domainCounts[r.domain] = (domainCounts[r.domain] || 0) + 1;
      }
      if (r.created_at) {
        const day = r.created_at.slice(0, 10);
        dailyRegistrations[day] = (dailyRegistrations[day] || 0) + 1;
      }
    });

    // Helper to calculate median
    function calculateMedian(arr) {
      if (!arr || arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 !== 0) {
        return sorted[mid];
      }
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Group mu_points by team from registrations
    const registrationsByTeam = {};
    registrations.forEach((r) => {
      if (r.team) {
        if (!registrationsByTeam[r.team]) {
          registrationsByTeam[r.team] = [];
        }
        registrationsByTeam[r.team].push(Number(r.mu_points || 0));
      }
    });

    const squadPointsMap = {};
    squads.forEach((s) => {
      if (s.name) {
        squadPointsMap[s.name] = 0;
      }
    });

    Object.keys(registrationsByTeam).forEach((team) => {
      const pointsArray = registrationsByTeam[team];
      const registeredCount = pointsArray.length;
      if (registeredCount === 0) {
        squadPointsMap[team] = 0;
        return;
      }
      const activeCount = pointsArray.filter((pts) => pts > 0).length;
      const median = calculateMedian(pointsArray);
      const score = median * (activeCount / registeredCount) * Math.log10(activeCount + 1) * 100;
      squadPointsMap[team] = Math.round(score);
    });

    const teamStats = squads
      .map((s) => {
        const name = s.name;
        const count = teamCounts[name] || 0;
        const points = squadPointsMap[name] || 0;
        return { name, count, points };
      })
      .sort((a, b) => b.points - a.points);

    const domainStats = Object.entries(domainCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const today = new Date();
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({ date: key, count: dailyRegistrations[key] || 0 });
    }

    // Compute Hourly trend (last 24 hours) using robust millisecond timestamp windows
    const hourlyTrend = [];
    const oneHourMs = 60 * 60 * 1000;
    const nowMs = today.getTime();

    for (let i = 47; i >= 0; i--) {
      const hourStart = nowMs - (i + 1) * oneHourMs;
      const hourEnd = nowMs - i * oneHourMs;
      
      let count = 0;
      registrations.forEach((r) => {
        if (r.created_at) {
          const regTime = new Date(r.created_at).getTime();
          if (regTime > hourStart && regTime <= hourEnd) {
            count++;
          }
        }
      });

      const targetTime = new Date(hourEnd);
      const year = targetTime.getFullYear();
      const month = String(targetTime.getMonth() + 1).padStart(2, '0');
      const dateVal = String(targetTime.getDate()).padStart(2, '0');
      const hours = String(targetTime.getHours()).padStart(2, '0');
      
      hourlyTrend.push({
        date: `${year}-${month}-${dateVal} ${hours}:00`,
        label: `${hours}:00`,
        count: count
      });
    }

    // Compute Weekly trend (last 7 days - daily counts)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      weeklyTrend.push({
        date: key,
        label: key.slice(5), // MM-DD
        count: dailyRegistrations[key] || 0
      });
    }

    // Compute Monthly trend (last 30 days - daily counts)
    const monthlyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      monthlyTrend.push({
        date: key,
        label: key.slice(8), // DD
        count: dailyRegistrations[key] || 0
      });
    }

    let hourlyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;

    registrations.forEach((r) => {
      if (r.created_at) {
        const regTime = new Date(r.created_at).getTime();
        const diffMs = nowMs - regTime;
        if (diffMs <= 24 * 60 * 60 * 1000) {
          hourlyCount++;
        }
        if (diffMs <= 7 * 24 * 60 * 60 * 1000) {
          weeklyCount++;
        }
        if (diffMs <= 30 * 24 * 60 * 60 * 1000) {
          monthlyCount++;
        }
      }
    });

    // Aggregate completions count by task_id
    const completionCounts = {};
    completionsList.forEach((c) => {
      if (c.task_id) {
        completionCounts[c.task_id] = (completionCounts[c.task_id] || 0) + 1;
      }
    });

    const taskCompletionStats = tasksList.map((t) => ({
      id: t.id,
      title: t.title,
      count: completionCounts[t.id] || 0,
    })).sort((a, b) => b.count - a.count);

    const statsPayload = {
      totalUsers,
      totalTeams: squads.length,
      teamStats,
      domainStats,
      dailyTrend,
      timeframeStats: {
        hourly: hourlyCount,
        weekly: weeklyCount,
        monthly: monthlyCount,
      },
      trends: {
        hourly: hourlyTrend,
        weekly: weeklyTrend,
        monthly: monthlyTrend,
      },
      taskStats: taskCompletionStats,
    };

    return NextResponse.json({
      success: true,
      stats: statsPayload,
      data: statsPayload,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to compile stats.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
