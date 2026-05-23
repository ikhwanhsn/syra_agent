import mongoose from "mongoose";
import LpExperimentRun from "../models/LpExperimentRun.js";
import LpExperimentState from "../models/LpExperimentState.js";
import LpExperimentAgentState from "../models/LpExperimentAgentState.js";
import { LP_AGENT_EXPERIMENT_DEFAULTS } from "../config/lpAgentExperimentStrategies.js";
import { resolveLpExperimentStrategies, resolveLpStrategyById } from "./lpExperimentStrategyResolve.js";
import { fetchMeteoraPoolDetail, fetchMeteoraPools } from "./meteoraDlmmClient.js";
import { scorePool } from "./lpExperimentScoring.js";

const OPEN_POSITION_COOLDOWN_MS = 90 * 60 * 1000;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

let cachedSolPrice = { value: 150, ts: 0 };
let bootPromise = null;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Mongo expression: net PnL in USD using SOL PnL × (depositUsd/depositSol) at open. */
const mongoNetPnlUsdExpr = {
  $multiply: [
    { $ifNull: ["$simNetPnlSol", 0] },
    {
      $cond: [
        { $gt: [{ $ifNull: ["$depositSol", 0] }, 0] },
        { $divide: [{ $ifNull: ["$depositUsd", 0] }, "$depositSol"] },
        0,
      ],
    },
  ],
};

/** Mongo expression: open+close chain fees in USD (same USD/SOL ratio as position). */
const mongoChainFeesUsdExpr = {
  $multiply: [
    { $add: [{ $ifNull: ["$simOpenFeeSol", 0] }, { $ifNull: ["$simCloseFeeSol", 0] }] },
    {
      $cond: [
        { $gt: [{ $ifNull: ["$depositSol", 0] }, 0] },
        { $divide: [{ $ifNull: ["$depositUsd", 0] }, "$depositSol"] },
        0,
      ],
    },
  ],
};

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

function mergedSimConfig(stateDoc) {
  const s = stateDoc?.simConfig || {};
  return {
    startingBankSol: toNum(s.startingBankSol, LP_AGENT_EXPERIMENT_DEFAULTS.startingBankSol),
    maxPositionSol: toNum(s.maxPositionSol, LP_AGENT_EXPERIMENT_DEFAULTS.maxPositionSol),
    maxConcurrentPositions: toNum(s.maxConcurrentPositions, LP_AGENT_EXPERIMENT_DEFAULTS.maxConcurrentPositions),
    openFeeBps: toNum(s.openFeeBps, LP_AGENT_EXPERIMENT_DEFAULTS.openFeeBps),
    closeFeeBps: toNum(s.closeFeeBps, LP_AGENT_EXPERIMENT_DEFAULTS.closeFeeBps),
  };
}

function feeSolFromBps(depositSol, bps) {
  return (toNum(depositSol) * toNum(bps)) / 10_000;
}

async function fetchSolPriceUsd() {
  const now = Date.now();
  if (now - cachedSolPrice.ts <= 20_000 && Number.isFinite(cachedSolPrice.value)) {
    return cachedSolPrice.value;
  }
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => ({}));
    const v = toNum(body?.solana?.usd, 0);
    if (v > 0) {
      cachedSolPrice = { value: v, ts: now };
      return v;
    }
  } catch {
    // fallback
  }
  return cachedSolPrice.value || 150;
}

function deriveSyntheticSignals(pool) {
  const volatilityScore = Math.max(
    0,
    Math.min(1, toNum(pool.feeTvlRatio) * 8 + Math.random() * 0.12),
  );
  return {
    organicScore: Math.max(0, Math.min(100, 50 + toNum(pool.feeTvlRatio) * 320 + Math.random() * 25)),
    holderCount: Math.floor(500 + toNum(pool.tvlUsd) / 250 + Math.random() * 1500),
    mcapUsd: Math.floor(Math.max(150_000, toNum(pool.tvlUsd) * (6 + Math.random() * 12))),
    smartWalletsPresent: toNum(pool.feeTvlRatio) > 0.045 || toNum(pool.volume24hUsd) > 140_000,
    narrativeScore: Math.max(1, Math.min(10, 4.5 + Math.random() * 4.5)),
    studyWinRate: Math.max(0.35, Math.min(0.8, 0.42 + toNum(pool.feeTvlRatio) * 2 + Math.random() * 0.2)),
    hiveConsensus: Math.max(0.2, Math.min(1, 0.3 + Math.random() * 0.6)),
    volatilityScore,
    priceVsAthPct: Math.max(20, Math.min(100, 35 + volatilityScore * 55 + Math.random() * 20)),
  };
}

