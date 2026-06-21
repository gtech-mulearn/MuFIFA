import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory caches (module-scoped, persist across requests in the same process)
// ---------------------------------------------------------------------------

// Rank map cache – the heaviest query (all registrations). TTL: 30 seconds.
let _rankMapCache = null; // { map: Map, ts: number }
const RANK_MAP_TTL_MS = 30_000;

// Paginated query cache – keyed by the full Supabase query URL. TTL: 15 seconds.
// Stores { players, totalCount, ts }.  Max 50 entries to cap memory usage.
const _queryCache = new Map();
const QUERY_CACHE_TTL_MS = 15_000;
const QUERY_CACHE_MAX_SIZE = 50;

/**
 * Retrieve or build the global rank map from Supabase.
 * Returns a Map<id, rank> (1-indexed).
 */
async function getRankMap(supabaseUrl, supabaseKey) {
  const now = Date.now();
  if (_rankMapCache && now - _rankMapCache.ts < RANK_MAP_TTL_MS) {
    return _rankMapCache.map;
  }

  const rankMap = new Map();
  try {
    const allPlayersRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?select=id,mu_points,name&order=mu_points.desc,name.asc`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    if (allPlayersRes.ok) {
      const allPlayers = await allPlayersRes.json();
      allPlayers.forEach((p, idx) => {
        rankMap.set(p.id, idx + 1);
      });
    }
  } catch (err) {
    console.error("Failed to build rank map:", err);
    // Return stale cache if available
    if (_rankMapCache) return _rankMapCache.map;
  }

  _rankMapCache = { map: rankMap, ts: now };
  return rankMap;
}

/**
 * Fetch paginated players from Supabase with a short-lived cache.
 * Returns { players: Array, totalCount: number }.
 */
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

  // Parse total count from Content-Range header
  const contentRange = res.headers.get("content-range");
  let totalCount = players.length;
  if (contentRange) {
    const parts = contentRange.split("/");
    if (parts.length === 2) {
      totalCount = parseInt(parts[1], 10);
    }
  }

  // Evict oldest entries when cache exceeds max size
  if (_queryCache.size >= QUERY_CACHE_MAX_SIZE) {
    const oldestKey = _queryCache.keys().next().value;
    _queryCache.delete(oldestKey);
  }

  _queryCache.set(queryUrl, { players, totalCount, ts: now });
  return { players, totalCount };
}

// ---------------------------------------------------------------------------

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "desc";

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
      "id,name,user_id,team,domain,mu_points,avatar_url,created_at";

    const orderDirection = sort === "asc" ? "asc" : "desc";
    let queryUrl = `${supabaseUrl}/rest/v1/registrations?select=${selectFields}&order=mu_points.${orderDirection},name.asc&limit=${limit}&offset=${offset}`;

    if (search.trim()) {
      const cleanSearch = search.trim();
      queryUrl += `&or=(name.ilike.*${encodeURIComponent(cleanSearch)}*,user_id.ilike.*${encodeURIComponent(cleanSearch)}*)`;
    }

    // Fetch paginated players and rank map in parallel
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
