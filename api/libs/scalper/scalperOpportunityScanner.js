/**
 * Hybrid opportunity scanner — harvests signals from BTC experiments, stocks, and own momentum.
 * Profitability bias: higher score floors, regime gate, prefer confluence-ready setups.
 */
import TradingExperimentRun from "../../models/TradingExperimentRun.js";
import BtcQuantExperimentState from "../../models/BtcQuantExperimentState.js";
import { decisionRepo } from "../../repositories/btc3/decisionRepo.js";
import { EXPERIMENT_SUITE_BTC_ONCHAIN } from "../../config/tradingExperimentStrategies.js";
import {
  resolveScalperUniverse,
  SCALPER_DEFAULTS,
} from "../../config/scalperConfig.js";
import { fetchStockNewsSignal } from "../stocksNewsSignals.js";
import { fetchJupiterPricesForMints } from "../stocksPriceFeed.js";
import {
  fetchPythBtcOhlcvBars,
  fetchPythBtcSpotUsd,
  computeBtcBarMomentum,
  computeEquityMomentum,
  recordEquityPriceSample,
} from "./pythPriceFeed.js";
import {
  assessMarketRegime,
  computeAtrPct,
  computeRsi,
  computeTrendBias,
  mergeOpportunitiesWithConfluence,
  scoreMomentumQuality,
} from "./scalperSignalEngine.js";
import { fetchNasdaqPrice } from "../equityPriceFetchers.js";

/** @typedef {'btc1' | 'btc2' | 'btc3' | 'stocks' | 'momentum'} ScalperOpportunitySource */
/** @typedef {'long' | 'short' | 'neutral'} ScalperSide */

/**
 * @typedef {Object} ScalperOpportunity
 * @property {ScalperOpportunitySource} source
 * @property {string} symbol
 * @property {string} mint
 * @property {'crypto' | 'equity'} assetClass
 * @property {ScalperSide} side
 * @property {number} score
 * @property {string} rationale
 * @property {string} expiresAt
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @param {number} winRate
 * @param {number} sampleSize
 * @returns {number}
 */
function strategyWeight(winRate, sampleSize) {
  const wr = Number.isFinite(winRate) ? winRate : 0.5;
  const n = Number.isFinite(sampleSize) ? sampleSize : 0;
  const sampleBoost = Math.min(1, n / 12);
  return 0.45 + wr * 0.4 + sampleBoost * 0.15;
}