function computePriceDriftPct(entry, current) {
  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(current) || current <= 0) return 0;
  return (current / entry - 1) * 100;
}

function computeFeeYieldPct(feeTvlRatio, hoursElapsed) {
  const f = toNum(feeTvlRatio, 0);
  if (f <= 0 || hoursElapsed <= 0) return 0;
  return f * (hoursElapsed / 24) * 100;
}

function shouldCloseByOor(run, detail, strategyExit, hoursElapsed) {
  const activeNow = toNum(detail.activeBinId, run.activeBinAtOpen);
  const activeAtOpen = toNum(run.activeBinAtOpen, activeNow);
  const delta = activeNow - activeAtOpen;
  const overBelow = Math.abs(Math.min(0, delta)) > toNum(run.binsBelow);
  const overAbove = Math.max(0, delta) > toNum(run.binsAbove);
  if (!overBelow && !overAbove) return false;
  return hoursElapsed * 60 >= toNum(strategyExit.oorWaitMin, 30);
}

/**
 * @param {import("mongoose").LeanDocument<any>} run
 * @param {Record<string, unknown>} detail
 * @param {Record<string, unknown>} strategyExit
 * @param {number} hoursElapsed
 * @param {typeof LP_AGENT_EXPERIMENT_DEFAULTS} simDefaults
 * @param {{ openFeeBps: number; closeFeeBps: number }} feeCfg
 */
function evaluateRunResolution(run, detail, strategyExit, hoursElapsed, simDefaults, feeCfg) {
  const priceDriftPct = computePriceDriftPct(toNum(run.entryPriceUsd), toNum(detail.currentPrice));
  const feeYieldPct = computeFeeYieldPct(toNum(detail.feeTvlRatio, run.feeTvlRatio), hoursElapsed);
  const netPnlPct = priceDriftPct + feeYieldPct;
  const simFeesEarnedSol = toNum(run.depositSol) * (feeYieldPct / 100);

  const exit = strategyExit || {};
  let status = "open";
  let resolution = null;
  if (priceDriftPct <= toNum(exit.stopLossPct, -15)) {
    status = "loss";
    resolution = "stop_loss";
  } else if (netPnlPct >= toNum(exit.takeProfitPct, 10)) {
    status = "win";
    resolution = "take_profit";
  } else if (shouldCloseByOor(run, detail, exit, hoursElapsed)) {
    status = netPnlPct >= simDefaults.winThresholdPct ? "win" : "loss";
    resolution = "oor";
  } else if (hoursElapsed >= simDefaults.maxRunAgeHours) {
    status = netPnlPct >= simDefaults.winThresholdPct ? "win" : "expired";
    resolution = "time_expiry";
  }

  const openFeeSol =
    run.simOpenFeeSol != null && Number.isFinite(run.simOpenFeeSol) && toNum(run.simOpenFeeSol) > 0
      ? toNum(run.simOpenFeeSol)
      : feeSolFromBps(run.depositSol, feeCfg.openFeeBps);
  const closeFeeSol = feeSolFromBps(run.depositSol, feeCfg.closeFeeBps);
  const grossPnlSol = toNum(run.depositSol) * (netPnlPct / 100);
  const simNetPnlSol = grossPnlSol - openFeeSol - closeFeeSol;

  return {
    status,
    resolution,
    tvlUsd: detail.tvlUsd,
    volume24hUsd: detail.volume24hUsd,
    feeTvlRatio: detail.feeTvlRatio,
    simFeesEarnedSol,
    simPriceDriftPct: priceDriftPct,
    simPnlPct: netPnlPct,
    simPnlUsd: toNum(run.depositUsd) * (netPnlPct / 100),
    simOpenFeeSol: openFeeSol,
    simCloseFeeSol: closeFeeSol,
    simNetPnlSol,
  };
}

