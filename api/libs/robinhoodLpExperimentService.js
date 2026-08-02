import mongoose from "mongoose";
import RobinhoodLpExperimentRun from "../models/RobinhoodLpExperimentRun.js";
import RobinhoodLpExperimentState from "../models/RobinhoodLpExperimentState.js";
import RobinhoodLpExperimentAgentState from "../models/RobinhoodLpExperimentAgentState.js";
import { ROBINHOOD_LP_EXPERIMENT_DEFAULTS } from "../config/robinhoodLpStrategies.js";
import {
  resolveRobinhoodLpExperimentStrategies,
  resolveRobinhoodLpStrategyById,
} from "./robinhoodLpExperimentStrategyResolve.js";
import {
  fetchRobinhoodUniswapPoolDetail,
  fetchRobinhoodUniswapPoolPages,
  isRobinhoodQuoteMint,
  isRobinhoodQuoteSymbol,
} from "./robinhoodUniswapClient.js";
import { scorePool } from "./lpExperimentScoring.js";
import { derivePoolSignals } from "./lpPoolSignalsSynthetic.js";
import {
  applyRiskAdjustedFeeMultiplier,
  computeDlmmFeeShareMultiplier,
  computeFeeYieldPct,
  computeLpNetPnlPct,
  getLpSimFeeCalibrationMult,
  computeLpRiskRewardProfile,
  computePoolRiskScore,
  computePriceDriftPct,
  isPositionOutOfRange,
  LP_MIN_EXTREME_RISK_REWARD_RATIO,
  LP_MIN_SIM_RISK_REWARD_RATIO,
  mergeRealExitRules,
  resolveAdaptiveExitRules,
  resolveEffectiveBins,
  shouldCloseByOor,
  strategyLikelyNeedsSidecarSwap,
} from "./lpEconomicsModel.js";
import {
  computeRobinhoodSimTransactionCostsUsd,
  robinhoodStrategyNeedsSidecarSwap,
} from "./robinhoodLpEconomics.js";
import { getHeartbeatMinMs, isHeartbeatDue, numChanged } from "../utils/mongoHeartbeatWrite.js";

export { computeLpNetPnlPct, isPositionOutOfRange, derivePoolSignals };

const OPEN_POSITION_COOLDOWN_MS = 45 * 60 * 1000;
const SIM_POOL_SCAN_PAGES = 4;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

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

function mergedSimConfig(stateDoc) {
  const s = stateDoc?.simConfig || {};
  return {
    startingBankUsd: toNum(s.startingBankUsd, ROBINHOOD_LP_EXPERIMENT_DEFAULTS.startingBankUsd),
    maxPositionUsd: toNum(s.maxPositionUsd, ROBINHOOD_LP_EXPERIMENT_DEFAULTS.maxPositionUsd),
    maxConcurrentPositions: toNum(
      s.maxConcurrentPositions,
      ROBINHOOD_LP_EXPERIMENT_DEFAULTS.maxConcurrentPositions,
    ),
    openFeeUsd: toNum(s.openFeeUsd, ROBINHOOD_LP_EXPERIMENT_DEFAULTS.openFeeUsd),
    closeFeeUsd: toNum(s.closeFeeUsd, ROBINHOOD_LP_EXPERIMENT_DEFAULTS.closeFeeUsd),
  };
}

function shouldWriteRobinhoodRunResolve(run, fields) {
  if (fields.status !== "open") return true;
  const heartbeatMinMs = getHeartbeatMinMs("ROBINHOOD_LP_HEARTBEAT_MIN_MS", 5 * 60_000);
  if (isHeartbeatDue(run.lastEvaluatedAt, heartbeatMinMs)) return true;
  const tracked = [
    "simPnlPct",
    "simNetPnlUsd",
    "simFeesEarnedUsd",
    "simPriceDriftPct",
    "feeTvlRatio",
    "tvlUsd",
    "volume24hUsd",
  ];
  for (const key of tracked) {
    if (numChanged(fields[key], run[key], 0.001)) return true;
  }
  const existingPeak =
    run.screeningSnapshot != null && typeof run.screeningSnapshot === "object"
      ? run.screeningSnapshot.peakPnlPct
      : undefined;
  if (numChanged(fields.peakPnlPct, existingPeak, 0.001)) return true;
  return false;
}

