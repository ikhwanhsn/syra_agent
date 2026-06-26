/**
 * BTC onchain quant experiment — paper sim cohort using TradingExperimentRun + onchain Solana DEX signals.
 * Real onchain cbBTC execution is handled by btcQuantRealService.js.
 */
import crypto from "node:crypto";
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import BtcQuantExperimentState from "../models/BtcQuantExperimentState.js";
import {
  BTC_QUANT_EXPERIMENT_DEFAULTS,
  BTC_QUANT_STRATEGIES,
  BTC_QUANT_TOKEN,
  EXPERIMENT_SUITE_BTC_ONCHAIN,
  resolveBtcQuantStrategyById,
} from "../config/tradingExperimentStrategies.js";
import {
  TRADING_EXPERIMENT_STARTING_USD,
  TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD,
  roundUsd,
  computeAgentEquityFromRealizedPnl,
  computeAgentReturnPct,
  computeAgentCashFromEquity,
  computeExperimentNotionalUsd,
} from "../config/tradingExperimentSim.js";
import {
  BTC_ONCHAIN_DATA_SOURCE,
  BTC_ONCHAIN_SYMBOL,
  buildBtcOnchainSignalReport,
  fetchCbbtcSpotPriceUsd,
} from "./btcQuantOnchainMarket.js";
import { barDurationMsGeneric } from "./experimentCandleAnchor.js";
import { extractSignalFields } from "./experimentSignalExtract.js";
import {
  applyBtcQuantSignalGate,
  extractBtcQuantGateSignals,
} from "./btcQuantSignalGate.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const EXPERIMENT_ID_PREFIX = "btcq";

let bootPromise = null;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