/**
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanBtcQuantRuns(btcBars, regime) {
  /** @type {ScalperOpportunity[]} */
  const out = [];
  if (!regime?.allowLong) return out;

  const since = new Date(Date.now() - SCALPER_DEFAULTS.experimentSignalMaxAgeMs);
  const closes = (btcBars ?? []).map((b) => b[4]).filter((c) => c > 0);
  const trend = computeTrendBias(closes);
  if (trend === "bearish") return out;

  for (const lane of ["btc1", "btc2"]) {
    const state = await BtcQuantExperimentState.findOne({
      _id: lane === "btc2" ? "singleton-btc2" : "singleton",
    }).lean();
    const experimentId = state?.activeExperimentId;
    if (!experimentId) continue;

    const runs = await TradingExperimentRun.find({
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      status: "open",
      clearSignal: "BUY",
      createdAt: { $gte: since },
      "summary.experimentId": experimentId,
      "summary.lane": lane,
    })
      .select("agentId agentName confidence entry priceAtSignal createdAt summary")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    for (const run of runs) {
      const settled = await TradingExperimentRun.aggregate([
        {
          $match: {
            suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
            agentId: run.agentId,
            status: { $in: ["win", "loss", "expired"] },
            "summary.experimentId": experimentId,
            "summary.lane": lane,
          },
        },
        {
          $group: {
            _id: null,
            wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]);
      const wins = settled[0]?.wins ?? 0;
      const total = settled[0]?.total ?? 0;
      const winRate = total > 0 ? wins / total : 0.5;
      // Only follow agents that already show edge
      if (total >= 4 && winRate < 0.48) continue;
      if (total >= 8 && winRate < 0.52) continue;

      const weight = strategyWeight(winRate, total);
      const confidence = Number(run.confidence ?? 0.5);
      if (confidence < 0.45 && total < 6) continue;

      let baseScore = 0.55 + weight * 0.28 + Math.min(0.14, confidence * 0.14);
      if (trend === "bullish") baseScore += 0.04;
      if (baseScore < 0.58) continue;

      out.push({
        source: /** @type {ScalperOpportunitySource} */ (lane),
        symbol: "cbBTC",
        mint: resolveScalperUniverse()[0].mint,
        assetClass: "crypto",
        side: "long",
        score: Math.min(0.95, baseScore),
        rationale: `${lane.toUpperCase()} agent #${run.agentId} (${run.agentName}) open BUY · winRate ${Math.round(winRate * 100)}%`,
        expiresAt: new Date(Date.now() + 8 * 60_000).toISOString(),
        meta: {
          agentId: run.agentId,
          agentName: run.agentName,
          confidence: run.confidence,
          entry: run.entry,
          winRate,
          sampleSize: total,
          trend,
          regime: regime.regime,
        },
      });
    }
  }

  return out;
}

/**
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanBtc3MacroBias(btcBars, regime) {
  if (!regime?.allowLong) return [];

  const latest = await decisionRepo.findLatest(1);
  const decision = latest?.[0];
  if (!decision?.targetAllocation) return [];

  const currentBtc = Number(decision.currentAllocation?.btcPct ?? 50);
  const targetBtc = Number(decision.targetAllocation.btcPct ?? 50);
  const delta = targetBtc - currentBtc;
  // Need a clearer rebalance impulse
  if (delta < 5) return [];

  const closes = (btcBars ?? []).map((b) => b[4]).filter((c) => c > 0);
  const trend = computeTrendBias(closes);
  if (trend === "bearish") return [];
  if (trend === "neutral" && delta < 8) return [];

  const confidence = Number(decision.confidence ?? 0.5);
  if (confidence < 0.4) return [];

  let score = Math.min(0.93, 0.52 + Math.abs(delta) / 70 + confidence * 0.24);
  if (trend === "bullish") score += 0.03;
  if (score < 0.58) return [];

  return [
    {
      source: "btc3",
      symbol: "cbBTC",
      mint: resolveScalperUniverse()[0].mint,
      assetClass: "crypto",
      side: "long",
      score,
      rationale: `BTC3 macro rebalance bias: target BTC ${targetBtc.toFixed(1)}% (Δ${delta > 0 ? "+" : ""}${delta.toFixed(1)}%) · ${decision.headline?.slice(0, 80) || "macro decision"}`,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      meta: {
        currentBtcPct: currentBtc,
        targetBtcPct: targetBtc,
        confidence,
        headline: decision.headline,
        trend,
        regime: regime.regime,
      },
    },
  ];
}

/**
 * @param {Array<{ symbol: string; mint: string; nasdaqTicker?: string | null; priceUsd?: number; assetClass?: string }>} universe
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanStocksSignals(universe) {
  /** @type {ScalperOpportunity[]} */
  const out = [];
  const equities = universe.filter((u) => u.assetClass === "equity");

  for (const entry of equities) {
    let nasdaqPriceUsd = null;
    if (entry.nasdaqTicker) {
      try {
        const nasdaq = await fetchNasdaqPrice(entry.nasdaqTicker);
        nasdaqPriceUsd = nasdaq?.priceUsd ?? null;
      } catch {
        /* optional */
      }
    }

    const signal = await fetchStockNewsSignal(entry.symbol, {
      priceUsd: entry.priceUsd,
      nasdaqPriceUsd,
    });
    if (!signal || signal.direction !== "long") continue;
    // News alone is noisy for short holds — demand stronger composite
    if (signal.compositeScore < 0.22) continue;
    if ((signal.newsCount ?? 0) < 1) continue;

    let score = Math.min(0.88, 0.4 + Math.max(0, signal.compositeScore) * 0.5);
    if (nasdaqPriceUsd && entry.priceUsd > 0) {
      const discountPct = ((nasdaqPriceUsd - entry.priceUsd) / nasdaqPriceUsd) * 100;
      // Prefer onchain discount vs NASDAQ (structural edge)
      if (discountPct > 0.6) score += Math.min(0.1, discountPct / 18);
      else if (discountPct < -0.8) score -= 0.08;
    }
    if (score < 0.66) continue;

    out.push({
      source: "stocks",
      symbol: entry.symbol,
      mint: entry.mint,
      assetClass: "equity",
      side: "long",
      score,
      rationale: `Stocks news long · composite ${signal.compositeScore.toFixed(2)} · ${signal.topHeadline?.slice(0, 80) || "news signal"}`,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      meta: {
        compositeScore: signal.compositeScore,
        sentimentScore: signal.sentimentScore,
        newsCount: signal.newsCount,
        nasdaqPriceUsd,
      },
    });
  }

  return out;
}

