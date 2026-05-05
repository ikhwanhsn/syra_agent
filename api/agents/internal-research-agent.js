/**
 * Internal Research Agent — grounded product/feature recommendations from crawl snapshot only.
 * OpenRouter only; no crawl or Telegram here.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";

/**
 * @typedef {import("../libs/agentTeamCrawl.js").CrawlSnapshotItem} CrawlSnapshotItem
 */

/**
 * @typedef {'landing' | 'docs' | 'agent' | 'api' | 'playground' | 'cross-cutting'} ResearchSurface
 */

/**
 * @typedef {'feature' | 'fix' | 'integration' | 'ux' | 'devx'} ResearchCategory
 */

/**
 * @typedef {'high' | 'medium' | 'low'} ImpactEffort
 */

/**
 * @typedef {{
 *   title: string;
 *   why: string;
 *   surface: ResearchSurface;
 *   category: ResearchCategory;
 *   impact: ImpactEffort;
 *   effort: ImpactEffort;
 * }} InternalRecommendation
 */

/**
 * @typedef {{
 *   summary: string;
 *   recommendations: InternalRecommendation[];
 *   risks: string[];
 *   generatedAt: string;
 * }} InternalResearchOutput
 */

const SURFACES = new Set([
  "landing",
  "docs",
  "agent",
  "api",
  "playground",
  "cross-cutting",
]);

const CATEGORIES = new Set(["feature", "fix", "integration", "ux", "devx"]);

const LEVELS = new Set(["high", "medium", "low"]);

const SYSTEM_PROMPT = `You are Syra's internal product researcher. You receive crawled markdown/text from Syra's public web surfaces (landing, docs, agent app, API, playground) and optional API JSON excerpts.

Rules:
- Base every recommendation ONLY on evidence present in the provided content. If something is unclear, say so in "why" rather than inventing metrics, user numbers, or roadmap claims.
- Output ONLY a single JSON object, no markdown fences, no commentary before or after.
- Use this exact JSON shape and key order is not required:
{
  "summary": string (2-6 sentences),
  "recommendations": array of {
    "title": string,
    "why": string,
    "surface": one of "landing"|"docs"|"agent"|"api"|"playground"|"cross-cutting",
    "category": one of "feature"|"fix"|"integration"|"ux"|"devx",
    "impact": one of "high"|"medium"|"low",
    "effort": one of "high"|"medium"|"low"
  } (at least 3, at most 12 items),
  "risks": string[] (0-8 short items: gaps, inconsistencies, or missing proof in the sites themselves)
}
- Write in English. Be specific and actionable for an engineering + product team.`;

/**
 * @param {string} text
 * @returns {unknown}
 */
function parseJsonObjectFromLlm(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) throw new Error("Empty model response");

  const tryParse = (s) => {
    const t = s.trim();
    return JSON.parse(t);
  };

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
 * @returns {v is ResearchSurface}
 */
function isSurface(v) {
  return typeof v === "string" && SURFACES.has(v);
}

/**
 * @param {unknown} v
 * @returns {v is ResearchCategory}
 */
function isCategory(v) {
  return typeof v === "string" && CATEGORIES.has(v);
}

/**
 * @param {unknown} v
 * @returns {v is ImpactEffort}
 */
function isLevel(v) {
  return typeof v === "string" && LEVELS.has(v);
}

/**
 * @param {unknown} obj
 * @returns {obj is InternalResearchOutput}
 */
export function validateInternalResearchOutput(obj) {
  if (!obj || typeof obj !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (obj);
  if (typeof o.summary !== "string" || !o.summary.trim()) return false;
  if (!Array.isArray(o.recommendations) || o.recommendations.length < 3) return false;
  if (o.recommendations.length > 12) return false;
  for (const r of o.recommendations) {
    if (!r || typeof r !== "object") return false;
    const x = /** @type {Record<string, unknown>} */ (r);
    if (typeof x.title !== "string" || !x.title.trim()) return false;
    if (typeof x.why !== "string" || !x.why.trim()) return false;
    if (!isSurface(x.surface)) return false;
    if (!isCategory(x.category)) return false;
    if (!isLevel(x.impact) || !isLevel(x.effort)) return false;
  }
  if (!Array.isArray(o.risks)) return false;
  for (const ri of o.risks) {
    if (typeof ri !== "string") return false;
  }
  return true;
}

/**
 * @param {unknown} obj
 * @returns {InternalResearchOutput}
 */
function coerceInternalResearchOutput(obj) {
  if (!validateInternalResearchOutput(obj)) {
    throw new Error("Invalid internal research JSON shape");
  }
  const o = /** @type {InternalResearchOutput} */ (obj);
  const generatedAt =
    typeof o.generatedAt === "string" && o.generatedAt.trim()
      ? o.generatedAt.trim()
      : new Date().toISOString();
  return {
    summary: o.summary.trim(),
    recommendations: o.recommendations.map((r) => ({
      title: r.title.trim(),
      why: r.why.trim(),
      surface: r.surface,
      category: r.category,
      impact: r.impact,
      effort: r.effort,
    })),
    risks: o.risks.map((s) => s.trim()).filter(Boolean),
    generatedAt,
  };
}

/**
 * @param {CrawlSnapshotItem[]} snapshot
 * @returns {string}
 */
function buildUserContent(snapshot) {
  return JSON.stringify(
    {
      crawledAt: new Date().toISOString(),
      pages: snapshot.map((p) => ({
        url: p.url,
        title: p.title,
        markdown: p.markdown,
      })),
    },
    null,
    0,
  );
}

/**
 * Run internal research agent (OpenRouter).
 * @param {{ snapshot: CrawlSnapshotItem[]; model?: string | null }} params
 * @returns {Promise<InternalResearchOutput>}
 */
export async function runInternalResearchAgent({ snapshot, model }) {
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    throw new Error("runInternalResearchAgent: snapshot is required");
  }

  const modelId =
    typeof model === "string" && model.trim() ? model.trim() : OPENROUTER_DEFAULT_MODEL;
  const userContent = buildUserContent(snapshot);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze the following crawled content and produce the JSON object described in your instructions:\n\n${userContent}`,
    },
  ];

  const llmOpts = {
    model: modelId,
    max_tokens: 4096,
    temperature: 0.35,
  };

  const apiMessages = withLlmIdentitySystemNote(messages, modelId);
  const first = await callOpenRouter(apiMessages, llmOpts);

  let parsed;
  try {
    parsed = parseJsonObjectFromLlm(first.response);
    return coerceInternalResearchOutput(parsed);
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
          "Your previous reply was not valid JSON or did not match the required schema. Reply with ONLY one JSON object matching the schema (summary, recommendations 3-12 items with all required fields, risks array). No markdown fences.",
      },
    ];

    const second = await callOpenRouter(retryMessages, llmOpts);

    try {
      parsed = parseJsonObjectFromLlm(second.response);
      return coerceInternalResearchOutput(parsed);
    } catch {
      const hint = firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new Error(
        `Internal research agent failed JSON validation after retry (${hint}). Raw tail: ${String(second.response).slice(-400)}`,
      );
    }
  }
}
