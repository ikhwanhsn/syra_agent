/**
 * Stocks news experiment — paper trading xStocks via Jupiter price feeds.
 */
import crypto from "node:crypto";
import StocksExperimentState from "../models/StocksExperimentState.js";
import StocksExperimentRun from "../models/StocksExperimentRun.js";
import StocksExperimentAgentState from "../models/StocksExperimentAgentState.js";
import {
  STOCKS_EXPERIMENT_DEFAULTS,
  STOCKS_EXPERIMENT_STRATEGIES,
} from "../config/stocksExperimentStrategies.js";
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
  resolveStocksExperimentStrategies,
  resolveStocksStrategyById,
} from "./stocksStrategyResolve.js";
import {
  resolveStocksUniverse,
  fetchAllStockNewsSignals,
  scoreStockSignal,
  applyStocksSignalGate,
} from "./stocksNewsSignals.js";
import { fetchStockPricesBatch, fetchStockPrice } from "./stocksPriceFeed.js";
import { rankStocksStrategiesByPnl } from "./stocksExperimentEvolution.js";
import { computeStocksLeaderScore, MIN_DECIDED_FOR_LEADER } from "./stocksExperimentScoring.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

/** @type {Promise<{ experimentId: string }> | null} */
let bootPromise = null;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function newExperimentId() {
  return `stocks-cohort-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export async function ensureStocksBootstrapped() {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    let state = await StocksExperimentState.findById("singleton");
    if (state?.activeExperimentId) {
      await ensureAgentStates(state.activeExperimentId);
      return { experimentId: state.activeExperimentId };
    }

    const nextId = newExperimentId();
    state = await StocksExperimentState.findOneAndUpdate(
      { _id: "singleton" },
      {
        $setOnInsert: {
          activeExperimentId: nextId,
          title: "Stocks news trading lab",
          startedAt: new Date(),
          simConfig: {
            startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
            maxConcurrentPositions: STOCKS_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
            maxPositionPct: STOCKS_EXPERIMENT_DEFAULTS.maxPositionPct,
          },
        },
      },
      { upsert: true, new: true },
    );

    await ensureAgentStates(state.activeExperimentId);
    return { experimentId: state.activeExperimentId };
  })().finally(() => {
    bootPromise = null;
  });

  return bootPromise;
}

/** @param {string} experimentId */
async function ensureAgentStates(experimentId) {
  const strategies = await resolveStocksExperimentStrategies();
  const ops = strategies.map((s) => ({
    updateOne: {
      filter: { experimentId, strategyId: s.id },
      update: {
        $setOnInsert: {
          cashUsd: TRADING_EXPERIMENT_STARTING_USD,
          startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
        },
      },
      upsert: true,
    },
  }));
  if (ops.length > 0) {
    await StocksExperimentAgentState.bulkWrite(ops, { ordered: false });
  }
}

function mergedSimConfig(stateDoc) {
  const s = stateDoc?.simConfig || {};
  return {
    startingBankUsd: toNum(s.startingBankUsd, TRADING_EXPERIMENT_STARTING_USD),
    maxConcurrentPositions: toNum(
      s.maxConcurrentPositions,
      STOCKS_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
    ),
    maxPositionPct: toNum(s.maxPositionPct, STOCKS_EXPERIMENT_DEFAULTS.maxPositionPct),
  };
}

/**
 * @param {string} experimentId
 * @param {number} strategyId
 */
async function computeAgentLedger(experimentId, strategyId) {
  const cfg = mergedSimConfig(await StocksExperimentState.findById("singleton").lean());
  const baseFilter = { experimentId, strategyId };

  const [openRuns, settledAgg, agentState] = await Promise.all([
    StocksExperimentRun.find({ ...baseFilter, status: "open" }).lean(),
    StocksExperimentRun.aggregate([
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
    StocksExperimentAgentState.findOne({ experimentId, strategyId }).lean(),
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
    strategyId,
    cashUsd,
    startingBankUsd: agentState?.startingBankUsd ?? cfg.startingBankUsd,
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

export async function getStocksLabState() {
  await ensureStocksBootstrapped();
  const state = await StocksExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId ?? null;
  const cfg = mergedSimConfig(state);
  const strategies = await resolveStocksExperimentStrategies();
  const agents = await Promise.all(
    strategies.map((s) => computeAgentLedger(experimentId, s.id)),
  );

  return {
    activeExperimentId: experimentId,
    title: state?.title ?? "Stocks news trading lab",
    startedAt: state?.startedAt?.toISOString?.() ?? null,
    simConfig: cfg,
    agents: agents.map((a) => ({
      strategyId: a.strategyId,
      cashUsd: a.cashUsd,
      startingBankUsd: a.startingBankUsd,
      openPositions: a.openPositions,
      deployedUsd: a.deployedUsd,
      equityUsd: a.equityUsd,
      returnPct: a.returnPct,
    })),
  };
}

export async function getStocksStats() {
  await ensureStocksBootstrapped();
  const state = await StocksExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId ?? null;
  const strategies = await resolveStocksExperimentStrategies();

  const agents = await Promise.all(
    strategies.map(async (s) => {
      const ledger = await computeAgentLedger(experimentId, s.id);
      return {
        strategyId: s.id,
        strategyName: s.name,
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
        leaderScore: computeStocksLeaderScore(ledger),
      };
    }),
  );

  agents.sort((a, b) => {
    const scoreDiff = (b.leaderScore ?? -999) - (a.leaderScore ?? -999);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.sumPnlUsd ?? 0) - (a.sumPnlUsd ?? 0);
  });

  return { experimentId, agents };
}

export async function getStocksOverview() {
  const [labState, stats] = await Promise.all([getStocksLabState(), getStocksStats()]);
  const universe = await resolveStocksUniverse();
  const leader = stats.agents[0] ?? null;

  const settledCount = await StocksExperimentRun.countDocuments({
    experimentId: labState.activeExperimentId,
    status: { $in: ["win", "loss", "expired"] },
  });
  const openCount = await StocksExperimentRun.countDocuments({
    experimentId: labState.activeExperimentId,
    status: "open",
  });

  return {
    activeExperimentId: labState.activeExperimentId,
    startedAt: labState.startedAt,
    universeCount: universe.length,
    strategyCount: stats.agents.length,
    settledRuns: settledCount,
    openPositions: openCount,
    sumEquityUsd: roundUsd(stats.agents.reduce((s, a) => s + (a.equityUsd ?? 0), 0)),
    sumPnlUsd: roundUsd(stats.agents.reduce((s, a) => s + (a.sumPnlUsd ?? 0), 0)),
    leaderStrategyId: leader?.strategyId ?? null,
    leaderStrategyName: leader?.strategyName ?? null,
    leaderSumPnlUsd: leader?.sumPnlUsd ?? null,
    leaderWinRatePct: leader?.winRatePct ?? null,
    leaderReturnPct: leader?.returnPct ?? null,
  };
}

export async function listStocksRuns({ limit, offset, strategyId, experimentId, status } = {}) {
  await ensureStocksBootstrapped();
  const state = await StocksExperimentState.findById("singleton").lean();
  const expId = experimentId ?? state?.activeExperimentId ?? null;

  const filter = { experimentId: expId };
  if (strategyId != null) filter.strategyId = Number(strategyId);
  if (status) filter.status = status;

  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);

  const [runs, total] = await Promise.all([
    StocksExperimentRun.find(filter).sort({ createdAt: -1 }).skip(off).limit(lim).lean(),
    StocksExperimentRun.countDocuments(filter),
  ]);

  return {
    runs: runs.map((r) => ({
      id: String(r._id),
      experimentId: r.experimentId,
      strategyId: r.strategyId,
      strategyName: r.strategyName,
      symbol: r.symbol,
      mint: r.mint,
      nasdaqTicker: r.nasdaqTicker,
      entryPriceUsd: r.entryPriceUsd,
      notionalUsd: r.notionalUsd,
      signalSnapshot: r.signalSnapshot,
      newsHeadline: r.newsHeadline,
      status: r.status,
      resolution: r.resolution,
      simExitPrice: r.simExitPrice,
      simPnlUsd: r.simPnlUsd,
      simPnlPct: r.simPnlPct,
      openedAt: r.openedAt?.toISOString?.() ?? null,
      resolvedAt: r.resolvedAt?.toISOString?.() ?? null,
      createdAt: r.createdAt?.toISOString?.() ?? null,
    })),
    total,
  };
}

export async function getStocksUniverse() {
  const universe = await resolveStocksUniverse();
  const priceMap = await fetchStockPricesBatch(
    universe.map((u) => ({ symbol: u.symbol, mint: u.mint, nasdaqTicker: u.nasdaqTicker })),
  );

  return universe.map((u) => ({
    ...u,
    priceUsd: priceMap[u.symbol]?.priceUsd ?? null,
    priceSource: priceMap[u.symbol]?.source ?? null,
    nasdaqPriceUsd: priceMap[u.symbol]?.nasdaqPriceUsd ?? null,
  }));
}

export async function getStocksNewsFeed({ limit = 12 } = {}) {
  const universe = await resolveStocksUniverse();
  const symbols = universe.map((u) => u.symbol);
  const priceMap = await fetchStockPricesBatch(
    universe.map((u) => ({ symbol: u.symbol, mint: u.mint, nasdaqTicker: u.nasdaqTicker })),
  );

  const priceCtx = Object.fromEntries(
    symbols.map((sym) => [
      sym,
      {
        priceUsd: priceMap[sym]?.priceUsd,
        nasdaqPriceUsd: priceMap[sym]?.nasdaqPriceUsd,
      },
    ]),
  );

  const signals = await fetchAllStockNewsSignals(symbols, priceCtx);
  return signals
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, normalizeLimit(limit));
}

export async function runStocksSignalCycle() {
  await ensureStocksBootstrapped();
  const state = await StocksExperimentState.findById("singleton");
  const experimentId = state.activeExperimentId;
  const cfg = mergedSimConfig(state);

  const universe = await resolveStocksUniverse();
  const priceMap = await fetchStockPricesBatch(
    universe.map((u) => ({ symbol: u.symbol, mint: u.mint, nasdaqTicker: u.nasdaqTicker })),
  );

  const priceCtx = Object.fromEntries(
    universe.map((u) => [
      u.symbol,
      {
        priceUsd: priceMap[u.symbol]?.priceUsd,
        nasdaqPriceUsd: priceMap[u.symbol]?.nasdaqPriceUsd,
      },
    ]),
  );

  const allSignals = await fetchAllStockNewsSignals(
    universe.map((u) => u.symbol),
    priceCtx,
  );
  const signalBySymbol = new Map(allSignals.map((s) => [s.symbol, s]));

  const opened = [];
  const skipped = [];
  const errors = [];
  const strategies = await resolveStocksExperimentStrategies();

  for (const strategy of strategies) {
    try {
      const openCount = await StocksExperimentRun.countDocuments({
        experimentId,
        strategyId: strategy.id,
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

      const allowedSymbols =
        strategy.universeFilter?.symbols ?? universe.map((u) => u.symbol);
      const candidates = [];

      for (const sym of allowedSymbols) {
        const signal = signalBySymbol.get(sym);
        const uniEntry = universe.find((u) => u.symbol === sym);
        if (!signal || !uniEntry) continue;

        const gate = applyStocksSignalGate(strategy, signal);
        if (!gate.pass) continue;

        if (strategy.momentumConfirm && signal.momentumScore < 0.4) continue;
        if (signal.sentimentScore < (strategy.minSentiment ?? -1)) continue;

        const score = scoreStockSignal(strategy.signalWeights, signal);
        const px = priceMap[sym]?.priceUsd;
        if (!(px > 0)) continue;

        candidates.push({ sym, signal, uniEntry, score, priceUsd: px });
      }

      if (candidates.length === 0) {
        skipped.push({ strategyId: strategy.id, reason: "no_candidates" });
        continue;
      }

      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      const dup = await StocksExperimentRun.findOne({
        experimentId,
        strategyId: strategy.id,
        symbol: best.sym,
        status: "open",
      }).lean();
      if (dup) {
        skipped.push({ strategyId: strategy.id, reason: "already_open_symbol" });
        continue;
      }

      const run = await StocksExperimentRun.create({
        experimentId,
        strategyId: strategy.id,
        strategyName: strategy.name,
        symbol: best.sym,
        mint: best.uniEntry.mint,
        nasdaqTicker: best.uniEntry.nasdaqTicker,
        entryPriceUsd: best.priceUsd,
        notionalUsd: notional,
        signalSnapshot: best.signal,
        newsHeadline: best.signal.topHeadline,
        status: "open",
        openedAt: new Date(),
      });

      opened.push({
        strategyId: strategy.id,
        runId: String(run._id),
        symbol: best.sym,
        notionalUsd: notional,
      });
    } catch (e) {
      errors.push({
        strategyId: strategy.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { experimentId, opened, skipped, errors };
}

export async function resolveOpenStocksRuns() {
  await ensureStocksBootstrapped();
  const state = await StocksExperimentState.findById("singleton");
  const experimentId = state.activeExperimentId;

  const openRuns = await StocksExperimentRun.find({ experimentId, status: "open" })
    .select("_id strategyId mint nasdaqTicker entryPriceUsd notionalUsd openedAt")
    .lean();
  if (openRuns.length === 0) {
    return { experimentId, resolved: 0, stillOpen: 0, errors: [] };
  }

  let resolved = 0;
  const errors = [];

  for (const run of openRuns) {
    try {
      const strategy = await resolveStocksStrategyById(run.strategyId);
      const exit = strategy?.exit ?? {};
      const entry = Number(run.entryPriceUsd);
      const notional = Number(run.notionalUsd) || TRADING_EXPERIMENT_MIN_TRADE_NOTIONAL_USD;

      const priceResult = await fetchStockPrice(run.mint, run.nasdaqTicker);
      if (!priceResult?.priceUsd) {
        errors.push({ runId: String(run._id), error: "no_price" });
        continue;
      }
      const px = priceResult.priceUsd;

      const stopLossPct = Number(exit.stopLossPct ?? -5);
      const takeProfitPct = Number(exit.takeProfitPct ?? 8);
      const maxHoldHours = Number(strategy?.maxHoldHours ?? STOCKS_EXPERIMENT_DEFAULTS.defaultMaxHoldHours);
      const pnlPct = entry > 0 ? ((px - entry) / entry) * 100 : 0;

      let status = null;
      let resolution = null;
      let exitPx = px;

      if (pnlPct >= takeProfitPct) {
        status = "win";
        resolution = "take_profit";
        exitPx = entry * (1 + takeProfitPct / 100);
      } else if (pnlPct <= stopLossPct) {
        status = "loss";
        resolution = "stop_loss";
        exitPx = entry * (1 + stopLossPct / 100);
      } else if (run.openedAt) {
        const holdMs = maxHoldHours * 3_600_000;
        if (Date.now() - new Date(run.openedAt).getTime() > holdMs) {
          status = pnlPct >= 0 ? "win" : "expired";
          resolution = "max_hold";
          exitPx = px;
        }
      }

      if (!status) {
        await StocksExperimentRun.updateOne(
          { _id: run._id },
          { $set: { lastEvaluatedAt: new Date() } },
        );
        continue;
      }

      const simPnlUsd =
        entry > 0 && exitPx > 0 ? roundUsd(notional * (exitPx / entry - 1)) : 0;
      const simPnlPct = entry > 0 ? roundUsd(((exitPx - entry) / entry) * 100) : 0;
      await StocksExperimentRun.updateOne(
        { _id: run._id, status: "open" },
        {
          $set: {
            status,
            resolution,
            simExitPrice: exitPx,
            simPnlUsd,
            simPnlPct,
            resolvedAt: new Date(),
            lastEvaluatedAt: new Date(),
          },
        },
      );

      resolved += 1;
    } catch (e) {
      errors.push({
        runId: String(run._id),
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const stillOpen = await StocksExperimentRun.countDocuments({
    experimentId,
    status: "open",
  });

  return { experimentId, resolved, stillOpen, errors };
}

export async function rankStocksByNetPnl(experimentId) {
  const expId =
    experimentId ??
    (await StocksExperimentState.findById("singleton").lean())?.activeExperimentId;
  return rankStocksStrategiesByPnl(expId);
}

export async function pickBestStocksAgent() {
  const ranked = await rankStocksByNetPnl();
  const eligible = ranked.filter(
    (r) =>
      r.decided >= MIN_DECIDED_FOR_LEADER &&
      (r.winRate ?? 0) >= 0.48 &&
      (r.sumPnlUsd ?? 0) > 0 &&
      computeStocksLeaderScore(r) > 0,
  );
  return eligible[0] ?? ranked.find((r) => (r.sumPnlUsd ?? 0) > 0) ?? null;
}

export async function resetStocksFromScratch() {
  const nextId = newExperimentId();
  await StocksExperimentRun.deleteMany({});
  await StocksExperimentAgentState.deleteMany({});
  await StocksExperimentState.findOneAndUpdate(
    { _id: "singleton" },
    {
      $set: {
        activeExperimentId: nextId,
        startedAt: new Date(),
        title: "Stocks news trading lab",
        simConfig: {
          startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
          maxConcurrentPositions: STOCKS_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
          maxPositionPct: STOCKS_EXPERIMENT_DEFAULTS.maxPositionPct,
        },
      },
    },
    { upsert: true, new: true },
  );
  await ensureAgentStates(nextId);
  return { experimentId: nextId };
}

export async function listStocksStrategies() {
  const strategies = await resolveStocksExperimentStrategies();
  return strategies.map((s) => ({
    id: s.id,
    name: s.name,
    minSentiment: s.minSentiment,
    eventWeight: s.eventWeight,
    momentumConfirm: s.momentumConfirm,
    maxHoldHours: s.maxHoldHours,
    universeFilter: s.universeFilter,
    signalGate: s.signalGate,
    exit: s.exit,
    notes: s.notes,
  }));
}

export { computeStocksLeaderScore } from "./stocksExperimentScoring.js";
