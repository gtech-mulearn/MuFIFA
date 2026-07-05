import { NextResponse } from "next/server";
import { fetchAllSupabase } from "@/utils/supabase";

// Persists the aggregated college leaderboard standings in memory across requests to prevent redundant database load.
let _collegeCache = null;
const CACHE_TTL_MS = 3_600_000; // Cache TTL set to 1 hour

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Database credentials are not configured.",
          },
        },
        { status: 503 },
      );
    }

    // Serves cached standings if within the one-hour freshness window.
    const now = Date.now();
    if (_collegeCache && now - _collegeCache.ts < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: applySearch(_collegeCache.data, search),
      });
    }

    // Fetch all active player registrations from database, excluding internal test players.
    const allPlayers = await fetchAllSupabase(
      `${supabaseUrl}/rest/v1/registrations?select=id,institutions,mu_points,team&team=neq.Test`,
      {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    );

    // Group players by college names case-insensitively to prevent duplicates, while preserving user capitalization.
    const collegeMap = new Map();

    for (const player of allPlayers) {
      const raw = (player.institutions || "").trim();
      if (!raw) continue;

      const lookupKey = raw.toLowerCase();
      if (!collegeMap.has(lookupKey)) {
        collegeMap.set(lookupKey, {
          name: raw,
          totalPoints: 0,
          memberCount: 0,
        });
      }

      const collegeObj = collegeMap.get(lookupKey);
      collegeObj.totalPoints += Number(player.mu_points) || 0;
      collegeObj.memberCount += 1;
    }

    // Sort standings by highest points, falling back to alphabetical sorting on ties.
    const sorted = Array.from(collegeMap.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.name.localeCompare(b.name);
    });

    // Map sorted array indices to assign official ranks (1-indexed).
    const ranked = sorted.map((col, idx) => ({ rank: idx + 1, ...col }));

    _collegeCache = { data: ranked, ts: now };

    return NextResponse.json({
      success: true,
      data: applySearch(ranked, search),
    });
  } catch (error) {
    console.error("Fetch college standings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 },
    );
  }
}

function applySearch(data, search) {
  if (!search.trim()) return data;
  const q = search.trim().toLowerCase();
  return data.filter((c) => c.name.toLowerCase().includes(q));
}
