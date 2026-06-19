import { NextResponse } from "next/server";
import {
  KUZHIUNDO_BASE_POINTS,
  KUZHIUNDO_PER_SUBMISSION,
} from "@/utils/kuzhiundo";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const q = searchParams.get("q");

    // Construct target endpoint URL using URL object to handle query parameter encoding robustly.
    const endpointUrl = new URL("https://kuzhiundo.com/api/leaderboard/individuals");
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
    const users = json.users || [];

    // Map the external API users structure to our frontend mapper format.
    const mappersList = users.map((u) => {
      const reports = parseInt(u.reports || "0", 10);
      const points = KUZHIUNDO_BASE_POINTS + reports * KUZHIUNDO_PER_SUBMISSION;

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

    return NextResponse.json({
      success: true,
      data: mappersList,
    });
  } catch (error) {
    console.error("Individuals leaderboard proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
