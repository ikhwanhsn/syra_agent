/**
 * X (Twitter) API v2 client for app-only (Bearer token) requests.
 * Uses env: X_BEARER_TOKEN. Optional: X_CONSUMER_KEY, X_SECRET_KEY for OAuth flows later.
 *
 * Response cache (reduces duplicate calls / rate-limit pressure):
 * - X_API_RESPONSE_CACHE — set to "0" or "false" to disable (default: on)
 * - X_API_USER_CACHE_MS — user-by-username TTL (default 300000 = 5m)
 * - X_API_TWEETS_CACHE_MS — user timeline TTL (default 180000 = 3m)
 * - X_API_SEARCH_CACHE_MS — recent search TTL (default 600000 = 10m)
 * - X_API_CACHE_MAX_ENTRIES — max cached keys (default 400; FIFO eviction)
 *
 * @see https://docs.x.com/x-api/introduction
 */

const X_API_BASE = "https://api.x.com/2";

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isResponseCacheEnabled() {
  const v = (process.env.X_API_RESPONSE_CACHE ?? "1").trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

function cacheTtlForPath(path) {
  const p = path.replace(/^\//, "");
  if (p === "tweets/search/recent") {
    return parsePositiveInt(process.env.X_API_SEARCH_CACHE_MS, 600_000);
  }
  if (/^users\/[^/]+\/tweets$/.test(p)) {
    return parsePositiveInt(process.env.X_API_TWEETS_CACHE_MS, 180_000);
  }
  if (p.startsWith("users/by/username/")) {
    return parsePositiveInt(process.env.X_API_USER_CACHE_MS, 300_000);
  }
  return parsePositiveInt(process.env.X_API_DEFAULT_CACHE_MS, 120_000);
}

const CACHE_MAX = Math.min(5000, parsePositiveInt(process.env.X_API_CACHE_MAX_ENTRIES, 400));

/** @type {Map<string, { body: unknown; expires: number }>} */
const responseCache = new Map();

/**
 * Stable cache key for a GET URL (sorted query keys).
 * @param {URL} url
 */
function cacheKeyForUrl(url) {
  const entries = [...url.searchParams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const qs = new URLSearchParams(entries).toString();
  return `${url.pathname}?${qs}`;
}

function responseCacheGet(key) {
  const row = responseCache.get(key);
  if (!row || Date.now() > row.expires) {
    if (row) responseCache.delete(key);
    return null;
  }
  return row.body;
}

function responseCacheSet(key, body, ttlMs) {
  if (responseCache.size >= CACHE_MAX && !responseCache.has(key)) {
    const drop = Math.max(1, Math.floor(CACHE_MAX * 0.15));
    let i = 0;
    for (const k of responseCache.keys()) {
      responseCache.delete(k);
      if (++i >= drop) break;
    }
  }
  responseCache.set(key, { body, expires: Date.now() + ttlMs });
}

/**
 * @returns {string|null} Bearer token or null if not configured
 */
function getBearerToken() {
  const token = (process.env.X_BEARER_TOKEN || "").trim();
  return token || null;
}

/**
 * Make a GET request to X API v2 with Bearer auth.
 * @param {string} path - Path without base (e.g. "users/by/username/syra_agent")
 * @param {Record<string, string>} [params] - Query params
 * @returns {Promise<{ data?: unknown; errors?: Array<{ message: string }> }>}
 */
export async function xApiGet(path, params = {}) {
  const token = getBearerToken();
  if (!token) {
    return { errors: [{ message: "X_BEARER_TOKEN is not set" }] };
  }

  const url = new URL(`${X_API_BASE}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  });

  const cacheKey = cacheKeyForUrl(url);
  const ttlMs = cacheTtlForPath(path);

  if (isResponseCacheEnabled()) {
    const hit = responseCacheGet(cacheKey);
    if (hit != null) {
      return /** @type {{ data?: unknown; errors?: Array<{ message: string }> }} */ (hit);
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      errors: body.errors || [{ message: body.detail || body.message || `HTTP ${res.status}` }],
    };
  }

  const errList = body.errors;
  const hasErrors = Array.isArray(errList) && errList.length > 0;
  if (isResponseCacheEnabled() && !hasErrors) {
    responseCacheSet(cacheKey, body, ttlMs);
  }

  return body;
}

/**
 * Get user by username.
 * @param {string} username - Without @
 * @param {string} [userFields] - e.g. "created_at,description,public_metrics,verified"
 */
export async function getUserByUsername(username, userFields = "created_at,description,public_metrics,verified") {
  if (!username || !String(username).trim()) {
    return { errors: [{ message: "username is required" }] };
  }
  const clean = String(username).trim().replace(/^@/, "");
  const params = {};
  if (userFields) params["user.fields"] = userFields;
  return xApiGet(`users/by/username/${encodeURIComponent(clean)}`, params);
}

/**
 * Search recent tweets (last 7 days). Available to all developers.
 * @param {string} query - Query (e.g. "crypto lang:en", "from:syra_agent")
 * @param {object} [opts]
 * @param {number} [opts.max_results=10] - 10–100
 * @param {string} [opts.tweetFields] - e.g. "created_at,public_metrics,author_id,text"
 * @param {string} [opts.expansions] - e.g. "author_id" (include `includes.users` when combined with userFields)
 * @param {string} [opts.userFields] - e.g. "username,name,verified"
 */
export async function searchRecentTweets(
  query,
  opts = {}
) {
  const {
    max_results = 10,
    tweetFields = "created_at,public_metrics,author_id,text",
    expansions,
    userFields,
  } = opts;
  if (!query || !String(query).trim()) {
    return { errors: [{ message: "query is required" }] };
  }
  const params = {
    query: String(query).trim(),
    max_results: Math.min(100, Math.max(10, Number(max_results) || 10)),
  };
  if (tweetFields) params["tweet.fields"] = tweetFields;
  if (expansions) params.expansions = expansions;
  if (userFields) params["user.fields"] = userFields;
  return xApiGet("tweets/search/recent", params);
}

/**
 * Whether X API v2 Bearer token is configured (app-only).
 * @returns {boolean}
 */
export function isXApiBearerConfigured() {
  return Boolean((process.env.X_BEARER_TOKEN || "").trim());
}

/**
 * Get recent tweets for a user by ID.
 * @param {string} userId - X user ID
 * @param {object} [opts]
 * @param {number} [opts.max_results=10] - 5–100
 * @param {string} [opts.tweetFields]
 */
export async function getUserTweets(userId, opts = {}) {
  const { max_results = 10, tweetFields = "created_at,public_metrics,text" } = opts;
  if (!userId || !String(userId).trim()) {
    return { errors: [{ message: "userId is required" }] };
  }
  const params = {
    max_results: Math.min(100, Math.max(5, Number(max_results) || 10)),
  };
  if (tweetFields) params["tweet.fields"] = tweetFields;
  return xApiGet(`users/${encodeURIComponent(String(userId).trim())}/tweets`, params);
}
