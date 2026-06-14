const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 5; // Allow max 5 submissions per minute per IP

// Simple memory-based rate limiter middleware to prevent spamming registration endpoints.
const rateLimiter = async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "127.0.0.1";
  const now = Date.now();

  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, []);
  }

  // Filter timestamps to only keep requests within the sliding window.
  const timestamps = rateLimitCache.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitCache.set(ip, timestamps);

  if (timestamps.length >= MAX_REQUESTS) {
    return c.json({
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many registration attempts. Please try again after 1 minute.",
        details: null,
      },
    }, 429);
  }

  timestamps.push(now);
  await next();
};

module.exports = rateLimiter;
