/**
 * Pump.fun Alpha / Beta Play Radar — compute, persist, and serve from MongoDB.
 */

import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import { loadAlphaXBatchSnapshot, saveAlphaXBatchSnapshot } from "./alphaXBatchPipeline.js";
import {
  PUMPFUN_ALPHA_TREND_CRON_MS,
  PUMPFUN_ALPHA_TREND_MODES,
  PUMPFUN_ALPHA_TREND_PERIODS,
  pumpfunAlphaTrendDbId,
} from "../config/pumpfunAlphaTrendConfig.js";
import {
  alphaReason,
  betaReason,
  classifyAlphaBetaPlays,
  fetchPumpfunDiscoveryPool,
  getPeriodMs,
  getRelaxedLookbackMs,
  toPublicToken,
} from "./pumpfunAlphaCore.js";

/**
 * @param {string} savedAtIso
 */
export function isPumpfunAlphaTrendStale(savedAtIso) {
  if (!savedAtIso) return true;
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t >= PUMPFUN_ALPHA_TREND_CRON_MS;
}

/**
 * @param {string} savedAtIso
 */
export function getPumpfunAlphaTrendNextRefreshAt(savedAtIso) {
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return new Date(Date.now() + PUMPFUN_ALPHA_TREND_CRON_MS).toISOString();
  return new Date(t + PUMPFUN_ALPHA_TREND_CRON_MS).toISOString();
}

/**
 * @param {string} period
 * @param {string} mode
 * @returns {Promise<{ data: object; savedAt: string } | null>}
 */
export async function getPumpfunAlphaTrendForRead(period, mode = "trend") {
  return loadAlphaXBatchSnapshot(pumpfunAlphaTrendDbId(period, mode));
}

/**
 * @param {string} period
 * @param {string} mode
 * @param {{ candidatePool: number; pumpMetas: object[]; nowMs: number }} pool
 */
async function buildExperimentPayload(period, pool) {
  const { candidatePool, pumpMetas, nowMs } = pool;
  const periodMs = getPeriodMs(period);
  const startMs = nowMs - periodMs;
  const relaxedStartMs = nowMs - getRelaxedLookbackMs(period);

  const experimentPool = pumpMetas.filter((t) => {
    if (!t.createdTimestampMs) return false;
    return t.createdTimestampMs >= relaxedStartMs && t.createdTimestampMs <= nowMs;
  });

  const { alphaTokens, betaTokens } = classifyAlphaBetaPlays(experimentPool, nowMs, 6, 4);

  for (const t of alphaTokens) t.playRole = "alpha";
  for (const t of betaTokens) t.playRole = "beta";

  const experimentTokens = [...alphaTokens, ...betaTokens]
    .sort((a, b) => {
      if (a.playRole === "alpha" && b.playRole !== "alpha") return -1;
      if (b.playRole === "alpha" && a.playRole !== "alpha") return 1;
      if (a.playRole === "alpha" && b.playRole === "alpha") return (b.pumpScore ?? 0) - (a.pumpScore ?? 0);
      return (b.alignmentScore ?? 0) - (a.alignmentScore ?? 0);
    })
    .slice(0, 80)
    .map(toPublicToken);

  const watchlist = betaTokens.slice(0, 8).map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    reason: betaReason(t),
  }));

  return {
    period,
    startMs,
    nowMs,
    candidatePool,
    matchedCount: experimentTokens.length,
    alphaCount: alphaTokens.length,
    betaCount: betaTokens.length,
    tokens: experimentTokens,
    alphaTokens: alphaTokens.map((t) => ({ ...toPublicToken(t), playRole: "alpha", reason: alphaReason(t) })),
    betaTokens: betaTokens.map((t) => ({ ...toPublicToken(t), playRole: "beta", reason: betaReason(t) })),
    analysis: {
      trendTitle: alphaTokens.length ? `${alphaTokens[0].symbol} leading — beta plays scanning` : "Scanning for alpha runners",
      metaSummary:
        alphaTokens.length > 0
          ? `Flagged ${alphaTokens.length} alpha runner(s) with hot tape; surfacing ${betaTokens.length} aligned beta candidate(s) that may follow the same meta.`
          : "Bonding and graduated pump.fun tokens for paper-trading — waiting for a clear alpha runner.",
      signals: alphaTokens.slice(0, 4).map((t) => alphaReason(t)),
      watchlist,
      riskCaveats: ["Alpha/beta pairing is heuristic — not investment advice.", "Beta plays can fail to follow alpha."],
    },
  };
}

/**
 * @param {string} period
 * @param {{ candidatePool: number; pumpMetas: object[]; nowMs: number }} pool
 */
