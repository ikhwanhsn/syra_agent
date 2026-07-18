/**
 * Scalper signal intelligence — confluence, trend/RSI filters, volatility-aware levels,
 * regime gate, breakeven / profit-lock exits.
 */
import { estimateRoundTripCostPct, SCALPER_DEFAULTS } from "../../config/scalperConfig.js";

/**
 * @param {number[]} closes
 * @param {number} [period]
 * @returns {number | null} RSI 0–100
 */
export function computeRsi(closes, period = 14) {
  if (!Array.isArray(closes) || closes.length < period + 1) return null;
  const slice = closes.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const delta = slice[i] - slice[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * @param {number[][]} bars - [ts, o, h, l, c, v]
 * @param {number} [period]
 * @returns {number | null} ATR as % of last close
 */
export function computeAtrPct(bars, period = 6) {
  if (!Array.isArray(bars) || bars.length < period + 1) return null;
  const recent = bars.slice(-(period + 1));
  const trs = [];
  for (let i = 1; i < recent.length; i++) {
    const [, , hi, lo, ,] = recent[i];
    const prevClose = recent[i - 1][4];
    const tr = Math.max(hi - lo, Math.abs(hi - prevClose), Math.abs(lo - prevClose));
    if (prevClose > 0) trs.push((tr / prevClose) * 100);
  }
  if (trs.length === 0) return null;
  return trs.reduce((a, b) => a + b, 0) / trs.length;
}

/**
 * @param {number[]} closes
 * @param {number} fast
 * @param {number} slow
 * @returns {'bullish' | 'bearish' | 'neutral'}
 */
export function computeTrendBias(closes, fast = 5, slow = 12) {
  if (!Array.isArray(closes) || closes.length < slow) return "neutral";
  const ema = (data, span) => {
    const k = 2 / (span + 1);
    let val = data[0];
    for (let i = 1; i < data.length; i++) val = data[i] * k + val * (1 - k);
    return val;
  };
  const fastEma = ema(closes.slice(-slow), fast);
  const slowEma = ema(closes.slice(-slow), slow);
  const last = closes[closes.length - 1];
  if (fastEma > slowEma && last >= fastEma) return "bullish";
  if (fastEma < slowEma && last <= fastEma) return "bearish";
  return "neutral";
}

/**
 * Market regime for entry gating — avoid clear downtrends and hard chop.
 * Mild neutral-with-positive-momentum is allowed for active-demo cadence.
 * @param {number[]} closes
 * @param {number | null} atrPct
 * @returns {{ regime: 'trend_up' | 'chop' | 'trend_down'; allowLong: boolean; reason: string | null }}
 */
export function assessMarketRegime(closes, atrPct = null) {
  if (!Array.isArray(closes) || closes.length < 12) {
    return { regime: "chop", allowLong: false, reason: "insufficient_bars" };
  }

  const trend = computeTrendBias(closes);
  const rsi = computeRsi(closes);
  const last = closes[closes.length - 1];
  const lookback = closes.slice(-8);
  const high = Math.max(...lookback);
  const low = Math.min(...lookback);
  const rangePct = last > 0 ? ((high - low) / last) * 100 : 0;
  const vol = Number.isFinite(atrPct) ? atrPct : rangePct;

  if (trend === "bearish" || (rsi != null && rsi < 38)) {
    return { regime: "trend_down", allowLong: false, reason: "bearish_regime" };
  }

  // Whipsaw: wide range relative to net move
  const netPct = last > 0 ? ((last - lookback[0]) / lookback[0]) * 100 : 0;
  if (vol > SCALPER_DEFAULTS.momentumMaxVolatilityPct && Math.abs(netPct) < vol * 0.35) {
    return { regime: "chop", allowLong: false, reason: "choppy_range" };
  }

  if (trend === "bullish" || (rsi != null && rsi >= 48 && rsi <= 68 && netPct > 0.1)) {
    return { regime: "trend_up", allowLong: true, reason: null };
  }

  // Mild neutral with positive drift — allow longs for active demo
  if (
    trend === "neutral" &&
    netPct > 0.03 &&
    (rsi == null || (rsi >= 45 && rsi <= 68))
  ) {
    return { regime: "trend_up", allowLong: true, reason: "mild_neutral_up" };
  }

  // Soft allow: mid-range RSI, not clearly down — momentum scorer still filters flat noise
  if (
    trend !== "bearish" &&
    rsi != null &&
    rsi >= 45 &&
    rsi <= 65 &&
    netPct > -0.05
  ) {
    return { regime: "trend_up", allowLong: true, reason: "soft_mid_rsi" };
  }

  if (trend === "neutral" && (rsi == null || rsi < 45 || rsi > 68) && Math.abs(netPct) < 0.1) {
    return { regime: "chop", allowLong: false, reason: "no_directional_edge" };
  }

  return { regime: "chop", allowLong: false, reason: "neutral_chop" };
}

/**
 * @param {object} params
 * @param {number} params.momentumPct
 * @param {number | null} params.rsi
 * @param {'bullish' | 'bearish' | 'neutral'} params.trend
 * @param {number} params.volatilityPct
 * @returns {{ quality: number; reject: boolean; reason: string | null }}
 */
export function scoreMomentumQuality({ momentumPct, rsi, trend, volatilityPct }) {
  let quality = 0.45;

  if (momentumPct < SCALPER_DEFAULTS.momentumMinPct) {
    return { quality: 0, reject: true, reason: "momentum_too_weak" };
  }

  // Reject chasing extended / exhausted moves
  if (momentumPct > 0.95 && rsi != null && rsi > 65) {
    return { quality: 0, reject: true, reason: "overbought_chase" };
  }
  if (momentumPct > 1.4) {
    return { quality: 0, reject: true, reason: "extended_move" };
  }

  // Prefer fresh impulse in healthy RSI band
  if (rsi != null) {
    if (rsi > 70) return { quality: 0, reject: true, reason: "rsi_overbought" };
    if (rsi > 64) quality -= 0.18;
    else if (rsi >= 48 && rsi <= 62) quality += 0.22;
    else if (rsi >= 42 && rsi < 48) quality += 0.08;
    else if (rsi < 35) quality -= 0.12;
  }

  if (trend === "bullish") quality += 0.24;
  else if (trend === "bearish") {
    return { quality: 0, reject: true, reason: "bearish_trend" };
  } else {
    // Neutral trend still qualifies at reduced quality (active-demo cadence)
    quality -= 0.02;
  }

  if (volatilityPct > SCALPER_DEFAULTS.momentumMaxVolatilityPct) {
    return { quality: 0, reject: true, reason: "volatility_too_high" };
  }
  if (volatilityPct < 0.25) quality -= 0.1;
  else if (volatilityPct >= 0.35 && volatilityPct <= 1.0) quality += 0.1;

  // Momentum sweet spot: strong enough but not exhausted
  if (momentumPct >= 0.35 && momentumPct <= 0.9) quality += 0.12;
  else if (momentumPct >= 0.08 && momentumPct < 0.35) quality += 0.06;
  else if (momentumPct > 0.9) quality -= 0.05;

  quality = Math.max(0, Math.min(1, quality));
  return { quality, reject: quality < 0.42, reason: quality < 0.42 ? "low_momentum_quality" : null };
}

/**
 * Volatility-aware TP/SL with enforced minimum R:R after fill cost.
 * @param {object} cfg - effective scalper config
 * @param {number} volatilityPct - ATR or realized vol %
 * @param {number} confluenceCount
 * @returns {{ takeProfitPct: number; stopLossPct: number; maxHoldMinutes: number }}
 */
export function computeDynamicTradeLevels(cfg, volatilityPct, confluenceCount = 1) {
  const vol = Number.isFinite(volatilityPct) && volatilityPct > 0 ? volatilityPct : 0.7;
  const roundTrip = estimateRoundTripCostPct(cfg.quoteSlippageBps ?? SCALPER_DEFAULTS.quoteSlippageBps);
  const edgeBuf = cfg.minEdgeBufferPct ?? SCALPER_DEFAULTS.minEdgeBufferPct;

  // TP must clear fill cost + buffer; scale modestly with vol
  let takeProfitPct = Math.max(
    cfg.takeProfitPct,
    roundTrip + edgeBuf,
    vol * 1.15 + roundTrip * 0.5,
  );

  // SL sits inside noise but not so tight we get wicked out every tick
  let stopLossPct = Math.max(0.35, Math.min(cfg.stopLossPct, vol * 0.7 + 0.12));

  // Confluence: slightly wider TP, tighter SL (better R:R)
  if (confluenceCount >= 2) {
    takeProfitPct *= 1.06;
    stopLossPct *= 0.9;
  }
  if (confluenceCount >= 3) {
    takeProfitPct *= 1.04;
  }

  // Enforce min ~2.4:1 reward:risk after costs
  const minRr = 2.4;
  if (takeProfitPct / stopLossPct < minRr) {
    takeProfitPct = stopLossPct * minRr;
  }

  // Cap TP so vol scaling cannot push targets into unreachable territory
  takeProfitPct = Math.min(1.6, takeProfitPct);
  stopLossPct = Math.min(takeProfitPct / minRr, stopLossPct);
  stopLossPct = Math.max(0.35, Math.min(0.55, stopLossPct));

  let maxHoldMinutes = cfg.maxHoldMinutes;
  if (vol > 1.2) maxHoldMinutes = Math.max(10, maxHoldMinutes - 4);
  if (confluenceCount >= 2) maxHoldMinutes = Math.min(20, maxHoldMinutes + 3);
  else maxHoldMinutes = Math.min(maxHoldMinutes, 15);

  return {
    takeProfitPct: Math.round(takeProfitPct * 100) / 100,
    stopLossPct: Math.round(stopLossPct * 100) / 100,
    maxHoldMinutes: Math.floor(maxHoldMinutes),
  };
}

/**
 * @param {number} fillPriceUsd
 * @param {number} takeProfitPct
 * @param {number} stopLossPct
 * @param {number} [slippageBps]
 */
export function priceLevelsFromPct(fillPriceUsd, takeProfitPct, stopLossPct, slippageBps) {
  const slipPct = (Number(slippageBps) || SCALPER_DEFAULTS.quoteSlippageBps) / 100;
  const tp = fillPriceUsd * (1 + takeProfitPct / 100);
  const sl = fillPriceUsd * (1 - stopLossPct / 100);
  // TP trigger on mid must clear exit slippage
  const tpTrigger = tp * (1 + slipPct / 100);
  return { takeProfitPriceUsd: tpTrigger, stopLossPriceUsd: sl, targetTpUsd: tp };
}

/** @typedef {import('./scalperOpportunityScanner.js').ScalperOpportunity} ScalperOpportunity */

const CONFLUENCE_BOOST_PER_SOURCE = 0.14;
const MOMENTUM_SOLO_MIN_SCORE = SCALPER_DEFAULTS.minSoloMomentumScore;
const GENERIC_SOLO_MIN_SCORE = SCALPER_DEFAULTS.minSoloScore;

/**
 * @typedef {Object} ScalperMergeDiagnostics
 * @property {number} rawCount
 * @property {Record<string, number>} perSource
 * @property {Array<{ symbol: string; source: string; score: number; reason: string }>} droppedReasons
 */

/**
 * Merge duplicate symbol opportunities; boost score when multiple independent sources agree.
 * Solo momentum/generic that clear floors survive; solo stocks stay confluence-only.
 * @param {ScalperOpportunity[]} opportunities
 * @returns {{ merged: ScalperOpportunity[]; diagnostics: ScalperMergeDiagnostics }}
 */
export function mergeOpportunitiesWithConfluence(opportunities) {
  /** @type {Map<string, ScalperOpportunity[]>} */
  const bySymbol = new Map();
  /** @type {Record<string, number>} */
  const perSource = {};
  /** @type {Array<{ symbol: string; source: string; score: number; reason: string }>} */
  const droppedReasons = [];

  const longOnly = Array.isArray(opportunities) ? opportunities : [];
  for (const opp of longOnly) {
    perSource[opp.source] = (perSource[opp.source] ?? 0) + 1;
    if (opp.side !== "long") {
      droppedReasons.push({
        symbol: opp.symbol,
        source: opp.source,
        score: opp.score,
        reason: "not_long",
      });
      continue;
    }
    const key = opp.symbol;
    const list = bySymbol.get(key) ?? [];
    list.push(opp);
    bySymbol.set(key, list);
  }

  /** @type {ScalperOpportunity[]} */
  const merged = [];

  for (const [, group] of bySymbol) {
    const sources = [...new Set(group.map((o) => o.source))];
    const confluenceCount = sources.length;
    const best = group.reduce((a, b) => (a.score >= b.score ? a : b));
    const avgScore = group.reduce((s, o) => s + o.score, 0) / group.length;

    let score = avgScore * 0.35 + best.score * 0.65;
    if (confluenceCount >= 2) {
      score += CONFLUENCE_BOOST_PER_SOURCE * (confluenceCount - 1);
      score = Math.min(0.98, score);
    }

    // Solo stocks news is noise for short holds: drop entirely (confluence-only).
    // Solo momentum/generic survive when they clear the (active-demo) floors.
    if (confluenceCount === 1) {
      if (best.source === "stocks") {
        droppedReasons.push({
          symbol: best.symbol,
          source: best.source,
          score,
          reason: "solo_stocks_blocked",
        });
        continue;
      }
      if (best.source === "momentum" && score < MOMENTUM_SOLO_MIN_SCORE) {
        droppedReasons.push({
          symbol: best.symbol,
          source: best.source,
          score,
          reason: "solo_momentum_below_floor",
        });
        continue;
      }
      if (score < GENERIC_SOLO_MIN_SCORE) {
        droppedReasons.push({
          symbol: best.symbol,
          source: best.source,
          score,
          reason: "solo_below_floor",
        });
        continue;
      }
    }

    const sourceLabels = sources.map((s) => s.toUpperCase()).join(" + ");
    const rationale =
      confluenceCount >= 2
        ? `Confluence (${confluenceCount} sources: ${sourceLabels}) · ${best.rationale}`
        : best.rationale;

    merged.push({
      ...best,
      score,
      rationale,
      meta: {
        ...(best.meta ?? {}),
        confluenceCount,
        confluenceSources: sources,
        sourceScores: Object.fromEntries(group.map((o) => [o.source, o.score])),
      },
    });
  }

  // Prefer confluence first, then score
  merged.sort((a, b) => {
    const ca = Number(a.meta?.confluenceCount ?? 1);
    const cb = Number(b.meta?.confluenceCount ?? 1);
    if (cb !== ca) return cb - ca;
    return b.score - a.score;
  });

  return {
    merged,
    diagnostics: {
      rawCount: longOnly.length,
      perSource,
      droppedReasons,
    },
  };
}

/**
 * Trailing stop + breakeven lock once trade moves favorably.
 * @param {object} params
 * @param {number} params.entryPriceUsd
 * @param {number} params.currentPriceUsd
 * @param {number | null} params.peakPriceUsd
 * @param {number} params.stopLossPriceUsd
 * @param {number} [params.trailActivatePct]
 * @param {number} [params.trailDistancePct]
 * @param {number} [params.breakevenActivatePct]
 */
export function computeTrailingStop({
  entryPriceUsd,
  currentPriceUsd,
  peakPriceUsd,
  stopLossPriceUsd,
  trailActivatePct = SCALPER_DEFAULTS.trailActivatePct,
  trailDistancePct = SCALPER_DEFAULTS.trailDistancePct,
  breakevenActivatePct = SCALPER_DEFAULTS.breakevenActivatePct,
}) {
  const peak = Math.max(peakPriceUsd ?? entryPriceUsd, currentPriceUsd, entryPriceUsd);
  const gainPct = entryPriceUsd > 0 ? (peak / entryPriceUsd - 1) * 100 : 0;

  let effectiveStopUsd = stopLossPriceUsd;
  let trailingStopPriceUsd = null;

  // Lock breakeven (tiny buffer for exit slippage) once in the money
  if (gainPct >= breakevenActivatePct) {
    const breakeven = entryPriceUsd * 1.0015;
    effectiveStopUsd = Math.max(effectiveStopUsd, breakeven);
  }

  if (gainPct >= trailActivatePct) {
    trailingStopPriceUsd = peak * (1 - trailDistancePct / 100);
    effectiveStopUsd = Math.max(effectiveStopUsd, trailingStopPriceUsd);
  }

  return { peakPriceUsd: peak, trailingStopPriceUsd, effectiveStopUsd };
}

/**
 * Detect momentum reversal / stalled winner for early exit (all sources).
 * @param {number} entryPriceUsd
 * @param {number} currentPriceUsd
 * @param {number | null} peakPriceUsd
 * @param {object} [opts]
 */
export function shouldEarlyExitMomentumFade(
  entryPriceUsd,
  currentPriceUsd,
  peakPriceUsd,
  opts = {},
) {
  if (!(entryPriceUsd > 0) || !(currentPriceUsd > 0)) return false;
  const peak = peakPriceUsd ?? currentPriceUsd;
  const peakGainPct = (peak / entryPriceUsd - 1) * 100;
  const drawdownFromPeakPct = peak > 0 ? ((peak - currentPriceUsd) / peak) * 100 : 0;
  const lockGain = opts.profitLockGainPct ?? SCALPER_DEFAULTS.profitLockGainPct;
  const lockGiveback = opts.profitLockGivebackPct ?? SCALPER_DEFAULTS.profitLockGivebackPct;

  // Soft profit lock: once we had a solid push, don't give it all back
  if (peakGainPct >= lockGain && drawdownFromPeakPct >= lockGiveback) return true;

  // Earlier fade for smaller winners that stall
  return peakGainPct >= 0.48 && drawdownFromPeakPct >= 0.28;
}

/**
 * Cut rotting losers before max-hold turns into a larger loss.
 * @param {number} entryPriceUsd
 * @param {number} currentPriceUsd
 * @param {Date | string | null} maxHoldUntil
 * @param {Date | string | null} openedAt
 */
export function shouldCutStaleLoser(entryPriceUsd, currentPriceUsd, maxHoldUntil, openedAt) {
  if (!(entryPriceUsd > 0) || !(currentPriceUsd > 0)) return false;
  const pnlPct = (currentPriceUsd / entryPriceUsd - 1) * 100;
  if (pnlPct >= -0.15) return false;

  const now = Date.now();
  const holdMs =
    openedAt != null ? now - new Date(openedAt).getTime() : 0;
  const untilMs = maxHoldUntil != null ? new Date(maxHoldUntil).getTime() : 0;
  const remainingMs = untilMs > 0 ? untilMs - now : Infinity;

  // If underwater past 55% of max hold with no recovery, cut
  if (holdMs > 0 && remainingMs < Infinity) {
    const totalWindow = holdMs + remainingMs;
    if (totalWindow > 0 && holdMs / totalWindow >= 0.55 && pnlPct < -0.2) return true;
  }

  // Deep early drawdown — don't wait for hard SL if already bleeding
  return pnlPct <= -0.45 && holdMs >= 6 * 60_000;
}

/**
 * Whether a scored opportunity clears solo vs confluence bars.
 * @param {number} score
 * @param {string} source
 * @param {number} confluenceCount
 * @param {number} minOpportunityScore
 */
export function passesSelectivityGate(score, source, confluenceCount, minOpportunityScore) {
  if (!(score >= minOpportunityScore)) return false;
  if (confluenceCount >= 2) return true;
  // Solo stocks: never — news alone is noise for 15-min scalps
  if (source === "stocks") return false;
  if (source === "momentum") return score >= SCALPER_DEFAULTS.minSoloMomentumScore;
  return score >= SCALPER_DEFAULTS.minSoloScore;
}
