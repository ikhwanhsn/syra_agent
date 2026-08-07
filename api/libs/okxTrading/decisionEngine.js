/**
 * Decision engine for the OKX.AI Trading Hackathon agent.
 *
 * Turns Syra's own crypto intelligence into a ranked list of tradable
 * candidates. Core signal is the CEX technical engine (`buildCexSignalReport`
 * -> CryptoAnalysisEngine); sentiment is an optional confirming/decaying
 * modifier that degrades gracefully when upstream data is unavailable.
 *
 * The scoring math is pure and unit-tested; the network/IO lives in
 * `gatherCandidateIntel`.
 */
import { buildCexSignalReport } from "../cexSignalAnalysis.js";

const STRENGTH_WEIGHT = { HIGH: 1, MEDIUM: 0.6, LOW: 0.3 };

/**
 * Map a single signal report to a directional score in [-1, 1].
 * @param {{ metadata?: Record<string, unknown> }} report
 */
export function signalToScore(report) {
  const meta = report?.metadata || {};
  const dir = String(meta.TRADING_SIGNAL || "HOLD").toUpperCase();
  const strength = String(meta.SIGNAL_STRENGTH || "LOW").toUpperCase();
  const w = STRENGTH_WEIGHT[strength] ?? 0.3;
  if (dir === "BUY") return w;
  if (dir === "SELL") return -w;
  return 0;
}

/**
 * Normalize a sentiment payload to [-1, 1]. Accepts several shapes and returns
 * 0 when nothing usable is present.
 * @param {unknown} sentiment
 */
export function sentimentToScore(sentiment) {
  if (sentiment == null) return 0;
  // Common shape: array of { date, sentiment_score } or { general: { ... } }
  const pick = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  let raw = null;
  if (Array.isArray(sentiment) && sentiment.length) {
    const latest = sentiment[sentiment.length - 1] || {};
    raw =
      pick(latest.sentiment_score) ??
      pick(latest.score) ??
      pick(latest.sentiment) ??
      pick(latest.avg_sentiment);
  } else if (typeof sentiment === "object") {
    raw =
      pick(sentiment.sentiment_score) ??
      pick(sentiment.score) ??
      pick(sentiment.general);
  } else {
    raw = pick(sentiment);
  }
  if (raw == null) return 0;
  // Sentiment scores are typically in [-1, 1] already; clamp defensively and
  // also handle 0..100 scales.
  if (Math.abs(raw) > 1.5) raw = (raw - 50) / 50;
  return Math.max(-1, Math.min(1, raw));
}

/**
 * Combine multiple weighted signal scores + sentiment into one composite.
 * @param {{ signals: Array<{ score: number, weight: number }>, sentimentScore?: number, sentimentWeight?: number }} input
 * @returns {{ score: number, side: "buy"|"sell"|"hold", conviction: number }}
 */
export function computeCompositeScore({ signals = [], sentimentScore = 0, sentimentWeight = 0.2 }) {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of signals) {
    const w = Number(s.weight) || 0;
    const v = Number(s.score) || 0;
    weightedSum += v * w;
    totalWeight += w;
  }
  weightedSum += sentimentScore * sentimentWeight;
  totalWeight += sentimentWeight;
  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const clamped = Math.max(-1, Math.min(1, score));
  let side = "hold";
  if (clamped > 0.15) side = "buy";
  else if (clamped < -0.15) side = "sell";
  return { score: clamped, side, conviction: Math.abs(clamped) };
}

/**
 * Weight for a bar timeframe. Longer timeframes anchor the trend; shorter ones
 * time the entry.
 */
function barWeight(bar, index) {
  const map = { "1d": 1, "4h": 0.9, "1h": 0.7, "15m": 0.4, "5m": 0.25, "1m": 0.15 };
  return map[bar] ?? Math.max(0.2, 0.7 - index * 0.2);
}

/**
 * Fetch multi-timeframe signals (+ optional sentiment) for one token and score it.
 * @param {{ token: string, source: string, bars: string[], sentimentFn?: (t: string) => Promise<unknown> }} args
 */
export async function gatherCandidateIntel({ token, source, bars, sentimentFn }) {
  const signals = [];
  let priceUsd = null;
  let instrument = null;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    try {
      const { report, instrument: instr } = await buildCexSignalReport(source, { token, bar });
      const price = Number(report?.marketOverview?.currentPrice);
      if (Number.isFinite(price) && price > 0) priceUsd = price;
      if (instr) instrument = instr;
      signals.push({ score: signalToScore(report), weight: barWeight(bar, i), bar, report });
    } catch (err) {
      signals.push({ score: 0, weight: 0, bar, error: String(err?.message || err) });
    }
  }

  let sentimentScore = 0;
  if (typeof sentimentFn === "function") {
    try {
      sentimentScore = sentimentToScore(await sentimentFn(token));
    } catch {
      sentimentScore = 0;
    }
  }

  const composite = computeCompositeScore({
    signals: signals.map((s) => ({ score: s.score, weight: s.weight })),
    sentimentScore,
  });

  return {
    token,
    instrument,
    priceUsd,
    sentimentScore,
    signals: signals.map((s) => ({ bar: s.bar, score: s.score, weight: s.weight, error: s.error })),
    ...composite,
  };
}

/**
 * Rank the full universe and return candidates sorted by conviction (best first).
 * Only entries with a usable price are eligible for buys.
 * @param {{ universe: string[], source: string, bars: string[], sentimentFn?: (t: string) => Promise<unknown> }} args
 */
export async function rankUniverse({ universe, source, bars, sentimentFn }) {
  const results = await Promise.all(
    universe.map((token) =>
      gatherCandidateIntel({ token, source, bars, sentimentFn }).catch((err) => ({
        token,
        priceUsd: null,
        score: 0,
        side: "hold",
        conviction: 0,
        error: String(err?.message || err),
      })),
    ),
  );
  return results.sort((a, b) => b.score - a.score);
}
