/**
 * Pump.fun Utility Scout Agent — finds tech / real-utility projects (pump.fun + ecosystem).
 */

import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import { loadAlphaXBatchSnapshot, saveAlphaXBatchSnapshot } from "./alphaXBatchPipeline.js";
import { collectOnchainPartnershipSignals } from "./onchainPartnershipSignals.js";
import {
  PUMPFUN_UTILITY_SCOUT_DB_ID,
  PUMPFUN_UTILITY_SCOUT_CRON_MS,
  PUMPFUN_UTILITY_SCOUT_HISTORY_MAX,
  PUMPFUN_UTILITY_SCOUT_CANDIDATE_TOP_N,
  PUMPFUN_UTILITY_SCOUT_MIN_SCORE,
} from "../config/pumpfunUtilityScoutConfig.js";
import { fetchPumpfunDiscoveryPool } from "./pumpfunAlphaCore.js";
import {
  buildLearnedUtilityProfile,
  computeLearnedUtilityFitScore,
  computeUtilityScore,
  inferProjectType,
  utilityKeywords,
} from "./pumpfunUtilityScoring.js";

/**
 * @param {ReturnType<import("./pumpfunUtilityScoring.js").computeUtilityScore> extends number ? never : object} token
 * @param {number} nowMs
 */
function historyEntryFromToken(token, nowMs, utilityScore) {
  return {
    mint: token.mint,
    symbol: token.symbol,
    name: token.name,
    projectType: inferProjectType(token),
    utilityScore,
    marketCapUsd: token.marketCapUsd,
    complete: token.complete,
    website: token.website ?? null,
    twitter: token.twitter ?? null,
    keywords: utilityKeywords(token),
    flaggedAtMs: nowMs,
  };
}

/**
 * @param {object[]} priorHistory
 * @param {object[]} newEntries
 */
function mergeUtilityHistory(priorHistory, newEntries) {
  /** @type {Map<string, object>} */
  const byMint = new Map();
  for (const row of priorHistory) {
    if (!row || typeof row.mint !== "string") continue;
    byMint.set(row.mint, row);
  }
  for (const row of newEntries) {
    if (!row || typeof row.mint !== "string") continue;
    const prev = byMint.get(row.mint);
    if (!prev || (row.utilityScore ?? 0) >= (prev.utilityScore ?? 0)) {
      byMint.set(row.mint, { ...prev, ...row });
    }
  }
  return [...byMint.values()]
    .sort((a, b) => (b.flaggedAtMs ?? 0) - (a.flaggedAtMs ?? 0))
    .slice(0, PUMPFUN_UTILITY_SCOUT_HISTORY_MAX);
}

/**
 * @param {string} responseText
 */
function parseUtilityScoutLlm(responseText) {
  const parsed = parseJsonObjectFromLlm(responseText);
  if (!parsed || typeof parsed !== "object") throw new Error("llm_bad_shape");
  const o = /** @type {Record<string, unknown>} */ (parsed);

  const scoutTitle = typeof o.scoutTitle === "string" ? o.scoutTitle.trim() : "";
  const scoutSummary = typeof o.scoutSummary === "string" ? o.scoutSummary.trim() : "";
  const patternsLearned = Array.isArray(o.patternsLearned)
    ? o.patternsLearned.map(String).filter(Boolean).slice(0, 10)
    : [];
  const riskCaveats = Array.isArray(o.riskCaveats)
    ? o.riskCaveats.map(String).filter(Boolean).slice(0, 8)
    : [];

  const picksRaw = Array.isArray(o.utilityPicks) ? o.utilityPicks : [];
  const utilityPicks = picksRaw
    .map((p) => {
      const r = p && typeof p === "object" ? p : null;
      const mint = r && typeof r.mint === "string" ? r.mint : "";
      const symbol = r && typeof r.symbol === "string" ? r.symbol : "";
      const utilityThesis = r && typeof r.utilityThesis === "string" ? r.utilityThesis : "";
      const projectType =
        r && typeof r.projectType === "string" ? r.projectType : "general-utility";
      const confidence =
        r && (r.confidence === "low" || r.confidence === "medium" || r.confidence === "high")
          ? r.confidence
          : "medium";
      return mint && symbol && utilityThesis
        ? { mint, symbol, projectType, utilityThesis, confidence }
        : null;
    })
    .filter(Boolean)
    .slice(0, 12);

  if (!scoutTitle || !scoutSummary) throw new Error("llm_missing_fields");
  return { scoutTitle, scoutSummary, patternsLearned, utilityPicks, riskCaveats };
}

/**
 * @param {string} savedAtIso
 */
