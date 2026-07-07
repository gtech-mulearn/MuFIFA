import { NextResponse } from "next/server";
import { fetchAllSupabase } from "@/utils/supabase";

// Global rank map cache is used to calculate absolute ranks. Cached for 1 hour.
let _rankMapCache = null;
const RANK_MAP_TTL_MS = 3_600_000;

// Short-term cache for paginated query URLs to optimize performance. Max 50 items.
const _queryCache = new Map();
const QUERY_CACHE_TTL_MS = 3_600_000;
const QUERY_CACHE_MAX_SIZE = 50;

// Builds an in-memory map of player IDs to their absolute point-based leaderboard ranks.
async function getRankMap(supabaseUrl, supabaseKey) {
  const now = Date.now();
  if (_rankMapCache && now - _rankMapCache.ts < RANK_MAP_TTL_MS) {
    return _rankMapCache.map;
  }

  const rankMap = new Map();
  try {
    const allPlayers = await fetchAllSupabase(
      `${supabaseUrl}/rest/v1/registrations?select=id,mu_points,name,team&order=mu_points.desc,name.asc`,
      {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      }
    );
    const allPlayersFiltered = allPlayers.filter(p => p.team !== 'Test');
    allPlayersFiltered.forEach((p, idx) => {
      rankMap.set(p.id, idx + 1);
    });
  } catch (err) {
    console.error("Failed to build rank map:", err);
    if (_rankMapCache) return _rankMapCache.map;
  }

  _rankMapCache = { map: rankMap, ts: now };
  return rankMap;
}

// Queries a single page of players from Supabase, applying cache lookup.
async function fetchPlayersPage(queryUrl, supabaseKey) {
  const now = Date.now();
  const cached = _queryCache.get(queryUrl);
  if (cached && now - cached.ts < QUERY_CACHE_TTL_MS) {
    return { players: cached.players, totalCount: cached.totalCount };
  }

  const res = await fetch(queryUrl, {
    method: "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase query failed: ${await res.text()}`);
  }

  const players = await res.json();

  // Extract total exact count of matching records from HTTP headers
  const contentRange = res.headers.get("content-range");
  let totalCount = players.length;
  if (contentRange) {
    const parts = contentRange.split("/");
    if (parts.length === 2) {
      totalCount = parseInt(parts[1], 10);
    }
  }

  // Prevent memory leaks by evicting the oldest query from the map cache
  if (_queryCache.size >= QUERY_CACHE_MAX_SIZE) {
    const oldestKey = _queryCache.keys().next().value;
    _queryCache.delete(oldestKey);
  }

  _queryCache.set(queryUrl, { players, totalCount, ts: now });
  return { players, totalCount };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "desc";
    const team = searchParams.get("team") || "All";

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

    const selectFields =
      "id,name,user_id,team,domain,mu_points,avatar_url,created_at,tasks";

    const orderDirection = sort === "asc" ? "asc" : "desc";
    let queryUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&order=mu_points.${orderDirection},name.asc&limit=${limit}&offset=${offset}`;

    if (search.trim()) {
      const cleanSearch = search.trim();
      queryUrl += `&or=(name.ilike.*${encodeURIComponent(cleanSearch)}*,user_id.ilike.*${encodeURIComponent(cleanSearch)}*)`;
    }

    if (team && team !== "All") {
      queryUrl += `&team=eq.${encodeURIComponent(team)}`;
    } else {
      queryUrl += `&team=neq.Test`;
    }

    // Load data from page query and absolute ranking map concurrently
    const [{ players, totalCount }, rankMap] = await Promise.all([
      fetchPlayersPage(queryUrl, supabaseKey),
      getRankMap(supabaseUrl, supabaseKey),
    ]);

    const playersWithRanks = players.map((player, idx) => {
      let fallbackRank;
      if (sort === "asc") {
        fallbackRank = totalCount - (offset + idx);
      } else {
        fallbackRank = offset + idx + 1;
      }
      const rank = rankMap.get(player.id) || fallbackRank;
      return { ...player, rank };
    });

    return NextResponse.json({
      success: true,
      data: playersWithRanks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + players.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Fetch individual standings error:", error);
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
