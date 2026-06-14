const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 5; // Allow max 5 submissions per minute per IP

// Simple memory-based rate limiter middleware to prevent spamming registration endpoints.
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();

  if (!rateLimitCache.has(ip)) {
    rateLimitCache.set(ip, []);
  }

  // Filter timestamps to only keep requests within the sliding window.
  const timestamps = rateLimitCache.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitCache.set(ip, timestamps);

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many registration attempts. Please try again after 1 minute.",
        details: null,
      },
    });
  }

  timestamps.push(now);
  next();
};

module.exports = rateLimiter;