function evaluateRunResolution(run, detail, strategyExit, hoursElapsed, simDefaults) {
  const priceDriftPct = computePriceDriftPct(toNum(run.entryPriceUsd), toNum(detail.currentPrice));
  const inRange = !isPositionOutOfRange(
    run.activeBinAtOpen,
    detail.activeBinId,
    run.binsBelow,
    run.binsAbove,
  );
  const tvlUsd = toNum(detail.tvlUsd, run.tvlUsd);
  const volume24hUsd = toNum(detail.volume24hUsd, run.volume24hUsd);
  const volTvlRatio = tvlUsd > 0 ? volume24hUsd / tvlUsd : 0;
  const feeTvlRatio = toNum(detail.feeTvlRatio, run.feeTvlRatio);
  const snapshot =
    run.screeningSnapshot != null && typeof run.screeningSnapshot === "object"
      ? run.screeningSnapshot
      : {};
  const volatilityScore = toNum(snapshot.volatilityScore, 0.45);
  const riskScore = toNum(
    snapshot.riskScore,
    computePoolRiskScore({
      tvlUsd,
      volume24hUsd,
      feeTvlRatio,
      volatilityScore,
      binsBelow: run.binsBelow,
      binsAbove: run.binsAbove,
    }),
  );

  const poolContext = { tvlUsd, volume24hUsd, feeTvlRatio, volatilityScore };
  const adaptiveExit =
    snapshot.adaptiveExit && typeof snapshot.adaptiveExit === "object"
      ? snapshot.adaptiveExit
      : resolveAdaptiveExitRules(strategyExit || {}, poolContext, run.binsBelow, run.binsAbove);
  const exit = mergeRealExitRules(adaptiveExit);

  const baseFeeYieldPct = computeFeeYieldPct(feeTvlRatio, hoursElapsed);
  const rawFeeShareMult = computeDlmmFeeShareMultiplier({
    volTvlRatio,
    tvlUsd,
    binsBelow: run.binsBelow,
    binsAbove: run.binsAbove,
    inRange,
  });
  const feeShareMult =
    applyRiskAdjustedFeeMultiplier(rawFeeShareMult, riskScore) * getLpSimFeeCalibrationMult();
  const feeYieldPct = inRange ? baseFeeYieldPct * feeShareMult : baseFeeYieldPct * feeShareMult * 0.25;
  const netPnlPct = computeLpNetPnlPct(priceDriftPct, feeYieldPct, inRange, riskScore);
  const simFeesEarnedUsd = toNum(run.depositUsd) * (feeYieldPct / 100);

  const peakPnlPct = Math.max(toNum(snapshot.peakPnlPct), netPnlPct);
  let status = "open";
  let resolution = null;
  if (priceDriftPct <= toNum(exit.stopLossPct, -15)) {
    status = "loss";
    resolution = "stop_loss";
  } else if (netPnlPct >= toNum(exit.takeProfitPct, 10)) {
    status = "win";
    resolution = "take_profit";
  } else {
    const trailingTrigger = toNum(exit.trailingTriggerPct);
    const trailingGiveback = Math.max(toNum(exit.trailingGivebackPct, trailingTrigger * 0.4), 1.1);
    if (
      trailingTrigger > 0 &&
      peakPnlPct >= trailingTrigger &&
      netPnlPct <= peakPnlPct - trailingGiveback
    ) {
      status = netPnlPct >= simDefaults.winThresholdPct ? "win" : "loss";
      resolution = "trailing_stop";
    } else if (shouldCloseByOor(run, detail, exit, hoursElapsed)) {
      status = netPnlPct >= simDefaults.winThresholdPct ? "win" : "loss";
      resolution = "oor";
    } else if (hoursElapsed >= simDefaults.maxRunAgeHours) {
      status = netPnlPct >= simDefaults.winThresholdPct ? "win" : "expired";
      resolution = "time_expiry";
    }
  }

  const needsSidecar = robinhoodStrategyNeedsSidecarSwap(run.binsBelow, run.binsAbove);
  const txCosts = computeRobinhoodSimTransactionCostsUsd(run.depositUsd, { needsSidecarSwap: needsSidecar });
  const openFeeUsd =
    run.simOpenFeeUsd != null && Number.isFinite(run.simOpenFeeUsd) && toNum(run.simOpenFeeUsd) > 0
      ? toNum(run.simOpenFeeUsd)
      : txCosts.openFeeUsd;
  const closeFeeUsd = txCosts.closeFeeUsd;
  const grossPnlUsd = toNum(run.depositUsd) * (netPnlPct / 100);
  const simNetPnlUsd = grossPnlUsd - openFeeUsd - closeFeeUsd;

  if (status === "win" && simNetPnlUsd < 0) {
    status = "loss";
    resolution = resolution === "take_profit" ? "tp_below_cost" : resolution || "net_negative";
  } else if (status === "loss" && simNetPnlUsd > 0) {
    status = "win";
  } else if (status === "expired" && simNetPnlUsd > 0) {
    status = "win";
  }

  return {
    status,
    resolution,
    tvlUsd: detail.tvlUsd,
    volume24hUsd: detail.volume24hUsd,
    feeTvlRatio: detail.feeTvlRatio,
    simFeesEarnedUsd,
    simPriceDriftPct: priceDriftPct,
    simPnlPct: netPnlPct,
    simPnlUsd: grossPnlUsd,
    simOpenFeeUsd: openFeeUsd,
    simCloseFeeUsd: closeFeeUsd,
    simNetPnlUsd,
    peakPnlPct,
    riskScore,
    adaptiveExit,
  };
}

async function getSingletonStateDoc() {
  return RobinhoodLpExperimentState.findById("singleton").lean();
}

export async function ensureRobinhoodLpExperimentBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let state = await RobinhoodLpExperimentState.findById("singleton").lean();
    const simDefaults = ROBINHOOD_LP_EXPERIMENT_DEFAULTS;
    if (!state) {
      const activeExperimentId = `rh-lp-cohort-${Date.now()}`;
      await RobinhoodLpExperimentState.create({
        _id: "singleton",
        activeExperimentId,
        title: "Robinhood Chain LP simulation ($2,000 bank, $200 slots)",
        startedAt: new Date(),
        simConfig: {
          startingBankUsd: simDefaults.startingBankUsd,
          maxPositionUsd: simDefaults.maxPositionUsd,
          maxConcurrentPositions: simDefaults.maxConcurrentPositions,
          openFeeUsd: simDefaults.openFeeUsd,
          closeFeeUsd: simDefaults.closeFeeUsd,
        },
      });
      state = await RobinhoodLpExperimentState.findById("singleton").lean();
    }
    const activeId = state?.activeExperimentId;
    if (!activeId) return;
    const strategies = await resolveRobinhoodLpExperimentStrategies();
    const cfg = mergedSimConfig(state);
    for (const s of strategies) {
      const exists = await RobinhoodLpExperimentAgentState.findOne({
        experimentId: activeId,
        strategyId: s.id,
      }).lean();
      if (exists) continue;
      const settled = await RobinhoodLpExperimentRun.find({
        experimentId: activeId,
        strategyId: s.id,
        status: { $in: ["win", "loss", "expired"] },
      }).lean();
      const openRuns = await RobinhoodLpExperimentRun.find({
        experimentId: activeId,
        strategyId: s.id,
        status: "open",
      }).lean();
      let cash = cfg.startingBankUsd;
      for (const r of settled) {
        const txFallback = computeRobinhoodSimTransactionCostsUsd(r.depositUsd, {
          needsSidecarSwap: strategyLikelyNeedsSidecarSwap(r.binsBelow, r.binsAbove),
        });
        const openFee = toNum(r.simOpenFeeUsd, txFallback.openFeeUsd);
        const closeFee = toNum(r.simCloseFeeUsd, txFallback.closeFeeUsd);
        const net =
          Number.isFinite(r.simNetPnlUsd) && r.simNetPnlUsd !== 0
            ? toNum(r.simNetPnlUsd)
            : toNum(r.depositUsd) * (toNum(r.simPnlPct) / 100) - openFee - closeFee;
        cash += net;
      }
      for (const r of openRuns) {
        const txFallback = computeRobinhoodSimTransactionCostsUsd(r.depositUsd, {
          needsSidecarSwap: strategyLikelyNeedsSidecarSwap(r.binsBelow, r.binsAbove),
        });
        const openFee = toNum(r.simOpenFeeUsd, txFallback.openFeeUsd);
        cash -= toNum(r.depositUsd) + openFee;
      }
      await RobinhoodLpExperimentAgentState.create({
        experimentId: activeId,
        strategyId: s.id,
        cashUsd: Math.max(0, cash),
        startingBankUsd: cfg.startingBankUsd,
      });
    }
  })().finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

export async function getRobinhoodLpExperimentLabState() {
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  if (!state) {
    return {
      activeExperimentId: null,
      title: "",
      startedAt: null,
      simConfig: mergedSimConfig(null),
      agents: [],
    };
  }
  const cfg = mergedSimConfig(state);
  const agents = await RobinhoodLpExperimentAgentState.find({ experimentId: state.activeExperimentId })
    .sort({ strategyId: 1 })
    .lean();
  const openAgg = await RobinhoodLpExperimentRun.aggregate([
    { $match: { experimentId: state.activeExperimentId, status: "open" } },
    { $group: { _id: "$strategyId", count: { $sum: 1 }, deployedUsd: { $sum: "$depositUsd" } } },
  ]);
  const openMap = new Map(openAgg.map((x) => [x._id, x]));
  return {
    activeExperimentId: state.activeExperimentId,
    title: state.title || "",
    startedAt: state.startedAt || null,
    simConfig: cfg,
    agents: agents.map((a) => {
      const o = openMap.get(a.strategyId) || { count: 0, deployedUsd: 0 };
      return {
        strategyId: a.strategyId,
        cashUsd: toNum(a.cashUsd),
        startingBankUsd: toNum(a.startingBankUsd, cfg.startingBankUsd),
        openPositions: toNum(o.count),
        deployedUsd: toNum(o.deployedUsd),
        equityUsd: toNum(a.cashUsd) + toNum(o.deployedUsd),
      };
    }),
  };
}

export async function resetRobinhoodLpFromScratch(opts = {}) {
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await RobinhoodLpExperimentState.findById("singleton");
  if (!state) throw new Error("Robinhood LP experiment state missing");
  const cfg = mergedSimConfig(state);
  await RobinhoodLpExperimentRun.deleteMany({});
  await RobinhoodLpExperimentAgentState.deleteMany({});
  // Wipe evolvable degen-herd overrides so the next cohort starts from static DNA.
  const RobinhoodLpExperimentStrategyOverride = (
    await import("../models/RobinhoodLpExperimentStrategyOverride.js")
  ).default;
  const clearedOverrides = await RobinhoodLpExperimentStrategyOverride.deleteMany({});
  try {
    const { invalidateRobinhoodLpStrategyCache } = await import(
      "./robinhoodLpExperimentStrategyResolve.js"
    );
    invalidateRobinhoodLpStrategyCache();
  } catch {
    /* optional */
  }
  const nextId = `rh-lp-cohort-${Date.now()}`;
  state.activeExperimentId = nextId;
  state.title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : "Robinhood Chain LP simulation (reset)";
  state.startedAt = new Date();
  state.simConfig = { ...cfg };
  await state.save();
  const strategies = await resolveRobinhoodLpExperimentStrategies();
  for (const s of strategies) {
    await RobinhoodLpExperimentAgentState.create({
      experimentId: nextId,
      strategyId: s.id,
      cashUsd: cfg.startingBankUsd,
      startingBankUsd: cfg.startingBankUsd,
    });
  }
  bootPromise = null;
  return {
    nextExperimentId: nextId,
    clearedOverrides: clearedOverrides?.deletedCount ?? 0,
    strategyCount: strategies.length,
  };
}

export function isQuotePairPool(pool) {
  const baseMint = String(pool?.baseMint || "").toLowerCase();
  const quoteMint = String(pool?.quoteMint || "").toLowerCase();
  return (
    isRobinhoodQuoteMint(baseMint) ||
    isRobinhoodQuoteMint(quoteMint) ||
    isRobinhoodQuoteSymbol(pool?.baseSymbol) ||
    isRobinhoodQuoteSymbol(pool?.quoteSymbol)
  );
}

