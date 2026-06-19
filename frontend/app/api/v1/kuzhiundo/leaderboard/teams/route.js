import { NextResponse } from "next/server";
import {
  KUZHIUNDO_BASE_POINTS,
  KUZHIUNDO_PER_SUBMISSION,
} from "@/utils/kuzhiundo";
import { TEAM_FLAGS } from "@/utils/constants";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const q = searchParams.get("q");

    // Construct target endpoint URL using URL object to handle query parameter encoding robustly.
    const endpointUrl = new URL("https://kuzhiundo.com/api/leaderboard/teams");
    if (period) {
      endpointUrl.searchParams.set("period", period);
    }
    if (q) {
      endpointUrl.searchParams.set("q", q);
    }

    const res = await fetch(endpointUrl.toString(), { next: { revalidate: 30 } });
    if (!res.ok) {
      throw new Error(`Kuzhiundo API returned status ${res.status}`);
    }

    const json = await res.json();
    const teams = json.teams || [];

    // Prepopulate all registered teams with zero values so that every team appears on the leaderboard.
    const leaderboardMap = Object.entries(TEAM_FLAGS).reduce((acc, [teamName, flagCode]) => {
      acc[teamName] = {
        team: teamName,
        flag: flagCode,
        submissions: 0,
        mappersCount: 0,
        points: 0,
      };
      return acc;
    }, {});

    // Overlay API results for registered teams and calculate points.
    for (const item of teams) {
      const name = item.team;
      if (leaderboardMap[name]) {
        const submissions = parseInt(item.reports || "0", 10);
        const mappersCount = parseInt(item.mappers || "0", 10);
        const points =
          mappersCount * KUZHIUNDO_BASE_POINTS + submissions * KUZHIUNDO_PER_SUBMISSION;

        leaderboardMap[name] = {
          team: name,
          flag: TEAM_FLAGS[name],
          submissions,
          mappersCount,
          points,
        };
      }
    }

    // Rank teams by total points first, breaking any ties with submission count.
    const sortedTeams = Object.values(leaderboardMap).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.submissions - a.submissions;
    });

    return NextResponse.json({
      success: true,
      data: sortedTeams,
      cached: false,
    });
  } catch (error) {
    console.error("Teams leaderboard proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