async function hasRecentPosition(experimentId, strategyId, poolAddress) {
  const q = { strategyId, poolAddress, experimentId };
  const open = await LpExperimentRun.findOne({ ...q, status: "open" }).sort({ createdAt: -1 }).lean();
  if (open) return true;
  const latest = await LpExperimentRun.findOne(q).sort({ createdAt: -1 }).lean();
  if (!latest?.createdAt) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < OPEN_POSITION_COOLDOWN_MS;
}

async function getSingletonStateDoc() {
  return LpExperimentState.findById("singleton").lean();
}

/**
 * One-time boot: singleton state, cohort id on legacy runs, agent cash rows.
 */
export async function ensureLpExperimentBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let state = await LpExperimentState.findById("singleton").lean();
    const simDefaults = LP_AGENT_EXPERIMENT_DEFAULTS;
    if (!state) {
      const activeExperimentId = `lp-cohort-${Date.now()}`;
      await LpExperimentState.create({
        _id: "singleton",
        activeExperimentId,
        title: "Compound capital simulation (10 SOL bank, 1 SOL slots)",
        startedAt: new Date(),
        simConfig: {
          startingBankSol: simDefaults.startingBankSol,
          maxPositionSol: simDefaults.maxPositionSol,
          maxConcurrentPositions: simDefaults.maxConcurrentPositions,
          openFeeBps: simDefaults.openFeeBps,
          closeFeeBps: simDefaults.closeFeeBps,
        },
      });
      await LpExperimentRun.updateMany(
        { $or: [{ experimentId: null }, { experimentId: { $exists: false } }] },
        { $set: { experimentId: activeExperimentId } },
      );
      state = await LpExperimentState.findById("singleton").lean();
    }
    const activeId = state?.activeExperimentId;
    if (!activeId) return;
    const strategies = await resolveLpExperimentStrategies();
    const cfg = mergedSimConfig(state);
    for (const s of strategies) {
      const exists = await LpExperimentAgentState.findOne({ experimentId: activeId, strategyId: s.id }).lean();
      if (exists) continue;
      const settled = await LpExperimentRun.find({
        experimentId: activeId,
        strategyId: s.id,
        status: { $in: ["win", "loss", "expired"] },
      }).lean();
      const openRuns = await LpExperimentRun.find({
        experimentId: activeId,
        strategyId: s.id,
        status: "open",
      }).lean();
      let cash = cfg.startingBankSol;
      for (const r of settled) {
        const openFee = toNum(r.simOpenFeeSol, feeSolFromBps(r.depositSol, cfg.openFeeBps));
        const closeFee = toNum(r.simCloseFeeSol, feeSolFromBps(r.depositSol, cfg.closeFeeBps));
        const net =
          Number.isFinite(r.simNetPnlSol) && r.simNetPnlSol !== 0
            ? toNum(r.simNetPnlSol)
            : toNum(r.depositSol) * (toNum(r.simPnlPct) / 100) - openFee - closeFee;
        cash += net;
      }
      for (const r of openRuns) {
        const openFee = toNum(r.simOpenFeeSol, feeSolFromBps(r.depositSol, cfg.openFeeBps));
        cash -= toNum(r.depositSol) + openFee;
      }
      await LpExperimentAgentState.create({
        experimentId: activeId,
        strategyId: s.id,
        cashSol: Math.max(0, cash),
        startingBankSol: cfg.startingBankSol,
      });
    }
  })().finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