/** Cohort-wide cap: stop all agents herding into one meme pool (JPORK failure mode). */
export const ROBINHOOD_MAX_AGENTS_PER_POOL = Number(
  process.env.ROBINHOOD_LP_MAX_AGENTS_PER_POOL || 3,
);
/** Reject casino vol/TVL ratios unless strategy is explicitly degen. */
export const ROBINHOOD_MAX_VOL_TVL_RATIO = Number(process.env.ROBINHOOD_LP_MAX_VOL_TVL_RATIO || 6);
export const ROBINHOOD_MIN_TVL_USD = Number(process.env.ROBINHOOD_LP_MIN_TVL_USD || 25_000);

export function isRobinhoodDegenStrategy(strategy) {
  const name = String(strategy?.name || "").toLowerCase();
  if (name.includes("degen")) return true;
  const maxTvl = Number(strategy?.screeningOverrides?.maxTvlUsd);
  const minFee = Number(strategy?.screeningOverrides?.minFeeTvlRatio);
  // Aggressive spawn templates clamp maxTvlUsd into the degen band with high fee/TVL floors.
  return Number.isFinite(maxTvl) && maxTvl > 0 && maxTvl <= 520_000 && minFee >= 0.03;
}

export function passesRobinhoodSimPoolScreen(pool, { binsBelow = 30, binsAbove = 30 } = {}) {
  const feeTvl = toNum(pool.feeTvlRatio);
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  if (tvl < ROBINHOOD_MIN_TVL_USD || vol < 12_000) return false;
  if (feeTvl < 0.00012) return false;
  const volTvl = tvl > 0 ? vol / tvl : 0;
  if (volTvl < 0.3 && feeTvl < 0.0007) return false;
  // Extreme churn without fee support = meme dump risk; hard reject at universe screen.
  if (volTvl > ROBINHOOD_MAX_VOL_TVL_RATIO * 1.5 && feeTvl < 0.01) return false;

  const rr = computeLpRiskRewardProfile({
    tvlUsd: tvl,
    volume24hUsd: vol,
    feeTvlRatio: feeTvl,
    volatilityScore: toNum(pool.volatilityScore, 0.45),
    binsBelow,
    binsAbove,
    holdHours: 4,
  });
  if (rr.ratio < LP_MIN_SIM_RISK_REWARD_RATIO) return false;
  if (rr.tier === "extreme" && rr.ratio < LP_MIN_EXTREME_RISK_REWARD_RATIO) return false;
  return true;
}

/**
 * Per-strategy risk gate: non-degen agents cannot enter high/extreme pools or casino vol/TVL.
 */
export function passesRobinhoodStrategyRiskGate(strategy, pool, riskTier, volTvlRatio) {
  const degen = isRobinhoodDegenStrategy(strategy);
  if (!degen) {
    if (riskTier === "high" || riskTier === "extreme") {
      return { pass: false, reason: "risk_tier_blocked_for_non_degen" };
    }
    if (volTvlRatio > ROBINHOOD_MAX_VOL_TVL_RATIO) {
      return { pass: false, reason: "vol_tvl_too_high_for_non_degen" };
    }
  } else if (riskTier === "extreme" && volTvlRatio > ROBINHOOD_MAX_VOL_TVL_RATIO * 1.25) {
    return { pass: false, reason: "extreme_casino_pool" };
  }
  return { pass: true, reason: null };
}

function simPoolSizeMultiplier(tvlUsd) {
  const tvl = toNum(tvlUsd);
  if (tvl > 2_500_000) return 0.78;
  if (tvl > 900_000) return 0.88;
  if (tvl > 450_000) return 0.94;
  if (tvl <= 320_000) return 1.08;
  return 1;
}

function simRiskRewardBoost(pool, synthetic, binsBelow, binsAbove) {
  const rr = computeLpRiskRewardProfile({
    tvlUsd: pool.tvlUsd,
    volume24hUsd: pool.volume24hUsd,
    feeTvlRatio: pool.feeTvlRatio,
    volatilityScore: synthetic.volatilityScore,
    binsBelow,
    binsAbove,
    holdHours: 4,
  });
  if (rr.ratio < LP_MIN_SIM_RISK_REWARD_RATIO) return { eligible: false, boost: 0, profile: rr };
  if (rr.tier === "extreme" && rr.ratio < LP_MIN_EXTREME_RISK_REWARD_RATIO) {
    return { eligible: false, boost: 0, profile: rr };
  }
  const rewardBoost = 0.72 + Math.min(1.45, rr.ratio * 0.52);
  const safetyBoost = 0.88 + (1 - rr.riskScore) * 0.28;
  return { eligible: true, boost: rewardBoost * safetyBoost, profile: rr };
}

async function fetchSimCandidatePools() {
  const [byFee, byVolume] = await Promise.all([
    fetchRobinhoodUniswapPoolPages({
      pages: SIM_POOL_SCAN_PAGES,
      limit: 100,
      sortKey: "fee",
    }),
    fetchRobinhoodUniswapPoolPages({
      pages: 2,
      limit: 100,
      sortKey: "volume",
    }),
  ]);
  const seen = new Map();
  for (const pool of [...byFee, ...byVolume]) {
    if (pool.poolAddress) seen.set(pool.poolAddress, pool);
  }
  return [...seen.values()]
    .filter((p) => passesRobinhoodSimPoolScreen(p) && isQuotePairPool(p))
    .sort((a, b) => {
      const rrA = computeLpRiskRewardProfile({
        tvlUsd: a.tvlUsd,
        volume24hUsd: a.volume24hUsd,
        feeTvlRatio: a.feeTvlRatio,
      }).ratio;
      const rrB = computeLpRiskRewardProfile({
        tvlUsd: b.tvlUsd,
        volume24hUsd: b.volume24hUsd,
        feeTvlRatio: b.feeTvlRatio,
      }).ratio;
      return rrB - rrA;
    });
}

