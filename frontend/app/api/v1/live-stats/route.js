import { NextResponse } from "next/server";
import { fetchAllSupabase } from "@/utils/supabase";

export const revalidate = 3600;

// Caches calculation results in memory for 1 hour to prevent scanning the entire table on every request.
let _liveStatsCache = null;
const LIVE_STATS_TTL_MS = 3_600_000;

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

    const now = Date.now();
    if (_liveStatsCache && now - _liveStatsCache.ts < LIVE_STATS_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          response: _liveStatsCache.stats,
          data: _liveStatsCache.stats,
        },
        { status: 200 },
      );
    }

    const allRegistrations = await fetchAllSupabase(
      `${supabaseUrl}/rest/v1/registrations?select=user_id,team,mu_points`,
      {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      { fetchOptions: { next: { revalidate: 3600 } } }
    );
    const registrations = allRegistrations.filter(r => r.team !== "Test");

    const squadsUrl = `${supabaseUrl}/rest/v1/squads?select=name`;
    const squadsRes = await fetch(squadsUrl, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 },
    });

    const squadNames = [];
    if (squadsRes.ok) {
      const squadsData = await squadsRes.json();
      squadsData.forEach((s) => {
        if (s.name && s.name !== "Test") squadNames.push(s.name);
      });
    }

    // Initialize team statistics maps and temporary arrays
    const organisation_count = {};
    const squad_points = {};
    const registrationsByTeam = {};

    squadNames.forEach((name) => {
      organisation_count[name] = 0;
      squad_points[name] = 0;
      registrationsByTeam[name] = [];
    });

    // Count registrations and collect individual points arrays per team
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

    // Calculates the statistical median of a points list
    function calculateMedian(arr) {
      if (!arr || arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 !== 0) {
        return sorted[mid];
      }
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Dynamic scoring logic: scores weigh total size, participation activity, and median performance
    Object.keys(registrationsByTeam).forEach((team) => {
      const pointsArray = registrationsByTeam[team];
      const registeredCount = pointsArray.length;
      if (registeredCount === 0) {
        squad_points[team] = 0;
        return;
      }
      const activeCount = pointsArray.filter((pts) => pts > 10).length;
      const median = calculateMedian(pointsArray);
      const score =
        median *
        (activeCount / registeredCount) *
        Math.pow(activeCount, 0.4) *
        Math.pow(registeredCount, 0.3) *
        100;
      squad_points[team] = Math.round(score);
    });

    const statsPayload = {
      organisation_count,
      referral_analytics,
      squad_points,
    };

    _liveStatsCache = { stats: statsPayload, ts: now };

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
    // Serves stale cached payload as a graceful fallback during server-side database errors.
    if (_liveStatsCache) {
      return NextResponse.json(
        {
          success: true,
          response: _liveStatsCache.stats,
          data: _liveStatsCache.stats,
        },
        { status: 200 },
      );
    }
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
