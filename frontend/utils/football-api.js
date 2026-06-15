// utils/football-api.js

const COMPETITION = "WC";
const CACHE_KEY = `${COMPETITION}_season`;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch WC matches, using match_cache as a 5-minute TTL cache.
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
      next: { revalidate: 0 },
    }
  );

  if (cacheRes.ok) {
    const rows = await cacheRes.json();
    if (rows.length > 0) {
      const { match_data, fetched_at } = rows[0];
      const age = Date.now() - new Date(fetched_at).getTime();

      if (age < CACHE_TTL_MS) {
        // Cache hit — return fresh cached data
        return { matches: match_data.matches, cachedAt: fetched_at, stale: false };
      }

      // Cache is stale — attempt live refresh, fall back to stale on failure
      try {
        const fresh = await _fetchFromApi(footballApiKey);
        await _updateCache(supabaseUrl, supabaseKey, fresh);
        return { matches: fresh.matches, cachedAt: new Date().toISOString(), stale: false };
      } catch {
        // Upstream failure — serve stale data gracefully
        return { matches: match_data.matches, cachedAt: fetched_at, stale: true };
      }
    }
  }

  // 2. Cache miss — fetch live and populate cache
  const fresh = await _fetchFromApi(footballApiKey);
  await _updateCache(supabaseUrl, supabaseKey, fresh);
  return { matches: fresh.matches, cachedAt: new Date().toISOString(), stale: false };
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
      next: { revalidate: 0 },
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
        match_data: data,
        fetched_at: new Date().toISOString(),
      },
    ]),
  });
}