export function isPumpfunUtilityScoutBriefStale(savedAtIso) {
  if (!savedAtIso) return true;
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t >= PUMPFUN_UTILITY_SCOUT_CRON_MS;
}

export async function getPumpfunUtilityScoutBriefForRead() {
  return loadAlphaXBatchSnapshot(PUMPFUN_UTILITY_SCOUT_DB_ID);
}

/**
 * @param {string} savedAtIso
 */
export function getPumpfunUtilityScoutNextRefreshAt(savedAtIso) {
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return new Date(Date.now() + PUMPFUN_UTILITY_SCOUT_CRON_MS).toISOString();
  return new Date(t + PUMPFUN_UTILITY_SCOUT_CRON_MS).toISOString();
}

/**
 * @param {import("./onchainPartnershipSignals.js").collectOnchainPartnershipSignals extends () => Promise<infer R> ? R : never} ecosystem
 */
function mapEcosystemPicks(ecosystem) {
  const utilityCategories = new Set([
    "solana8004",
    "solana-token-utility",
    "x402-api",
    "agent-registry",
    "ai-agent",
  ]);

  return (ecosystem?.candidates ?? [])
    .filter((c) => {
      const cat = String(c.category ?? "").toLowerCase();
      const util = String(c.utility ?? "").toLowerCase();
      if (utilityCategories.has(cat)) return true;
      return /\b(ai|agent|api|infra|data|tool|protocol|x402|utility|sdk|defi)\b/i.test(util);
    })
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      name: c.name,
      source: c.source,
      category: c.category,
      projectType: inferProjectType({
        name: c.name,
        symbol: c.name,
        description: c.utility,
        website: c.link,
        twitter: null,
        telegram: null,
      }),
      utility: c.utility,
      signals: c.signals ?? [],
      link: c.link ?? null,
      score: c.score ?? null,
    }));
}

/**
 * @param {object} [opts]
 */
export async function runPumpfunUtilityScoutAgent(opts = {}) {
  if (!opts.force) {
    const existing = await loadAlphaXBatchSnapshot(PUMPFUN_UTILITY_SCOUT_DB_ID);
    if (existing && !isPumpfunUtilityScoutBriefStale(existing.savedAt)) {
      return { data: existing.data, savedAt: existing.savedAt, skipped: true };
    }
  }

  const [{ candidatePool, pumpMetas, nowMs }, ecosystem] = await Promise.all([
    fetchPumpfunDiscoveryPool(),
    collectOnchainPartnershipSignals().catch(() => ({ candidates: [], sourceStats: {}, ecosystemNotes: [] })),
  ]);

  const priorSnap = await loadAlphaXBatchSnapshot(PUMPFUN_UTILITY_SCOUT_DB_ID);
  const priorPayload = priorSnap?.data && typeof priorSnap.data === "object" ? priorSnap.data : null;
  const priorHistory = Array.isArray(priorPayload?.pastUtilityHistory) ? priorPayload.pastUtilityHistory : [];

  const scoredPump = pumpMetas
    .map((t) => {
      const utilityScore = computeUtilityScore(t, nowMs);
      const learnedFitScore = computeLearnedUtilityFitScore(
        t,
        buildLearnedUtilityProfile(priorHistory),
        nowMs,
      );
      return {
        ...t,
        utilityScore,
        learnedFitScore,
        projectType: inferProjectType(t),
        keywords: utilityKeywords(t),
      };
    })
    .filter((t) => t.utilityScore >= PUMPFUN_UTILITY_SCOUT_MIN_SCORE)
    .sort(
      (a, b) =>
        b.learnedFitScore - a.learnedFitScore ||
        b.utilityScore - a.utilityScore ||
        (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0),
    )
    .slice(0, PUMPFUN_UTILITY_SCOUT_CANDIDATE_TOP_N);

  const validatedEntries = scoredPump
    .filter((t) => t.utilityScore >= 55)
    .slice(0, 8)
    .map((t) => historyEntryFromToken(t, nowMs, t.utilityScore));

  const pastUtilityHistory = mergeUtilityHistory(priorHistory, validatedEntries);
  const learnedProfile = buildLearnedUtilityProfile(pastUtilityHistory);
  learnedProfile.patternsLearned = Array.isArray(priorPayload?.learnedProfile?.patternsLearned)
    ? priorPayload.learnedProfile.patternsLearned
    : [];

  const ecosystemUtilityPicks = mapEcosystemPicks(ecosystem);

  let meta = {
    scoutTitle: scoredPump.length
      ? `Utility scan — ${scoredPump.length} pump.fun tech candidates`
      : "Utility scan — filtering for real product signals",
    scoutSummary:
      learnedProfile.sampleSize >= 2
        ? `Learned from ${learnedProfile.sampleSize} past utility flags. Prioritizing tokens with product/API/infra language over pure meme tickers.`
        : "Building utility memory — scores favor descriptions, links, and tech narratives.",
    patternsLearned: [],
    riskCaveats: [
      "Utility labels are heuristic — many pump.fun tokens still lack real products.",
      "Not investment advice; verify repos, demos, and on-chain usage yourself.",
    ],
  };

  let pumpfunUtilityPicks = scoredPump.slice(0, 8).map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    complete: t.complete,
    marketCapUsd: t.marketCapUsd,
    utilityScore: t.utilityScore,
    learnedFitScore: t.learnedFitScore,
    projectType: t.projectType,
    website: t.website,
    twitter: t.twitter,
    utilityThesis: `${t.projectType.replace(/-/g, " ")} signals in name/metadata — score ${t.utilityScore}`,
    confidence: t.utilityScore >= 68 ? "medium" : "low",
  }));

  if (scoredPump.length > 0) {
    const SYSTEM_PROMPT = `You are Syra's Pump.fun Utility Scout — a separate agent that ONLY surfaces tech projects and tokens with plausible real utility.

You receive pump.fun candidates scored by utility heuristics (description, website, twitter, tech keywords) plus optional ecosystem registry projects.

Your job:
1) Reject pure meme / hype-only tokens even if they scored high on momentum.
2) Select up to 8 utilityPicks from candidatePool mints ONLY when there is a concrete product/service/data narrative.
3) Extract patternsLearned from pastUtilityHistory + today's set (what utility themes repeat).
4) Write scoutTitle and scoutSummary for a dashboard.

projectType values: ai-agent | api-infra | defi | dev-tool | payments | consumer-app | general-utility

CRITICAL:
- Output ONLY one JSON object. No markdown.
- utilityPicks mints MUST come from candidatePool.
- Do not invent GitHub repos, partnerships, or revenue not supported by provided fields.
- Informational only — not investment advice.`;

    const userPayload = {
      nowMs,
      learnedProfile,
      pastUtilityHistory: pastUtilityHistory.slice(0, 15),
      ecosystemUtilityPicks: ecosystemUtilityPicks.slice(0, 6),
      candidatePool: scoredPump.map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        projectType: t.projectType,
        utilityScore: t.utilityScore,
        learnedFitScore: t.learnedFitScore,
        complete: t.complete,
        marketCapUsd: t.marketCapUsd,
        description: t.description,
        website: t.website,
        twitter: t.twitter,
        keywords: t.keywords,
      })),
    };

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${JSON.stringify(userPayload, null, 2)}

