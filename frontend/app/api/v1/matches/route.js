import { NextResponse } from "next/server";
import { fetchMatches } from "@/utils/football-api";

export async function GET() {
  try {
    const { matches, cachedAt, stale } = await fetchMatches();

    return NextResponse.json(
      {
        success: true,
        data: {
          matches,
          cachedAt,
          competition: "WC",
          stale,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/v1/matches error:", error);

    if (error?.message?.includes("Database not configured")) {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPSTREAM_ERROR",
          message: "Failed to fetch matches from football-data.org.",
          details: null,
        },
      },
      { status: 502 }
    );
  }
}
