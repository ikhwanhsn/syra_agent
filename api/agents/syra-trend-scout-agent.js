/**
 * Syra Trend Scout — analyzes trending news/events and suggests Syra content + product ideas.
 * Grounded only on provided headlines, articles, and events; JSON-validated output.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { parseJsonObjectFromLlm } from "../libs/llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";

/**
 * @typedef {{
 *   title: string;
 *   angle: string;
 *   platforms: string[];
 *   hook: string;
 *   priority: 'high' | 'medium' | 'low';
 * }} ContentSuggestion
 */

/**
 * @typedef {{
 *   title: string;
 *   why: string;
 *   surface: string;
 *   priority: 'high' | 'medium' | 'low';
 * }} FeatureSuggestion
 */

/**
 * @typedef {{
 *   marketSummary: string;
 *   trendingTopics: string[];
 *   contentSuggestions: ContentSuggestion[];
 *   featureSuggestions: FeatureSuggestion[];
 *   risksOrCaveats: string[];
 *   generatedAt: string;
 *   sourceStats: {
 *     headlineCount: number;
 *     articleCount: number;
 *     eventDayCount: number;
 *   };
 * }} SyraTrendScoutOutput
 */

const PRIORITIES = new Set(["high", "medium", "low"]);

/**
 * @param {unknown} v
 * @param {string} fallback
 * @returns {string}
 */
function str(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/**
 * @param {unknown} v
 * @returns {'high' | 'medium' | 'low'}
 */
function priority(v) {
  const p = str(v, "medium").toLowerCase();
  return PRIORITIES.has(p) ? /** @type {'high' | 'medium' | 'low'} */ (p) : "medium";
}

/**
 * @param {unknown} raw
 * @returns {ContentSuggestion[]}
 */
function coerceContentSuggestions(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {ContentSuggestion[]} */
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const title = str(x.title);
    if (!title) continue;
    const platforms = Array.isArray(x.platforms)
      ? x.platforms.map((p) => str(p)).filter(Boolean)
      : ["X"];
    out.push({
      title,
      angle: str(x.angle, title),
      platforms: platforms.length ? platforms : ["X"],
      hook: str(x.hook, ""),
      priority: priority(x.priority),
    });
  }
  return out.slice(0, 8);
}

/**
 * @param {unknown} raw
 * @returns {FeatureSuggestion[]}
 */
function coerceFeatureSuggestions(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {FeatureSuggestion[]} */
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const title = str(x.title);
    if (!title) continue;
    out.push({
      title,
      why: str(x.why, ""),
      surface: str(x.surface, "cross-cutting"),
      priority: priority(x.priority),
    });
  }
  return out.slice(0, 8);
}

/**
 * @param {unknown} obj
 * @param {{ headlineCount: number; articleCount: number; eventDayCount: number }} stats
 * @returns {SyraTrendScoutOutput}
 */
function coerceOutput(obj, stats) {
  const root = obj && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
  const trendingTopics = Array.isArray(root.trendingTopics)
    ? root.trendingTopics.map((t) => str(t)).filter(Boolean).slice(0, 12)
    : [];
  const risksOrCaveats = Array.isArray(root.risksOrCaveats)
    ? root.risksOrCaveats.map((t) => str(t)).filter(Boolean).slice(0, 8)
    : [];

  return {
    marketSummary: str(root.marketSummary, "No summary produced."),
    trendingTopics,
    contentSuggestions: coerceContentSuggestions(root.contentSuggestions),
    featureSuggestions: coerceFeatureSuggestions(root.featureSuggestions),
    risksOrCaveats,
    generatedAt: new Date().toISOString(),
    sourceStats: stats,
  };
}

const SYSTEM = `You are **Syra Trend Scout**, an internal analyst for the Syra project.

**Syra context (do not invent facts beyond the provided news/events):**
- Syra is an AI trading & research agent on Solana (agent.syraa.fun, @syra_agent on X).
- Product surfaces: x402-paid APIs (news, sentiment, signals, health), Telegram bot, dashboard, LP/trading experiments.
- Audience: crypto traders, builders, and AI-agent ecosystem followers.

**Your job:** From the supplied trending headlines, recent articles, and calendar events, produce actionable output for the Syra team:
1. **marketSummary** — 2–4 sentences on what is hot in crypto/AI/Solana right now.
2. **trendingTopics** — 5–10 short bullet themes (strings).
3. **contentSuggestions** — 4–6 post ideas Syra can publish (X, Telegram, blog). Each needs: title, angle, platforms (array), hook (opening line), priority (high|medium|low). Tie ideas to real trends in the input — no generic filler.
4. **featureSuggestions** — 4–6 product/feature ideas Syra could build to ride trends (API, agent tool, UI, integration). Each: title, why (grounded in trends), surface (landing|docs|agent|api|telegram|cross-cutting), priority.
5. **risksOrCaveats** — 2–5 strings (hype, regulatory noise, data gaps).

**Rules:**
- Use ONLY evidence from the user payload. If data is thin, say so in risksOrCaveats and keep suggestions conservative.
- Prefer Solana, AI agents, DeFi, memecoins, x402, and trading narratives when present in sources.
- Output valid JSON only, no markdown fences.`;

/**
 * @param {{
 *   headlines: Array<{ headline: string; importance?: number }>;
 *   articles: Array<{ title: string; source: string; publishedAt: string; snippet: string }>;
 *   eventsByDate: Record<string, Array<{ event_name: string; event_text?: string }>>;
 *   model?: string | null;
 * }} input
 * @returns {Promise<SyraTrendScoutOutput>}
 */
export async function runSyraTrendScoutAgent(input) {
  const headlineCount = input.headlines.length;
  const articleCount = input.articles.length;
  const eventDayCount = Object.keys(input.eventsByDate || {}).length;
  const stats = { headlineCount, articleCount, eventDayCount };

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      marketSummary: "OpenRouter API key not configured; trend scout skipped LLM analysis.",
      trendingTopics: input.headlines.slice(0, 5).map((h) => h.headline),
      contentSuggestions: [],
      featureSuggestions: [],
      risksOrCaveats: ["Set OPENROUTER_API_KEY to enable full analysis."],
      generatedAt: new Date().toISOString(),
      sourceStats: stats,
    };
  }

  const userPayload = {
    headlines: input.headlines,
    articles: input.articles,
    eventsByDate: input.eventsByDate,
  };

  const model = resolveInternalPipelineModel(input.model);
  const messages = withLlmIdentitySystemNote(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Analyze these market signals and return JSON with keys: marketSummary, trendingTopics, contentSuggestions, featureSuggestions, risksOrCaveats.\n\n${JSON.stringify(userPayload).slice(0, 100_000)}`,
      },
    ],
    model,
  );

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
    temperature: 0.35,
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonObjectFromLlm(result.response);
  return coerceOutput(parsed, stats);
}
