import { NextResponse } from "next/server";
import { kuzhiundoCache } from "@/utils/kuzhiundoCache";

const CACHE_TTL = 3600000; // 1 hour in milliseconds

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const q = searchParams.get("q");

    // Since in-memory cache is simple, we can cache the main list. If there are query parameters, we bypass cache to fetch live from the source.
    const isFilterApplied = !!(period || q);
    const now = Date.now();

    if (!isFilterApplied && kuzhiundoCache.individuals && (now - kuzhiundoCache.individualsTimestamp < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: kuzhiundoCache.individuals,
        cached: true,
        expires_at: new Date(kuzhiundoCache.individualsTimestamp + CACHE_TTL).toISOString(),
      });
    }

    let url = "https://kuzhiundo.com/api/leaderboard/individuals";
    const params = [];
    if (period) params.push(`period=${encodeURIComponent(period)}`);
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Kuzhiundo API returned status ${res.status}`);
    }

    const json = await res.json();
    const users = json.users || [];

    const mappersList = users.map((u) => {
      const reports = parseInt(u.reports || "0", 10);
      // Under the scoring model, verifying awards 10 points (base), and each additional submission awards 1 point.
      // So points = 9 + reports.
      const points = 9 + reports;

      return {
        id: u.id,
        name: u.name,
        username: u.user_id,
        avatar_url: u.avatar_url,
        domain: u.domain || "Coder",
        team: u.team,
        submissions: reports,
        points: points,
      };
    });

    if (!isFilterApplied) {
      kuzhiundoCache.individuals = mappersList;
      kuzhiundoCache.individualsTimestamp = now;
    }

    return NextResponse.json({
      success: true,
      data: mappersList,
      cached: false,
      expires_at: new Date(now + CACHE_TTL).toISOString(),
    });

  } catch (error) {
    console.error("Individuals leaderboard proxy error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
