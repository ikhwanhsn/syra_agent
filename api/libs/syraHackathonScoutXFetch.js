/**
 * Credit-conscious X fetch for hackathon scout — one search per run, long cache.
 */

import { searchRecentTweets, isXApiBearerConfigured } from "./xApiClient.js";
import {
  HACKATHON_SCOUT_DEFAULT_SEARCH_QUERY,
  HACKATHON_SCOUT_MAX_RESULTS,
  HACKATHON_SCOUT_SEARCH_CACHE_MS,
} from "../config/syraHackathonScoutConfig.js";

/**
 * @typedef {{
 *   id: string;
 *   text: string;
 *   createdAt: string;
 *   authorId: string;
 *   authorHandle: string;
 *   authorName: string;
 *   likeCount: number;
 *   retweetCount: number;
 *   url: string;
 * }} HackathonTweetSample
 */

/** @type {Map<string, { expires: number; tweets: HackathonTweetSample[] }>} */
const pipelineSearchCache = new Map();

/**
 * @returns {string}
 */
export function resolveHackathonSearchQuery() {
  const fromEnv = (process.env.HACKATHON_SCOUT_SEARCH_QUERY || "").trim();
  return fromEnv || HACKATHON_SCOUT_DEFAULT_SEARCH_QUERY;
}

const HACKATHON_KEYWORDS =
  /\b(hackathon|hacker\s*house|build\s*week|bounty|demo\s*day|superteam|colosseum|earn\s*grant|prize\s*pool|registration\s*open|apply\s*now|deadline)\b/i;

/**
 * @param {string} text
 * @returns {boolean}
 */
function looksHackathonRelated(text) {
  return HACKATHON_KEYWORDS.test(text);
}

/**
 * @param {unknown} body
 * @returns {HackathonTweetSample[]}
 */
function normalizeSearchBody(body) {
  const tweets = Array.isArray(body?.data) ? body.data : [];
  const users = Array.isArray(body?.includes?.users) ? body.includes.users : [];
  const userById = new Map();
  for (const u of users) {
    if (!u || typeof u !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (u);
    const id = String(x.id || "");
    if (id) userById.set(id, x);
  }

  /** @type {HackathonTweetSample[]} */
  const out = [];
  for (const t of tweets) {
    if (!t || typeof t !== "object") continue;
    const tw = /** @type {Record<string, unknown>} */ (t);
    const id = String(tw.id || "").trim();
    const text = String(tw.text || "").trim();
    if (!id || !text) continue;
    const authorId = String(tw.author_id || "");
    const u = userById.get(authorId);
    const handle = u ? String(u.username || "") : "";
    const metrics =
      tw.public_metrics && typeof tw.public_metrics === "object"
        ? /** @type {Record<string, unknown>} */ (tw.public_metrics)
        : {};
    out.push({
      id,
      text,
      createdAt: String(tw.created_at || ""),
      authorId,
      authorHandle: handle ? `@${handle}` : "",
      authorName: u ? String(u.name || "") : "",
      likeCount: Number(metrics.like_count) || 0,
      retweetCount: Number(metrics.retweet_count) || 0,
      url: handle ? `https://x.com/${handle}/status/${id}` : `https://x.com/i/web/status/${id}`,
    });
  }
  return out;
}

/**
 * One X recent-search call (cached per query for HACKATHON_SCOUT_SEARCH_CACHE_MS).
 * @returns {Promise<{ query: string; tweets: HackathonTweetSample[]; fromCache: boolean; xConfigured: boolean }>}
 */
export async function fetchHackathonTweetsFromX() {
  const query = resolveHackathonSearchQuery();
  if (!isXApiBearerConfigured()) {
    return { query, tweets: [], fromCache: false, xConfigured: false };
  }

  const cacheKey = query;
  const cached = pipelineSearchCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { query, tweets: cached.tweets, fromCache: true, xConfigured: true };
  }

  const body = await searchRecentTweets(query, {
    max_results: HACKATHON_SCOUT_MAX_RESULTS,
    tweetFields: "created_at,public_metrics,author_id,text",
    expansions: "author_id",
    userFields: "username,name,verified",
  });

  if (body.errors?.length) {
    const msg = body.errors.map((e) => e.message).join("; ");
    throw new Error(`X search failed: ${msg}`);
  }

  const all = normalizeSearchBody(body);
  const tweets = all.filter((t) => looksHackathonRelated(t.text)).slice(0, HACKATHON_SCOUT_MAX_RESULTS);

  pipelineSearchCache.set(cacheKey, {
    tweets,
    expires: Date.now() + HACKATHON_SCOUT_SEARCH_CACHE_MS,
  });

  return { query, tweets, fromCache: false, xConfigured: true };
}