export async function getLpExperimentLabState() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  if (!state) {
    const referenceSolPriceUsd = await fetchSolPriceUsd();
    return {
      activeExperimentId: null,
      title: "",
      startedAt: null,
      referenceSolPriceUsd,
      simConfig: mergedSimConfig(null),
      agents: [],
    };
  }
  const cfg = mergedSimConfig(state);
  const agents = await LpExperimentAgentState.find({ experimentId: state.activeExperimentId })
    .sort({ strategyId: 1 })
    .lean();
  const openAgg = await LpExperimentRun.aggregate([
    { $match: { experimentId: state.activeExperimentId, status: "open" } },
    { $group: { _id: "$strategyId", count: { $sum: 1 }, deployedSol: { $sum: "$depositSol" } } },
  ]);
  const openMap = new Map(openAgg.map((x) => [x._id, x]));
  const referenceSolPriceUsd = await fetchSolPriceUsd();
  return {
    activeExperimentId: state.activeExperimentId,
    title: state.title || "",
    startedAt: state.startedAt || null,
    referenceSolPriceUsd,
    simConfig: cfg,
    agents: agents.map((a) => {
      const o = openMap.get(a.strategyId) || { count: 0, deployedSol: 0 };
      return {
        strategyId: a.strategyId,
        cashSol: toNum(a.cashSol),
        startingBankSol: toNum(a.startingBankSol, cfg.startingBankSol),
        openPositions: toNum(o.count),
        deployedSol: toNum(o.deployedSol),
        equitySol: toNum(a.cashSol) + toNum(o.deployedSol),
      };
    }),
  };
}

/**
 * Wipe all LP experiment run rows, all per-agent ledger rows, all archive documents, and start a new cohort from zero
 * (same sim config as current singleton). Does not keep any history.
 * @param {{ title?: string }} [opts]
 */
export async function resetLpExperimentFromScratch(opts = {}) {
  await ensureLpExperimentBootstrapped();
  // Never wipe real on-chain LP positions or config when resetting the sim lab.
  const state = await LpExperimentState.findById("singleton");
  if (!state) throw new Error("LP experiment state missing");
  const cfg = mergedSimConfig(state);
  await LpExperimentRun.deleteMany({});
  await LpExperimentAgentState.deleteMany({});
  await mongoose.connection.collection("lp_experiment_archives").deleteMany({});
  const nextId = `lp-cohort-${Date.now()}`;
  state.activeExperimentId = nextId;
  state.title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : "LP compound simulation (reset)";
  state.startedAt = new Date();
  state.simConfig = {
    startingBankSol: cfg.startingBankSol,
    maxPositionSol: cfg.maxPositionSol,
    maxConcurrentPositions: cfg.maxConcurrentPositions,
    openFeeBps: cfg.openFeeBps,
    closeFeeBps: cfg.closeFeeBps,
  };
  await state.save();
  const strategies = await resolveLpExperimentStrategies();
  for (const s of strategies) {
    await LpExperimentAgentState.create({
      experimentId: nextId,
      strategyId: s.id,
      cashSol: cfg.startingBankSol,
      startingBankSol: cfg.startingBankSol,
    });
  }
  bootPromise = null;
  return { nextExperimentId: nextId };
}