function newExperimentId() {
  return `${EXPERIMENT_ID_PREFIX}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

function mergedSimConfig(stateDoc) {
  const s = stateDoc?.simConfig || {};
  return {
    startingBankUsd: toNum(s.startingBankUsd, TRADING_EXPERIMENT_STARTING_USD),
    maxConcurrentPositions: toNum(
      s.maxConcurrentPositions,
      BTC_QUANT_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
    ),
  };
}

function experimentFilter(experimentId) {
  return {
    suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
    "summary.experimentId": experimentId,
  };
}

/**
 * @param {{ exit?: { tpFromSignal?: boolean; slFromSignal?: boolean; takeProfitPct?: number; stopLossPct?: number } }} strategy
 * @param {ReturnType<typeof extractSignalFields>} signal
 */
function resolveTradeLevels(strategy, signal) {
  const exit = strategy.exit || {};
  let entry = Number(signal.entry);
  let stopLoss = Number(signal.stopLoss);
  let firstTarget = Number(signal.firstTarget);
  const px =
    Number.isFinite(signal.priceAtSignal) && signal.priceAtSignal > 0
      ? signal.priceAtSignal
      : entry;

  if (!(entry > 0)) entry = px;
  if (exit.slFromSignal === false && exit.stopLossPct != null && entry > 0) {
    stopLoss = entry * (1 - Number(exit.stopLossPct) / 100);
  }
  if (exit.tpFromSignal === false && exit.takeProfitPct != null && entry > 0) {
    firstTarget = entry * (1 + Number(exit.takeProfitPct) / 100);
  }

  const valid =
    entry > 0 &&
    stopLoss > 0 &&
    firstTarget > 0 &&
    firstTarget > entry &&
    stopLoss < entry;

  return { entry, stopLoss, firstTarget, valid };
}

/** @param {string} bar */
function maxHoldMs(bar, maxBars) {
  const dur = barDurationMsGeneric(bar);
  const bars = Number.isFinite(Number(maxBars)) ? Number(maxBars) : 48;
  return dur * bars;
}

async function fetchBtcSpotPrice() {
  return fetchCbbtcSpotPriceUsd();
}

export async function ensureBtcQuantBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let state = await BtcQuantExperimentState.findById("singleton");
    if (state?.activeExperimentId) return { experimentId: state.activeExperimentId };

    const nextId = newExperimentId();
    state = await BtcQuantExperimentState.findOneAndUpdate(
      { _id: "singleton" },
      {
        $setOnInsert: {
          activeExperimentId: nextId,
          title: "BTC onchain quant lab",
          startedAt: new Date(),
          simConfig: {
            startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
            maxConcurrentPositions: BTC_QUANT_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
          },
        },
      },
      { upsert: true, new: true },
    );
    return { experimentId: state.activeExperimentId };
  })().finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

/**
 * @param {string} experimentId
 * @param {number} agentId
 */
async function computeAgentLedger(experimentId, agentId) {
  const cfg = mergedSimConfig(await BtcQuantExperimentState.findById("singleton"));
  const baseFilter = { ...experimentFilter(experimentId), agentId };

  const [openRuns, settledAgg] = await Promise.all([
    TradingExperimentRun.find({ ...baseFilter, status: "open" }).lean(),
    TradingExperimentRun.aggregate([
      { $match: { ...baseFilter, status: { $in: ["win", "loss", "expired"] } } },
      {
        $group: {
          _id: null,
          realizedPnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
          wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "loss"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const realizedPnlUsd = roundUsd(settledAgg[0]?.realizedPnlUsd ?? 0);
  const deployedUsd = roundUsd(
    openRuns.reduce((sum, r) => sum + toNum(r.notionalUsd, 0), 0),
  );
  const equityUsd = computeAgentEquityFromRealizedPnl(realizedPnlUsd);
  const cashUsd = computeAgentCashFromEquity(equityUsd, deployedUsd);
  const wins = settledAgg[0]?.wins ?? 0;
  const losses = settledAgg[0]?.losses ?? 0;
  const expired = settledAgg[0]?.expired ?? 0;
  const decided = wins + losses;
  const winRate = decided > 0 ? wins / decided : null;

  return {
    agentId,
    cashUsd,
    startingBankUsd: cfg.startingBankUsd,
    openPositions: openRuns.length,
    deployedUsd,
    equityUsd,
    realizedPnlUsd,
    returnPct: computeAgentReturnPct(equityUsd, cfg.startingBankUsd),
    wins,
    losses,
    expired,
    decided,
    winRate,
    winRatePct: winRate != null ? roundUsd(winRate * 100) : null,
    sumPnlUsd: realizedPnlUsd,
  };
}

export async function getBtcQuantLabState() {
  await ensureBtcQuantBootstrapped();
  const state = await BtcQuantExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId ?? null;
  const cfg = mergedSimConfig(state);
  const agents = await Promise.all(
    BTC_QUANT_STRATEGIES.map((s) => computeAgentLedger(experimentId, s.id)),
  );
  return {
    activeExperimentId: experimentId,
    title: state?.title ?? "BTC onchain quant lab",
    startedAt: state?.startedAt?.toISOString?.() ?? null,
    simConfig: cfg,
    agents: agents.map((a) => ({
      strategyId: a.agentId,
      cashUsd: a.cashUsd,
      startingBankUsd: a.startingBankUsd,
      openPositions: a.openPositions,
      deployedUsd: a.deployedUsd,
      equityUsd: a.equityUsd,
      returnPct: a.returnPct,
    })),
  };
}

export async function getBtcQuantStats() {
  const { activeExperimentId: experimentId } = await getBtcQuantLabState();
  const agents = await Promise.all(
    BTC_QUANT_STRATEGIES.map(async (s) => {
      const ledger = await computeAgentLedger(experimentId, s.id);
      const settled = await TradingExperimentRun.find({
        ...experimentFilter(experimentId),
        agentId: s.id,
        status: { $in: ["win", "loss", "expired"] },
      }).lean();
      const avgPnlUsd =
        settled.length > 0
          ? roundUsd(settled.reduce((sum, r) => sum + toNum(r.simPnlUsd, 0), 0) / settled.length)
          : 0;
      return {
        strategyId: s.id,
        strategyName: s.name,
        bar: s.bar,
        dataSource: s.dataSource,
        wins: ledger.wins,
        losses: ledger.losses,
        expired: ledger.expired,
        decided: ledger.decided,
        winRate: ledger.winRate,
        winRatePct: ledger.winRatePct,
        openPositions: ledger.openPositions,
        cashUsd: ledger.cashUsd,
        equityUsd: ledger.equityUsd,
        returnPct: ledger.returnPct,
        sumPnlUsd: ledger.sumPnlUsd,
        avgPnlUsd,
      };
    }),
  );
  return { agents, experimentId };
}

export async function getBtcQuantOverview() {
  const [state, stats] = await Promise.all([getBtcQuantLabState(), getBtcQuantStats()]);
  const experimentId = state.activeExperimentId;
  const agents = stats.agents;

  const settledRuns = await TradingExperimentRun.countDocuments({
    ...experimentFilter(experimentId),
    status: { $in: ["win", "loss", "expired"] },
  });
  const openPositions = await TradingExperimentRun.countDocuments({
    ...experimentFilter(experimentId),
    status: "open",
  });
  const sumPnlUsd = roundUsd(agents.reduce((sum, a) => sum + toNum(a.sumPnlUsd, 0), 0));
  const sumEquityUsd = roundUsd(agents.reduce((sum, a) => sum + toNum(a.equityUsd, 0), 0));

  const ranked = [...agents].sort((a, b) => toNum(b.sumPnlUsd) - toNum(a.sumPnlUsd));
  const leader = ranked[0] ?? null;
  const topWin = [...agents].sort((a, b) => toNum(b.winRatePct) - toNum(a.winRatePct))[0] ?? null;

  let realAgent = {
    enabled: false,
    openPositions: 0,
    realizedNetPnlUsd: 0,
    realWinRate: null,
    realWins: 0,
    realLosses: 0,
    cronEnabled: false,
  };
  try {
    const { getBtcQuantRealState } = await import("./btcQuantRealService.js");
    const real = await getBtcQuantRealState();
    realAgent = {
      enabled: real.enabled,
      openPositions: real.openPositions,
      realizedNetPnlUsd: real.realizedNetPnlUsd,
      realWinRate: real.realWinRate,
      realWins: real.realWins,
      realLosses: real.realLosses,
      cronEnabled: real.cronEnabled,
      leaderStrategyId: real.leaderStrategyId,
    };
  } catch {
    // real module optional at boot
  }

  return {
    btcSpotPriceUsd: await fetchBtcSpotPrice(),
    onchain: {
      venue: "Solana",
      asset: "cbBTC",
      execution: "Jupiter swap",
      ohlcv: "Birdeye (Solana DEX)",
      spot: "Jupiter Price API",
    },
    simulation: {
      activeExperimentId: experimentId,
      strategyCount: BTC_QUANT_STRATEGIES.length,
      settledRuns,
      openPositions,
      sumPnlUsd,
      sumEquityUsd,
      leaderStrategyId: leader?.strategyId ?? null,
      leaderSumPnlUsd: leader?.sumPnlUsd ?? null,
      leaderWinRatePct: leader?.winRatePct ?? null,
      topWinRateStrategyId: topWin?.strategyId ?? null,
      topWinRatePct: topWin?.winRatePct ?? null,
    },
    realAgent,
  };
}

export async function listBtcQuantRuns({
  limit,
  offset,
  strategyId,
  status,
  experimentId: experimentIdOpt,
}) {
  const state = await BtcQuantExperimentState.findById("singleton").lean();
  const experimentId = experimentIdOpt || state?.activeExperimentId;
  if (!experimentId) return { runs: [], total: 0 };

  const filter = { ...experimentFilter(experimentId) };
  if (strategyId != null && Number.isInteger(strategyId)) filter.agentId = strategyId;
  if (status) filter.status = status;

  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const [runs, total] = await Promise.all([
    TradingExperimentRun.find(filter).sort({ createdAt: -1 }).skip(off).limit(lim).lean(),
    TradingExperimentRun.countDocuments(filter),
  ]);

  return {
    runs: runs.map((r) => ({
      _id: String(r._id),
      strategyId: r.agentId,
      strategyName: r.agentName,
      bar: r.bar,
      dataSource: r.cexSource,
      symbol: r.symbol,
      status: r.status,
      resolution: r.resolution,
      clearSignal: r.clearSignal,
      entry: r.entry,
      stopLoss: r.stopLoss,
      firstTarget: r.firstTarget,
      priceAtSignal: r.priceAtSignal,
      notionalUsd: r.notionalUsd,
      simExitPrice: r.simExitPrice,
      simPnlUsd: r.simPnlUsd,
      experimentId: r.summary?.experimentId ?? experimentId,
      createdAt: r.createdAt?.toISOString?.() ?? null,
      resolvedAt: r.resolvedAt?.toISOString?.() ?? null,
    })),
    total,
  };
}

export async function runBtcQuantSignalCycle() {
  await ensureBtcQuantBootstrapped();
  const state = await BtcQuantExperimentState.findById("singleton");
  const experimentId = state.activeExperimentId;
  const cfg = mergedSimConfig(state);

  const signalCache = new Map();
  const opened = [];
  const skipped = [];
  const errors = [];

  for (const strategy of BTC_QUANT_STRATEGIES) {
    try {
      const openCount = await TradingExperimentRun.countDocuments({
        ...experimentFilter(experimentId),
        agentId: strategy.id,
        status: "open",
      });
      if (openCount >= cfg.maxConcurrentPositions) {
        skipped.push({ strategyId: strategy.id, reason: "max_concurrent" });
        continue;
      }

      const ledger = await computeAgentLedger(experimentId, strategy.id);
      const notional = computeExperimentNotionalUsd(ledger.cashUsd);
      if (notional < TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD) {
        skipped.push({ strategyId: strategy.id, reason: "insufficient_cash" });
        continue;
      }

      const cacheKey = strategy.bar;
      let cached = signalCache.get(cacheKey);
      if (!cached) {
        const built = await buildBtcOnchainSignalReport({
          bar: strategy.bar,
          limit: 200,
        });
        const gateSignals = extractBtcQuantGateSignals(built.report);
        cached = {
          built,
          gateSignals,
          fields: extractSignalFields(built.report),
        };
        signalCache.set(cacheKey, cached);
      }

      const gate = applyBtcQuantSignalGate(strategy, cached.gateSignals);
      if (!gate.pass) {
        skipped.push({ strategyId: strategy.id, reason: "gate_failed", details: gate.reasons });
        continue;
      }

      if (cached.fields.clearSignal !== "BUY") {
        skipped.push({ strategyId: strategy.id, reason: "not_buy" });
        continue;
      }

      const levels = resolveTradeLevels(strategy, cached.fields);
      if (!levels.valid) {
        skipped.push({ strategyId: strategy.id, reason: "invalid_levels" });
        continue;
      }

      if (cached.built.anchorCloseMs != null) {
        const dup = await TradingExperimentRun.findOne({
          ...experimentFilter(experimentId),
          agentId: strategy.id,
          anchorCloseMs: cached.built.anchorCloseMs,
          status: { $in: ["open", "win", "loss", "expired"] },
        }).lean();
        if (dup) {
          skipped.push({ strategyId: strategy.id, reason: "duplicate_anchor" });
          continue;
        }
      }

      const run = await TradingExperimentRun.create({
        suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
        agentId: strategy.id,
        agentName: strategy.name,
        token: BTC_QUANT_TOKEN,
        bar: strategy.bar,
        limit: 200,
        symbol: cached.built.instrument || BTC_ONCHAIN_SYMBOL,
        cexSource: BTC_ONCHAIN_DATA_SOURCE,
        anchorCloseMs: cached.built.anchorCloseMs,
        clearSignal: cached.fields.clearSignal,
        entry: levels.entry,
        stopLoss: levels.stopLoss,
        firstTarget: levels.firstTarget,
        priceAtSignal: cached.fields.priceAtSignal ?? levels.entry,
        confidence: cached.fields.confidence,
        status: "open",
        notionalUsd: notional,
        summary: {
          experimentId,
          btcOnchain: true,
          gateReasons: [],
          notes: strategy.notes,
          onchainAsset: "cbBTC",
        },
      });

      opened.push({ strategyId: strategy.id, runId: String(run._id), notionalUsd: notional });
    } catch (e) {
      errors.push({
        strategyId: strategy.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { experimentId, opened, skipped, errors };
}

export async function resolveOpenBtcQuantRuns() {
  await ensureBtcQuantBootstrapped();
  const state = await BtcQuantExperimentState.findById("singleton");
  const experimentId = state.activeExperimentId;

  const openRuns = await TradingExperimentRun.find({
    ...experimentFilter(experimentId),
    status: "open",
  }).lean();

  const px = await fetchBtcSpotPrice();
  if (!(px > 0)) {
    return { experimentId, resolved: 0, stillOpen: openRuns.length, errors: ["no_price"] };
  }

  let resolved = 0;
  const errors = [];

  for (const run of openRuns) {
    try {
      const strategy = resolveBtcQuantStrategyById(run.agentId);
      const exit = strategy?.exit ?? {};
      const entry = Number(run.entry);
      const sl = Number(run.stopLoss);
      const tp = Number(run.firstTarget);
      const notional = Number(run.notionalUsd) || TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD;

      let status = null;
      let exitPx = px;
      if (px >= tp) {
        status = "win";
        exitPx = tp;
      } else if (px <= sl) {
        status = "loss";
        exitPx = sl;
      } else if (run.anchorCloseMs != null && strategy) {
        const holdMs = maxHoldMs(strategy.bar, exit.maxBars ?? 48);
        if (Date.now() > run.anchorCloseMs + holdMs) {
          status = "expired";
          exitPx = px;
        }
      }

      if (!status) continue;

      const simPnlUsd = entry > 0 && exitPx > 0 ? roundUsd(notional * (exitPx / entry - 1)) : 0;
      const u = await TradingExperimentRun.updateOne(
        { _id: run._id, status: "open" },
        {
          $set: {
            status,
            simExitPrice: exitPx,
            simPnlUsd,
            resolvedAt: new Date(),
            resolution: status === "expired" ? "max_hold" : status,
          },
        },
      );
      if (u.modifiedCount > 0) resolved += 1;
    } catch (e) {
      errors.push({
        runId: String(run._id),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const stillOpen = await TradingExperimentRun.countDocuments({
    ...experimentFilter(experimentId),
    status: "open",
  });

  return { experimentId, resolved, stillOpen, errors };
}

export function listBtcQuantStrategies() {
  return BTC_QUANT_STRATEGIES.map((s) => ({
    id: s.id,
    name: s.name,
    bar: s.bar,
    dataSource: s.dataSource,
    signalGate: s.signalGate,
    exit: s.exit,
    notes: s.notes,
  }));
}
