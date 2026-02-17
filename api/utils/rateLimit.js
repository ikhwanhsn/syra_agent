/**
 * Rate limiting for non-x402 (free) APIs to prevent spam, DDoS, and abuse.
 * - Simple window: single window (e.g. 100 req/min).
 * - Strict (dual-window): burst limit (e.g. 25/10s) + sustained (e.g. 100/min) to mitigate burst attacks.
 * - Periodic cleanup of expired entries to prevent memory exhaustion.
 */

const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

function simpleRateLimit(options) {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 60;
  const skip = options.skip || (() => false);
  const hits = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [ip, data] of hits.entries()) {
      if (now > data.resetTime) hits.delete(ip);
    }
  };
  const cleanupInterval = setInterval(cleanup, options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS);
  cleanupInterval.unref?.();

  return (req, res, next) => {
    if (skip(req)) return next();
    const ip = getClientIp(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!hits.has(ip)) {
      hits.set(ip, { count: 1, resetTime });
      return next();
    }
    const data = hits.get(ip);
    if (now > data.resetTime) {
      hits.set(ip, { count: 1, resetTime });
      return next();
    }
    data.count++;
    if (data.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((data.resetTime - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please slow down.",
      });
    }
    next();
  };
}

/**
 * Strict rate limit: burst window (e.g. 25 req/10s) AND sustained window (e.g. 100 req/60s).
 * Request is blocked if either limit is exceeded. Mitigates burst DDoS and sustained spam.
 */
function strictRateLimit(options) {
  const burstWindowMs = options.burstWindowMs ?? 10 * 1000;   // 10 seconds
  const burstMax = options.burstMax ?? 25;
  const windowMs = options.windowMs ?? 60 * 1000;            // 1 minute
  const max = options.max ?? 100;
  const skip = options.skip || (() => false);

  const burstHits = new Map();  // ip -> { count, resetTime }
  const sustainedHits = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [ip, data] of burstHits.entries()) {
      if (now > data.resetTime) burstHits.delete(ip);
    }
    for (const [ip, data] of sustainedHits.entries()) {
      if (now > data.resetTime) sustainedHits.delete(ip);
    }
  };
  const cleanupInterval = setInterval(cleanup, options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS);
  cleanupInterval.unref?.();

  return (req, res, next) => {
    if (skip(req)) return next();
    const ip = getClientIp(req);
    const now = Date.now();
    const burstReset = now + burstWindowMs;
    const sustainedReset = now + windowMs;

    // Burst window
    if (!burstHits.has(ip)) {
      burstHits.set(ip, { count: 1, resetTime: burstReset });
    } else {
      const b = burstHits.get(ip);
      if (now > b.resetTime) {
        burstHits.set(ip, { count: 1, resetTime: burstReset });
      } else {
        b.count++;
        if (b.count > burstMax) {
          res.setHeader("Retry-After", String(Math.ceil((b.resetTime - now) / 1000)));
          return res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down.",
          });
        }
      }
    }

    // Sustained window
    if (!sustainedHits.has(ip)) {
      sustainedHits.set(ip, { count: 1, resetTime: sustainedReset });
    } else {
      const s = sustainedHits.get(ip);
      if (now > s.resetTime) {
        sustainedHits.set(ip, { count: 1, resetTime: sustainedReset });
      } else {
        s.count++;
        if (s.count > max) {
          res.setHeader("Retry-After", String(Math.ceil((s.resetTime - now) / 1000)));
          return res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down.",
          });
        }
      }
    }
    next();
  };
}

/** Resolve client IP (supports X-Forwarded-For when trust proxy is set). */
function getClientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Default export: strict dual-window rate limit for non-x402 APIs.
 * Use simpleRateLimit for a single-window limit if needed.
 */
function rateLimit(options) {
  if (options.strict !== false && (options.burstMax != null || options.burstWindowMs != null || options.strict)) {
    return strictRateLimit(options);
  }
  return simpleRateLimit(options);
}

rateLimit.simple = simpleRateLimit;
rateLimit.strict = strictRateLimit;
export default rateLimit;
