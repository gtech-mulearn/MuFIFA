import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message:
              "Database credentials are not configured in environment variables.",
            details: null,
          },
        },
        { status: 503 },
      );
    }

    const targetUrl = `${supabaseUrl}/rest/v1/registrations?select=user_id,team,mu_points`;
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase REST error: ${errorText}`);
    }

    const registrations = await res.json();

    const squadsUrl = `${supabaseUrl}/rest/v1/squads?select=name`;
    const squadsRes = await fetch(squadsUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 0 },
    });

    const squadNames = [];
    if (squadsRes.ok) {
      const squadsData = await squadsRes.json();
      squadsData.forEach((s) => {
        if (s.name) squadNames.push(s.name);
      });
    }

    // Initialize counts and points map
    const organisation_count = {};
    const squad_points = {};
    const registrationsByTeam = {};

    squadNames.forEach((name) => {
      organisation_count[name] = 0;
      squad_points[name] = 0;
      registrationsByTeam[name] = [];
    });

    // Populate registration counts and group mu_points by team
    registrations.forEach((r) => {
      if (r.team) {
        organisation_count[r.team] = (organisation_count[r.team] || 0) + 1;
        if (!registrationsByTeam[r.team]) {
          registrationsByTeam[r.team] = [];
        }
        registrationsByTeam[r.team].push(Number(r.mu_points || 0));
      }
    });

    const referral_analytics = {};
    registrations.forEach((r) => {
      if (r.user_id) {
        referral_analytics[r.user_id] =
          (referral_analytics[r.user_id] || 0) + 1;
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

    // Calculate dynamic scores for each team: Median * (Active / Registered) * 100
    Object.keys(registrationsByTeam).forEach((team) => {
      const pointsArray = registrationsByTeam[team];
      const registeredCount = pointsArray.length;
      if (registeredCount === 0) {
        squad_points[team] = 0;
        return;
      }
      const activeCount = pointsArray.filter((pts) => pts > 0).length;
      const median = calculateMedian(pointsArray);
      const score =
        median *
        (activeCount / registeredCount) *
        Math.log10(activeCount + 1) *
        100;
      squad_points[team] = Math.round(score);
    });

    const statsPayload = {
      organisation_count,
      referral_analytics,
      squad_points,
    };

    return NextResponse.json(
      {
        success: true,
        response: statsPayload,
        data: statsPayload,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Next.js live-stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while compiling live stats.",
          details: null,
        },
      },
      { status: 500 },
    );
  }
}
