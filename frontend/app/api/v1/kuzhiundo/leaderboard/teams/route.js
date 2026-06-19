import { NextResponse } from "next/server";
import { kuzhiundoCache } from "@/utils/kuzhiundoCache";

const CACHE_TTL = 3600000; // 1 hour in milliseconds

const TEAM_FLAGS = {
  Brazil: "br",
  Argentina: "ar",
  Portugal: "pt",
  Germany: "de",
  France: "fr",
  England: "gb-eng",
  Spain: "es",
  Netherlands: "nl",
  Belgium: "be",
  Croatia: "hr",
  Uruguay: "uy",
  Japan: "jp",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const q = searchParams.get("q");

    const isFilterApplied = !!(period || q);
    const now = Date.now();

    if (!isFilterApplied && kuzhiundoCache.teams && (now - kuzhiundoCache.teamsTimestamp < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: kuzhiundoCache.teams,
        cached: true,
        expires_at: new Date(kuzhiundoCache.teamsTimestamp + CACHE_TTL).toISOString(),
      });
    }

    let url = "https://kuzhiundo.com/api/leaderboard/teams";
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
    const teams = json.teams || [];

    // Map to frontend structure
    const teamsList = teams.map((t) => {
      const reports = parseInt(t.reports || "0", 10);
      const mappers = parseInt(t.mappers || "0", 10);
      const points = (mappers * 9) + reports;

      return {
        team: t.team,
        flag: TEAM_FLAGS[t.team] || null,
        submissions: reports,
        mappersCount: mappers,
        points: points,
      };
    });

    // Make sure we include all 12 teams in the standings even if they have 0 mappers/reports
    const finalTeamsMap = {};
    Object.keys(TEAM_FLAGS).forEach((teamName) => {
      finalTeamsMap[teamName] = {
        team: teamName,
        flag: TEAM_FLAGS[teamName],
        submissions: 0,
        mappersCount: 0,
        points: 0,
      };
    });

    teamsList.forEach((t) => {
      if (finalTeamsMap[t.team]) {
        finalTeamsMap[t.team] = t;
      }
    });

    const sortedTeamsList = Object.values(finalTeamsMap).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.submissions - a.submissions;
    });

    if (!isFilterApplied) {
      kuzhiundoCache.teams = sortedTeamsList;
      kuzhiundoCache.teamsTimestamp = now;
    }

    return NextResponse.json({
      success: true,
      data: sortedTeamsList,
      cached: false,
      expires_at: new Date(now + CACHE_TTL).toISOString(),
    });

  } catch (error) {
    console.error("Teams leaderboard proxy error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
