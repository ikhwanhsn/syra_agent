/**
 * Business Strategy Agent — GTM and monetization guidance using crawl snapshot + internal research output.
 * OpenRouter only; chained after internal research.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import { resolveInternalPipelineModel } from "../config/internalPipelineAgents.js";

/**
 * @typedef {import("../libs/agentTeamCrawl.js").CrawlSnapshotItem} CrawlSnapshotItem
 */

/**
 * @typedef {import("./internal-research-agent.js").InternalResearchOutput} InternalResearchOutput
 */

/**
 * @typedef {'1w' | '1m' | '1q'} GtmHorizon
 */

/**
 * @typedef {{
 *   title: string;
 *   rationale: string;
 *   channel: string;
 *   horizon: GtmHorizon;
 * }} GtmRecommendation
 */

/**
 * @typedef {{
 *   title: string;
 *   rationale: string;
 *   pricingHypothesis: string;
 * }} MonetizationIdea
 */

/**
 * @typedef {{
 *   marketPosition: string;
 *   gtmRecommendations: GtmRecommendation[];
 *   monetizationIdeas: MonetizationIdea[];
 *   competitiveRisks: string[];
 *   generatedAt: string;
 * }} BusinessStrategyOutput
 */

const HORIZONS = new Set(["1w", "1m", "1q"]);

const SYSTEM_PROMPT = `You are a senior GTM and business strategist for Syra (AI trading intelligence / x402 pay-per-call API on Solana).

You receive:
1) Crawled public website/API content (ground truth for positioning and offerings as shown to users).
2) Structured internal research JSON from a product researcher (feature gaps, UX, devx — treat as hypotheses, still ground claims in the crawl when possible).

Rules:
- Do not invent revenue numbers, user counts, or partnerships not evidenced in the inputs. If inferring, label clearly as hypothesis in rationale text.
- Output ONLY a single JSON object, no markdown fences, no commentary before or after.
- Shape:
{
  "marketPosition": string (3-8 sentences),
  "gtmRecommendations": array of {
    "title": string,
    "rationale": string,
    "channel": string (e.g. Twitter, docs SEO, hackathons, devrel, partnerships),
    "horizon": "1w" | "1m" | "1q"
  } (at least 3, at most 10),
  "monetizationIdeas": array of {
    "title": string,
    "rationale": string,
    "pricingHypothesis": string (qualitative; no fake dollar amounts unless explicitly in crawl)
  } (at least 2, at most 8),
  "competitiveRisks": string[] (0-8 items)
}
- Write in English.`;

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
 * @param {unknown} v
 * @returns {v is GtmHorizon}
 */
function isHorizon(v) {
  return typeof v === "string" && HORIZONS.has(v);
}

/**
 * @param {unknown} obj
 * @returns {obj is BusinessStrategyOutput}
 */
