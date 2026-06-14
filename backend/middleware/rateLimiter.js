const rateLimitCache = new Map();

// Default constants with environment variable configuration options
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX, 10) || 5;

// Garbage collect inactive IPs periodically to prevent long-term memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitCache.entries()) {
    const activeTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
    if (activeTimestamps.length === 0) {
      rateLimitCache.delete(ip);
    } else {
      rateLimitCache.set(ip, activeTimestamps);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Extracts the original client IP, splitting off upstream proxy headers if present.
 */
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}

/**
 * Rate-limiting middleware using a sliding-window cache to prevent API flooding.
 */
const rateLimiter = (req, res, next) => {
  const ip = getClientIp(req);
  const now = Date.now();

  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, []);
  }

  const timestamps = rateLimitCache.get(ip).filter(t => now - t < WINDOW_MS);
  rateLimitCache.set(ip, timestamps);

  const remaining = Math.max(0, MAX_REQUESTS - timestamps.length);
  const oldestTimestamp = timestamps[0] || now;
  const resetSeconds = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);

  // Set standard rate limit headers to let clients manage their request cycles
  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", resetSeconds);

  if (timestamps.length >= MAX_REQUESTS) {
    res.setHeader("Retry-After", resetSeconds);
    return res.status(429).json({
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: `Too many registration attempts. Please try again after ${resetSeconds} seconds.`,
        details: null,
      },
    });
  }

  timestamps.push(now);
  next();
};

module.exports = rateLimiter;
