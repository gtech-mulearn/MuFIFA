// utils/football-api.js

const COMPETITION = "WC";
const CACHE_KEY = `${COMPETITION}_season`;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch WC matches, using match_cache as a 1-hour TTL cache.
 * Returns { matches: MatchObject[], cachedAt: string, stale: boolean }
 *
 * @throws {Error} If SUPABASE_URL or SUPABASE_KEY env vars are missing
 */
export async function fetchMatches() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const footballApiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Database not configured: SUPABASE_URL and SUPABASE_KEY environment variables are required."
    );
  }

  const supabaseHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // 1. Check cache
  const cacheRes = await fetch(
    `${supabaseUrl}/rest/v1/match_cache?match_id=eq.${CACHE_KEY}&select=match_data,fetched_at&limit=1`,
    {
      method: "GET",
      headers: supabaseHeaders,
      next: { revalidate: 300 },
    }
  );

  if (cacheRes.ok) {
    const rows = await cacheRes.json();
    if (rows.length > 0) {
      const { match_data, fetched_at } = rows[0];
      const age = Date.now() - new Date(fetched_at).getTime();

      if (age < CACHE_TTL_MS) {
        // Cache hit — return fresh cached data
        return { matches: filterMatches(match_data.matches), cachedAt: fetched_at, stale: false };
      }

      // Cache is stale — attempt live refresh, fall back to stale on failure
      try {
        const fresh = await _fetchFromApi(footballApiKey);
        await _updateCache(supabaseUrl, supabaseKey, fresh);
        return { matches: filterMatches(fresh.matches), cachedAt: new Date().toISOString(), stale: false };
      } catch {
        // Upstream failure — serve stale data gracefully
        return { matches: filterMatches(match_data.matches), cachedAt: fetched_at, stale: true };
      }
    }
  }

  // 2. Cache miss — fetch live and populate cache
  const fresh = await _fetchFromApi(footballApiKey);
  await _updateCache(supabaseUrl, supabaseKey, fresh);
  return { matches: filterMatches(fresh.matches), cachedAt: new Date().toISOString(), stale: false };
}

/**
 * Fetch all WC matches directly from football-data.org.
 * Throws on non-2xx responses.
 *
 * @param {string} apiKey - FOOTBALL_DATA_API_KEY
 * @returns {Promise<{ matches: MatchObject[], competition: object, [key: string]: unknown }>}
 */
export async function _fetchFromApi(apiKey) {
  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${COMPETITION}/matches`,
    {
      method: "GET",
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    throw new Error(
      `football-data.org responded ${res.status}: ${await res.text()}`
    );
  }

  return res.json(); // { matches: MatchObject[], competition: {...}, ... }
}

/**
 * UPSERT the full API response into match_cache for key WC_season.
 * Uses Prefer: "return=minimal,resolution=merge-duplicates" for conflict resolution.
 *
 * @param {string} supabaseUrl
 * @param {string} supabaseKey
 * @param {object} data - The full response from football-data.org
 */
export async function _updateCache(supabaseUrl, supabaseKey, data) {
  // Filter matches to store only necessary data (id, status, utcDate, competition name, teams name/shortName/crest, score)
  const slimMatches = (data?.matches || []).map((match) => ({
    id: match.id,
    status: match.status,
    utcDate: match.utcDate,
    competition: {
      name: match.competition?.name || "World Cup",
    },
    homeTeam: {
      id: match.homeTeam?.id,
      name: match.homeTeam?.name,
      shortName: match.homeTeam?.shortName,
      crest: match.homeTeam?.crest,
    },
    awayTeam: {
      id: match.awayTeam?.id,
      name: match.awayTeam?.name,
      shortName: match.awayTeam?.shortName,
      crest: match.awayTeam?.crest,
    },
    score: {
      fullTime: {
        home: match.score?.fullTime?.home,
        away: match.score?.fullTime?.away,
      },
    },
  }));

  const slimData = {
    matches: slimMatches,
  };

  await fetch(`${supabaseUrl}/rest/v1/match_cache`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal,resolution=merge-duplicates",
    },
    body: JSON.stringify([
      {
        match_id: CACHE_KEY,
        match_data: slimData,
        fetched_at: new Date().toISOString(),
      },
    ]),
  });
}

function filterMatches(matches) {
  if (!matches || !Array.isArray(matches)) return [];

  // Sort matches chronologically to find the boundary match
  const sorted = [...matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  // Find the Saudi Arabia vs Uruguay match
  const saudiUruguayIndex = sorted.findIndex((m) => {
    const home = m.homeTeam?.name?.toLowerCase() || "";
    const away = m.awayTeam?.name?.toLowerCase() || "";
    return (
      (home.includes("saudi") && away.includes("uruguay")) ||
      (home.includes("uruguay") && away.includes("saudi"))
    );
  });

  if (saudiUruguayIndex === -1) {
    return sorted;
  }

  // Keep all matches starting from the Saudi Arabia vs Uruguay match
  const cutoffDate = new Date(sorted[saudiUruguayIndex].utcDate);
  return sorted.filter((m) => new Date(m.utcDate) >= cutoffDate);
}
