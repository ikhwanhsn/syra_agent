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
import {
  BTC_QUANT_LANE_IDS,
  BTC_QUANT_LANES,
  getBtcQuantLaneDef,
} from "../config/btcQuantLanes.js";
import { resolveBtcQuantStrategies, resolveBtcQuantStrategyById } from "./btcQuantStrategyResolve.js";
import {
  isStrategyOnEvolutionCooldown,
  pickBestBtcQuantStrategy,
  rankBtcQuantStrategiesByPnl,
  ensureBtcQuantLaneStrategyVariants,
} from "./btcQuantExperimentEvolution.js";
import BtcQuantStrategyOverride from "../models/BtcQuantStrategyOverride.js";
import BtcQuantEvolutionState from "../models/BtcQuantEvolutionState.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

/** @type {Map<string, Promise<{ experimentId: string; lane: string }>>} */
const bootPromises = new Map();

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

/** @param {ReturnType<typeof getBtcQuantLaneDef>} laneDef */
function newExperimentId(laneDef) {
  return `${laneDef.idPrefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

/** @param {unknown} [lane] */
async function loadLaneState(lane) {
  const laneDef = getBtcQuantLaneDef(lane);
  await ensureBtcQuantBootstrapped(laneDef.lane);
  return BtcQuantExperimentState.findById(laneDef.stateId).lean();
}

export async function ensureBtcQuantBootstrapped(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  const existing = bootPromises.get(laneDef.lane);
  if (existing) return existing;

  const promise = (async () => {
    let state = await BtcQuantExperimentState.findById(laneDef.stateId);
    if (state?.activeExperimentId) {
      return { experimentId: state.activeExperimentId, lane: laneDef.lane };
    }

    const nextId = newExperimentId(laneDef);
    state = await BtcQuantExperimentState.findOneAndUpdate(
      { _id: laneDef.stateId },
      {
        $setOnInsert: {
          activeExperimentId: nextId,
          title: laneDef.title,
          startedAt: new Date(),
          simConfig: {
            startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
            maxConcurrentPositions: BTC_QUANT_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
          },
        },
      },
      { upsert: true, new: true },
    );
    return { experimentId: state.activeExperimentId, lane: laneDef.lane };
  })().finally(() => {
    bootPromises.delete(laneDef.lane);
  });

  bootPromises.set(laneDef.lane, promise);
  const boot = await promise;
  if (laneDef.seedMutatedStrategies) {
    await repairMirroredBtc2Lane(laneDef);
    await ensureBtcQuantLaneStrategyVariants(laneDef.lane);
  }
  return boot;
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

function experimentFilter(experimentId, lane) {
  const filter = {
    suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
    "summary.experimentId": experimentId,
  };
  if (lane) filter["summary.lane"] = lane;
  return filter;
}

/** One-time repair when btc2 mirrored btc1 before lane variants existed. */
async function repairMirroredBtc2Lane(laneDef) {
  if (laneDef.lane !== "btc2" || !laneDef.seedMutatedStrategies) return;

  const overrideCount = await BtcQuantStrategyOverride.countDocuments({ lane: laneDef.lane });
  if (overrideCount > 0) return;

  const [state1, state2] = await Promise.all([
    BtcQuantExperimentState.findById(BTC_QUANT_LANES.btc1.stateId).lean(),
    BtcQuantExperimentState.findById(laneDef.stateId).lean(),
  ]);
  if (!state1?.activeExperimentId || !state2?.activeExperimentId) return;
  if (state1.activeExperimentId === state2.activeExperimentId) {
    await wipeBtcQuantLaneRuns(laneDef, state2.activeExperimentId);
    return;
  }

  const [sum1, sum2] = await Promise.all([
    TradingExperimentRun.aggregate([
      {
        $match: {
          ...experimentFilter(state1.activeExperimentId, "btc1"),
          status: { $in: ["win", "loss", "expired"] },
        },
      },
      { $group: { _id: null, pnl: { $sum: { $ifNull: ["$simPnlUsd", 0] } } } },
    ]),
    TradingExperimentRun.aggregate([
      {
        $match: {
          ...experimentFilter(state2.activeExperimentId, "btc2"),
          status: { $in: ["win", "loss", "expired"] },
        },
      },
      { $group: { _id: null, pnl: { $sum: { $ifNull: ["$simPnlUsd", 0] } } } },
    ]),
  ]);

  const pnl1 = sum1[0]?.pnl ?? 0;
  const pnl2 = sum2[0]?.pnl ?? 0;
  if (Math.abs(pnl1 - pnl2) < 0.01 && (sum1.length > 0 || sum2.length > 0)) {
    await wipeBtcQuantLaneRuns(laneDef, state2.activeExperimentId);
  }
}

/** Wipe mirrored paper-sim runs and rotate experiment id without touching strategy overrides. */
async function wipeBtcQuantLaneRuns(laneDef, oldExperimentId) {
  if (oldExperimentId) {
    await TradingExperimentRun.deleteMany({
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": oldExperimentId,
    });
  }
  const state = await BtcQuantExperimentState.findById(laneDef.stateId);
  if (!state) return;
  state.activeExperimentId = newExperimentId(laneDef);
  state.startedAt = new Date();
  state.title = laneDef.title;
  await state.save();
  bootPromises.delete(laneDef.lane);
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

/**
 * @param {string} experimentId
 * @param {number} agentId
 * @param {unknown} [lane]
 */
async function computeAgentLedger(experimentId, agentId, lane = "btc1") {
  const cfg = mergedSimConfig(await loadLaneState(lane));
  const baseFilter = { ...experimentFilter(experimentId, lane), agentId };

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

export async function getBtcQuantLabState(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  await ensureBtcQuantBootstrapped(laneDef.lane);
  const state = await loadLaneState(laneDef.lane);
  const experimentId = state?.activeExperimentId ?? null;
  const cfg = mergedSimConfig(state);
  const strategies = await resolveBtcQuantStrategies(laneDef.lane);
  const agents = await Promise.all(
    strategies.map((s) => computeAgentLedger(experimentId, s.id, laneDef.lane)),
  );
  return {
    lane: laneDef.lane,
    activeExperimentId: experimentId,
    title: state?.title ?? laneDef.title,
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

export async function getBtcQuantStats(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  const { activeExperimentId: experimentId } = await getBtcQuantLabState(laneDef.lane);
  const strategies = await resolveBtcQuantStrategies(laneDef.lane);
  const agents = await Promise.all(
    strategies.map(async (s) => {
      const ledger = await computeAgentLedger(experimentId, s.id, laneDef.lane);
      const settled = await TradingExperimentRun.find({
        ...experimentFilter(experimentId, laneDef.lane),
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
  return { agents, experimentId, lane: laneDef.lane };
}

export async function getBtcQuantOverview(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  const [state, stats] = await Promise.all([
    getBtcQuantLabState(laneDef.lane),
    getBtcQuantStats(laneDef.lane),
  ]);
  const experimentId = state.activeExperimentId;
  const agents = stats.agents;

  const settledRuns = await TradingExperimentRun.countDocuments({
    ...experimentFilter(experimentId, laneDef.lane),
    status: { $in: ["win", "loss", "expired"] },
  });
  const openPositions = await TradingExperimentRun.countDocuments({
    ...experimentFilter(experimentId, laneDef.lane),
    status: "open",
  });
  const sumPnlUsd = roundUsd(agents.reduce((sum, a) => sum + toNum(a.sumPnlUsd, 0), 0));
  const sumEquityUsd = roundUsd(agents.reduce((sum, a) => sum + toNum(a.equityUsd, 0), 0));

  const rankedByScore = await rankBtcQuantStrategiesByPnl(experimentId);
  const leaderRow = rankedByScore[0] ?? null;
  const leader = leaderRow
    ? agents.find((a) => a.strategyId === leaderRow.strategyId) ?? null
    : [...agents].sort((a, b) => toNum(b.sumPnlUsd) - toNum(a.sumPnlUsd))[0] ?? null;
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
    lane: laneDef.lane,
    btcSpotPriceUsd: await fetchBtcSpotPrice(),
    onchain: {
      venue: "Solana",
      asset: "cbBTC",
      execution: "Jupiter swap",
      ohlcv: "Binance BTCUSDT",
      spot: "Jupiter Price API (cbBTC) · Binance fallback",
    },
    simulation: {
      activeExperimentId: experimentId,
      strategyCount: (await resolveBtcQuantStrategies(laneDef.lane)).length,
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
  lane = "btc1",
}) {
  const laneDef = getBtcQuantLaneDef(lane);
  const state = await loadLaneState(laneDef.lane);
  const experimentId = experimentIdOpt || state?.activeExperimentId;
  if (!experimentId) return { runs: [], total: 0 };

  const filter = { ...experimentFilter(experimentId, laneDef.lane) };
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

export async function runBtcQuantSignalCycle(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  await ensureBtcQuantBootstrapped(laneDef.lane);
  const state = await BtcQuantExperimentState.findById(laneDef.stateId);
  const experimentId = state.activeExperimentId;
  const cfg = mergedSimConfig(state);

  const signalCache = new Map();
  const opened = [];
  const skipped = [];
  const errors = [];

  const strategies = await resolveBtcQuantStrategies(laneDef.lane);

  for (const strategy of strategies) {
    try {
      if (await isStrategyOnEvolutionCooldown(laneDef.lane, strategy.id)) {
        skipped.push({ strategyId: strategy.id, reason: "evolution_cooldown" });
        continue;
      }

      const openCount = await TradingExperimentRun.countDocuments({
        ...experimentFilter(experimentId, laneDef.lane),
        agentId: strategy.id,
        status: "open",
      });
      if (openCount >= cfg.maxConcurrentPositions) {
        skipped.push({ strategyId: strategy.id, reason: "max_concurrent" });
        continue;
      }

      const ledger = await computeAgentLedger(experimentId, strategy.id, laneDef.lane);
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
          ...experimentFilter(experimentId, laneDef.lane),
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
        // Shared TradingExperimentRun field; BTC onchain suite stores onchain dataSource here.
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
          lane: laneDef.lane,
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

  return { lane: laneDef.lane, experimentId, opened, skipped, errors };
}

export async function runAllBtcQuantSignalCycles() {
  /** @type {Record<string, Awaited<ReturnType<typeof runBtcQuantSignalCycle>>>} */
  const lanes = {};
  for (const lane of BTC_QUANT_LANE_IDS) {
    lanes[lane] = await runBtcQuantSignalCycle(lane);
  }
  return { lanes };
}

export async function resolveOpenBtcQuantRuns(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  await ensureBtcQuantBootstrapped(laneDef.lane);
  const state = await BtcQuantExperimentState.findById(laneDef.stateId);
  const experimentId = state.activeExperimentId;

  const openRuns = await TradingExperimentRun.find({
    ...experimentFilter(experimentId, laneDef.lane),
    status: "open",
  }).lean();

  const px = await fetchBtcSpotPrice();
  if (!(px > 0)) {
    return { experimentId, resolved: 0, stillOpen: openRuns.length, errors: ["no_price"] };
  }

  let resolved = 0;
  const errors = [];
  /** @type {import('mongoose').AnyBulkWriteOperation[]} */
  const bulkOps = [];

  for (const run of openRuns) {
    try {
      const strategy = await resolveBtcQuantStrategyById(laneDef.lane, run.agentId);
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
      bulkOps.push({
        updateOne: {
          filter: { _id: run._id, status: "open" },
          update: {
            $set: {
              status,
              simExitPrice: exitPx,
              simPnlUsd,
              resolvedAt: new Date(),
              resolution: status === "expired" ? "max_hold" : status,
            },
          },
        },
      });
    } catch (e) {
      errors.push({
        runId: String(run._id),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (bulkOps.length > 0) {
    const bulkResult = await TradingExperimentRun.bulkWrite(bulkOps, { ordered: false });
    resolved = bulkResult.modifiedCount ?? 0;
  }

  const stillOpen = await TradingExperimentRun.countDocuments({
    ...experimentFilter(experimentId, laneDef.lane),
    status: "open",
  });

  return { lane: laneDef.lane, experimentId, resolved, stillOpen, errors };
}

export async function resolveAllOpenBtcQuantRuns() {
  /** @type {Record<string, Awaited<ReturnType<typeof resolveOpenBtcQuantRuns>>>} */
  const lanes = {};
  for (const lane of BTC_QUANT_LANE_IDS) {
    lanes[lane] = await resolveOpenBtcQuantRuns(lane);
  }
  return { lanes };
}

export async function listBtcQuantStrategies(lane = "btc1") {
  const strategies = await resolveBtcQuantStrategies(lane);
  return strategies.map((s) => ({
    id: s.id,
    name: s.name,
    bar: s.bar,
    dataSource: s.dataSource,
    signalGate: s.signalGate,
    exit: s.exit,
    notes: s.notes,
  }));
}

/**
 * Reset a BTC quant lane: wipe runs, evolution state, strategy overrides; start fresh cohort.
 * Does NOT touch btc_quant_real_* collections.
 * @param {{ lane?: string; title?: string }} [opts]
 */
export async function resetBtcQuantFromScratch(opts = {}) {
  const laneDef = getBtcQuantLaneDef(opts.lane ?? "btc1");
  await ensureBtcQuantBootstrapped(laneDef.lane);

  const state = await BtcQuantExperimentState.findById(laneDef.stateId);
  if (!state) throw new Error(`BTC quant state missing for lane ${laneDef.lane}`);

  const oldExperimentId = state.activeExperimentId;
  const cfg = mergedSimConfig(state);

  if (oldExperimentId) {
    await TradingExperimentRun.deleteMany({
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": oldExperimentId,
    });
  }

  await BtcQuantStrategyOverride.deleteMany({ lane: laneDef.lane });
  await BtcQuantEvolutionState.deleteOne({ _id: laneDef.lane });

  const nextId = newExperimentId(laneDef);
  state.activeExperimentId = nextId;
  state.title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : `${laneDef.title} (reset)`;
  state.startedAt = new Date();
  state.simConfig = {
    startingBankUsd: cfg.startingBankUsd,
    maxConcurrentPositions: cfg.maxConcurrentPositions,
  };
  await state.save();

  bootPromises.delete(laneDef.lane);

  return { lane: laneDef.lane, nextExperimentId: nextId, previousExperimentId: oldExperimentId };
}

/**
 * Reset both btc1 and btc2 lanes.
 * @param {{ title?: string }} [opts]
 */
export async function resetAllBtcQuantFromScratch(opts = {}) {
  /** @type {Record<string, Awaited<ReturnType<typeof resetBtcQuantFromScratch>>>} */
  const lanes = {};
  for (const lane of BTC_QUANT_LANE_IDS) {
    lanes[lane] = await resetBtcQuantFromScratch({ ...opts, lane });
  }
  return { lanes };
}

export { pickBestBtcQuantStrategy, rankBtcQuantStrategiesByPnl };
