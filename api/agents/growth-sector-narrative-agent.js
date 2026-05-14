/**
 * Growth — AI-agent sector & macro narrative (X search + CoinGecko spot macro → OpenRouter).
 * Positions Syra vs market tailwinds toward discovery / $1M-class milestones (informational).
 */

import { searchRecentTweets } from "../libs/xApiClient.js";
import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
  GROWTH_SECTOR_MAX_PER_QUERY,
  GROWTH_SECTOR_MAX_TWEETS_LLM,
  GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY,
} from "../config/internalPipelineAgents.js";

const TWEET_FIELDS = "created_at,public_metrics,author_id,text";
const EXPANSIONS = "author_id";
const USER_FIELDS = "username,name,verified";

const COINGECKO_SIMPLE =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";

const SYSTEM_PROMPT = `You help Syra's founders prioritize narrative and partnerships on the path to meaningful adoption (e.g. ~$1M FDV class awareness — not a promise). Frame opportunities so they also strengthen Up Only–aligned distribution where it is evidence-backed, not speculative.

Input: recent sector tweets + spot USD + 24h % change for SOL/BTC/ETH.

Rules:
- Ground claims in tweet ids where relevant.
- Identify tailwinds/headwinds for "Solana AI agents + paid APIs / x402" positioning.
- Output ONLY JSON:
{
  "summary": string (4-7 sentences),
  "tailwindThemes": string[] (3-8),
  "headwindThemes": string[] (2-7),
  "positioningIdeasForSyra": string[] (5-12 actionable ideas: integrations, content, BD targets—specific),
  "macroHeadline": string (one line on risk-on/off using SOL/BTC moves),
  "bullets": array of { "title": string, "detail": string, "evidenceTweetIds": string[] } (3-8 items)
}
English. No financial advice; no guaranteed returns.`;

async function fetchMacro() {
  const res = await fetch(COINGECKO_SIMPLE, {
    signal:
      typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(10_000)
        : undefined,
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

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
  if (typeof o.summary !== "string" || typeof o.macroHeadline !== "string") return false;
  if (
    !Array.isArray(o.tailwindThemes) ||
    !Array.isArray(o.headwindThemes) ||
    !Array.isArray(o.positioningIdeasForSyra) ||
    !Array.isArray(o.bullets)
  )
    return false;
  if (o.bullets.length < 3 || o.bullets.length > 8) return false;
  for (const b of o.bullets) {
    if (!b || typeof b !== "object") return false;
    const x = /** @type {Record<string, unknown>} */ (b);
    if (!Array.isArray(x.evidenceTweetIds)) return false;
  }
  return true;
}

/**
 * @param {{ model?: string | null }} params
 */
export async function runGrowthSectorNarrativeAgent({ model }) {
  const q = GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY;
  const maxPerQuery = Math.min(100, Math.max(10, GROWTH_SECTOR_MAX_PER_QUERY));
  const maxForLlm = Math.min(85, Math.max(15, GROWTH_SECTOR_MAX_TWEETS_LLM));

  const merged = new Map();
  const body = await searchRecentTweets(q, {
    max_results: maxPerQuery,
    tweetFields: TWEET_FIELDS,
    expansions: EXPANSIONS,
    userFields: USER_FIELDS,
  });
  if (body.errors?.length) {
    throw new Error(`growth-sector: ${body.errors[0]?.message || "X error"}`);
  }
  const usersById = usersByIdFromIncludes(body);
  const list = Array.isArray(body.data) ? body.data : [];
  for (const tw of list) {
    const n = normalizeTweet(tw, usersById);
    if (n && !merged.has(n.id)) merged.set(n.id, n);
  }

  if (merged.size === 0) {
    throw new Error("growth-sector: no tweets returned");
  }

  const macro = await fetchMacro();
  const sorted = [...merged.values()].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  const sampled = sorted.slice(0, maxForLlm);

  const modelId = resolveInternalPipelineModel(model);

  const userPayload = {
    tweetCount: merged.size,
    macro,
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
      content: `Sector narrative for Syra (JSON only):\n\n${JSON.stringify(userPayload)}`,
    },
  ];

  const llmOpts = {
    model: modelId,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.growthSectorNarrative,
    temperature: 0.26,
  };
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
            "Reply ONLY with JSON: summary, tailwindThemes, headwindThemes, positioningIdeasForSyra, macroHeadline, bullets (3-8 with evidenceTweetIds).",
        },
      ],
      llmOpts,
    );
    parsed = parseJsonObjectFromLlm(second.response);
  }

  if (!validateOutput(parsed)) {
    throw new Error("growth-sector: invalid LLM JSON");
  }

  const o = /** @type {Record<string, unknown>} */ (parsed);
  return {
    summary: String(o.summary).trim(),
    tailwindThemes: o.tailwindThemes.map((s) => String(s).trim()).filter(Boolean),
    headwindThemes: o.headwindThemes.map((s) => String(s).trim()).filter(Boolean),
    positioningIdeasForSyra: o.positioningIdeasForSyra.map((s) => String(s).trim()).filter(Boolean),
    macroHeadline: String(o.macroHeadline).trim(),
    bullets: o.bullets.map((b) => {
      const x = /** @type {Record<string, unknown>} */ (b);
      const ids = Array.isArray(x.evidenceTweetIds)
        ? x.evidenceTweetIds.map((id) => String(id).trim())
        : [];
      return {
        title: String(x.title).trim(),
        detail: String(x.detail).trim(),
        evidenceTweetIds: ids,
      };
    }),
    generatedAt: new Date().toISOString(),
    tweetsSampled: merged.size,
  };
}
