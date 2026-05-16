/**
 * Internal Research Agent — grounded product/feature recommendations from crawl snapshot only.
 * OpenRouter only; no crawl or Telegram here.
 */

import { callOpenRouter } from "../libs/openrouter.js";
import { looksLikeAuthWall } from "../libs/agentTeamCrawl.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  resolveInternalPipelineModel,
  INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS,
} from "../config/internalPipelineAgents.js";

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
 * Phrases that indicate an "auth/access" failure claim. Intentionally broad — we want
 * to catch both numeric ("401", "402") and prose ("authentication error", "auth wall",
 * "login wall", "deployment protection") variants because the LLM mixes them freely.
 */
const AUTH_FAILURE_PHRASES = [
  /\b401\b/,
  /\b402\b/,
  /\bunauthorized\b/,
  /\bpayment required\b/,
  /authentication (?:error|required|failure|issue|problem|wall)/,
  /\bauth (?:error|failure|issue|problem|wall)\b/,
  /login wall|sign[- ]?in wall|deployment protection|vercel authentication/,
  /inaccessible|not accessible|blocked from access|cannot (?:be )?access(?:ed)?/,
];

/**
 * Phrases that name a user-facing web host (by surface name or by domain).
 * Matching these strongly suggests the claim is *about* the SPA hosts.
 */
const USER_WEB_HOST_MENTIONS = [
  /\bsyraa\.fun\b/,
  /\bdocs\.syraa\.fun\b/,
  /\bagent\.syraa\.fun\b/,
  /\bplayground\.syraa\.fun\b/,
  /\b(landing|docs|agent|playground)\b/,
  /public[- ]?facing/,
  /user[- ]?facing/,
  /(public|web)[- ]?(web )?surfaces?/,
  /web app(?:lication)?s?/,
];

/** @param {string} text @param {RegExp[]} patterns */
function matchesAny(text, patterns) {
  return patterns.some((rx) => rx.test(text));
}

/** @param {string} text */
function textClaimsUserWebAuthFailure(text) {
  const t = (text || "").toLowerCase();
  if (!t) return false;
  return matchesAny(t, AUTH_FAILURE_PHRASES) && matchesAny(t, USER_WEB_HOST_MENTIONS);
}

/**
 * LLM often conflates api.syraa.fun Unauthorized responses with SPA hosts. This now
 * fires on TEXT, regardless of the `surface` enum the model picked — so a
 * `surface: "cross-cutting"` recommendation whose body still names landing/docs/agent/
 * playground as "401" or "inaccessible" is still caught.
 * @param {InternalRecommendation} rec
 */
function recommendationClaimsUserSiteAuthFailure(rec) {
  return textClaimsUserWebAuthFailure(`${rec.title}\n${rec.why}`);
}

/**
 * @param {CrawlSnapshotItem[]} snapshot
 * @param {InternalRecommendation} rec
 */
function recommendationBackedByCrawlEvidence(snapshot, rec) {
  const candidates = USER_WEB_SURFACES.has(rec.surface)
    ? [/** @type {ResearchSurface} */ (rec.surface)]
    : Array.from(USER_WEB_SURFACES);
  return candidates.some((s) =>
    snapshotHasAuthWallEvidenceForSurface(snapshot, /** @type {ResearchSurface} */ (s)),
  );
}

/** @param {string} text */
function splitIntoSentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Strip from `summary` any sentence that hallucinates auth failure on user-facing hosts
 * without crawl evidence. Returns the sanitized summary plus a count of removed sentences.
 * @param {CrawlSnapshotItem[]} snapshot
 * @param {string} summary
 */
