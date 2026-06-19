/**
 * Live pump.fun scout x402 service — alpha, beta, predicted, utility segments.
 */

import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  alphaReason,
  betaReason,
  buildLearnedAlphaProfile,
  classifyAlphaBetaPlays,
  computeLearnedAlphaFitScore,
  computePumpScore,
  fetchPumpfunDiscoveryPool,
  getPeriodMs,
  getRelaxedLookbackMs,
  narrativeKeywords,
  toPublicToken,
} from "./pumpfunAlphaCore.js";
import {
  computeLearnedUtilityFitScore,
  computeUtilityScore,
  inferProjectType,
  utilityKeywords,
} from "./pumpfunUtilityScoring.js";
import { clampInt, parseBool, withScoutCache } from "./scoutCache.js";

const VALID_SEGMENTS = new Set(["alpha", "beta", "predicted", "utility"]);
const VALID_PERIODS = new Set(["today", "week", "month"]);
const CANDIDATE_CAP = 70;

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} reqLike
 */
export function parsePumpfunScoutParams(reqLike = {}) {
  const src =
    reqLike.method === "POST" && reqLike.body && typeof reqLike.body === "object"
      ? reqLike.body
      : reqLike.query ?? {};

  const segmentRaw = String(src.segment ?? "alpha").trim().toLowerCase();
  const periodRaw = String(src.period ?? "today").trim().toLowerCase();

  return {
    segment: VALID_SEGMENTS.has(segmentRaw) ? segmentRaw : "alpha",
    period: VALID_PERIODS.has(periodRaw) ? periodRaw : "today",
    limit: clampInt(src.limit, 1, 50, 10),
    minPumpScore: clampInt(src.minPumpScore, 0, 100, 48),
    llm: parseBool(src.llm),
  };
}

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
 * @param {ReturnType<typeof fetchPumpfunDiscoveryPool>} pool
 * @param {string} period
 */
function filterPoolByPeriod(pool, period) {
  const { pumpMetas, nowMs } = pool;
  const relaxedStartMs = nowMs - getRelaxedLookbackMs(period);
  const periodMs = getPeriodMs(period);
  const startMs = nowMs - periodMs;

  const filtered = pumpMetas.filter((t) => {
    const anchor = t.createdTimestampMs ?? t.anchorTsMs ?? t.lastTradeTimestampMs;
    if (anchor == null) return false;
    return anchor >= relaxedStartMs && anchor <= nowMs;
  });

  return {
    ...pool,
    pumpMetas: filtered.length > 0 ? filtered : pumpMetas,
    startMs,
    periodMs,
  };
}

function buildDeterministicAnalysis(alphaTokens, betaTokens) {
  const watchlist = betaTokens.slice(0, 8).map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    reason: betaReason(t),
  }));

  return {
    trendTitle:
      alphaTokens.length > 0
        ? `${alphaTokens[0].symbol} leading — beta plays scanning`
        : "Scanning for alpha runners",
    metaSummary:
      alphaTokens.length > 0
        ? `Flagged ${alphaTokens.length} alpha runner(s) with hot tape; surfacing ${betaTokens.length} aligned beta candidate(s).`
        : "Bonding and graduated pump.fun tokens — waiting for a clear alpha runner.",
    signals: alphaTokens.slice(0, 4).map((t) => alphaReason(t)),
    watchlist,
    riskCaveats: [
      "Alpha/beta pairing is heuristic — not investment advice.",
      "Beta plays can fail to follow alpha.",
    ],
  };
}

/**
 * @param {object} params
 */