export async function getLpCandidatePools() {
  await ensureLpExperimentBootstrapped();
  const strategies = await resolveLpExperimentStrategies();
  const pools = await fetchMeteoraPools({
    page: 1,
    limit: Math.max(30, LP_AGENT_EXPERIMENT_DEFAULTS.minCandidateCount),
    sortKey: "fee",
    order: "desc",
    hideLowTvl: true,
  });
  const candidates = [];
  for (const strategy of strategies) {
    const scored = pools.map((pool) => {
      const synthetic = deriveSyntheticSignals(pool);
      const scoredRow = scorePool(strategy, { ...pool, ...synthetic });
      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        poolAddress: pool.poolAddress,
        poolName: pool.poolName,
        baseSymbol: pool.baseSymbol,
        quoteSymbol: pool.quoteSymbol,
        score: scoredRow.score,
        gatePassed: scoredRow.gatePassed,
        gateReasons: scoredRow.gateReasons,
        signalSnapshot: scoredRow.signalSnapshot,
        tvlUsd: pool.tvlUsd,
        volume24hUsd: pool.volume24hUsd,
        feeTvlRatio: pool.feeTvlRatio,
      };
    });
    const top = scored
      .filter((x) => x.gatePassed)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    candidates.push(...top);
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export async function runLpExperimentSignalCycle() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 0, errors: ["no_experiment_state"], openedRuns: [], skippedRows: [] };
  }
  const simCfg = mergedSimConfig(state);
  const strategies = await resolveLpExperimentStrategies();
  const pools = await fetchMeteoraPools({
    page: 1,
    limit: Math.max(30, LP_AGENT_EXPERIMENT_DEFAULTS.minCandidateCount),
    sortKey: "fee",
    order: "desc",
    hideLowTvl: true,
  });
  const solPrice = await fetchSolPriceUsd();
  const opened = [];
  const skipped = [];
  const errors = [];

  for (const strategy of strategies) {
    try {
      const openCount = await LpExperimentRun.countDocuments({
        experimentId,
        strategyId: strategy.id,
        status: "open",
      });
      if (openCount >= simCfg.maxConcurrentPositions) {
        skipped.push({ strategyId: strategy.id, reason: "max_positions" });
        continue;
      }

      const agent = await LpExperimentAgentState.findOne({ experimentId, strategyId: strategy.id }).lean();
      const cashSol = toNum(agent?.cashSol, 0);
      const depositSol = simCfg.maxPositionSol;
      const openFeeSol = feeSolFromBps(depositSol, simCfg.openFeeBps);
      if (cashSol < depositSol + openFeeSol - 1e-12) {
        skipped.push({ strategyId: strategy.id, reason: "insufficient_cash" });
        continue;
      }

      const scored = pools
        .map((pool) => {
          const synthetic = deriveSyntheticSignals(pool);
          const scoredRow = scorePool(strategy, { ...pool, ...synthetic });
          const compoundBoost = 1 + Math.log1p(Math.max(0, cashSol - simCfg.startingBankSol)) / 25;
          return { pool, synthetic, ...scoredRow, score: scoredRow.score * compoundBoost };
        })
        .filter((x) => x.gatePassed)
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best) {
        skipped.push({ strategyId: strategy.id, reason: "no_candidate" });
        continue;
      }
      const recent = await hasRecentPosition(experimentId, strategy.id, best.pool.poolAddress);
      if (recent) {
        skipped.push({ strategyId: strategy.id, reason: "cooldown_or_open" });
        continue;
      }

      const costSol = depositSol + openFeeSol;
      const reserved = await LpExperimentAgentState.findOneAndUpdate(
        { experimentId, strategyId: strategy.id, cashSol: { $gte: costSol } },
        { $inc: { cashSol: -costSol } },
        { new: true },
      );
      if (!reserved) {
        skipped.push({ strategyId: strategy.id, reason: "cash_race" });
        continue;
      }

      const depositUsd = depositSol * solPrice;
      try {
        const created = await LpExperimentRun.create({
          experimentId,
          strategyId: strategy.id,
          strategyName: strategy.name,
          lpShape: strategy.lpShape,
          poolAddress: best.pool.poolAddress,
          poolName: best.pool.poolName,
          baseSymbol: best.pool.baseSymbol,
          quoteSymbol: best.pool.quoteSymbol,
          binStep: best.pool.binStep,
          tvlUsd: best.pool.tvlUsd,
          volume24hUsd: best.pool.volume24hUsd,
          organicScore: best.synthetic.organicScore,
          holderCount: best.synthetic.holderCount,
          mcapUsd: best.synthetic.mcapUsd,
          feeTvlRatio: best.pool.feeTvlRatio,
          binsBelow: strategy.binsBelow,
          binsAbove: strategy.binsAbove,
          activeBinAtOpen: best.pool.activeBinId,
          entryPriceUsd: best.pool.currentPrice,
          depositSol,
          depositUsd,
          signalSnapshot: best.signalSnapshot,
          screeningSnapshot: { ...best.synthetic, score: best.score },
          status: "open",
          openedAt: new Date(),
          simOpenFeeSol: openFeeSol,
          simCloseFeeSol: 0,
          simNetPnlSol: 0,
        });
        opened.push({
          runId: String(created._id),
          strategyId: strategy.id,
          strategyName: strategy.name,
          poolAddress: created.poolAddress,
          poolName: created.poolName,
        });
      } catch (createErr) {
        await LpExperimentAgentState.updateOne(
          { experimentId, strategyId: strategy.id },
          { $inc: { cashSol: costSol } },
        );
        throw createErr;
      }
    } catch (err) {
      errors.push(`strategy:${strategy.id}:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    opened: opened.length,
    skipped: skipped.length,
    errors,
    openedRuns: opened,
    skippedRows: skipped,
  };
}

export async function resolveOpenLpRuns() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  const feeCfg = mergedSimConfig(state);
  if (!experimentId) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [] };
  }
  const openQuery = { status: "open", experimentId };
  const openRuns = await LpExperimentRun.find(openQuery).sort({ createdAt: 1 }).lean();
  const resolvedRows = [];
  const errors = [];

  for (const run of openRuns) {
    try {
      const strategy = await resolveLpStrategyById(run.strategyId);
      if (!strategy) {
        await LpExperimentRun.updateOne(
          { _id: run._id },
          {
            $set: {
              status: "error",
              resolution: "strategy_missing",
              errorMessage: "Strategy not found",
              resolvedAt: new Date(),
              lastEvaluatedAt: new Date(),
            },
          },
        );
        continue;
      }
      const detail = await fetchMeteoraPoolDetail(run.poolAddress);
      const now = Date.now();
      const openedAt = new Date(run.openedAt || run.createdAt || Date.now()).getTime();
      const hoursElapsed = Math.max(0, (now - openedAt) / 3_600_000);
      const fields = evaluateRunResolution(run, detail, strategy.exit, hoursElapsed, LP_AGENT_EXPERIMENT_DEFAULTS, feeCfg);

      const expId = run.experimentId || experimentId;
      if (fields.status !== "open" && expId) {
        const retSol =
          toNum(run.depositSol) + toNum(run.depositSol) * (toNum(fields.simPnlPct) / 100) - toNum(fields.simCloseFeeSol);
        await LpExperimentAgentState.updateOne(
          { experimentId: expId, strategyId: run.strategyId },
          { $inc: { cashSol: retSol } },
        );
      }

      await LpExperimentRun.updateOne(
        { _id: run._id },
        {
          $set: {
            status: fields.status,
            resolution: fields.resolution,
            tvlUsd: fields.tvlUsd,
            volume24hUsd: fields.volume24hUsd,
            feeTvlRatio: fields.feeTvlRatio,
            simFeesEarnedSol: fields.simFeesEarnedSol,
            simPriceDriftPct: fields.simPriceDriftPct,
            simPnlPct: fields.simPnlPct,
            simPnlUsd: fields.simPnlUsd,
            simOpenFeeSol: fields.simOpenFeeSol,
            simCloseFeeSol: fields.simCloseFeeSol,
            simNetPnlSol: fields.simNetPnlSol,
            lastEvaluatedAt: new Date(),
            ...(fields.status !== "open" ? { resolvedAt: new Date() } : {}),
          },
        },
      );

      if (fields.status !== "open") {
        resolvedRows.push({
          runId: String(run._id),
          status: fields.status,
          resolution: fields.resolution,
          strategyId: run.strategyId,
        });
      }
    } catch (err) {
      errors.push(`run:${String(run._id)}:${err instanceof Error ? err.message : String(err)}`);
      await LpExperimentRun.updateOne(
        { _id: run._id },
        { $set: { status: "error", resolution: "resolve_error", errorMessage: String(err), resolvedAt: new Date() } },
      );
    }
  }

  return {
    resolved: resolvedRows.length,
    openChecked: openRuns.length,
    errors,
    rows: resolvedRows,
  };
}

export async function getLpExperimentStats() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  const strategies = await resolveLpExperimentStrategies();
  if (!experimentId) {
    const zeros = strategies.map((strategy) => ({
      strategyId: strategy.id,
      strategyName: strategy.name,
      lpShape: strategy.lpShape,
      wins: 0,
      losses: 0,
      expired: 0,
      decided: 0,
      winRate: null,
      winRatePct: null,
      openPositions: 0,
      avgPnlPct: 0,
      avgFeesSol: 0,
      cashSol: 0,
      sumNetPnlSol: 0,
      avgNetPnlSol: 0,
      sumNetPnlUsd: 0,
      avgNetPnlUsd: 0,
      sumChainFeesSol: 0,
      sumChainFeesUsd: 0,
    }));
    return { agents: zeros, experimentId: null };
  }
  const match = { experimentId };
  const [statsRows, openRows, agentRows] = await Promise.all([
    LpExperimentRun.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$strategyId",
          strategyName: { $last: "$strategyName" },
          lpShape: { $last: "$lpShape" },
          wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "loss"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
          openPositions: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          avgPnlPct: { $avg: "$simPnlPct" },
          avgFeesSol: { $avg: "$simFeesEarnedSol" },
          sumNetPnlSol: { $sum: "$simNetPnlSol" },
          avgNetPnlSol: { $avg: "$simNetPnlSol" },
          sumNetPnlUsd: { $sum: mongoNetPnlUsdExpr },
          avgNetPnlUsd: { $avg: mongoNetPnlUsdExpr },
          sumChainFeesSol: { $sum: { $add: ["$simOpenFeeSol", "$simCloseFeeSol"] } },
          sumChainFeesUsd: { $sum: mongoChainFeesUsdExpr },
        },
      },
    ]),
    LpExperimentRun.find({ ...match, status: "open" }).select({ strategyId: 1 }).lean(),
    LpExperimentAgentState.find({ experimentId }).lean(),
  ]);
  const openMap = openRows.reduce((acc, row) => {
    const key = Number(row.strategyId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const cashMap = new Map(agentRows.map((a) => [a.strategyId, toNum(a.cashSol)]));
  const merged = strategies.map((strategy) => {
    const row = statsRows.find((s) => Number(s._id) === strategy.id);
    const wins = toNum(row?.wins);
    const losses = toNum(row?.losses);
    const expired = toNum(row?.expired);
    const decided = wins + losses + expired;
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      lpShape: strategy.lpShape,
      wins,
      losses,
      expired,
      decided,
      winRate: decided > 0 ? wins / decided : null,
      winRatePct: decided > 0 ? (wins / decided) * 100 : null,
      openPositions: toNum(openMap[strategy.id], toNum(row?.openPositions)),
      avgPnlPct: toNum(row?.avgPnlPct, 0),
      avgFeesSol: toNum(row?.avgFeesSol, 0),
      cashSol: toNum(cashMap.get(strategy.id)),
      sumNetPnlSol: toNum(row?.sumNetPnlSol, 0),
      avgNetPnlSol: toNum(row?.avgNetPnlSol, 0),
      sumNetPnlUsd: toNum(row?.sumNetPnlUsd, 0),
      avgNetPnlUsd: toNum(row?.avgNetPnlUsd, 0),
      sumChainFeesSol: toNum(row?.sumChainFeesSol, 0),
      sumChainFeesUsd: toNum(row?.sumChainFeesUsd, 0),
    };
  });
  return {
    agents: merged.sort((a, b) => {
      const ar = a.winRate ?? -1;
      const br = b.winRate ?? -1;
      if (br !== ar) return br - ar;
      return b.wins - a.wins;
    }),
    experimentId: experimentId || null,
  };
}

export async function listLpExperimentRuns({
  limit = DEFAULT_LIST_LIMIT,
  offset = 0,
  strategyId,
  status,
  symbol,
  experimentId: experimentIdOverride,
} = {}) {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const q = {};
  if (experimentIdOverride && String(experimentIdOverride).trim()) {
    q.experimentId = String(experimentIdOverride).trim();
  } else if (state?.activeExperimentId) {
    q.experimentId = state.activeExperimentId;
  } else {
    return { runs: [], total: 0 };
  }
  if (strategyId != null && Number.isInteger(Number(strategyId))) {
    q.strategyId = Number(strategyId);
  }
  if (typeof status === "string" && status.trim()) {
    q.status = status.trim();
  }
  if (typeof symbol === "string" && symbol.trim()) {
    q.$or = [
      { baseSymbol: new RegExp(symbol.trim(), "i") },
      { quoteSymbol: new RegExp(symbol.trim(), "i") },
      { poolName: new RegExp(symbol.trim(), "i") },
    ];
  }
  const safeLimit = normalizeLimit(limit);
  const safeOffset = Math.max(0, Number(offset) || 0);
  const [runs, total] = await Promise.all([
    LpExperimentRun.find(q).sort({ createdAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
    LpExperimentRun.countDocuments(q),
  ]);
  return { runs, total };
}
