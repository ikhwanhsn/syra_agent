/**
 * Rate limiting for non-x402 (free) APIs.
 *
 * Two backends:
 *  - default in-memory (legacy; ok for a single API instance)
 *  - Redis when SYRA_REDIS_URL is set (required for multi-instance deploys; counters live in Redis
 *    so all API replicas share state). Falls back to memory if Redis is unreachable.
 *
 * P0.8 — strict mode supports per-route key suffix so wallet endpoints can be limited per-user
 * (when authenticated) instead of per-IP.
 */
import crypto from "node:crypto";

const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 1000;

// Lazy Redis client. Loaded once at first use to avoid forcing a hard dep when SYRA_REDIS_URL is unset.
let _redisClient = null;
let _redisLoading = null;
let _redisDisabled = false;

/** ioredis expects redis:// or rediss:// — not Upstash REST (https://) URLs. */
function isValidRedisUrl(url) {
  return /^rediss?:\/\/.+/i.test(url);
}

function disableRedis(reason) {
  if (_redisDisabled) return;
  _redisDisabled = true;
  if (_redisClient) {
    _redisClient.disconnect(false);
    _redisClient = null;
  }
  console.warn(`[rateLimit] ${reason}; using in-memory limiter`);
}

async function getRedis() {
  if (_redisDisabled) return null;
  if (_redisClient) return _redisClient;
  const url = (process.env.SYRA_REDIS_URL || "").trim();
  if (!url) return null;
  if (!isValidRedisUrl(url)) {
    const scheme = url.split(":")[0] || "unknown";
    disableRedis(
      scheme === "https" || scheme === "http"
        ? "SYRA_REDIS_URL must be redis:// or rediss:// (not the REST https URL — use the Redis URL from your provider dashboard)"
        : `SYRA_REDIS_URL has invalid scheme "${scheme}" (expected redis:// or rediss://)`
    );
    return null;
  }
  if (_redisLoading) return _redisLoading;
  _redisLoading = (async () => {
    try {
      const mod = await import("ioredis").catch(() => null);
      if (!mod) {
        disableRedis("SYRA_REDIS_URL set but `ioredis` not installed");
        return null;
      }
      const Redis = mod.default || mod.Redis || mod;
      const client = new Redis(url, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 0,
        retryStrategy: () => null,
      });
      client.on("error", (e) => {
        disableRedis(`redis error: ${e?.message || e}`);
      });
      await client.connect();
      _redisClient = client;
      return client;
    } catch (e) {
      disableRedis(`redis init failed: ${e?.message || e}`);
      return null;
    } finally {
      _redisLoading = null;
    }
  })();
  return _redisLoading;
}

async function redisIncrWithExpiry(key, ttlSec) {
  const r = await getRedis();
  if (!r) return null;
  try {
    const pipeline = r.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, ttlSec, "NX");
    const results = await pipeline.exec();
    const count = Array.isArray(results?.[0]) ? Number(results[0][1]) : null;
    return count;
  } catch (e) {
    return null;
  }
}

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
  const burstWindowMs = options.burstWindowMs ?? 10 * 1000;
  const burstMax = options.burstMax ?? 25;
  const windowMs = options.windowMs ?? 60 * 1000;
  const max = options.max ?? 100;
  const skip = options.skip || (() => false);
  const keyOf = options.keyOf || ((req) => getClientIp(req));

  const burstHits = new Map();
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

  return async (req, res, next) => {
    if (skip(req)) return next();
    const key = String(keyOf(req) || "unknown");
    const now = Date.now();
    const burstReset = now + burstWindowMs;
    const sustainedReset = now + windowMs;

    // Try Redis first when configured; falls back to in-memory transparently.
    const redisKeyB = `rl:b:${hashKey(key)}:${Math.floor(now / burstWindowMs)}`;
    const redisKeyS = `rl:s:${hashKey(key)}:${Math.floor(now / windowMs)}`;
    const burstCount = await redisIncrWithExpiry(redisKeyB, Math.ceil(burstWindowMs / 1000));
    if (burstCount != null) {
      if (burstCount > burstMax) {
        res.setHeader("Retry-After", String(Math.ceil(burstWindowMs / 1000)));
        return res.status(429).json({ success: false, message: "Too many requests. Please slow down." });
      }
      const sustainedCount = await redisIncrWithExpiry(redisKeyS, Math.ceil(windowMs / 1000));
      if (sustainedCount != null && sustainedCount > max) {
        res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
        return res.status(429).json({ success: false, message: "Too many requests. Please slow down." });
      }
      return next();
    }

    if (!burstHits.has(key)) {
      burstHits.set(key, { count: 1, resetTime: burstReset });
    } else {
      const b = burstHits.get(key);
      if (now > b.resetTime) burstHits.set(key, { count: 1, resetTime: burstReset });
      else {
        b.count++;
        if (b.count > burstMax) {
          res.setHeader("Retry-After", String(Math.ceil((b.resetTime - now) / 1000)));
          return res.status(429).json({ success: false, message: "Too many requests. Please slow down." });
        }
      }
    }

    if (!sustainedHits.has(key)) {
      sustainedHits.set(key, { count: 1, resetTime: sustainedReset });
    } else {
      const s = sustainedHits.get(key);
      if (now > s.resetTime) sustainedHits.set(key, { count: 1, resetTime: sustainedReset });
      else {
        s.count++;
        if (s.count > max) {
          res.setHeader("Retry-After", String(Math.ceil((s.resetTime - now) / 1000)));
          return res.status(429).json({ success: false, message: "Too many requests. Please slow down." });
        }
      }
    }
    next();
  };
}

function hashKey(s) {
  return crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 16);
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
