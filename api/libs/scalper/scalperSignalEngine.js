/**
 * Scalper signal intelligence — confluence, trend/RSI filters, volatility-aware levels.
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
 * @param {object} params
 * @param {number} params.momentumPct
 * @param {number | null} params.rsi
 * @param {'bullish' | 'bearish' | 'neutral'} params.trend
 * @param {number} params.volatilityPct
 * @returns {{ quality: number; reject: boolean; reason: string | null }}
 */
export function scoreMomentumQuality({ momentumPct, rsi, trend, volatilityPct }) {
  let quality = 0.5;

  if (momentumPct < SCALPER_DEFAULTS.momentumMinPct) {
    return { quality: 0, reject: true, reason: "momentum_too_weak" };
  }

  // Reject chasing extended moves — classic scalper mistake
  if (momentumPct > 1.2 && rsi != null && rsi > 68) {
    return { quality: 0, reject: true, reason: "overbought_chase" };
  }
  if (momentumPct > 1.8) {
    return { quality: 0, reject: true, reason: "extended_move" };
  }

  if (rsi != null) {
    if (rsi > 72) quality -= 0.25;
    else if (rsi > 65) quality -= 0.1;
    else if (rsi >= 45 && rsi <= 60) quality += 0.15;
    else if (rsi < 35) quality += 0.1;
  }

  if (trend === "bullish") quality += 0.2;
  else if (trend === "bearish") quality -= 0.3;

  if (volatilityPct > SCALPER_DEFAULTS.momentumMaxVolatilityPct) {
    quality -= 0.15;
  } else if (volatilityPct < 0.4) {
    quality += 0.05;
  }

  quality = Math.max(0, Math.min(1, quality));
  return { quality, reject: quality < 0.25, reason: quality < 0.25 ? "low_momentum_quality" : null };
}

/**
 * @param {object} cfg - effective scalper config
 * @param {number} volatilityPct - ATR or realized vol %
 * @param {number} confluenceCount
 * @returns {{ takeProfitPct: number; stopLossPct: number; maxHoldMinutes: number }}
 */
export function computeDynamicTradeLevels(cfg, volatilityPct, confluenceCount = 1) {
  const vol = Number.isFinite(volatilityPct) && volatilityPct > 0 ? volatilityPct : 0.8;
  const roundTrip = estimateRoundTripCostPct(cfg.quoteSlippageBps ?? SCALPER_DEFAULTS.quoteSlippageBps);

  let takeProfitPct = Math.max(cfg.takeProfitPct, vol * 1.4, roundTrip + (cfg.minEdgeBufferPct ?? 0.25));
  let stopLossPct = Math.min(cfg.stopLossPct, vol * 0.75);
  stopLossPct = Math.max(0.45, stopLossPct);

  // Confluence trades get slightly wider TP, tighter SL
  if (confluenceCount >= 2) {
    takeProfitPct *= 1.08;
    stopLossPct *= 0.92;
  }

  takeProfitPct = Math.min(3.2, takeProfitPct);
  stopLossPct = Math.min(takeProfitPct * 0.55, stopLossPct);

  let maxHoldMinutes = cfg.maxHoldMinutes;
  if (vol > 1.5) maxHoldMinutes = Math.max(25, maxHoldMinutes - 10);
  if (confluenceCount >= 2) maxHoldMinutes = Math.min(60, maxHoldMinutes + 5);

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

const CONFLUENCE_BOOST_PER_SOURCE = 0.12;
const MOMENTUM_SOLO_MIN_SCORE = 0.62;

/**
 * Merge duplicate symbol opportunities; boost score when multiple independent sources agree.
 * @param {ScalperOpportunity[]} opportunities
 * @returns {ScalperOpportunity[]}
 */
export function mergeOpportunitiesWithConfluence(opportunities) {
  /** @type {Map<string, ScalperOpportunity[]>} */
  const bySymbol = new Map();

  for (const opp of opportunities) {
    if (opp.side !== "long") continue;
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

    let score = avgScore * 0.4 + best.score * 0.6;
    if (confluenceCount >= 2) {
      score += CONFLUENCE_BOOST_PER_SOURCE * (confluenceCount - 1);
      score = Math.min(0.97, score);
    }

    // Solo momentum needs higher bar — weakest edge source
    if (confluenceCount === 1 && best.source === "momentum" && score < MOMENTUM_SOLO_MIN_SCORE) {
      continue;
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

  return merged.sort((a, b) => b.score - a.score);
}

/**
 * Trailing stop: lock profit once trade moves favorably.
 * @param {object} params
 * @param {number} params.entryPriceUsd
 * @param {number} params.currentPriceUsd
 * @param {number | null} params.peakPriceUsd
 * @param {number} params.stopLossPriceUsd
 * @param {number} [params.trailActivatePct]
 * @param {number} [params.trailDistancePct]
 */
export function computeTrailingStop({
  entryPriceUsd,
  currentPriceUsd,
  peakPriceUsd,
  stopLossPriceUsd,
  trailActivatePct = 0.7,
  trailDistancePct = 0.35,
}) {
  const peak = Math.max(peakPriceUsd ?? entryPriceUsd, currentPriceUsd, entryPriceUsd);
  const gainPct = entryPriceUsd > 0 ? ((peak / entryPriceUsd - 1) * 100) : 0;

  if (gainPct < trailActivatePct) {
    return { peakPriceUsd: peak, trailingStopPriceUsd: null, effectiveStopUsd: stopLossPriceUsd };
  }

  const trailStop = peak * (1 - trailDistancePct / 100);
  const effectiveStopUsd = Math.max(stopLossPriceUsd, trailStop);
  return { peakPriceUsd: peak, trailingStopPriceUsd: trailStop, effectiveStopUsd };
}

/**
 * Detect momentum reversal for early exit on open winners.
 * @param {number} entryPriceUsd
 * @param {number} currentPriceUsd
 * @param {number | null} peakPriceUsd
 */
export function shouldEarlyExitMomentumFade(entryPriceUsd, currentPriceUsd, peakPriceUsd) {
  if (!(entryPriceUsd > 0) || !(currentPriceUsd > 0)) return false;
  const peak = peakPriceUsd ?? currentPriceUsd;
  const peakGainPct = (peak / entryPriceUsd - 1) * 100;
  const drawdownFromPeakPct = peak > 0 ? ((peak - currentPriceUsd) / peak) * 100 : 0;
  return peakGainPct >= 0.55 && drawdownFromPeakPct >= 0.35;
}
