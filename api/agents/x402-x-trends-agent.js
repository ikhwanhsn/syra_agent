/**
 * x402 X trends agent — X API v2 recent search (Bearer) + OpenRouter briefing for Syra dev alerts.
 */

import { searchRecentTweets } from "../libs/xApiClient.js";
import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
  X402_X_TRENDS_MAX_PER_QUERY,
  X402_X_TRENDS_MAX_TWEETS_LLM,
  X402_X_TRENDS_SEARCH_QUERY,
} from "../config/internalPipelineAgents.js";

const TWEET_FIELDS = "created_at,public_metrics,author_id,text";
const EXPANSIONS = "author_id";
const USER_FIELDS = "username,name,verified";

const SYSTEM_PROMPT = `You are a research analyst for Syra. You ONLY receive recent tweets about x402, HTTP 402 payments on the web, PayAI, Corbits, facilitators, Solana/Base x402, and closely related topics.

Strategic lens: surface what matters for Syra's paid APIs and agent distribution, and for Up Only–adjacent crypto Twitter — still grounded only in the tweets provided.

Rules:
- Base every bullet ONLY on the tweet evidence provided. For each bullet, evidenceTweetIds MUST list one or more tweet "id" values from the input JSON (strings).
- If the sample is mostly noise or spam, say so in noiseOrCaveats and keep bullets conservative.
- Output ONLY one JSON object, no markdown fences, no commentary before or after.
- JSON shape:
{
  "summary": string (2-5 sentences),
  "bullets": array of { "title": string, "detail": string, "evidenceTweetIds": string[] } (4 to 10 items),
  "watchlist": string[] (0-6 short forward-looking phrases to track on X),
  "noiseOrCaveats": string[] (0-5 items: limitations, bots, hashtag spam, or missing context)
}
- Write in English. Be concise and concrete.`;

/**
 * @typedef {{
 *   title: string;
 *   detail: string;
 *   evidenceTweetIds: string[];
 * }} X402TrendBullet
 */

/**
 * @typedef {{
 *   summary: string;
 *   bullets: X402TrendBullet[];
 *   watchlist: string[];
 *   noiseOrCaveats: string[];
 *   generatedAt: string;
 *   tweetsSampled: number;
 * }} X402XTrendsOutput
 */

/**
 * @param {string} text
 * @returns {unknown}
 */