async function maybeEnhanceWithLlm(params, baseMeta, candidateContext) {
  if (!params.llm) return baseMeta;

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are Syra's Pump.fun scout analyst. Output ONLY valid JSON with keys: scoutTitle, scoutSummary, patternsLearned (string[]), riskCaveats (string[]). Ground in provided data only.",
      },
      {
        role: "user",
        content: `Segment: ${params.segment}\nContext:\n${JSON.stringify(candidateContext, null, 2)}\nReturn JSON.`,
      },
    ];
    const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), {
      max_tokens: 600,
      temperature: 0.28,
    });
    const parsed = parseJsonObjectFromLlm(result?.response ?? "");
    if (!parsed || typeof parsed !== "object") return baseMeta;
    const o = /** @type {Record<string, unknown>} */ (parsed);
    return {
      scoutTitle: typeof o.scoutTitle === "string" ? o.scoutTitle : baseMeta.scoutTitle,
      scoutSummary: typeof o.scoutSummary === "string" ? o.scoutSummary : baseMeta.scoutSummary,
      patternsLearned: Array.isArray(o.patternsLearned)
        ? o.patternsLearned.map(String).filter(Boolean).slice(0, 8)
        : baseMeta.patternsLearned,
      riskCaveats: Array.isArray(o.riskCaveats)
        ? o.riskCaveats.map(String).filter(Boolean).slice(0, 8)
        : baseMeta.riskCaveats,
    };
  } catch {
    return baseMeta;
  }
}

async function fetchDiscoveryCached() {
  return withScoutCache("pumpfun:discovery", () =>
    fetchPumpfunDiscoveryPool({ candidateCap: CANDIDATE_CAP }),
  );
}

/**
 * @param {ReturnType<typeof parsePumpfunScoutParams>} params
 */
