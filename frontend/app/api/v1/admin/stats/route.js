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

    const squadPointsMap = {};
    squads.forEach((s) => {
      squadPointsMap[s.name] = s.points || 0;
    });

    const teamStats = Object.entries(teamCounts)
      .map(([name, count]) => ({
        name,
        count,
        points: squadPointsMap[name] || 0,
      }))
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

    const statsPayload = {
      totalUsers,
      totalTeams: squads.length,
      teamStats,
      domainStats,
      dailyTrend,
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
