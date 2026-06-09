/**
 * Pump.fun Alpha Scout Agent — records past alphas, learns patterns, predicts new runners.
 */

import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import { loadAlphaXBatchSnapshot, saveAlphaXBatchSnapshot } from "./alphaXBatchPipeline.js";
import {
  PUMPFUN_ALPHA_SCOUT_DB_ID,
  PUMPFUN_ALPHA_SCOUT_HISTORY_MAX,
  PUMPFUN_ALPHA_SCOUT_MIN_LEARNED_SCORE,
  PUMPFUN_ALPHA_SCOUT_PREDICT_TOP_N,
  PUMPFUN_ALPHA_SCOUT_CRON_MS,
} from "../config/pumpfunAlphaScoutConfig.js";
import {
  alphaReason,
  buildLearnedAlphaProfile,
  classifyAlphaBetaPlays,
  computeLearnedAlphaFitScore,
  computePumpScore,
  fetchPumpfunDiscoveryPool,
  narrativeKeywords,
  toPublicToken,
} from "./pumpfunAlphaCore.js";

/**
 * @param {ReturnType<typeof classifyAlphaBetaPlays>["alphaTokens"][number]} token
 * @param {number} nowMs
 */
function historyEntryFromAlpha(token, nowMs) {
  return {
    mint: token.mint,
    symbol: token.symbol,
    name: token.name,
    complete: token.complete,
    marketCapUsd: token.marketCapUsd,
    athMarketCapUsd: token.athMarketCapUsd,
    pumpScore: token.pumpScore ?? computePumpScore(token, nowMs),
    keywords: [...narrativeKeywords(token.symbol, token.name)],
    flaggedAtMs: nowMs,
  };
}

/**
 * @param {object[]} priorHistory
 * @param {object[]} newEntries
 */
function mergeAlphaHistory(priorHistory, newEntries) {
  /** @type {Map<string, object>} */
  const byMint = new Map();
  for (const row of priorHistory) {
    if (!row || typeof row.mint !== "string") continue;
    byMint.set(row.mint, row);
  }
  for (const row of newEntries) {
    if (!row || typeof row.mint !== "string") continue;
    const prev = byMint.get(row.mint);
    if (!prev || (row.pumpScore ?? 0) >= (prev.pumpScore ?? 0)) {
      byMint.set(row.mint, { ...prev, ...row });
    }
  }
  return [...byMint.values()]
    .sort((a, b) => (b.flaggedAtMs ?? 0) - (a.flaggedAtMs ?? 0))
    .slice(0, PUMPFUN_ALPHA_SCOUT_HISTORY_MAX);
}

/**
 * @param {string} responseText
 */
function parseScoutLlm(responseText) {
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

  const predsRaw = Array.isArray(o.predictedAlphas) ? o.predictedAlphas : [];
  const predictedAlphas = predsRaw
    .map((p) => {
      const r = p && typeof p === "object" ? p : null;
      const mint = r && typeof r.mint === "string" ? r.mint : "";
      const symbol = r && typeof r.symbol === "string" ? r.symbol : "";
      const thesis = r && typeof r.thesis === "string" ? r.thesis : "";
      const confidence =
        r && (r.confidence === "low" || r.confidence === "medium" || r.confidence === "high")
          ? r.confidence
          : "medium";
      const matchedPatterns = Array.isArray(r?.matchedPatterns)
        ? r.matchedPatterns.map(String).slice(0, 5)
        : [];
      return mint && symbol && thesis ? { mint, symbol, thesis, confidence, matchedPatterns } : null;
    })
    .filter(Boolean)
    .slice(0, 10);

  if (!scoutTitle || !scoutSummary) throw new Error("llm_missing_fields");
  return { scoutTitle, scoutSummary, patternsLearned, predictedAlphas, riskCaveats };
}

/**
 * @param {string} savedAtIso
 */
export function isPumpfunAlphaScoutBriefStale(savedAtIso) {
  if (!savedAtIso) return true;
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t >= PUMPFUN_ALPHA_SCOUT_CRON_MS;
}

/**
 * @returns {Promise<{ data: object; savedAt: string } | null>}
 */
