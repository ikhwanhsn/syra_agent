/**
 * Syra Growth Scout — recommends next steps to grow users and TVL.
 * Grounded on provided metrics, LP state, and social signals.
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
 *   why: string;
 *   channel: string;
 *   effort: 'low' | 'medium' | 'high';
 *   priority: 'high' | 'medium' | 'low';
 *   expectedImpact: string;
 * }} GrowthAction
 */

/**
 * @typedef {{
 *   label: string;
 *   value: string;
 *   trend?: string;
 * }} MetricHighlight
 */

/**
 * @typedef {{
 *   growthSummary: string;
 *   metricHighlights: MetricHighlight[];
 *   userAcquisitionActions: GrowthAction[];
 *   tvlGrowthActions: GrowthAction[];
 *   productPriorities: GrowthAction[];
 *   risksOrCaveats: string[];
 *   generatedAt: string;
 *   sourceStats: {
 *     metricCount: number;
 *     socialTweetCount: number;
 *     sectorTweetCount: number;
 *   };
 * }} SyraGrowthScoutOutput
 */

const PRIORITIES = new Set(["high", "medium", "low"]);
const EFFORTS = new Set(["low", "medium", "high"]);

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
 * @param {unknown} v
 * @returns {'low' | 'medium' | 'high'}
 */
function effort(v) {
  const e = str(v, "medium").toLowerCase();
  return EFFORTS.has(e) ? /** @type {'low' | 'medium' | 'high'} */ (e) : "medium";
}

/**
 * @param {unknown} raw
 * @returns {GrowthAction[]}
 */
function coerceActions(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {GrowthAction[]} */
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const title = str(x.title);
    if (!title) continue;
    out.push({
      title,
      why: str(x.why, ""),
      channel: str(x.channel, "product"),
      effort: effort(x.effort),
      priority: priority(x.priority),
      expectedImpact: str(x.expectedImpact, ""),
    });
  }
  return out.slice(0, 8);
}

/**
 * @param {unknown} raw
 * @returns {MetricHighlight[]}
 */
function coerceMetricHighlights(raw) {
  if (!Array.isArray(raw)) return [];
  /** @type {MetricHighlight[]} */
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (item);
    const label = str(x.label);
    const value = str(x.value);
    if (!label || !value) continue;
    const trend = str(x.trend);
    out.push({
      label,
      value,
      ...(trend ? { trend } : {}),
    });
  }
  return out.slice(0, 8);
}

/**
 * @param {unknown} obj
 * @param {{ metricCount: number; socialTweetCount: number; sectorTweetCount: number }} stats
 * @returns {SyraGrowthScoutOutput}
 */
function coerceOutput(obj, stats) {
  const root = obj && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
  const risksOrCaveats = Array.isArray(root.risksOrCaveats)
    ? root.risksOrCaveats.map((t) => str(t)).filter(Boolean).slice(0, 8)
    : [];

  return {
    growthSummary: str(root.growthSummary, "No summary produced."),
    metricHighlights: coerceMetricHighlights(root.metricHighlights),
    userAcquisitionActions: coerceActions(root.userAcquisitionActions),
    tvlGrowthActions: coerceActions(root.tvlGrowthActions),
    productPriorities: coerceActions(root.productPriorities),
    risksOrCaveats,
    generatedAt: new Date().toISOString(),
    sourceStats: stats,
  };
}

const SYSTEM = `You are **Syra Growth Scout**, an internal strategist for the Syra project.

**Syra context:**
- Syra is an AI trading & research agent on Solana (agent.syraa.fun, @syra_agent on X).
- Revenue and usage come from x402-paid APIs, agent chat sessions, playground shares, and LP/trading experiments.
- TVL growth means more SOL deployed in Syra LP agents (real + sim), more liquidity in tracked pools, and more capital using Syra tools.
- User acquisition means more unique chat users, paid API calls, playground shares, and wallet connections.

**Your job:** From the supplied metrics, LP/TVL snapshot, social chatter, and optional market summary, tell the team **what Syra should do next** to grow users and TVL. Be specific and actionable — not generic "post more on X".

Output JSON with:
1. **growthSummary** — 2–4 sentences on current growth health (users + TVL) and the biggest opportunity.
2. **metricHighlights** — 4–6 key metrics as { label, value, trend? } (human-readable values, e.g. "142 (+18% vs prior week)").
3. **userAcquisitionActions** — 4–6 concrete actions to get more users. Each: title, why (grounded in data), channel (X|Telegram|product|partnerships|content|community|ads), effort (low|medium|high), priority, expectedImpact.
4. **tvlGrowthActions** — 4–6 concrete actions to grow TVL / capital deployed. Same fields. Include LP agent, Meteora, treasury, and product levers when relevant.
5. **productPriorities** — 3–5 highest-impact things to ship or improve this week (same action shape; channel often "product" or "api").
6. **risksOrCaveats** — 2–5 strings (data gaps, vanity metrics, things not to over-index on).

**Rules:**
- Use ONLY evidence from the user payload. If metrics are zero or missing, recommend realistic first steps for an early-stage product.
- Prefer low-effort, high-impact moves when data is thin.
- Do not invent user counts or TVL numbers not in the payload.
- Output valid JSON only, no markdown fences.`;

/**
 * @param {{
 *   metrics: Record<string, number | string | null>;
 *   metricsNotes: string[];
 *   lpOverview: Record<string, unknown> | null;
 *   syraSocialTweets: Array<{ text: string; authorHandle: string; likeCount: number }>;
 *   sectorTweets: Array<{ text: string; authorHandle: string; likeCount: number }>;
 *   trendScoutSummary: string | null;
 *   model?: string | null;
 * }} input
 * @returns {Promise<SyraGrowthScoutOutput>}
 */
export async function runSyraGrowthScoutAgent(input) {
  const socialTweetCount = input.syraSocialTweets.length;
  const sectorTweetCount = input.sectorTweets.length;
  const metricCount = Object.keys(input.metrics || {}).length;
  const stats = { metricCount, socialTweetCount, sectorTweetCount };

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      growthSummary: "OpenRouter API key not configured; growth scout skipped LLM analysis.",
      metricHighlights: [],
      userAcquisitionActions: [],
      tvlGrowthActions: [],
      productPriorities: [],
      risksOrCaveats: ["Set OPENROUTER_API_KEY to enable full analysis."],
      generatedAt: new Date().toISOString(),
      sourceStats: stats,
    };
  }

  const userPayload = {
    metrics: input.metrics,
    metricsNotes: input.metricsNotes,
    lpOverview: input.lpOverview,
    syraSocialSample: input.syraSocialTweets.slice(0, 20).map((t) => ({
      text: t.text,
      author: t.authorHandle,
      likes: t.likeCount,
    })),
    sectorNarrativeSample: input.sectorTweets.slice(0, 16).map((t) => ({
      text: t.text,
      author: t.authorHandle,
      likes: t.likeCount,
    })),
    trendScoutMarketSummary: input.trendScoutSummary,
  };

  const model = resolveInternalPipelineModel(input.model);
  const messages = withLlmIdentitySystemNote(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Analyze Syra growth signals and return JSON with keys: growthSummary, metricHighlights, userAcquisitionActions, tvlGrowthActions, productPriorities, risksOrCaveats.\n\n${JSON.stringify(userPayload).slice(0, 100_000)}`,
      },
    ],
    model,
  );

  const result = await callOpenRouter(messages, {
    model,
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.growthScout,
    temperature: 0.35,
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonObjectFromLlm(result.response);
  return coerceOutput(parsed, stats);
}
