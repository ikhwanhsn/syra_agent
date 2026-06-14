/**
 * twitterapi.io read client — advanced search, user lookup.
 * Auth: TWITTER_API_KEY via X-API-Key header.
 *
 * @see https://docs.twitterapi.io/introduction
 */

import { fetchWithRetry } from "../utils/resilientFetch.js";

const TWITTERAPI_IO_BASE = "https://api.twitterapi.io";

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isResponseCacheEnabled() {
  const v = (process.env.TWITTERAPI_IO_CACHE ?? "1").trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

const CACHE_MAX = Math.min(5000, parsePositiveInt(process.env.TWITTERAPI_IO_CACHE_MAX_ENTRIES, 200));
const SEARCH_CACHE_MS = parsePositiveInt(process.env.TWITTERAPI_IO_SEARCH_CACHE_MS, 300_000);
const USER_CACHE_MS = parsePositiveInt(process.env.TWITTERAPI_IO_USER_CACHE_MS, 300_000);
const TWEETS_CACHE_MS = parsePositiveInt(process.env.TWITTERAPI_IO_TWEETS_CACHE_MS, 180_000);
const TRENDS_CACHE_MS = parsePositiveInt(process.env.TWITTERAPI_IO_TRENDS_CACHE_MS, 600_000);

/** @type {Map<string, { body: unknown; expires: number }>} */
const responseCache = new Map();

/**
 * @returns {string|null}
 */
function getApiKey() {
  const key = (process.env.TWITTER_API_KEY || "").trim();
  return key || null;
}

/**
 * @returns {boolean}
 */
export function isTwitterApiIoConfigured() {
  return Boolean(getApiKey());
}

/**
 * @param {string} key
 * @returns {unknown|null}
 */
function responseCacheGet(key) {
  const row = responseCache.get(key);
  if (!row || Date.now() > row.expires) {
    if (row) responseCache.delete(key);
    return null;
  }
  return row.body;
}

/**
 * @param {string} key
 * @param {unknown} body
 * @param {number} ttlMs
 */
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
 * @param {URL} url
 */
function cacheKeyForUrl(url) {
  const entries = [...url.searchParams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const qs = new URLSearchParams(entries).toString();
  return `${url.pathname}?${qs}`;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNonNegativeInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/**
 * @param {unknown} raw
 * @returns {string|null}
 */
function extractTweetId(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s.length > 0 ? s : null;
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
function extractTweetText(raw) {
  return String(raw ?? "").trim();
}

/**
 * @param {unknown} raw
 * @returns {string|null}
 */
function extractCreatedAt(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toISOString() : s;
}

/**
 * @param {Record<string, unknown>} authorRaw
 */
function normalizeAuthor(authorRaw) {
  const userName = String(
    authorRaw?.userName ?? authorRaw?.username ?? authorRaw?.screen_name ?? "",
  )
    .trim()
    .replace(/^@/, "");

  const name = String(authorRaw?.name ?? authorRaw?.displayName ?? userName).trim();

  const followers = toNonNegativeInt(
    authorRaw?.followers ?? authorRaw?.followersCount ?? authorRaw?.followers_count,
  );

  const verified = Boolean(
    authorRaw?.isBlueVerified ??
      authorRaw?.verified ??
      authorRaw?.isVerified ??
      authorRaw?.blue_verified,
  );

  return {
    userName,
    name: name || userName,
    followers,
    verified,
  };
}

/**
 * @param {Record<string, unknown>} tweetRaw
 */
function normalizeTweet(tweetRaw) {
  const id = extractTweetId(tweetRaw?.id ?? tweetRaw?.tweetId ?? tweetRaw?.tweet_id);
  const text = extractTweetText(tweetRaw?.text ?? tweetRaw?.full_text ?? tweetRaw?.tweetText);
  if (!id || !text) return null;

  const authorRaw =
    tweetRaw?.author && typeof tweetRaw.author === "object"
      ? /** @type {Record<string, unknown>} */ (tweetRaw.author)
      : tweetRaw?.user && typeof tweetRaw.user === "object"
        ? /** @type {Record<string, unknown>} */ (tweetRaw.user)
        : {};

  const author = normalizeAuthor(authorRaw);
  if (!author.userName) return null;

  const metricsRaw =
    tweetRaw?.public_metrics && typeof tweetRaw.public_metrics === "object"
      ? /** @type {Record<string, unknown>} */ (tweetRaw.public_metrics)
      : tweetRaw;

  const likeCount = toNonNegativeInt(
    metricsRaw?.likeCount ?? metricsRaw?.favorite_count ?? metricsRaw?.favourites_count,
  );
  const retweetCount = toNonNegativeInt(
    metricsRaw?.retweetCount ?? metricsRaw?.retweet_count,
  );
  const replyCount = toNonNegativeInt(
    metricsRaw?.replyCount ?? metricsRaw?.reply_count,
  );
  const quoteCount = toNonNegativeInt(
    metricsRaw?.quoteCount ?? metricsRaw?.quote_count,
  );
  const viewCount = toNonNegativeInt(
    metricsRaw?.viewCount ?? metricsRaw?.views ?? metricsRaw?.impression_count,
  );

  const createdAt = extractCreatedAt(tweetRaw?.createdAt ?? tweetRaw?.created_at);

  return {
    id,
    text,
    url: `https://x.com/${encodeURIComponent(author.userName)}/status/${id}`,
    createdAt,
    author,
    metrics: {
      likeCount,
      retweetCount,
      replyCount,
      quoteCount,
      viewCount,
    },
  };
}

/**
 * @param {unknown} body
 */
function extractTweetsArray(body) {
  if (!body || typeof body !== "object") return [];
  const obj = /** @type {Record<string, unknown>} */ (body);

  if (Array.isArray(obj.tweets)) return obj.tweets;
  if (Array.isArray(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === "object") {
    const data = /** @type {Record<string, unknown>} */ (obj.data);
    if (Array.isArray(data.tweets)) return data.tweets;
  }
  return [];
}

/**
 * @param {string} path
 * @param {Record<string, string>} [params]
 */
async function twitterApiIoGet(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error("TWITTER_API_KEY is not configured");
    err.code = "twitterapi_unavailable";
    throw err;
  }

  const url = new URL(`${TWITTERAPI_IO_BASE}/${path.replace(/^\//, "")}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  });

  const cacheKey = cacheKeyForUrl(url);
  if (isResponseCacheEnabled()) {
    const hit = responseCacheGet(cacheKey);
    if (hit != null) {
      return hit;
    }
  }

  const res = await fetchWithRetry(url.toString(), {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (typeof body?.message === "string" && body.message) ||
      (typeof body?.error === "string" && body.error) ||
      (typeof body?.msg === "string" && body.msg) ||
      `twitterapi.io HTTP ${res.status}`;
    const err = new Error(msg);
    err.code = res.status === 401 || res.status === 403 ? "twitterapi_unavailable" : "twitterapi_error";
    err.status = res.status;
    throw err;
  }

  if (isResponseCacheEnabled()) {
    const ttl =
      path.includes("/user/info") ? USER_CACHE_MS
      : path.includes("/user/last_tweets") || path.includes("/user/mentions") ? TWEETS_CACHE_MS
      : path.includes("/trends") ? TRENDS_CACHE_MS
      : SEARCH_CACHE_MS;
    responseCacheSet(cacheKey, body, ttl);
  }

  return body;
}

/**
 * Advanced search for tweets.
 * @param {{ query: string; queryType?: "Latest" | "Top"; cursor?: string | null }} opts
 */
export async function advancedSearch(opts) {
  const query = String(opts?.query ?? "").trim();
  if (!query) {
    const err = new Error("Search query is required");
    err.code = "invalid_query";
    throw err;
  }

  const queryType = opts?.queryType === "Top" ? "Top" : "Latest";
  const params = { query, queryType };
  if (opts?.cursor) params.cursor = String(opts.cursor).trim();

  const body = await twitterApiIoGet("/twitter/tweet/advanced_search", params);
  const rawTweets = extractTweetsArray(body);

  const tweets = rawTweets
    .map((t) => (t && typeof t === "object" ? normalizeTweet(/** @type {Record<string, unknown>} */ (t)) : null))
    .filter(Boolean);

  const obj = body && typeof body === "object" ? /** @type {Record<string, unknown>} */ (body) : {};

  return {
    tweets,
    hasNextPage: Boolean(obj.has_next_page ?? obj.hasNextPage),
    nextCursor:
      typeof obj.next_cursor === "string"
        ? obj.next_cursor
        : typeof obj.nextCursor === "string"
          ? obj.nextCursor
          : null,
    rawCount: rawTweets.length,
    validatedCount: tweets.length,
  };
}

/**
 * @param {Record<string, unknown>} raw
 */
function normalizeUserInfo(raw) {
  if (!raw || typeof raw !== "object") return null;
  const userName = String(raw.userName ?? raw.username ?? raw.screen_name ?? "")
    .trim()
    .replace(/^@/, "");
  if (!userName) return null;

  return {
    userName,
    name: String(raw.name ?? raw.displayName ?? userName).trim() || userName,
    followers: toNonNegativeInt(raw.followers ?? raw.followersCount ?? raw.followers_count),
    following: toNonNegativeInt(raw.following ?? raw.followingCount ?? raw.friends_count),
    tweetCount: toNonNegativeInt(raw.tweetCount ?? raw.statusesCount ?? raw.statuses_count),
    favouritesCount: toNonNegativeInt(raw.favouritesCount ?? raw.favourites_count),
    verified: Boolean(raw.isBlueVerified ?? raw.verified ?? raw.isVerified),
    description: String(raw.description ?? raw.bio ?? "").trim(),
    createdAt: extractCreatedAt(raw.createdAt ?? raw.created_at),
    profilePicture: String(raw.profilePicture ?? raw.profile_image_url ?? "").trim() || null,
  };
}

/**
 * @param {string} userName
 */
export async function getUserInfo(userName) {
  const clean = String(userName ?? "").trim().replace(/^@/, "");
  if (!clean) {
    const err = new Error("userName is required");
    err.code = "invalid_handle";
    throw err;
  }

  const body = await twitterApiIoGet("/twitter/user/info", { userName: clean });
  const data =
    body && typeof body === "object" && body.data && typeof body.data === "object"
      ? /** @type {Record<string, unknown>} */ (body.data)
      : body && typeof body === "object"
        ? /** @type {Record<string, unknown>} */ (body)
        : null;

  const user = data ? normalizeUserInfo(data) : null;
  if (!user) {
    const err = new Error(`Could not parse user info for @${clean}`);
    err.code = "twitterapi_error";
    throw err;
  }

  return { user, rawStatus: typeof body?.status === "string" ? body.status : "success" };
}

/**
 * @param {{ userName: string; cursor?: string | null }} opts
 */
export async function getUserLastTweets(opts) {
  const clean = String(opts?.userName ?? "").trim().replace(/^@/, "");
  if (!clean) {
    const err = new Error("userName is required");
    err.code = "invalid_handle";
    throw err;
  }

  const params = { userName: clean };
  if (opts?.cursor) params.cursor = String(opts.cursor).trim();

  const body = await twitterApiIoGet("/twitter/user/last_tweets", params);
  const rawTweets = extractTweetsArray(body);
  const tweets = rawTweets
    .map((t) => (t && typeof t === "object" ? normalizeTweet(/** @type {Record<string, unknown>} */ (t)) : null))
    .filter(Boolean);

  const obj = body && typeof body === "object" ? /** @type {Record<string, unknown>} */ (body) : {};

  return {
    tweets,
    hasNextPage: Boolean(obj.has_next_page ?? obj.hasNextPage),
    nextCursor:
      typeof obj.next_cursor === "string"
        ? obj.next_cursor
        : typeof obj.nextCursor === "string"
          ? obj.nextCursor
          : null,
    rawCount: rawTweets.length,
    validatedCount: tweets.length,
  };
}

/**
 * @param {{ userName: string; sinceTime?: number; untilTime?: number; cursor?: string | null }} opts
 */
export async function getUserMentions(opts) {
  const clean = String(opts?.userName ?? "").trim().replace(/^@/, "");
  if (!clean) {
    const err = new Error("userName is required");
    err.code = "invalid_handle";
    throw err;
  }

  const params = { userName: clean };
  if (opts?.sinceTime != null && Number.isFinite(opts.sinceTime)) {
    params.sinceTime = String(Math.floor(opts.sinceTime));
  }
  if (opts?.untilTime != null && Number.isFinite(opts.untilTime)) {
    params.untilTime = String(Math.floor(opts.untilTime));
  }
  if (opts?.cursor) params.cursor = String(opts.cursor).trim();

  const body = await twitterApiIoGet("/twitter/user/mentions", params);
  const rawTweets = extractTweetsArray(body);
  const tweets = rawTweets
    .map((t) => (t && typeof t === "object" ? normalizeTweet(/** @type {Record<string, unknown>} */ (t)) : null))
    .filter(Boolean);

  const obj = body && typeof body === "object" ? /** @type {Record<string, unknown>} */ (body) : {};

  return {
    tweets,
    hasNextPage: Boolean(obj.has_next_page ?? obj.hasNextPage),
    nextCursor:
      typeof obj.next_cursor === "string"
        ? obj.next_cursor
        : typeof obj.nextCursor === "string"
          ? obj.nextCursor
          : null,
    rawCount: rawTweets.length,
    validatedCount: tweets.length,
  };
}

/**
 * @param {number} [woeid]
 */
export async function getTrends(woeid = 1) {
  const w = Number.isFinite(Number(woeid)) ? Math.floor(Number(woeid)) : 1;
  const body = await twitterApiIoGet("/twitter/trends", { woeid: String(w) });

  const trendsRaw = Array.isArray(body?.trends) ? body.trends : [];
  const trends = trendsRaw
    .map((item) => {
      const trend =
        item && typeof item === "object" && item.trend && typeof item.trend === "object"
          ? /** @type {Record<string, unknown>} */ (item.trend)
          : item && typeof item === "object"
            ? /** @type {Record<string, unknown>} */ (item)
            : null;
      if (!trend) return null;
      const name = String(trend.name ?? trend.trend ?? "").trim();
      if (!name) return null;
      const rank = toNonNegativeInt(trend.rank ?? trend.order);
      return { name, rank: rank > 0 ? rank : null };
    })
    .filter(Boolean);

  return { trends, woeid: w, rawCount: trendsRaw.length, validatedCount: trends.length };
}
