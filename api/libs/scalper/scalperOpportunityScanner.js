/**
 * Hybrid opportunity scanner — harvests signals from BTC experiments, stocks, and own momentum.
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
  const sampleBoost = Math.min(1, n / 10);
  return 0.5 + wr * 0.35 + sampleBoost * 0.15;
}

/**
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanBtcQuantRuns() {
  /** @type {ScalperOpportunity[]} */
  const out = [];
  const since = new Date(Date.now() - SCALPER_DEFAULTS.experimentSignalMaxAgeMs);

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
      const weight = strategyWeight(winRate, total);
      const baseScore = 0.55 + weight * 0.25;

      out.push({
        source: /** @type {ScalperOpportunitySource} */ (lane),
        symbol: "cbBTC",
        mint: resolveScalperUniverse()[0].mint,
        assetClass: "crypto",
        side: "long",
        score: Math.min(0.95, baseScore),
        rationale: `${lane.toUpperCase()} agent #${run.agentId} (${run.agentName}) open BUY · winRate ${Math.round(winRate * 100)}%`,
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        meta: {
          agentId: run.agentId,
          agentName: run.agentName,
          confidence: run.confidence,
          entry: run.entry,
        },
      });
    }
  }

  return out;
}

/**
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanBtc3MacroBias() {
  const latest = await decisionRepo.findLatest(1);
  const decision = latest?.[0];
  if (!decision?.targetAllocation) return [];

  const currentBtc = Number(decision.currentAllocation?.btcPct ?? 50);
  const targetBtc = Number(decision.targetAllocation.btcPct ?? 50);
  const delta = targetBtc - currentBtc;
  if (Math.abs(delta) < 2) return [];

  const side = delta > 0 ? "long" : "neutral";
  if (side === "neutral") return [];

  const confidence = Number(decision.confidence ?? 0.5);
  const score = Math.min(0.9, 0.45 + Math.abs(delta) / 100 + confidence * 0.2);

  return [
    {
      source: "btc3",
      symbol: "cbBTC",
      mint: resolveScalperUniverse()[0].mint,
      assetClass: "crypto",
      side: "long",
      score,
      rationale: `BTC3 macro rebalance bias: target BTC ${targetBtc.toFixed(1)}% (Δ${delta > 0 ? "+" : ""}${delta.toFixed(1)}%) · ${decision.headline?.slice(0, 80) || "macro decision"}`,
      expiresAt: new Date(Date.now() + 20 * 60_000).toISOString(),
      meta: {
        currentBtcPct: currentBtc,
        targetBtcPct: targetBtc,
        confidence,
        headline: decision.headline,
      },
    },
  ];
}

/**
 * @param {Array<{ symbol: string; mint: string; nasdaqTicker?: string | null; priceUsd?: number }>} universe
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanStocksSignals(universe) {
  /** @type {ScalperOpportunity[]} */
  const out = [];
  const equities = universe.filter((u) => u.assetClass === "equity");

  for (const entry of equities) {
    const signal = await fetchStockNewsSignal(entry.symbol, {
      priceUsd: entry.priceUsd,
    });
    if (!signal || signal.direction !== "long") continue;
    if (signal.compositeScore < 0.05) continue;

    const score = Math.min(0.88, 0.4 + Math.max(0, signal.compositeScore) * 0.5);
    out.push({
      source: "stocks",
      symbol: entry.symbol,
      mint: entry.mint,
      assetClass: "equity",
      side: "long",
      score,
      rationale: `Stocks news long · composite ${signal.compositeScore.toFixed(2)} · ${signal.topHeadline?.slice(0, 80) || "news signal"}`,
      expiresAt: new Date(Date.now() + 12 * 60_000).toISOString(),
      meta: {
        compositeScore: signal.compositeScore,
        sentimentScore: signal.sentimentScore,
        newsCount: signal.newsCount,
      },
    });
  }

  return out;
}

/**
 * @param {Array<{ symbol: string; mint: string; assetClass: 'crypto' | 'equity'; priceUsd?: number }>} universe
 * @returns {Promise<ScalperOpportunity[]>}
 */
async function scanMomentum(universe) {
  /** @type {ScalperOpportunity[]} */
  const out = [];

  const btcBars = await fetchPythBtcOhlcvBars("5", 12);
  const btcMom = computeBtcBarMomentum(btcBars);
  const btcEntry = universe.find((u) => u.symbol === "cbBTC");
  if (btcMom && btcEntry) {
    const { momentumPct, volatilityPct } = btcMom;
    if (
      Math.abs(momentumPct) >= SCALPER_DEFAULTS.momentumMinPct &&
      volatilityPct <= SCALPER_DEFAULTS.momentumMaxVolatilityPct
    ) {
      const side = momentumPct > 0 ? "long" : "neutral";
      if (side === "long") {
        const score = Math.min(0.85, 0.35 + Math.abs(momentumPct) / 2);
        out.push({
          source: "momentum",
          symbol: "cbBTC",
          mint: btcEntry.mint,
          assetClass: "crypto",
          side: "long",
          score,
          rationale: `5m Pyth momentum +${momentumPct.toFixed(2)}% · vol ${volatilityPct.toFixed(2)}%`,
          expiresAt: new Date(Date.now() + 8 * 60_000).toISOString(),
          meta: { momentumPct, volatilityPct },
        });
      }
    }
  }

  for (const entry of universe.filter((u) => u.assetClass === "equity")) {
    if (entry.priceUsd > 0) recordEquityPriceSample(entry.symbol, entry.priceUsd);
    const mom = computeEquityMomentum(entry.symbol, 5 * 60_000);
    if (!mom) continue;
    const { momentumPct, volatilityPct } = mom;
    if (
      momentumPct >= SCALPER_DEFAULTS.momentumMinPct &&
      volatilityPct <= SCALPER_DEFAULTS.momentumMaxVolatilityPct
    ) {
      const score = Math.min(0.8, 0.32 + momentumPct / 2);
      out.push({
        source: "momentum",
        symbol: entry.symbol,
        mint: entry.mint,
        assetClass: "equity",
        side: "long",
        score,
        rationale: `5m price momentum +${momentumPct.toFixed(2)}% · vol ${volatilityPct.toFixed(2)}%`,
        expiresAt: new Date(Date.now() + 8 * 60_000).toISOString(),
        meta: { momentumPct, volatilityPct, samples: mom.samples },
      });
    }
  }

  return out;
}

/**
 * @returns {Promise<{ opportunities: ScalperOpportunity[]; priceMap: Record<string, number>; scannedAt: string }>}
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

  const [btcQuant, btc3, stocks, momentum] = await Promise.all([
    scanBtcQuantRuns(),
    scanBtc3MacroBias(),
    scanStocksSignals(enrichedUniverse),
    scanMomentum(enrichedUniverse),
  ]);

  const all = [...btcQuant, ...btc3, ...stocks, ...momentum];
  const byKey = new Map();

  for (const opp of all) {
    const key = `${opp.symbol}:${opp.side}`;
    const existing = byKey.get(key);
    if (!existing || opp.score > existing.score) {
      byKey.set(key, opp);
    }
  }

  const opportunities = [...byKey.values()].sort((a, b) => b.score - a.score);

  return {
    opportunities,
    priceMap,
    scannedAt: new Date().toISOString(),
  };
}