function parseJsonObjectFromLlm(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) throw new Error("Empty model response");
  const tryParse = (s) => JSON.parse(s.trim());
  try {
    return tryParse(raw);
  } catch {
    /* continue */
  }
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(raw);
  if (fence?.[1]) {
    return tryParse(fence[1]);
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return tryParse(raw.slice(start, end + 1));
  }
  throw new Error("No JSON object found in model response");
}

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
function validateOutput(obj) {
  if (!obj || typeof obj !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (obj);
  if (typeof o.summary !== "string" || !o.summary.trim()) return false;
  if (!Array.isArray(o.bullets) || o.bullets.length < 4 || o.bullets.length > 10)
    return false;
  for (const b of o.bullets) {
    if (!b || typeof b !== "object") return false;
    const x = /** @type {Record<string, unknown>} */ (b);
    if (typeof x.title !== "string" || !x.title.trim()) return false;
    if (typeof x.detail !== "string" || !x.detail.trim()) return false;
    if (!Array.isArray(x.evidenceTweetIds)) return false;
    for (const id of x.evidenceTweetIds) {
      if (typeof id !== "string" || !id.trim()) return false;
    }
  }
  if (!Array.isArray(o.watchlist)) return false;
  if (!Array.isArray(o.noiseOrCaveats)) return false;
  for (const w of o.watchlist) {
    if (typeof w !== "string") return false;
  }
  for (const n of o.noiseOrCaveats) {
    if (typeof n !== "string") return false;
  }
  return true;
}

/**
 * @param {unknown} obj
 * @param {number} tweetsSampled
 * @returns {X402XTrendsOutput}
 */
function coerceOutput(obj, tweetsSampled) {
  if (!validateOutput(obj)) {
    throw new Error("Invalid x402 X trends JSON shape");
  }
  const o = /** @type {Record<string, unknown>} */ (obj);
  const bullets = o.bullets.map((b) => {
    const x = /** @type {Record<string, unknown>} */ (b);
    return {
      title: String(x.title).trim(),
      detail: String(x.detail).trim(),
      evidenceTweetIds: x.evidenceTweetIds.map((id) =>
        String(/** @type {unknown} */ (id)).trim(),
      ),
    };
  });
  return {
    summary: String(o.summary).trim(),
    bullets,
    watchlist: o.watchlist.map((s) => String(s).trim()).filter(Boolean),
    noiseOrCaveats: o.noiseOrCaveats.map((s) => String(s).trim()).filter(Boolean),
    generatedAt: new Date().toISOString(),
    tweetsSampled,
  };
}

/**
 * @param {unknown} body
 * @returns {Map<string, { username?: string; name?: string }>}
 */
function usersByIdFromIncludes(body) {
  const map = new Map();
  const inc =
    body && typeof body === "object"
      ? /** @type {{ includes?: { users?: unknown[] } }} */ (body).includes
      : null;
  const users = inc && Array.isArray(inc.users) ? inc.users : [];
  for (const u of users) {
    if (!u || typeof u !== "object") continue;
    const rec = /** @type {Record<string, unknown>} */ (u);
    const id = typeof rec.id === "string" ? rec.id : null;
    if (!id) continue;
    map.set(id, {
      username: typeof rec.username === "string" ? rec.username : undefined,
      name: typeof rec.name === "string" ? rec.name : undefined,
    });
  }
  return map;
}

/**
 * @param {unknown} tweet
 * @param {Map<string, { username?: string; name?: string }>} usersById
 */
function normalizeTweet(tweet, usersById) {
  if (!tweet || typeof tweet !== "object") return null;
  const t = /** @type {Record<string, unknown>} */ (tweet);
  const id = typeof t.id === "string" ? t.id : null;
  const text = typeof t.text === "string" ? t.text : "";
  if (!id || !text) return null;
  const authorId = typeof t.author_id === "string" ? t.author_id : "";
  const u = authorId ? usersById.get(authorId) : undefined;
  const metrics =
    t.public_metrics && typeof t.public_metrics === "object"
      ? /** @type {Record<string, unknown>} */ (t.public_metrics)
      : {};
  return {
    id,
    text: text.slice(0, 320),
    created_at: typeof t.created_at === "string" ? t.created_at : "",
    author_id: authorId,
    author_handle: u?.username ? `@${u.username}` : authorId || "?",
    like_count: Number(metrics.like_count) || 0,
    retweet_count: Number(metrics.retweet_count) || 0,
  };
}

/**
 * @param {{ model?: string | null }} params
 * @returns {Promise<X402XTrendsOutput>}
 */
export async function runX402XTrendsAgent({ model }) {
  const q = X402_X_TRENDS_SEARCH_QUERY;
  const maxPerQuery = Math.min(100, Math.max(10, X402_X_TRENDS_MAX_PER_QUERY));
  const maxForLlm = Math.min(100, Math.max(15, X402_X_TRENDS_MAX_TWEETS_LLM));

  const merged = new Map();

  const body = await searchRecentTweets(q, {
    max_results: maxPerQuery,
    tweetFields: TWEET_FIELDS,
    expansions: EXPANSIONS,
    userFields: USER_FIELDS,
  });
  if (body.errors?.length) {
    const msg = body.errors[0]?.message || "X search error";
    throw new Error(`x402 X trends: ${msg} (query: ${q.slice(0, 80)})`);
  }
  const usersById = usersByIdFromIncludes(body);
  const list = Array.isArray(body.data) ? body.data : [];
  for (const tw of list) {
    const n = normalizeTweet(tw, usersById);
    if (n && !merged.has(n.id)) merged.set(n.id, n);
  }

  if (merged.size === 0) {
    throw new Error(
      "x402 X trends: no tweets returned for configured queries (check X tier / query syntax)",
    );
  }

  const sorted = [...merged.values()].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  const sampled = sorted.slice(0, maxForLlm);

  const userPayload = {
    collectedAt: new Date().toISOString(),
    tweetCount: merged.size,
    sentToModel: sampled.length,
    tweets: sampled.map((t) => ({
      id: t.id,
      created_at: t.created_at,
      author: t.author_handle,
      like_count: t.like_count,
      text: t.text,
    })),
  };

  const modelId = resolveInternalPipelineModel(model);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Synthesize x402 / paid-HTTP trends from these recent tweets (JSON only per instructions):\n\n${JSON.stringify(userPayload)}`,
    },
  ];

  const llmOpts = {
    model: modelId,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.x402XTrends,
    temperature: 0.26,
  };

  const apiMessages = withLlmIdentitySystemNote(messages, modelId);
  const first = await callOpenRouter(apiMessages, llmOpts);

  let parsed;
  try {
    parsed = parseJsonObjectFromLlm(first.response);
    return coerceOutput(parsed, merged.size);
  } catch (firstErr) {
    const retryMessages = [
      ...apiMessages,
      {
        role: "assistant",
        content:
          typeof first.response === "string" ? first.response.slice(0, 8000) : "",
      },
      {
        role: "user",
        content:
          "Your reply was not valid JSON or did not match the schema. Output ONLY one JSON object: summary, bullets (4-10 items with title, detail, evidenceTweetIds array of tweet id strings from the input), watchlist string array, noiseOrCaveats string array.",
      },
    ];
    const second = await callOpenRouter(retryMessages, llmOpts);
    try {
      parsed = parseJsonObjectFromLlm(second.response);
      return coerceOutput(parsed, merged.size);
    } catch {
      const hint =
        firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new Error(
        `x402 X trends: JSON validation failed after retry (${hint}). Tail: ${String(second.response).slice(-400)}`,
      );
    }
  }
}