/**
 * Prefer the stronger of standard (~30m) vs short-horizon (~15m) BTC momentum.
 * @param {number[][]} bars
 */
function pickBtcMomentum(bars) {
  const standard = computeBtcBarMomentum(bars);
  // computeBtcBarMomentum needs >= 4 bars; short window ≈ 15–20m
  if (!Array.isArray(bars) || bars.length < 4) return standard;
  const shortBars = bars.slice(-4);
  const short = computeBtcBarMomentum(shortBars);
  if (!standard) return short;
  if (!short) return standard;
  // Prefer the window with clearer absolute move (active-demo cadence)
  return Math.abs(short.momentumPct) >= Math.abs(standard.momentumPct) ? short : standard;
}

async function scanMomentum(universe, btcBars, regime, rejectSink = null) {
  /** @type {ScalperOpportunity[]} */
  const out = [];
  if (!regime?.allowLong) {
    rejectSink?.push({
      symbol: "cbBTC",
      source: "momentum",
      score: 0,
      reason: `regime_blocked:${regime?.reason ?? regime?.regime ?? "unknown"}`,
    });
    return out;
  }

  const bars = btcBars ?? (await fetchPythBtcOhlcvBars("5", 24));
  const btcMom = pickBtcMomentum(bars);
  const btcCloses = bars.map((b) => b[4]).filter((c) => c > 0);
  const btcRsi = computeRsi(btcCloses);
  const btcTrend = computeTrendBias(btcCloses);
  const btcAtr = computeAtrPct(bars) ?? btcMom?.volatilityPct ?? 0.8;

  const btcEntry = universe.find((u) => u.symbol === "cbBTC");
  if (!btcMom) {
    rejectSink?.push({
      symbol: "cbBTC",
      source: "momentum",
      score: 0,
      reason: "insufficient_bars",
    });
  } else if (btcEntry) {
    const { momentumPct, volatilityPct } = btcMom;
    const quality = scoreMomentumQuality({
      momentumPct,
      rsi: btcRsi,
      trend: btcTrend,
      volatilityPct,
    });
    if (quality.reject || quality.quality < 0.4) {
      rejectSink?.push({
        symbol: "cbBTC",
        source: "momentum",
        score: quality.quality,
        reason: quality.reason ?? "low_momentum_quality",
      });
    } else {
      const score = Math.min(
        0.86,
        0.42 + Math.abs(momentumPct) / 2.8 + quality.quality * 0.32,
      );
      if (score < 0.55) {
        rejectSink?.push({
          symbol: "cbBTC",
          source: "momentum",
          score,
          reason: "score_below_emit_floor",
        });
      } else {
        out.push({
          source: "momentum",
          symbol: "cbBTC",
          mint: btcEntry.mint,
          assetClass: "crypto",
          side: "long",
          score,
          rationale: `5m momentum +${momentumPct.toFixed(2)}% · RSI ${btcRsi?.toFixed(0) ?? "—"} · ${btcTrend} · vol ${volatilityPct.toFixed(2)}%`,
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
          meta: {
            momentumPct,
            volatilityPct,
            rsi: btcRsi,
            trend: btcTrend,
            atrPct: btcAtr,
            quality: quality.quality,
            regime: regime.regime,
          },
        });
      }
    }
  }

  for (const entry of universe.filter((u) => u.assetClass === "equity")) {
    if (entry.priceUsd > 0) recordEquityPriceSample(entry.symbol, entry.priceUsd);
    const mom = computeEquityMomentum(entry.symbol, 5 * 60_000);
    if (!mom) continue;
    const { momentumPct, volatilityPct } = mom;

    const quality = scoreMomentumQuality({
      momentumPct,
      rsi: null,
      trend: momentumPct > 0.4 ? "bullish" : "neutral",
      volatilityPct,
    });
    if (quality.reject || quality.quality < 0.4) continue;

    const score = Math.min(0.8, 0.38 + momentumPct / 2.6 + quality.quality * 0.28);
    if (score < 0.55) continue;
    out.push({
      source: "momentum",
      symbol: entry.symbol,
      mint: entry.mint,
      assetClass: "equity",
      side: "long",
      score,
      rationale: `5m equity momentum +${momentumPct.toFixed(2)}% · vol ${volatilityPct.toFixed(2)}%`,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      meta: {
        momentumPct,
        volatilityPct,
        samples: mom.samples,
        quality: quality.quality,
      },
    });
  }

  return out;
}

