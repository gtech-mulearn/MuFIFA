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

/**
 * Fetch rows from Supabase where a field is `in` a set of values, batching the requests
 * to avoid URL length limitations and the server-side row limit.
 *
 * @param {string} baseUrl       – The full Supabase REST URL without query params.
 * @param {string} field         – The field to filter on (e.g. `user_id`).
 * @param {Array} values         – The array of values to query.
 * @param {object} headers       – Request headers.
 * @param {string} selectFields  – Selection string (default is `*`).
 * @returns {Promise<Array>}     – The complete list of matched rows.
 */
export async function fetchInSupabase(baseUrl, field, values, headers, selectFields = "*") {
  if (!values || values.length === 0) return [];

  const batchSize = 100; // safe batch size to avoid URL length issues
  const separator = baseUrl.includes("?") ? "&" : "?";
  let allRows = [];

  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize);
    const formattedValues = batch.map((val) => `"${String(val).replace(/"/g, '\\"')}"`).join(",");
    const url = `${baseUrl}${separator}${field}=in.(${encodeURIComponent(formattedValues)})&select=${selectFields}`;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Supabase fetchIn failed (${res.status}): ${errText}`);
    }

    const rows = await res.json();
    allRows = allRows.concat(rows);
  }

  return allRows;
}

