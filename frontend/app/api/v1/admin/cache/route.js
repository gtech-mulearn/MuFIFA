import { NextResponse } from "next/server";
import { requireRole } from "@/utils/auth";
import { kuzhiundoCache } from "@/utils/kuzhiundoCache";

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

    return NextResponse.json({
      success: true,
      cache: {
        individuals: {
          cached: !!kuzhiundoCache.individuals,
          count: kuzhiundoCache.individuals ? kuzhiundoCache.individuals.length : 0,
          timestamp: kuzhiundoCache.individualsTimestamp ? new Date(kuzhiundoCache.individualsTimestamp).toISOString() : null,
        },
        teams: {
          cached: !!kuzhiundoCache.teams,
          count: kuzhiundoCache.teams ? kuzhiundoCache.teams.length : 0,
          timestamp: kuzhiundoCache.teamsTimestamp ? new Date(kuzhiundoCache.teamsTimestamp).toISOString() : null,
        }
      }
    });
  } catch (error) {
    console.error("Admin get cache status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cache status.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, "admin", "superadmin");
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

    kuzhiundoCache.clear();

    return NextResponse.json({
      success: true,
      message: "Kuzhiundo cache cleared successfully.",
    });
  } catch (error) {
    console.error("Admin cache clear error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to clear cache.",
          details: null,
        },
      },
      { status: 500 }
    );
  }
}
