// Shared in-memory rate limiter for API routes.
// Resets on cold start (acceptable for serverless).

const stores = new Map(); // key: storeName, value: Map<ip, { count, resetAt }>
const MAX_STORE_SIZE = 500;

/**
 * Create a rate limiter for a specific route.
 * @param {string} name - Unique identifier for this limiter
 * @param {number} maxAttempts - Max requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 */
export function createRateLimiter(name, maxAttempts = 10, windowMs = 60_000) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }

  return function checkRateLimit(ip) {
    const store = stores.get(name);
    const now = Date.now();

    // Evict stale entries periodically
    if (store.size > MAX_STORE_SIZE) {
      for (const [key, val] of store) {
        if (now > val.resetAt) store.delete(key);
      }
    }

    const entry = store.get(ip);
    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return { limited: false };
    }

    entry.count++;
    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { limited: true, retryAfter };
    }

    return { limited: false };
  };
}

/**
 * Helper to extract client IP from a Next.js request.
 */
export function getClientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