async function buildTrendPayload(period, pool) {
  const { candidatePool, pumpMetas, nowMs } = pool;
  const periodMs = getPeriodMs(period);
  const startMs = nowMs - periodMs;
  const relaxedStartMs = nowMs - getRelaxedLookbackMs(period);

  const activePool = pumpMetas.filter((t) => {
    const lastTrade = t.lastTradeTimestampMs;
    const created = t.createdTimestampMs ?? t.anchorTsMs;
    const inPeriod =
      (created != null && created >= startMs && created <= nowMs) ||
      (lastTrade != null && lastTrade >= startMs && lastTrade <= nowMs);
    const relaxedInPeriod =
      (created != null && created >= relaxedStartMs && created <= nowMs) ||
      (lastTrade != null && lastTrade >= relaxedStartMs && lastTrade <= nowMs);
    return inPeriod || relaxedInPeriod;
  });

  const usedRelaxedWindow = !activePool.some((t) => {
    const created = t.createdTimestampMs ?? t.anchorTsMs;
    const lastTrade = t.lastTradeTimestampMs;
    return (
      (created != null && created >= startMs && created <= nowMs) ||
      (lastTrade != null && lastTrade >= startMs && lastTrade <= nowMs)
    );
  });

  const { alphaTokens, betaTokens } = classifyAlphaBetaPlays(activePool.length ? activePool : pumpMetas, nowMs, 5, 3);

  for (const t of alphaTokens) t.playRole = "alpha";
  for (const t of betaTokens) t.playRole = "beta";

  const tokens = [...alphaTokens, ...betaTokens].slice(0, 16).map(toPublicToken);

  if (tokens.length === 0) {
    return {
      period,
      startMs,
      nowMs,
      candidatePool,
      matchedCount: 0,
      alphaCount: 0,
      betaCount: 0,
      tokens: [],
      alphaTokens: [],
      betaTokens: [],
      analysis: {
        trendTitle: "No alpha runners detected in current sample",
        metaSummary:
          "Syra couldn't find tokens with hot enough tape in this window. The radar refreshes about every hour.",
        signals: [],
        watchlist: [],
        riskCaveats: [
          "Provider feeds may be incomplete; token discovery can miss some runners.",
          "This is informational analysis, not investment advice.",
        ],
      },
    };
  }

  const tokenBriefForLlm = tokens.map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    playRole: t.playRole,
    pumpScore: t.pumpScore,
    alignmentScore: t.alignmentScore,
    alignedToAlphaMint: t.alignedToAlphaMint,
    marketCapUsd: t.marketCapUsd,
    athMarketCapUsd: t.athMarketCapUsd,
    athMarketCapTimestampMs: t.athMarketCapTimestampMs,
    updatedAtMs: t.updatedAtMs,
    lastTradeTimestampMs: t.lastTradeTimestampMs,
  }));

  const SYSTEM_PROMPT = `You are Syra's Pump.fun alpha/beta play analyst.
You will receive structured JSON about pump.fun coins flagged as ALPHA (running hard right now) and BETA (aligned potential followers).

Your job:
- Explain the meta/narrative linking alpha runners to their beta candidates.
- Describe why beta tokens might pump like alpha (narrative overlap, timing, MC gap — grounded in input only).
- Produce a watchlist focused on beta plays with concrete, data-tied reasons.

CRITICAL:
- Output ONLY a single JSON object (no markdown, no extra keys).
- Be cautious: these are informational signals, not investment advice.
- Do not invent token-specific data not present in input.`;

  /** @type {Array<{role:'system'|'user',content:string}>} */
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Time window: ${period} (startMs=${startMs}, nowMs=${nowMs}).
Window mode: ${usedRelaxedWindow ? "relaxed fallback window used because strict match was empty" : "strict"}.

Input tokens (ALPHA = running hard; BETA = aligned follower candidates):
${JSON.stringify({ period, alphaCount: alphaTokens.length, betaCount: betaTokens.length, tokens: tokenBriefForLlm }, null, 2)}

Return JSON:
{
  "trendTitle": string,
  "metaSummary": string,
  "signals": string[],
  "watchlist": Array<{ "mint": string, "symbol": string, "reason": string }>,
  "riskCaveats": string[]
}`,
    },
  ];

  /**
   * @param {string} responseText
   */
  const parseAndValidate = (responseText) => {
    /** @type {unknown} */
    const parsed = parseJsonObjectFromLlm(responseText);
    if (!parsed || typeof parsed !== "object") throw new Error("llm_bad_shape");
    const o = /** @type {Record<string, unknown>} */ (parsed);

    const trendTitle = typeof o.trendTitle === "string" ? o.trendTitle.trim() : "";
    const metaSummary = typeof o.metaSummary === "string" ? o.metaSummary.trim() : "";
    const signals = Array.isArray(o.signals) ? o.signals.map(String).slice(0, 8) : [];
    const riskCaveats = Array.isArray(o.riskCaveats) ? o.riskCaveats.map(String).slice(0, 8) : [];
    const watchlistRaw = Array.isArray(o.watchlist) ? o.watchlist : [];
    const watchlist = watchlistRaw
      .map((w) => {
        const r = w && typeof w === "object" ? w : null;
        const mint = r && typeof r.mint === "string" ? r.mint : "";
        const symbol = r && typeof r.symbol === "string" ? r.symbol : "";
        const reason = r && typeof r.reason === "string" ? r.reason : "";
        return mint && symbol && reason ? { mint, symbol, reason } : null;
      })
      .filter(Boolean)
      .slice(0, 8);

    if (!trendTitle || !metaSummary || !signals.length) throw new Error("llm_missing_fields");
    return { trendTitle, metaSummary, signals, watchlist, riskCaveats };
  };

  /** @type {ReturnType<typeof parseAndValidate>} */
  let analysis;
  let lastResponse = "";
  const llmOpts = { max_tokens: 900, temperature: 0.28 };

  try {
    const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), llmOpts);
    lastResponse = typeof result?.response === "string" ? result.response : "";
    analysis = parseAndValidate(lastResponse);
  } catch {
    const retryMessages = [
      ...messages,
      {
        role: "assistant",
        content: lastResponse ? lastResponse.slice(0, 8000) : "",
      },
      {
        role: "user",
        content: `Your last response did not parse or did not match the schema.
