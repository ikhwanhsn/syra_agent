/**
 * Internal Research Agent — grounded product/feature recommendations from crawl snapshot only.
 * OpenRouter only; no crawl or Telegram here.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { looksLikeAuthWall } from "../libs/agentTeamCrawl.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import { resolveInternalPipelineModel } from "../config/internalPipelineAgents.js";

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

/** Surfaces that correspond to public HTML apps (not api.syraa.fun JSON routes). */
const USER_WEB_SURFACES = new Set(["landing", "docs", "agent", "playground"]);

/** When the LLM drops below min recommendations after stripping auth hallucinations. */
const SANITIZER_PAD_RECOMMENDATIONS = Object.freeze([
  {
    title: "Treat crawler-only auth walls separately from real browsers",
    why: "Agent-team crawls use Cloudflare Browser Rendering from datacenter IPs. Vercel Deployment Protection (or similar) may challenge crawlers while normal visitors still receive 200. Repeated false 401 reports usually mean allowlist the crawl origin or confirm production protection settings — not that SPA hosts are broken.",
    surface: "cross-cutting",
    category: "devx",
    impact: "medium",
    effort: "low",
  },
  {
    title: "Clarify API auth vs browsable web apps on the landing page",
    why: "State explicitly that api.syraa.fun routes may require keys or x402 while syraa.fun, docs.syraa.fun, agent.syraa.fun, and playground.syraa.fun are ordinary sites integrators can open without API credentials.",
    surface: "landing",
    category: "ux",
    impact: "low",
    effort: "low",
  },
]);

/**
 * @param {string} urlStr
 * @returns {string}
 */
function crawlHostname(urlStr) {
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * True if some crawled page for this surface looks like an auth / deployment wall.
 * @param {CrawlSnapshotItem[]} snapshot
 * @param {ResearchSurface} surface
 * @returns {boolean}
 */
function snapshotHasAuthWallEvidenceForSurface(snapshot, surface) {
  for (const p of snapshot) {
    const md = typeof p.markdown === "string" ? p.markdown : "";
    if (!looksLikeAuthWall(md)) continue;
    const host = crawlHostname(String(p.url || ""));
    if (surface === "landing" && (host === "syraa.fun" || host === "www.syraa.fun")) return true;
    if (surface === "docs" && host === "docs.syraa.fun") return true;
    if (surface === "agent" && host === "agent.syraa.fun") return true;
    if (surface === "playground" && host === "playground.syraa.fun") return true;
  }
  return false;
}

/**
 * @param {CrawlSnapshotItem[]} snapshot
 * @returns {boolean}
 */
function anyUserFacingHostShowsAuthWall(snapshot) {
  for (const s of USER_WEB_SURFACES) {
    if (snapshotHasAuthWallEvidenceForSurface(snapshot, /** @type {ResearchSurface} */ (s))) {
      return true;
    }
  }
  return false;
}

/**
 * LLM often conflates api.syraa.fun Unauthorized responses with SPA hosts.
 * @param {InternalRecommendation} rec
 * @returns {boolean}
 */
function recommendationClaimsUserSiteAuthFailure(rec) {
  if (!USER_WEB_SURFACES.has(rec.surface)) return false;
  const text = `${rec.title}\n${rec.why}`.toLowerCase();
  const citesAuthFailure =
    /\b401\b/.test(text) ||
    /\b402\b/.test(text) ||
    /authentication error|unauthorized error|payment required/i.test(text);
  if (!citesAuthFailure) return false;
  return /preventing users|blocking users|hindering users|not accessible|inaccessible|returned (a )?401|returns 401|respond(ed|ing)? with (a )?401|401 errors|main entry point|experimenting with the api/i.test(
    text,
  );
}

/**
 * Strip recommendations / risks that claim user-facing sites return 401 without crawl proof.
 * @param {CrawlSnapshotItem[]} snapshot
 * @param {InternalResearchOutput} output
 * @returns {InternalResearchOutput}
 */
function sanitizeAuthSurfaceHallucinations(snapshot, output) {
  let recommendations = output.recommendations.filter((rec) => {
    if (!recommendationClaimsUserSiteAuthFailure(rec)) return true;
    return snapshotHasAuthWallEvidenceForSurface(snapshot, rec.surface);
  });

  let risks = output.risks.filter((line) => {
    const t = line.toLowerCase();
    const systemic401 =
      /\b401\b/.test(t) &&
      /all (four|4)|user-facing surfaces|systemic|landing.*docs|every.*surface|all returning|primary user-facing/i.test(
        t,
      );
    if (!systemic401) return true;
    return anyUserFacingHostShowsAuthWall(snapshot);
  });

  const dropped = output.recommendations.length - recommendations.length;
  if (dropped > 0) {
    risks.unshift(
      `Automated filter: removed ${dropped} recommendation(s) that claimed HTTP 401/402 on user-facing web hosts without matching auth-wall crawl evidence (usually conflated with api.syraa.fun).`,
    );
  }

  let padIdx = 0;
  while (recommendations.length < 3 && padIdx < SANITIZER_PAD_RECOMMENDATIONS.length) {
    recommendations.push({ ...SANITIZER_PAD_RECOMMENDATIONS[padIdx] });
    padIdx += 1;
  }
  while (recommendations.length < 3) {
    recommendations.push({
      title: "Review crawl coverage when auth-wall pages were dropped",
      why: "Matching deployment-protection markdown is removed before the LLM runs. Few snapshot URLs for a host means conclusions about that host may be unreliable until crawl bypass or limits are adjusted.",
      surface: "cross-cutting",
      category: "devx",
      impact: "low",
      effort: "low",
    });
  }

  if (recommendations.length > 12) {
    recommendations = recommendations.slice(0, 12);
  }

  return {
    ...output,
    recommendations,
    risks,
  };
}

const SYSTEM_PROMPT = `You are Syra's internal product researcher. You receive crawled markdown/text from Syra's public web surfaces (landing, docs, agent app, playground) plus a static description of the API auth model and public API discovery JSON (OpenAPI + x402).

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
- Write in English. Be specific and actionable for an engineering + product team.

Auth model — IMPORTANT (do not generate false-positive auth bug reports):
- The synthetic page whose URL ends with \`/_meta/auth-model\` describes **only** https://api.syraa.fun. It is not evidence about syraa.fun, docs.syraa.fun, agent.syraa.fun, or playground.syraa.fun. Never claim those web apps "return 401" because that page mentions Unauthorized/Payment Required for the API.
- The api.syraa.fun JSON API is intentionally protected (keys / x402). Anonymous calls to protected routes there are expected to fail auth — that does **not** mean the marketing or docs sites are down.
- Only recommend a **fix** for user-facing web surfaces if the crawled **page URL** for that host (see snapshot \`url\` fields) contains visible auth-wall content (deployment protection, site-wide login with no product shell), not merely API error jargon copied from docs.
- Frontend bundles must never embed API keys; trusted-origin injection applies. Do not recommend exposing API keys in client bundles.`;

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

  const modelId = resolveInternalPipelineModel(model);
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
    return sanitizeAuthSurfaceHallucinations(
      snapshot,
      coerceInternalResearchOutput(parsed),
    );
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
      return sanitizeAuthSurfaceHallucinations(
        snapshot,
        coerceInternalResearchOutput(parsed),
      );
    } catch {
      const hint = firstErr instanceof Error ? firstErr.message : String(firstErr);
      throw new Error(
        `Internal research agent failed JSON validation after retry (${hint}). Raw tail: ${String(second.response).slice(-400)}`,
      );
    }
  }
}
