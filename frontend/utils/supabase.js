/**
 * Supabase REST API utilities.
 *
 * PostgREST (used by Supabase) enforces a server-side maximum row limit
 * (typically 1,000). This helper paginates transparently so callers always
 * receive the complete result set.
 */

/**
 * Fetch all matching rows from a Supabase REST endpoint by paginating
 * automatically in batches.
 *
 * @param {string} baseUrl  – The full Supabase REST URL **without** limit/offset
 *                            query params (e.g. `${SUPABASE_URL}/rest/v1/table?select=col`).
 * @param {object} headers  – Request headers (must include apikey & Authorization).
 * @param {object} [opts]
 * @param {number} [opts.batchSize=1000] – Rows per request (max the server allows).
 * @param {object} [opts.fetchOptions]   – Extra options forwarded to `fetch` (e.g. `next`).
 * @returns {Promise<Array>} – The full array of rows.
 */
export async function fetchAllSupabase(baseUrl, headers, opts = {}) {
  const batchSize = opts.batchSize || 1000;
  const fetchOptions = opts.fetchOptions || {};
  const separator = baseUrl.includes("?") ? "&" : "?";

  let allRows = [];
  let offset = 0;

  while (true) {
    const url = `${baseUrl}${separator}limit=${batchSize}&offset=${offset}`;
    const res = await fetch(url, {
      method: "GET",
      headers,
      ...fetchOptions,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase fetch failed (${res.status}): ${errText}`);
    }

    const rows = await res.json();
    allRows = allRows.concat(rows);

    // If we got fewer rows than the batch size, we've reached the end
    if (rows.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return allRows;
}