Return ONLY valid JSON with exact keys: trendTitle (string), metaSummary (string), signals (string[] length>=1), watchlist (array of objects with mint/symbol/reason), riskCaveats (string[]). No markdown.`,
      },
    ];
    const result2 = await callOpenRouter(withLlmIdentitySystemNote(retryMessages, null), llmOpts);
    lastResponse = typeof result2?.response === "string" ? result2.response : "";
    analysis = parseAndValidate(lastResponse);
  }

  const fallbackWatchlist = betaTokens.slice(0, 8).map((t) => ({
    mint: t.mint,
    symbol: t.symbol,
    reason: betaReason(t),
  }));
  if (!analysis.watchlist.length && fallbackWatchlist.length) {
    analysis.watchlist = fallbackWatchlist;
  }

  return {
    period,
    startMs,
    nowMs,
    candidatePool,
    usedRelaxedWindow,
    matchedCount: tokens.length,
    alphaCount: alphaTokens.length,
    betaCount: betaTokens.length,
    tokens,
    alphaTokens: alphaTokens.map((t) => ({ ...toPublicToken(t), playRole: "alpha", reason: alphaReason(t) })),
    betaTokens: betaTokens.map((t) => ({ ...toPublicToken(t), playRole: "beta", reason: betaReason(t) })),
    analysis,
  };
}

/**
 * @param {string} period
 * @param {string} mode
 * @param {{ candidatePool: number; pumpMetas: object[]; nowMs: number }} pool
 */
async function buildPayloadForPeriodMode(period, mode, pool) {
  if (mode === "experiment") {
    return buildExperimentPayload(period, pool);
  }
  return buildTrendPayload(period, pool);
}

/**
 * @param {string} period
 * @param {string} mode
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 * @param {{ candidatePool: number; pumpMetas: object[]; nowMs: number }} [opts.pool]
 */
export async function runPumpfunAlphaTrendPipeline(period, mode = "trend", opts = {}) {
  const dbId = pumpfunAlphaTrendDbId(period, mode);

  if (!opts.force) {
    const existing = await loadAlphaXBatchSnapshot(dbId);
    if (existing && !isPumpfunAlphaTrendStale(existing.savedAt)) {
      return { data: existing.data, savedAt: existing.savedAt, skipped: true };
    }
  }

  const pool = opts.pool ?? (await fetchPumpfunDiscoveryPool());
  const data = await buildPayloadForPeriodMode(period, mode, pool);
  const { savedAt } = await saveAlphaXBatchSnapshot(dbId, data);
  return { data, savedAt };
}

/**
 * Refresh all period/mode snapshots (single discovery pool fetch per tick).
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 */
export async function runPumpfunAlphaTrendBatch(opts = {}) {
  if (!opts.force) {
    let anyStale = false;
    for (const period of PUMPFUN_ALPHA_TREND_PERIODS) {
      for (const mode of PUMPFUN_ALPHA_TREND_MODES) {
        const existing = await loadAlphaXBatchSnapshot(pumpfunAlphaTrendDbId(period, mode));
        if (!existing || isPumpfunAlphaTrendStale(existing.savedAt)) {
          anyStale = true;
          break;
        }
      }
      if (anyStale) break;
    }
    if (!anyStale) {
      return { success: true, skipped: true, results: [] };
    }
  }

  const pool = await fetchPumpfunDiscoveryPool();
  /** @type {Array<{ period: string; mode: string; savedAt: string; skipped?: boolean }>} */
  const results = [];

  for (const period of PUMPFUN_ALPHA_TREND_PERIODS) {
    for (const mode of PUMPFUN_ALPHA_TREND_MODES) {
      const out = await runPumpfunAlphaTrendPipeline(period, mode, { force: true, pool });
      results.push({ period, mode, savedAt: out.savedAt, skipped: out.skipped === true });
    }
  }

  return { success: true, results };
}