/**
 * @returns {Promise<{
 *   opportunities: ScalperOpportunity[];
 *   priceMap: Record<string, number>;
 *   scannedAt: string;
 *   regime: object;
 *   diagnostics: {
 *     rawCandidates: number;
 *     perSource: Record<string, number>;
 *     droppedReasons: Array<{ symbol: string; source: string; score: number; reason: string }>;
 *     regimeReason: string | null;
 *     mergedCount: number;
 *   };
 * }>}
 */
export async function scanScalperOpportunities() {
  const universe = resolveScalperUniverse();

  const equityMints = universe.filter((u) => u.assetClass === "equity").map((u) => u.mint);
  const [pythSpot, jupPrices] = await Promise.all([
    fetchPythBtcSpotUsd(),
    fetchJupiterPricesForMints(equityMints),
  ]);

  /** @type {Record<string, number>} */
  const priceMap = {};
  if (pythSpot?.priceUsd > 0) priceMap.cbBTC = pythSpot.priceUsd;
  for (const entry of universe) {
    if (entry.assetClass === "equity" && jupPrices[entry.mint] > 0) {
      priceMap[entry.symbol] = jupPrices[entry.mint];
    }
  }

  const enrichedUniverse = universe.map((u) => ({
    ...u,
    priceUsd: priceMap[u.symbol] ?? null,
  }));

  const btcBars = await fetchPythBtcOhlcvBars("5", 24);
  const btcCloses = btcBars.map((b) => b[4]).filter((c) => c > 0);
  const btcAtr = computeAtrPct(btcBars);
  const regime = assessMarketRegime(btcCloses, btcAtr);

  /** @type {Array<{ symbol: string; source: string; score: number; reason: string }>} */
  const momentumRejects = [];

  const [btcQuant, btc3, stocks, momentum] = await Promise.all([
    scanBtcQuantRuns(btcBars, regime),
    scanBtc3MacroBias(btcBars, regime),
    // Equity news can still fire in BTC chop — but momentum/btc gated by regime
    scanStocksSignals(enrichedUniverse),
    scanMomentum(enrichedUniverse, btcBars, regime, momentumRejects),
  ]);

  const all = [...btcQuant, ...btc3, ...stocks, ...momentum];
  const { merged: opportunities, diagnostics: mergeDiag } =
    mergeOpportunitiesWithConfluence(all);

  const perSource = {
    btc1: btcQuant.filter((o) => o.source === "btc1").length,
    btc2: btcQuant.filter((o) => o.source === "btc2").length,
    btc3: btc3.length,
    stocks: stocks.length,
    momentum: momentum.length,
    ...mergeDiag.perSource,
  };

  const droppedReasons = [...momentumRejects, ...mergeDiag.droppedReasons].slice(0, 20);

  return {
    opportunities,
    priceMap,
    scannedAt: new Date().toISOString(),
    regime,
    diagnostics: {
      rawCandidates: all.length,
      perSource,
      droppedReasons,
      regimeReason: regime?.reason ?? null,
      mergedCount: opportunities.length,
    },
  };
}