export async function getRobinhoodLpCandidatePools() {
  await ensureRobinhoodLpExperimentBootstrapped();
  const strategies = await resolveRobinhoodLpExperimentStrategies();
  const pools = await fetchSimCandidatePools();
  const candidates = [];
  for (const strategy of strategies) {
    const scored = pools.map((pool) => {
      const synthetic = derivePoolSignals(pool);
      const merged = { ...pool, ...synthetic };
      const scoredRow = scorePool(strategy, merged);
      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        poolAddress: pool.poolAddress,
        poolName: pool.poolName,
        baseSymbol: pool.baseSymbol,
        quoteSymbol: pool.quoteSymbol,
        baseMint: pool.baseMint,
        quoteMint: pool.quoteMint,
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

export async function runRobinhoodLpSignalCycle() {
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 0, errors: ["no_experiment_state"], openedRuns: [], skippedRows: [] };
  }
  const simCfg = mergedSimConfig(state);
  const strategies = await resolveRobinhoodLpExperimentStrategies();
  const pools = await fetchSimCandidatePools();
  const opened = [];
  const skipped = [];
  const errors = [];

  const recentCutoff = new Date(Date.now() - OPEN_POSITION_COOLDOWN_MS);
  const [openAgg, agentRows, recentPoolRows] = await Promise.all([
    RobinhoodLpExperimentRun.aggregate([
      { $match: { experimentId, status: "open" } },
      { $group: { _id: "$strategyId", count: { $sum: 1 } } },
    ]),
    RobinhoodLpExperimentAgentState.find({ experimentId }).select({ strategyId: 1, cashUsd: 1 }).lean(),
    RobinhoodLpExperimentRun.find({
      experimentId,
      $or: [{ status: "open" }, { createdAt: { $gte: recentCutoff } }],
    })
      .select({ strategyId: 1, poolAddress: 1 })
      .lean(),
  ]);
  const openCountByStrategy = new Map(openAgg.map((r) => [Number(r._id), toNum(r.count)]));
  const cashByStrategy = new Map(agentRows.map((a) => [Number(a.strategyId), toNum(a.cashUsd)]));
  const blockedPoolKeys = new Set(
    recentPoolRows.map((row) => `${Number(row.strategyId)}:${row.poolAddress}`),
  );
  // Cohort-wide occupancy: count how many agents already sit on each pool.
  const poolOccupancy = new Map();
  for (const row of recentPoolRows) {
    if (!row.poolAddress) continue;
    const key = String(row.poolAddress).toLowerCase();
    poolOccupancy.set(key, (poolOccupancy.get(key) || 0) + 1);
  }
  const maxAgentsPerPool = Number.isFinite(ROBINHOOD_MAX_AGENTS_PER_POOL)
    ? Math.max(1, Math.floor(ROBINHOOD_MAX_AGENTS_PER_POOL))
    : 3;

  for (const strategy of strategies) {
    try {
      const openCount = openCountByStrategy.get(strategy.id) ?? 0;
      if (openCount >= simCfg.maxConcurrentPositions) {
        skipped.push({ strategyId: strategy.id, reason: "max_positions" });
        continue;
      }

      const cashUsd = cashByStrategy.get(strategy.id) ?? 0;
      const depositUsd = simCfg.maxPositionUsd;
      const effectiveBins = resolveEffectiveBins(strategy.binsBelow, strategy.binsAbove);
      const openFeeUsd = computeRobinhoodSimTransactionCostsUsd(depositUsd, {
        needsSidecarSwap: robinhoodStrategyNeedsSidecarSwap(
          effectiveBins.binsBelow,
          effectiveBins.binsAbove,
        ),
      }).openFeeUsd;
      if (cashUsd < depositUsd + openFeeUsd - 1e-9) {
        skipped.push({ strategyId: strategy.id, reason: "insufficient_cash" });
        continue;
      }

      const scored = pools
        .map((pool) => {
          const synthetic = derivePoolSignals(pool);
          const rrMeta = simRiskRewardBoost(
            pool,
            synthetic,
            effectiveBins.binsBelow,
            effectiveBins.binsAbove,
          );
          if (!rrMeta.eligible) {
            return {
              pool,
              synthetic,
              score: 0,
              gatePassed: false,
              gateReasons: ["risk_reward:below_minimum"],
              signalSnapshot: null,
            };
          }
          const tvl = toNum(pool.tvlUsd);
          const vol = toNum(pool.volume24hUsd);
          const volTvl = tvl > 0 ? vol / tvl : 0;
          const riskGate = passesRobinhoodStrategyRiskGate(
            strategy,
            pool,
            rrMeta.profile.tier,
            volTvl,
          );
          if (!riskGate.pass) {
            return {
              pool,
              synthetic,
              score: 0,
              gatePassed: false,
              gateReasons: [riskGate.reason],
              signalSnapshot: null,
            };
          }
          const enriched = {
            ...pool,
            ...synthetic,
            riskScore: rrMeta.profile.riskScore,
            riskRewardRatio: rrMeta.profile.ratio,
            riskTier: rrMeta.profile.tier,
          };
          const scoredRow = scorePool(strategy, enriched);
          const compoundBoost = 1 + Math.log1p(Math.max(0, cashUsd - simCfg.startingBankUsd)) / 20;
          const sizeBoost = simPoolSizeMultiplier(pool.tvlUsd);
          // Penalize crowded pools so agents diversify instead of cloning JPORK entries.
          const occ = poolOccupancy.get(String(pool.poolAddress || "").toLowerCase()) || 0;
          const crowdingPenalty = occ >= maxAgentsPerPool ? 0 : 1 / (1 + occ * 0.55);
          const adaptiveExit = resolveAdaptiveExitRules(
            strategy.exit || {},
            {
              tvlUsd: pool.tvlUsd,
              volume24hUsd: pool.volume24hUsd,
              feeTvlRatio: pool.feeTvlRatio,
              volatilityScore: synthetic.volatilityScore,
            },
            effectiveBins.binsBelow,
            effectiveBins.binsAbove,
          );
          return {
            pool,
            synthetic: enriched,
            adaptiveExit,
            ...scoredRow,
            score: scoredRow.score * compoundBoost * rrMeta.boost * sizeBoost * crowdingPenalty,
            gatePassed: scoredRow.gatePassed && crowdingPenalty > 0,
          };
        })
        .filter((x) => x.gatePassed)
        .sort((a, b) => b.score - a.score);

      // Pick first candidate that isn't at cohort occupancy cap / per-strategy cooldown.
      let best = null;
      for (const candidate of scored) {
        const poolKey = String(candidate.pool.poolAddress || "").toLowerCase();
        const occ = poolOccupancy.get(poolKey) || 0;
        if (occ >= maxAgentsPerPool) continue;
        if (blockedPoolKeys.has(`${strategy.id}:${candidate.pool.poolAddress}`)) continue;
        best = candidate;
        break;
      }
      if (!best) {
        skipped.push({
          strategyId: strategy.id,
          reason: scored.length === 0 ? "no_candidate" : "pool_cap_or_cooldown",
        });
        continue;
      }

      const costUsd = depositUsd + openFeeUsd;
      const reserved = await RobinhoodLpExperimentAgentState.findOneAndUpdate(
        { experimentId, strategyId: strategy.id, cashUsd: { $gte: costUsd } },
        { $inc: { cashUsd: -costUsd } },
        { new: true },
      );
      if (!reserved) {
        skipped.push({ strategyId: strategy.id, reason: "cash_race" });
        continue;
      }

      try {
        const created = await RobinhoodLpExperimentRun.create({
          experimentId,
          strategyId: strategy.id,
          strategyName: strategy.name,
          lpShape: strategy.lpShape,
          poolAddress: best.pool.poolAddress,
          poolName: best.pool.poolName,
          baseSymbol: best.pool.baseSymbol,
          quoteSymbol: best.pool.quoteSymbol,
          baseMint: best.pool.baseMint,
          quoteMint: best.pool.quoteMint,
          binStep: best.pool.binStep,
          tvlUsd: best.pool.tvlUsd,
          volume24hUsd: best.pool.volume24hUsd,
          organicScore: best.synthetic.organicScore,
          holderCount: best.synthetic.holderCount,
          mcapUsd: best.synthetic.mcapUsd,
          feeTvlRatio: best.pool.feeTvlRatio,
          binsBelow: effectiveBins.binsBelow,
          binsAbove: effectiveBins.binsAbove,
          activeBinAtOpen: best.pool.activeBinId,
          entryPriceUsd: best.pool.currentPrice,
          depositUsd,
          signalSnapshot: best.signalSnapshot,
          screeningSnapshot: {
            ...best.synthetic,
            score: best.score,
            binsClamped: effectiveBins.clamped,
            adaptiveExit: best.adaptiveExit,
            riskTier: best.synthetic.riskTier,
            riskScore: best.synthetic.riskScore,
            riskRewardRatio: best.synthetic.riskRewardRatio,
            peakPnlPct: 0,
          },
          status: "open",
          openedAt: new Date(),
          simOpenFeeUsd: openFeeUsd,
          simCloseFeeUsd: 0,
          simNetPnlUsd: 0,
        });
        opened.push({
          runId: String(created._id),
          strategyId: strategy.id,
          strategyName: strategy.name,
          poolAddress: created.poolAddress,
          poolName: created.poolName,
        });
        blockedPoolKeys.add(`${strategy.id}:${created.poolAddress}`);
        const occKey = String(created.poolAddress || "").toLowerCase();
        poolOccupancy.set(occKey, (poolOccupancy.get(occKey) || 0) + 1);
        openCountByStrategy.set(strategy.id, (openCountByStrategy.get(strategy.id) ?? 0) + 1);
        cashByStrategy.set(strategy.id, cashUsd - costUsd);
      } catch (createErr) {
        await RobinhoodLpExperimentAgentState.updateOne(
          { experimentId, strategyId: strategy.id },
          { $inc: { cashUsd: costUsd } },
        );
        throw createErr;
      }
    } catch (err) {
      errors.push(`strategy:${strategy.id}:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { opened: opened.length, skipped: skipped.length, errors, openedRuns: opened, skippedRows: skipped };
}

export async function resolveOpenRobinhoodLpRuns() {
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [] };
  }
  const openRuns = await RobinhoodLpExperimentRun.find({ status: "open", experimentId })
    .sort({ createdAt: 1 })
    .lean();
  const resolvedRows = [];
  const errors = [];
  const bulkOps = [];
  const strategies = await resolveRobinhoodLpExperimentStrategies();
  const strategyById = new Map(strategies.map((s) => [s.id, s]));

  for (const run of openRuns) {
    try {
      const strategy = strategyById.get(run.strategyId) ?? null;
      if (!strategy) {
        bulkOps.push({
          updateOne: {
            filter: { _id: run._id },
            update: {
              $set: {
                status: "error",
                resolution: "strategy_missing",
                errorMessage: "Strategy not found",
                resolvedAt: new Date(),
                lastEvaluatedAt: new Date(),
              },
            },
          },
        });
        continue;
      }
      const detail = await fetchRobinhoodUniswapPoolDetail(run.poolAddress);
      const now = Date.now();
      const openedAt = new Date(run.openedAt || run.createdAt || Date.now()).getTime();
      const hoursElapsed = Math.max(0, (now - openedAt) / 3_600_000);
      const fields = evaluateRunResolution(
        run,
        detail,
        strategy.exit,
        hoursElapsed,
        ROBINHOOD_LP_EXPERIMENT_DEFAULTS,
      );

      if (!shouldWriteRobinhoodRunResolve(run, fields)) continue;

      const expId = run.experimentId || experimentId;
      if (fields.status !== "open" && expId) {
        const retUsd =
          toNum(run.depositUsd) +
          toNum(run.depositUsd) * (toNum(fields.simPnlPct) / 100) -
          toNum(fields.simCloseFeeUsd);
        await RobinhoodLpExperimentAgentState.updateOne(
          { experimentId: expId, strategyId: run.strategyId },
          { $inc: { cashUsd: retUsd } },
        );
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: run._id },
          update: {
            $set: {
              status: fields.status,
              resolution: fields.resolution,
              tvlUsd: fields.tvlUsd,
              volume24hUsd: fields.volume24hUsd,
              feeTvlRatio: fields.feeTvlRatio,
              simFeesEarnedUsd: fields.simFeesEarnedUsd,
              simPriceDriftPct: fields.simPriceDriftPct,
              simPnlPct: fields.simPnlPct,
              simPnlUsd: fields.simPnlUsd,
              simOpenFeeUsd: fields.simOpenFeeUsd,
              simCloseFeeUsd: fields.simCloseFeeUsd,
              simNetPnlUsd: fields.simNetPnlUsd,
              lastEvaluatedAt: new Date(),
              ...(fields.status !== "open" ? { resolvedAt: new Date() } : {}),
              ...(fields.status === "open"
                ? { "screeningSnapshot.peakPnlPct": fields.peakPnlPct }
                : {}),
            },
          },
        },
      });

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
      bulkOps.push({
        updateOne: {
          filter: { _id: run._id },
          update: {
            $set: {
              status: "error",
              resolution: "resolve_error",
              errorMessage: String(err),
              resolvedAt: new Date(),
            },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await RobinhoodLpExperimentRun.bulkWrite(bulkOps, { ordered: false });
  }

  return {
    resolved: resolvedRows.length,
    openChecked: openRuns.length,
    errors,
    rows: resolvedRows,
  };
}

export async function rankRobinhoodLpStrategiesByNetPnl(experimentId) {
  if (!experimentId) return [];
  const rows = await RobinhoodLpExperimentRun.aggregate([
    {
      $match: {
        experimentId,
        status: { $in: ["win", "loss", "expired", "open"] },
      },
    },
    {
      $group: {
        _id: "$strategyId",
        sumNetPnlUsd: { $sum: { $ifNull: ["$simNetPnlUsd", 0] } },
        runCount: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        decided: {
          $sum: { $cond: [{ $in: ["$status", ["win", "loss", "expired"]] }, 1, 0] },
        },
        sumDecidedNetPnlUsd: {
          $sum: {
            $cond: [
              { $in: ["$status", ["win", "loss", "expired"]] },
              { $ifNull: ["$simNetPnlUsd", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return rows
    .map((row) => {
      const decided = toNum(row.decided);
      const runCount = toNum(row.runCount);
      const sumNetPnlUsd = toNum(row.sumNetPnlUsd);
      const sumDecidedNetPnlUsd = toNum(row.sumDecidedNetPnlUsd);
      const wins = toNum(row.wins);
      const avgNetPnlUsd = runCount > 0 ? sumNetPnlUsd / runCount : 0;
      const avgDecidedNetPnlUsd = decided > 0 ? sumDecidedNetPnlUsd / decided : avgNetPnlUsd;
      const winRate = decided > 0 ? wins / decided : null;
      return {
        strategyId: Number(row._id),
        sumNetPnlUsd,
        avgNetPnlUsd,
        avgDecidedNetPnlUsd,
        rankScore: decided > 0 ? avgDecidedNetPnlUsd : avgNetPnlUsd,
        decided,
        runCount,
        wins,
        winRate,
      };
    })
    .filter((row) => row.runCount > 0)
    .sort((a, b) => {
      if (b.sumNetPnlUsd !== a.sumNetPnlUsd) return b.sumNetPnlUsd - a.sumNetPnlUsd;
      if (b.avgNetPnlUsd !== a.avgNetPnlUsd) return b.avgNetPnlUsd - a.avgNetPnlUsd;
      return (b.winRate ?? -1) - (a.winRate ?? -1);
    });
}

export async function getRobinhoodLpExperimentStats() {
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  const strategies = await resolveRobinhoodLpExperimentStrategies();
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
      avgFeesUsd: 0,
      cashUsd: 0,
      sumNetPnlUsd: 0,
      avgNetPnlUsd: 0,
      sumChainFeesUsd: 0,
    }));
    return { agents: zeros, experimentId: null };
  }

  const match = { experimentId };
  const [statsRows, openRows, agentRows] = await Promise.all([
    RobinhoodLpExperimentRun.aggregate([
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
          avgFeesUsd: { $avg: "$simFeesEarnedUsd" },
          sumNetPnlUsd: { $sum: "$simNetPnlUsd" },
          avgNetPnlUsd: { $avg: "$simNetPnlUsd" },
          sumChainFeesUsd: { $sum: { $add: ["$simOpenFeeUsd", "$simCloseFeeUsd"] } },
        },
      },
    ]),
    RobinhoodLpExperimentRun.find({ ...match, status: "open" }).select({ strategyId: 1 }).lean(),
    RobinhoodLpExperimentAgentState.find({ experimentId }).lean(),
  ]);

  const openMap = openRows.reduce((acc, row) => {
    const key = Number(row.strategyId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const cashMap = new Map(agentRows.map((a) => [a.strategyId, toNum(a.cashUsd)]));

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
      avgFeesUsd: toNum(row?.avgFeesUsd, 0),
      cashUsd: toNum(cashMap.get(strategy.id)),
      sumNetPnlUsd: toNum(row?.sumNetPnlUsd, 0),
      avgNetPnlUsd: toNum(row?.avgNetPnlUsd, 0),
      sumChainFeesUsd: toNum(row?.sumChainFeesUsd, 0),
    };
  });

  return {
    agents: merged.sort((a, b) => {
      if (b.sumNetPnlUsd !== a.sumNetPnlUsd) return b.sumNetPnlUsd - a.sumNetPnlUsd;
      if (b.avgNetPnlUsd !== a.avgNetPnlUsd) return b.avgNetPnlUsd - a.avgNetPnlUsd;
      return (b.winRate ?? -1) - (a.winRate ?? -1);
    }),
    experimentId,
  };
}

export async function listRobinhoodLpRuns({
  limit = DEFAULT_LIST_LIMIT,
  offset = 0,
  strategyId,
  status,
  symbol,
  experimentId: experimentIdOverride,
} = {}) {
  await ensureRobinhoodLpExperimentBootstrapped();
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
    // Escape metacharacters to prevent ReDoS / overly broad $regex matches
    const escaped = symbol.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    q.$or = [
      { baseSymbol: new RegExp(escaped, "i") },
      { quoteSymbol: new RegExp(escaped, "i") },
      { poolName: new RegExp(escaped, "i") },
    ];
  }
  const safeLimit = normalizeLimit(limit);
  const safeOffset = Math.max(0, Number(offset) || 0);
  const [runs, total] = await Promise.all([
    RobinhoodLpExperimentRun.find(q).sort({ createdAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
    RobinhoodLpExperimentRun.countDocuments(q),
  ]);
  return { runs, total };
}

export async function getRobinhoodLpGlobalOverview() {
  await ensureRobinhoodLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  const strategies = await resolveRobinhoodLpExperimentStrategies();
  let pools = [];
  try {
    pools = await fetchRobinhoodUniswapPoolPages({ pages: 2, limit: 80, sortKey: "volume" });
  } catch {
    pools = [];
  }
  const scanTvlUsd = pools.reduce((acc, p) => acc + toNum(p.tvlUsd), 0);
  const scanVolume24hUsd = pools.reduce((acc, p) => acc + toNum(p.volume24hUsd), 0);

  let simulation = {
    activeExperimentId: experimentId,
    strategyCount: strategies.length,
    settledRuns: 0,
    openPositions: 0,
    sumNetPnlUsd: 0,
    sumEquityUsd: 0,
    sumDeployedUsd: 0,
    leaderStrategyId: null,
    leaderAvgNetPnlUsd: null,
    leaderWinRate: null,
  };

  if (experimentId) {
    const stats = await getRobinhoodLpExperimentStats();
    const lab = await getRobinhoodLpExperimentLabState();
    const leader = stats.agents[0] ?? null;
    const settledRuns = stats.agents.reduce((acc, a) => acc + a.decided, 0);
    const openPositions = stats.agents.reduce((acc, a) => acc + a.openPositions, 0);
    const sumNetPnlUsd = stats.agents.reduce((acc, a) => acc + toNum(a.sumNetPnlUsd), 0);
    const sumEquityUsd = lab.agents.reduce((acc, a) => acc + toNum(a.equityUsd), 0);
    const sumDeployedUsd = lab.agents.reduce((acc, a) => acc + toNum(a.deployedUsd), 0);
    simulation = {
      activeExperimentId: experimentId,
      strategyCount: strategies.length,
      settledRuns,
      openPositions,
      sumNetPnlUsd,
      sumEquityUsd,
      sumDeployedUsd,
      leaderStrategyId: leader?.strategyId ?? null,
      leaderAvgNetPnlUsd: leader?.avgNetPnlUsd ?? null,
      leaderWinRate: leader?.winRate ?? null,
    };
  }

  const champion = await import("./experimentChampions.js")
    .then((m) => m.getDeskChampion("lp_robinhood"))
    .catch(() => null);

  return {
    chain: "Robinhood Chain",
    chainId: 4663,
    protocol: "Uniswap",
    uniswap: {
      poolsScanned: pools.length,
      scanTvlUsd,
      scanVolume24hUsd,
    },
    simulation,
    champion,
  };
}