export async function getPumpfunAlphaScoutBriefForRead() {
  return loadAlphaXBatchSnapshot(PUMPFUN_ALPHA_SCOUT_DB_ID);
}

/**
 * @param {string} savedAtIso
 */
export function getPumpfunAlphaScoutNextRefreshAt(savedAtIso) {
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return new Date(Date.now() + PUMPFUN_ALPHA_SCOUT_CRON_MS).toISOString();
  return new Date(t + PUMPFUN_ALPHA_SCOUT_CRON_MS).toISOString();
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 */
export async function runPumpfunAlphaScoutAgent(opts = {}) {
  if (!opts.force) {
    const existing = await loadAlphaXBatchSnapshot(PUMPFUN_ALPHA_SCOUT_DB_ID);
    if (existing && !isPumpfunAlphaScoutBriefStale(existing.savedAt)) {
      return { data: existing.data, savedAt: existing.savedAt, skipped: true };
    }
  }

  const { candidatePool, pumpMetas, nowMs } = await fetchPumpfunDiscoveryPool();
  const { alphaTokens } = classifyAlphaBetaPlays(pumpMetas, nowMs, 8, 2);

  const priorSnap = await loadAlphaXBatchSnapshot(PUMPFUN_ALPHA_SCOUT_DB_ID);
  const priorPayload = priorSnap?.data && typeof priorSnap.data === "object" ? priorSnap.data : null;
  const priorHistory = Array.isArray(priorPayload?.pastAlphaHistory) ? priorPayload.pastAlphaHistory : [];

  const newHistoryEntries = alphaTokens.map((t) => historyEntryFromAlpha(t, nowMs));
  const pastAlphaHistory = mergeAlphaHistory(priorHistory, newHistoryEntries);
  const learnedProfile = buildLearnedAlphaProfile(pastAlphaHistory);
  learnedProfile.patternsLearned = Array.isArray(priorPayload?.learnedProfile?.patternsLearned)
    ? priorPayload.learnedProfile.patternsLearned
    : [];

  const currentAlphaMints = new Set(alphaTokens.map((t) => t.mint));
  const scoredCandidates = pumpMetas
    .filter((t) => !currentAlphaMints.has(t.mint))
    .map((t) => {
      const pumpScore = computePumpScore(t, nowMs);
      const learnedFitScore = computeLearnedAlphaFitScore(t, learnedProfile, nowMs);
      return { ...t, pumpScore, learnedFitScore };
    })
    .filter((t) => t.learnedFitScore >= PUMPFUN_ALPHA_SCOUT_MIN_LEARNED_SCORE)
    .sort(
      (a, b) =>
        b.learnedFitScore - a.learnedFitScore ||
        b.pumpScore - a.pumpScore ||
        (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0),
    )
    .slice(0, PUMPFUN_ALPHA_SCOUT_PREDICT_TOP_N);

  const currentAlphaRunners = alphaTokens.map((t) => ({
    ...toPublicToken({ ...t, playRole: "alpha" }),
    reason: alphaReason(t),
  }));

  let meta = {
    scoutTitle:
      alphaTokens.length > 0
        ? `Scout: ${alphaTokens[0].symbol} on tape — ${pastAlphaHistory.length} past alphas in memory`
        : "Scout scanning — building alpha memory",
    scoutSummary:
      learnedProfile.sampleSize >= 3
        ? `Learned from ${learnedProfile.sampleSize} past alpha flags. Surfacing ${scoredCandidates.length} new fit candidates.`
        : `Collecting alpha history (${pastAlphaHistory.length} records). Predictions improve as more past alphas are stored.`,
    patternsLearned: [],
    riskCaveats: [
      "Scout predictions are pattern-based heuristics, not investment advice.",
      "Past alpha patterns may not repeat on pump.fun.",
    ],
  };

  let predictedAlphas = scoredCandidates.slice(0, 6).map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    name: t.name,
    complete: t.complete,
    marketCapUsd: t.marketCapUsd,
    pumpScore: t.pumpScore,
    learnedFitScore: t.learnedFitScore,
    thesis: `Learned fit ${t.learnedFitScore} — matches past alpha MC/narrative band`,
    confidence: t.learnedFitScore >= 72 ? "medium" : "low",
    matchedPatterns: learnedProfile.topKeywords.slice(0, 3).map((k) => k.keyword),
  }));

  if (scoredCandidates.length > 0 && learnedProfile.sampleSize >= 3) {
    const SYSTEM_PROMPT = `You are Syra's Pump.fun Alpha Scout — a separate agent that learns from PAST alpha runners to find NEW alpha candidates.

You receive:
- learnedProfile: statistical patterns from historical alpha flags (keywords, MC band, graduation rate)
- pastAlphaHistory: recent tokens that were flagged as alpha when they were running hard
- currentAlphaRunners: alphas pumping right now (for context, do not repeat as predictions)
- candidatePool: new tokens scored by learnedFitScore (higher = better match to past alpha patterns)

Your job:
1) Extract 3-8 concrete patternsLearned from past alphas + current tape (narrative themes, MC bands, timing — grounded in data only).
2) Pick up to 6 predictedAlphas from candidatePool mints ONLY. Explain thesis referencing which past-alpha patterns they match.
3) Write scoutTitle and scoutSummary for the dashboard.

CRITICAL:
- Output ONLY one JSON object. No markdown.
- predictedAlphas mints MUST come from candidatePool.
- Do not invent news or social events.
- Informational only — not investment advice.`;

    const userPayload = {
      nowMs,
      learnedProfile,
      pastAlphaHistory: pastAlphaHistory.slice(0, 20).map((h) => ({
        mint: h.mint,
        symbol: h.symbol,
        pumpScore: h.pumpScore,
        marketCapUsd: h.marketCapUsd,
        complete: h.complete,
        keywords: h.keywords,
        flaggedAtMs: h.flaggedAtMs,
      })),
      currentAlphaRunners: currentAlphaRunners.map((a) => ({
        mint: a.mint,
        symbol: a.symbol,
        pumpScore: a.pumpScore,
        marketCapUsd: a.marketCapUsd,
      })),
      candidatePool: scoredCandidates.map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        complete: t.complete,
        marketCapUsd: t.marketCapUsd,
        pumpScore: t.pumpScore,
        learnedFitScore: t.learnedFitScore,
        keywords: [...narrativeKeywords(t.symbol, t.name)],
        lastTradeTimestampMs: t.lastTradeTimestampMs,
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
  "predictedAlphas": Array<{ "mint": string, "symbol": string, "thesis": string, "confidence": "low"|"medium"|"high", "matchedPatterns": string[] }>,
  "riskCaveats": string[]
}`,
      },
    ];

    const llmOpts = { max_tokens: 1000, temperature: 0.25 };
    let lastResponse = "";

    try {
      const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), llmOpts);
      lastResponse = typeof result?.response === "string" ? result.response : "";
      const parsed = parseScoutLlm(lastResponse);
      meta = {
        scoutTitle: parsed.scoutTitle,
        scoutSummary: parsed.scoutSummary,
        patternsLearned: parsed.patternsLearned,
        riskCaveats: parsed.riskCaveats.length
          ? parsed.riskCaveats
          : meta.riskCaveats,
      };
      learnedProfile.patternsLearned = parsed.patternsLearned;

      const byMint = new Map(scoredCandidates.map((t) => [t.mint, t]));
      predictedAlphas = parsed.predictedAlphas
        .map((p) => {
          const live = byMint.get(p.mint);
          if (!live) return null;
          return {
            mint: p.mint,
            symbol: p.symbol,
            name: live.name,
            complete: live.complete,
            marketCapUsd: live.marketCapUsd,
            pumpScore: live.pumpScore,
            learnedFitScore: live.learnedFitScore,
            thesis: p.thesis,
            confidence: p.confidence,
            matchedPatterns: p.matchedPatterns,
          };
        })
        .filter(Boolean);
    } catch {
      /* keep heuristic fallback */
    }
  }

  const data = {
    nowMs,
    candidatePool,
    learnedProfile,
    pastAlphaHistory: pastAlphaHistory.slice(0, 30),
    currentAlphaRunners,
    predictedAlphas,
    meta,
  };

  const { savedAt } = await saveAlphaXBatchSnapshot(PUMPFUN_ALPHA_SCOUT_DB_ID, data);
  return { data, savedAt };
}