export function validateBusinessStrategyOutput(obj) {
  if (!obj || typeof obj !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (obj);
  if (typeof o.marketPosition !== "string" || !o.marketPosition.trim()) return false;

  if (!Array.isArray(o.gtmRecommendations) || o.gtmRecommendations.length < 3) return false;
  if (o.gtmRecommendations.length > 10) return false;
  for (const g of o.gtmRecommendations) {
    if (!g || typeof g !== "object") return false;
    const x = /** @type {Record<string, unknown>} */ (g);
    if (typeof x.title !== "string" || !x.title.trim()) return false;
    if (typeof x.rationale !== "string" || !x.rationale.trim()) return false;
    if (typeof x.channel !== "string" || !x.channel.trim()) return false;
    if (!isHorizon(x.horizon)) return false;
  }

  if (!Array.isArray(o.monetizationIdeas) || o.monetizationIdeas.length < 2) return false;
  if (o.monetizationIdeas.length > 8) return false;
  for (const m of o.monetizationIdeas) {
    if (!m || typeof m !== "object") return false;
    const x = /** @type {Record<string, unknown>} */ (m);
    if (typeof x.title !== "string" || !x.title.trim()) return false;
    if (typeof x.rationale !== "string" || !x.rationale.trim()) return false;
    if (typeof x.pricingHypothesis !== "string" || !x.pricingHypothesis.trim()) return false;
  }

  if (!Array.isArray(o.competitiveRisks)) return false;
  for (const c of o.competitiveRisks) {
    if (typeof c !== "string") return false;
  }
  return true;
}

/**
 * @param {unknown} obj
 * @returns {BusinessStrategyOutput}
 */
function coerceBusinessStrategyOutput(obj) {
  if (!validateBusinessStrategyOutput(obj)) {
    throw new Error("Invalid business strategy JSON shape");
  }
  const o = /** @type {BusinessStrategyOutput} */ (obj);
  const generatedAt =
    typeof o.generatedAt === "string" && o.generatedAt.trim()
      ? o.generatedAt.trim()
      : new Date().toISOString();
  return {
    marketPosition: o.marketPosition.trim(),
    gtmRecommendations: o.gtmRecommendations.map((g) => ({
      title: g.title.trim(),
      rationale: g.rationale.trim(),
      channel: g.channel.trim(),
      horizon: g.horizon,
    })),
    monetizationIdeas: o.monetizationIdeas.map((m) => ({
      title: m.title.trim(),
      rationale: m.rationale.trim(),
      pricingHypothesis: m.pricingHypothesis.trim(),
    })),
    competitiveRisks: o.competitiveRisks.map((s) => s.trim()).filter(Boolean),
    generatedAt,
  };
}

/**
 * @param {CrawlSnapshotItem[]} snapshot
 * @param {InternalResearchOutput} internalResearch
 * @returns {string}
 */
function buildUserContent(snapshot, internalResearch) {
  return JSON.stringify(
    {
      crawledAt: new Date().toISOString(),
      pages: snapshot.map((p) => ({
        url: p.url,
        title: p.title,
        markdown: p.markdown,
      })),
      internalResearch,
    },
    null,
    0,
  );
}

/**
 * Run business strategy agent (OpenRouter), chained after internal research.
 * @param {{
 *   snapshot: CrawlSnapshotItem[];
 *   internalResearch: InternalResearchOutput;
 *   model?: string | null;
 * }} params
 * @returns {Promise<BusinessStrategyOutput>}
 */
export async function runBusinessStrategyAgent({ snapshot, internalResearch, model }) {
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    throw new Error("runBusinessStrategyAgent: snapshot is required");
  }
  if (!internalResearch || typeof internalResearch !== "object") {
    throw new Error("runBusinessStrategyAgent: internalResearch is required");
  }

  const modelId = resolveInternalPipelineModel(model);
  const userContent = buildUserContent(snapshot, internalResearch);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Produce the JSON object per your instructions from this combined input:\n\n${userContent}`,
    },
  ];

  const llmOpts = {
    model: modelId,
    max_tokens: 4096,
    temperature: 0.4,
  };

  const apiMessages = withLlmIdentitySystemNote(messages, modelId);
  const first = await callOpenRouter(apiMessages, llmOpts);

  let parsed;
  try {
    parsed = parseJsonObjectFromLlm(first.response);
    return coerceBusinessStrategyOutput(parsed);
  } catch (firstErr) {
    const retryMessages = [
      ...apiMessages,
      {
        role: "assistant",
        content: typeof first.response === "string" ? first.response.slice(0, 8000) : "",
      },
      {
        role: "user",
        content:
          "Your previous reply was not valid JSON or did not match the required schema. Reply with ONLY one JSON object (marketPosition, gtmRecommendations 3-10 with horizon 1w|1m|1q, monetizationIdeas 2-8, competitiveRisks array). No markdown fences.",
      },
    ];

    const second = await callOpenRouter(retryMessages, llmOpts);

    try {
      parsed = parseJsonObjectFromLlm(second.response);
      return coerceBusinessStrategyOutput(parsed);
    } catch {
      const hint = firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new Error(
        `Business strategy agent failed JSON validation after retry (${hint}). Raw tail: ${String(second.response).slice(-400)}`,
      );
    }
  }
}