export async function getPumpfunScout(params) {
  const cacheKey = `pumpfun:scout:${params.segment}:${params.period}:${params.limit}:${params.minPumpScore}:${params.llm}`;

  return withScoutCache(cacheKey, async () => {
    const pool = filterPoolByPeriod(await fetchDiscoveryCached(), params.period);
    const { candidatePool, pumpMetas, nowMs, startMs } = pool;

    const { alphaTokens, betaTokens } = classifyAlphaBetaPlays(
      pumpMetas,
      nowMs,
      8,
      4,
    );

    for (const t of alphaTokens) t.playRole = "alpha";
    for (const t of betaTokens) t.playRole = "beta";

    const analysis = buildDeterministicAnalysis(alphaTokens, betaTokens);

    if (params.segment === "alpha") {
      const items = alphaTokens
        .filter((t) => (t.pumpScore ?? 0) >= params.minPumpScore)
        .slice(0, params.limit)
        .map((t) => ({
          ...toPublicToken(t),
          playRole: "alpha",
          reason: alphaReason(t),
        }));

      const meta = await maybeEnhanceWithLlm(params, {
        scoutTitle: analysis.trendTitle,
        scoutSummary: analysis.metaSummary,
        patternsLearned: analysis.signals.slice(0, 4),
        riskCaveats: analysis.riskCaveats,
      }, { alphaTokens: items, analysis });

      return {
        segment: "alpha",
        period: params.period,
        nowMs,
        startMs,
        candidatePool,
        alphaCount: alphaTokens.length,
        betaCount: betaTokens.length,
        items,
        analysis,
        meta,
        computedAt: new Date().toISOString(),
      };
    }

    if (params.segment === "beta") {
      const items = betaTokens.slice(0, params.limit).map((t) => ({
        ...toPublicToken(t),
        playRole: "beta",
        reason: betaReason(t),
      }));

      const meta = await maybeEnhanceWithLlm(params, {
        scoutTitle: `Beta plays — ${items.length} aligned candidates`,
        scoutSummary: analysis.metaSummary,
        patternsLearned: [],
        riskCaveats: analysis.riskCaveats,
      }, { betaTokens: items, analysis });

      return {
        segment: "beta",
        period: params.period,
        nowMs,
        startMs,
        candidatePool,
        alphaCount: alphaTokens.length,
        betaCount: betaTokens.length,
        items,
        analysis,
        meta,
        computedAt: new Date().toISOString(),
      };
    }

    if (params.segment === "predicted") {
      const pastAlphaHistory = alphaTokens.map((t) => historyEntryFromAlpha(t, nowMs));
      const learnedProfile = buildLearnedAlphaProfile(pastAlphaHistory);
      const currentAlphaMints = new Set(alphaTokens.map((t) => t.mint));

      const scoredCandidates = pumpMetas
        .filter((t) => !currentAlphaMints.has(t.mint))
        .map((t) => {
          const pumpScore = computePumpScore(t, nowMs);
          const learnedFitScore = computeLearnedAlphaFitScore(t, learnedProfile, nowMs);
          return { ...t, pumpScore, learnedFitScore };
        })
        .filter((t) => t.learnedFitScore >= Math.max(40, params.minPumpScore - 8))
        .sort(
          (a, b) =>
            b.learnedFitScore - a.learnedFitScore ||
            b.pumpScore - a.pumpScore ||
            (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0),
        )
        .slice(0, params.limit);

      const predictedAlphas = scoredCandidates.map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        complete: t.complete,
        marketCapUsd: t.marketCapUsd,
        pumpScore: t.pumpScore,
        learnedFitScore: t.learnedFitScore,
        thesis: `Learned fit ${t.learnedFitScore} — matches current alpha MC/narrative band`,
        confidence: t.learnedFitScore >= 72 ? "medium" : "low",
        matchedPatterns: learnedProfile.topKeywords.slice(0, 3).map((k) => k.keyword),
      }));

      const meta = await maybeEnhanceWithLlm(params, {
        scoutTitle:
          alphaTokens.length > 0
            ? `Predicted alphas — ${predictedAlphas.length} fit candidates`
            : "Predicted alphas — scanning",
        scoutSummary:
          learnedProfile.sampleSize >= 1
            ? `Scored ${predictedAlphas.length} candidates against ${learnedProfile.sampleSize} live alpha pattern(s).`
            : "No alpha runners yet — predictions use pump score heuristics only.",
        patternsLearned: learnedProfile.topKeywords.slice(0, 5).map((k) => k.keyword),
        riskCaveats: [
          "Predictions are pattern-based heuristics, not investment advice.",
          "Live scan has no cross-request memory — patterns reset each call.",
        ],
      }, { learnedProfile, predictedAlphas, currentAlphaRunners: alphaTokens });

      return {
        segment: "predicted",
        period: params.period,
        nowMs,
        candidatePool,
        learnedProfile,
        currentAlphaRunners: alphaTokens.map((t) => ({
          ...toPublicToken(t),
          reason: alphaReason(t),
        })),
        predictedAlphas,
        meta,
        computedAt: new Date().toISOString(),
      };
    }

    // utility
    const utilityPicks = pumpMetas
      .map((t) => {
        const utilityScore = computeUtilityScore(t, nowMs);
        const learnedFitScore = computeLearnedUtilityFitScore(t, { sampleSize: 0 }, nowMs);
        return { ...t, utilityScore, learnedFitScore, projectType: inferProjectType(t) };
      })
      .filter((t) => t.utilityScore >= 45)
      .sort(
        (a, b) =>
          b.learnedFitScore - a.learnedFitScore ||
          b.utilityScore - a.utilityScore ||
          (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0),
      )
      .slice(0, params.limit)
      .map((t) => ({
        mint: t.mint,
        symbol: t.symbol,
        name: t.name,
        complete: t.complete,
        marketCapUsd: t.marketCapUsd,
        utilityScore: t.utilityScore,
        learnedFitScore: t.learnedFitScore,
        projectType: t.projectType,
        keywords: utilityKeywords(t),
        website: t.website,
        twitter: t.twitter,
        utilityThesis: `Utility score ${t.utilityScore} — ${t.projectType} signals in name/description/socials`,
        confidence: t.utilityScore >= 70 ? "medium" : "low",
      }));

    const meta = await maybeEnhanceWithLlm(params, {
      scoutTitle: `Utility scout — ${utilityPicks.length} tech/utility candidates`,
      scoutSummary: `Scored pump.fun tokens for real utility signals (API, AI, infra, dev tools).`,
      patternsLearned: [],
      riskCaveats: [
        "Utility heuristics are regex-based — verify product claims manually.",
        "Memecoin launches can mimic utility keywords without real product.",
      ],
    }, { utilityPicks });

    return {
      segment: "utility",
      period: params.period,
      nowMs,
      candidatePool,
      utilityPicks,
      meta,
      computedAt: new Date().toISOString(),
    };
  });
}