Return JSON:
{
  "scoutTitle": string,
  "scoutSummary": string,
  "patternsLearned": string[],
  "utilityPicks": Array<{ "mint": string, "symbol": string, "projectType": string, "utilityThesis": string, "confidence": "low"|"medium"|"high" }>,
  "riskCaveats": string[]
}`,
      },
    ];

    try {
      const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), {
        max_tokens: 1100,
        temperature: 0.22,
      });
      const parsed = parseUtilityScoutLlm(typeof result?.response === "string" ? result.response : "");
      meta = {
        scoutTitle: parsed.scoutTitle,
        scoutSummary: parsed.scoutSummary,
        patternsLearned: parsed.patternsLearned,
        riskCaveats: parsed.riskCaveats.length ? parsed.riskCaveats : meta.riskCaveats,
      };
      learnedProfile.patternsLearned = parsed.patternsLearned;

      const byMint = new Map(scoredPump.map((t) => [t.mint, t]));
      const llmPicks = parsed.utilityPicks
        .map((p) => {
          const live = byMint.get(p.mint);
          if (!live) return null;
          return {
            mint: p.mint,
            symbol: p.symbol,
            name: live.name,
            complete: live.complete,
            marketCapUsd: live.marketCapUsd,
            utilityScore: live.utilityScore,
            learnedFitScore: live.learnedFitScore,
            projectType: p.projectType,
            website: live.website,
            twitter: live.twitter,
            utilityThesis: p.utilityThesis,
            confidence: p.confidence,
          };
        })
        .filter(Boolean);

      if (llmPicks.length) pumpfunUtilityPicks = llmPicks;
    } catch {
      /* heuristic fallback */
    }
  }

  const data = {
    nowMs,
    candidatePool,
    learnedProfile,
    pastUtilityHistory: pastUtilityHistory.slice(0, 25),
    pumpfunUtilityPicks,
    ecosystemUtilityPicks,
    ecosystemNotes: ecosystem?.ecosystemNotes ?? [],
    meta,
  };

  const { savedAt } = await saveAlphaXBatchSnapshot(PUMPFUN_UTILITY_SCOUT_DB_ID, data);
  return { data, savedAt };
}
