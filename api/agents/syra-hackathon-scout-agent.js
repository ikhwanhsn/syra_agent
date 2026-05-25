/**
 * Syra Hackathon Scout — extract structured hackathon leads from X tweet samples.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";
import { HACKATHON_SCOUT_MAX_TWEETS_LLM } from "../config/syraHackathonScoutConfig.js";

/**
 * @typedef {import("../libs/syraHackathonScoutXFetch.js").HackathonTweetSample} HackathonTweetSample
 */

/**
 * @typedef {{
 *   tweetId: string;
 *   title: string;
 *   organizer: string;
 *   description: string;
 *   relevanceScore: number;
 *   relevanceReason: string;
 *   tags: string[];
 *   deadline: string | null;
 *   prizePool: string | null;
 *   applicationUrl: string | null;
 * }} ExtractedHackathon
 */

/**
 * @param {unknown} v
 * @returns {string}
 */
function str(v) {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/**
 * @param {unknown} raw
 * @returns {ExtractedHackathon[]}
 */
function coerceExtractions(raw, tweetIds) {
  const validIds = new Set(tweetIds);
  const root = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const list = Array.isArray(root.hackathons)
    ? root.hackathons
    : Array.isArray(root.leads)
      ? root.leads
      : [];
  /** @type {ExtractedHackathon[]} */
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const tweetId = str(x.tweetId || x.tweet_id || x.id);
    if (!tweetId || !validIds.has(tweetId)) continue;
    const title = str(x.title);
    if (!title) continue;
    const score = typeof x.relevanceScore === "number" ? Math.max(0, Math.min(100, x.relevanceScore)) : 50;
    const tags = Array.isArray(x.tags) ? x.tags.map((t) => str(t)).filter(Boolean).slice(0, 8) : [];
    out.push({
      tweetId,
      title: title.slice(0, 200),
      organizer: str(x.organizer).slice(0, 120),
      description: str(x.description).slice(0, 600),
      relevanceScore: score,
      relevanceReason: str(x.relevanceReason).slice(0, 400),
      tags,
      deadline: str(x.deadline) || null,
      prizePool: str(x.prizePool) || null,
      applicationUrl: str(x.applicationUrl || x.url) || null,
    });
  }
  return out;
}

const SYSTEM = `You are **Syra Hackathon Scout**. Extract real hackathon / builder competition announcements from X tweets for the Syra team.

**Syra** builds: AI trading agent on Solana, x402 APIs, Telegram bot, agent chat, LP experiments, ERC-8004 registry.

**Input:** Tweet samples (id, text, author). Only output hackathons that are clearly announced in the tweets — do NOT invent events.

**Output JSON:** { "hackathons": [ { tweetId, title, organizer, description, relevanceScore (0-100 for Syra fit), relevanceReason, tags (e.g. solana, ai-agent, x402), deadline (ISO date or human string or null), prizePool (string or null), applicationUrl (url or null) } ] }

**Scoring:** Higher relevance for Solana, AI agents, x402, DeFi, trading, infra Syra can demo. Lower for unrelated chains-only or non-crypto events.

**Rules:**
- One row per distinct hackathon tweet (use exact tweetId from input).
- Skip pure commentary with no event CTA.
- Max 6 hackathons per run.
- Valid JSON only.`;

/**
 * @param {{ tweets: HackathonTweetSample[]; model?: string | null }} input
 * @returns {Promise<ExtractedHackathon[]>}
 */
export async function runSyraHackathonScoutAgent(input) {
  const tweets = input.tweets.slice(0, HACKATHON_SCOUT_MAX_TWEETS_LLM);
  if (tweets.length === 0) return [];

  if (!process.env.OPENROUTER_API_KEY) {
    return tweets.slice(0, 3).map((t) => ({
      tweetId: t.id,
      title: t.text.slice(0, 80),
      organizer: t.authorHandle,
      description: t.text.slice(0, 400),
      relevanceScore: 40,
      relevanceReason: "OpenRouter not configured — raw tweet saved for manual review.",
      tags: ["unparsed"],
      deadline: null,
      prizePool: null,
      applicationUrl: null,
    }));
  }

  const compact = tweets.map((t) => ({
    tweetId: t.id,
    text: t.text.slice(0, 500),
    author: t.authorHandle,
    createdAt: t.createdAt,
    url: t.url,
  }));

  const model = resolveInternalPipelineModel(input.model);
  const messages = withLlmIdentitySystemNote(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Extract hackathons from these tweets:\n${JSON.stringify({ tweets: compact })}`,
      },
    ],
    model,
  );

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.hackathonScout,
    temperature: 0.25,
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonObjectFromLlm(result.response);
  return coerceExtractions(
    parsed,
    tweets.map((t) => t.id),
  );
}
