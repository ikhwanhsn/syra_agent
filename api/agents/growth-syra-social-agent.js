/**
 * Growth — SYRA social / community pulse on X (Bearer search → OpenRouter).
 */

import { searchRecentTweets } from "../libs/xApiClient.js";
import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  GROWTH_SYRA_SOCIAL_MAX_PER_QUERY,
  GROWTH_SYRA_SOCIAL_MAX_TWEETS_LLM,
  GROWTH_SYRA_SOCIAL_SEARCH_QUERIES,
} from "../config/internalPipelineAgents.js";

const TWEET_FIELDS = "created_at,public_metrics,author_id,text";
const EXPANSIONS = "author_id";
const USER_FIELDS = "username,name,verified";

const SYSTEM_PROMPT = `You are Syra's growth marketer analyst. Input is recent X posts about $SYRA, @syra_agent, syraa.fun, or "Syra agent".

Rules:
- Ground bullets in tweet ids provided.
- Assess momentum toward broader discovery (holders, creators, integrations) — not financial advice.
- Output ONLY one JSON object:
{
  "summary": string (3-5 sentences),
  "sentiment": "positive"|"mixed"|"negative"|"quiet",
  "topThemes": string[] (3-8 short phrases),
  "communitySignals": string[] (0-6),
  "risks": string[] (0-5 spam/manipulation/criticism),
  "recommendedActions": string[] (4-10 concrete growth tactics for Syra),
  "bullets": array of { "title": string, "detail": string, "evidenceTweetIds": string[] } (4-9 items)
}
English only. No price guarantees.`;

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
    });
  }
  return map;
}

function normalizeTweet(tweet, usersById) {
  if (!tweet || typeof tweet !== "object") return null;
  const t = /** @type {Record<string, unknown>} */ (tweet);
  const id = typeof t.id === "string" ? t.id : null;
  const text = typeof t.text === "string" ? t.text : "";
  if (!id || !text) return null;
  const authorId = typeof t.author_id === "string" ? t.author_id : "";
  const u = authorId ? usersById.get(authorId) : undefined;
  return {
    id,
    text: text.slice(0, 300),
    created_at: typeof t.created_at === "string" ? t.created_at : "",
    author: u?.username ? `@${u.username}` : authorId || "?",
  };
}

function validateOutput(obj) {
  if (!obj || typeof obj !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (obj);
  if (typeof o.summary !== "string") return false;
  const sent = o.sentiment;
  if (!["positive", "mixed", "negative", "quiet"].includes(/** @type {string} */ (sent))) return false;
  if (!Array.isArray(o.topThemes) || !Array.isArray(o.bullets)) return false;
  if (o.bullets.length < 4 || o.bullets.length > 9) return false;
  for (const b of o.bullets) {
    if (!b || typeof b !== "object") return false;
    const x = /** @type {Record<string, unknown>} */ (b);
    if (!Array.isArray(x.evidenceTweetIds)) return false;
  }
  if (
    !Array.isArray(o.communitySignals) ||
    !Array.isArray(o.risks) ||
    !Array.isArray(o.recommendedActions)
  ) {
    return false;
  }
  if (o.recommendedActions.length < 1) return false;
  return true;
}

/**
 * @param {{ model?: string | null }} params
 */
export async function runGrowthSyraSocialAgent({ model }) {
  const queries = [...GROWTH_SYRA_SOCIAL_SEARCH_QUERIES];
  const maxPerQuery = Math.min(80, Math.max(10, GROWTH_SYRA_SOCIAL_MAX_PER_QUERY));
  const maxForLlm = Math.min(90, Math.max(15, GROWTH_SYRA_SOCIAL_MAX_TWEETS_LLM));

  const merged = new Map();
  for (const q of queries) {
    const body = await searchRecentTweets(q, {
      max_results: maxPerQuery,
      tweetFields: TWEET_FIELDS,
      expansions: EXPANSIONS,
      userFields: USER_FIELDS,
    });
    if (body.errors?.length) {
      throw new Error(`growth-syra-social: ${body.errors[0]?.message || "X error"} (${q.slice(0, 60)})`);
    }
    const usersById = usersByIdFromIncludes(body);
    const list = Array.isArray(body.data) ? body.data : [];
    for (const tw of list) {
      const n = normalizeTweet(tw, usersById);
      if (n && !merged.has(n.id)) merged.set(n.id, n);
    }
  }

  if (merged.size === 0) {
    throw new Error("growth-syra-social: no tweets returned");
  }

  const sorted = [...merged.values()].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  const sampled = sorted.slice(0, maxForLlm);

  const modelId = resolveInternalPipelineModel(model);

  const userPayload = {
    tweetCount: merged.size,
    tweets: sampled.map((t) => ({
      id: t.id,
      created_at: t.created_at,
      author: t.author,
      text: t.text,
    })),
  };

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Synthesize Syra community growth signals (JSON only):\n\n${JSON.stringify(userPayload)}`,
    },
  ];

  const llmOpts = { model: modelId, max_tokens: 3200, temperature: 0.32 };
  const apiMessages = withLlmIdentitySystemNote(messages, modelId);
  const first = await callOpenRouter(apiMessages, llmOpts);

  let parsed;
  try {
    parsed = parseJsonObjectFromLlm(first.response);
  } catch {
    const second = await callOpenRouter(
      [
        ...apiMessages,
        {
          role: "assistant",
          content: typeof first.response === "string" ? first.response.slice(0, 7000) : "",
        },
        {
          role: "user",
          content:
            "Output ONLY valid JSON: summary, sentiment, topThemes, communitySignals, risks, recommendedActions, bullets (4-9 with evidenceTweetIds).",
        },
      ],
      llmOpts,
    );
    parsed = parseJsonObjectFromLlm(second.response);
  }

  if (!validateOutput(parsed)) {
    throw new Error("growth-syra-social: invalid LLM JSON");
  }

  const o = /** @type {Record<string, unknown>} */ (parsed);
  return {
    summary: String(o.summary).trim(),
    sentiment: /** @type {"positive"|"mixed"|"negative"|"quiet"} */ (o.sentiment),
    topThemes: o.topThemes.map((s) => String(s).trim()).filter(Boolean),
    communitySignals: o.communitySignals.map((s) => String(s).trim()).filter(Boolean),
    risks: o.risks.map((s) => String(s).trim()).filter(Boolean),
    recommendedActions: o.recommendedActions.map((s) => String(s).trim()).filter(Boolean),
    bullets: o.bullets.map((b) => {
      const x = /** @type {Record<string, unknown>} */ (b);
      return {
        title: String(x.title).trim(),
        detail: String(x.detail).trim(),
        evidenceTweetIds: x.evidenceTweetIds.map((id) => String(id).trim()),
      };
    }),
    generatedAt: new Date().toISOString(),
    tweetsSampled: merged.size,
  };
}

/**
 * @param {Awaited<ReturnType<typeof runGrowthSyraSocialAgent>>} out
 */
export function formatGrowthSyraSocialTelegram(out) {
  const lines = [
    "Syra growth — social pulse",
    `Generated: ${out.generatedAt} · ${out.tweetsSampled} posts · sentiment: ${out.sentiment}`,
    "",
    out.summary,
    "",
    "Actions:",
    ...out.recommendedActions.slice(0, 6).map((a, i) => `${i + 1}. ${a}`),
  ];
  return lines.join("\n");
}