function sanitizeSummary(snapshot, summary) {
  const hasEvidence = anyUserFacingHostShowsAuthWall(snapshot);
  if (hasEvidence) return { summary, dropped: 0 };

  const sentences = splitIntoSentences(summary);
  const kept = sentences.filter((s) => !textClaimsUserWebAuthFailure(s));
  const dropped = sentences.length - kept.length;
  if (dropped === 0) return { summary, dropped: 0 };

  const cleaned = kept.join(" ").trim();
  if (cleaned) return { summary: cleaned, dropped };
  return {
    summary:
      "Public web surfaces (landing, docs, agent, playground) appear to load normally; the API host (api.syraa.fun) is intentionally key/x402-gated and is not a site-wide outage. Findings below are grounded in the crawl snapshot only.",
    dropped,
  };
}

/**
 * Phrases that claim a user-facing host (or its documentation) is broken / unreachable.
 * This is a DIFFERENT hallucination from auth-wall reports: the LLM jumps from "I don't
 * see x402 docs in the snapshot" (which can happen if the crawl was thin or depth-limited)
 * to "the docs site is down". We strip these whenever crawl evidence proves the host is live.
 */
const HOST_DOWN_PHRASES = [
  /\b(docs?(?:umentation)?|site|website|landing|playground|agent app)\b[^\n.]{0,80}\b(is|are|appears? to be|seems? to be|currently)\b[^\n.]{0,80}\b(down|offline|unreachable|unavailable|broken|not loading|inaccessible|not accessible|cannot be reached|can(?:'| no)?t be reached|missing|returns 404|404[ed]?)\b/,
  /\b(crucial|critical|essential|important)\s+(documentation|docs)[^\n.]{0,80}\b(unreachable|unavailable|missing|down|inaccessible|offline)\b/,
  /\b(documentation|docs)\b[^\n.]{0,80}\b(is|are)\b[^\n.]{0,40}\b(down|unreachable|unavailable|inaccessible|offline|missing|broken)\b/,
  /\bdocs site (is|appears?) (down|offline|broken|unreachable|unavailable)\b/,
  /\b(no|missing)\s+(x402|api[- ]?key|payment)\s+(documentation|docs)\b/,
  /\b(x402|api[- ]?key)\s+(documentation|docs)\b[^\n.]{0,80}\b(unreachable|unavailable|missing|broken|inaccessible)\b/,
];

/** @param {string} text */
function textClaimsHostDown(text) {
  const t = (text || "").toLowerCase();
  if (!t) return false;
  return HOST_DOWN_PHRASES.some((rx) => rx.test(t));
}

/**
 * Count successful (non-error, non-empty) crawl pages per host. Used to decide whether a
 * "host is down" claim has any supporting evidence at all.
 *
 * @param {CrawlSnapshotItem[]} snapshot
 * @returns {Map<string, number>}
 */
function countLivePagesPerHost(snapshot) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const p of snapshot) {
    const host = crawlHostname(String(p?.url || ""));
    if (!host) continue;
    const title = String(p?.title || "").toLowerCase();
    if (title === "crawl-error" || title === "fetch-error" || title === "crawl-status") {
      continue;
    }
    const md = typeof p?.markdown === "string" ? p.markdown : "";
    if (!md.trim()) continue;
    counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return counts;
}

/** Surfaces → user-facing hostnames that count as "live evidence". */
const SURFACE_HOSTS = Object.freeze({
  landing: ["syraa.fun", "www.syraa.fun"],
  docs: ["docs.syraa.fun"],
  agent: ["agent.syraa.fun"],
  playground: ["playground.syraa.fun"],
});

/**
 * @param {Map<string, number>} hostCounts
 * @param {ResearchSurface} surface
 * @returns {boolean}
 */
function surfaceHasLiveEvidence(hostCounts, surface) {
  const hosts = /** @type {readonly string[]} */ (SURFACE_HOSTS[surface] ?? []);
  return hosts.some((h) => (hostCounts.get(h) ?? 0) >= 1);
}

/**
 * @param {Map<string, number>} hostCounts
 * @returns {boolean}
 */
function anyUserFacingHostIsLive(hostCounts) {
  for (const s of USER_WEB_SURFACES) {
    if (surfaceHasLiveEvidence(hostCounts, /** @type {ResearchSurface} */ (s))) return true;
  }
  return false;
}

/**
 * Decide whether a "host is down" claim is plausible: if any user-facing host with live
 * crawl pages is named in the text, we drop the claim.
 *
 * @param {Map<string, number>} hostCounts
 * @param {string} text
 * @returns {boolean} true if claim should be DROPPED
 */
function hostDownClaimContradictedByEvidence(hostCounts, text) {
  const t = text.toLowerCase();
  const namesUserHost = matchesAny(t, USER_WEB_HOST_MENTIONS);
  if (!namesUserHost) {
    // Generic "the site is down" with no host: still drop if ANY user-facing host is live.
    return anyUserFacingHostIsLive(hostCounts);
  }
  for (const [surface, hosts] of Object.entries(SURFACE_HOSTS)) {
    const hostNamed = hosts.some((h) => t.includes(h)) || t.includes(surface);
    if (hostNamed && surfaceHasLiveEvidence(hostCounts, /** @type {ResearchSurface} */ (surface))) {
      return true;
    }
  }
  return anyUserFacingHostIsLive(hostCounts);
}

/**
 * Strip from `summary` any sentence that hallucinates "host down / docs unreachable" when
 * the crawl snapshot proves the host is live.
 *
 * @param {Map<string, number>} hostCounts
 * @param {string} summary
 */
function sanitizeSummaryForHostDown(hostCounts, summary) {
  const sentences = splitIntoSentences(summary);
  const kept = sentences.filter((s) => {
    if (!textClaimsHostDown(s)) return true;
    return !hostDownClaimContradictedByEvidence(hostCounts, s);
  });
  const dropped = sentences.length - kept.length;
  if (dropped === 0) return { summary, dropped: 0 };
  const cleaned = kept.join(" ").trim();
  if (cleaned) return { summary: cleaned, dropped };
  return {
    summary:
      "Public web surfaces (landing, docs, agent, playground) responded to the crawler this cycle; no host outage detected. Findings below are grounded in the crawl snapshot only.",
    dropped,
  };
}

/**
 * Strip recommendations / risks / summary sentences that claim user-facing sites return
 * 401 (or any auth wall) without crawl proof.
 * @param {CrawlSnapshotItem[]} snapshot
 * @param {InternalResearchOutput} output
 * @returns {InternalResearchOutput}
 */
function sanitizeAuthSurfaceHallucinations(snapshot, output) {
  const hostCounts = countLivePagesPerHost(snapshot);

  let recommendations = output.recommendations.filter((rec) => {
    const text = `${rec.title}\n${rec.why}`;
    if (recommendationClaimsUserSiteAuthFailure(rec)) {
      return recommendationBackedByCrawlEvidence(snapshot, rec);
    }
    if (textClaimsHostDown(text)) {
      return !hostDownClaimContradictedByEvidence(hostCounts, text);
    }
    return true;
  });

  const hasEvidence = anyUserFacingHostShowsAuthWall(snapshot);

  let risks = output.risks.filter((line) => {
    if (textClaimsUserWebAuthFailure(line)) return hasEvidence;
    if (textClaimsHostDown(line)) {
      return !hostDownClaimContradictedByEvidence(hostCounts, line);
    }
    return true;
  });

  const droppedRecs = output.recommendations.length - recommendations.length;
  const droppedRisks = output.risks.length - risks.length;

  const { summary: authSummary, dropped: droppedSummaryAuth } = sanitizeSummary(
    snapshot,
    output.summary,
  );
  const { summary: cleanedSummary, dropped: droppedSummaryHost } =
    sanitizeSummaryForHostDown(hostCounts, authSummary);
  const droppedSummary = droppedSummaryAuth + droppedSummaryHost;

  const totalDropped = droppedRecs + droppedRisks + droppedSummary;
  if (totalDropped > 0) {
    risks.unshift(
      `Automated filter: removed ${droppedRecs} recommendation(s), ${droppedRisks} risk(s), and ${droppedSummary} summary sentence(s) that either (a) claimed HTTP 401/402 / auth walls on user-facing web hosts without matching crawl evidence (usually conflated with api.syraa.fun), or (b) claimed a user-facing host / docs site is down / unreachable while the crawl snapshot shows live pages from that host.`,
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
    summary: cleanedSummary,
    recommendations,
    risks,
  };
}

const SYSTEM_PROMPT = `You are Syra's internal product researcher. You receive crawled markdown/text from Syra's public web surfaces (landing, docs, agent app, playground) plus a static description of the API auth model and public API discovery JSON (OpenAPI + x402).

Brand context (for tone and priorities only — never invent metrics or deals):
- Syra: agentic trading / intelligence and paid APIs (e.g. x402) on Solana.
- Up Only: companion community / distribution narrative; keep recommendations realistic and execution-focused for a team that may scale aggressively.

Rules:
- Base every recommendation ONLY on evidence present in the provided content. If something is unclear, say so in "why" rather than inventing metrics, user numbers, or roadmap claims.
- Prefer fewer, higher-signal recommendations over vague platitudes. Each "why" should cite what you saw (page type, missing section, confusing copy) in one or two concrete phrases.
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
- Frontend bundles must never embed API keys; trusted-origin injection applies. Do not recommend exposing API keys in client bundles.

Docs availability — IMPORTANT (do not invent outage reports):
- Treat a host as **live** if the snapshot contains at least one page from that host with non-empty markdown and a non-error title. \`docs.syraa.fun\` in particular is live and serves the x402 Payment Flow, API Reference, agent docs, and tokenomics pages.
- The presence or absence of a *specific* docs page in this snapshot is **not** evidence the docs site is down. The crawl is depth-limited and may not reach every sub-page. If you cannot find a topic (e.g. "x402 payments" or "API key usage") in the snapshot, say "this snapshot did not include the x402 docs page; verify crawl depth/coverage" — never say "the docs site is down" or "documentation is unreachable".
- Authoritative docs URLs for x402 and API auth (the LLM should assume these exist and are reachable unless an explicit auth-wall page proves otherwise): \`https://docs.syraa.fun/docs/api/x402-api-standard\` (x402 Payment Flow + headers), \`https://docs.syraa.fun/docs/api-reference\` (full API reference), \`https://docs.syraa.fun/docs/welcome\` (landing).
- The phrases "docs site is down", "documentation is unreachable", "x402 documentation is unavailable", "no API-key docs", and equivalents are forbidden output unless a crawled page URL for \`docs.syraa.fun\` actually rendered an auth-wall / 404 / deployment-protection body.

Forbidden output examples (these are FALSE-POSITIVE patterns — never produce them unless a crawled page URL for that exact host shows a real auth wall or hard error body):
- "Public-facing web applications (landing, docs, agent, playground) are inaccessible due to authentication errors."
- "Investigate 401 errors on public web surfaces."
- "Crucial documentation for x402 payments and API key usage is unreachable because the docs site is down."
- "docs.syraa.fun is offline / not loading / returns 404."
- Any recommendation/risk that lumps all four user-facing hosts together as "401" / "unauthorized" / "inaccessible" / "blocked" / "auth wall" / "down" / "offline".
- Any recommendation whose \`surface\` is "cross-cutting" but whose body still asserts user-facing hosts return 401/402 or are down.
If the only auth-related evidence you have comes from the \`/_meta/auth-model\` synthetic page or the API discovery JSON, the correct conclusion is "API host (api.syraa.fun) is intentionally protected — no user-facing outage detected", not a 401 incident on the SPAs and not a docs outage.`;

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
    max_tokens: INTERNAL_PIPELINE_MAX_COMPLETION_TOKENS.internalResearch,
    temperature: 0.28,
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
