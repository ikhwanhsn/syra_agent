import mongoose from "mongoose";
import LpExperimentRun from "../models/LpExperimentRun.js";
import LpExperimentState from "../models/LpExperimentState.js";
import LpExperimentAgentState from "../models/LpExperimentAgentState.js";
import {
  LP_AGENT_EXPERIMENT_DEFAULTS,
  LP_REAL_MIRROR_STRATEGY_ID,
  isLpRealEligibleStrategyId,
} from "../config/lpAgentExperimentStrategies.js";
import { resolveLpExperimentStrategies, resolveLpStrategyById } from "./lpExperimentStrategyResolve.js";
import { fetchMeteoraPoolDetail, fetchMeteoraPoolPages, fetchMeteoraPools } from "./meteoraDlmmClient.js";
import { isSolMint } from "./meteoraDlmmExecutor.js";
import { scorePool } from "./lpExperimentScoring.js";
import { derivePoolSignals } from "./lpPoolSignalsSynthetic.js";
import { enrichPoolsWithRealSignals } from "./lpRealSignals.js";
import { passesRealTokenSafety } from "./lpRealTokenSafety.js";
import {
  getLpRealMaxFeeTvlRatio,
  getLpRealMaxVolTvlRatio,
  getLpRealMinTvlUsd,
  getLpRealMinValidatedSimRuns,
  getLpRealMinVol24hUsd,
  getLpRealUseRealSignals,
} from "../config/lpRealAgentAccess.js";
import {
  applyRiskAdjustedFeeMultiplier,
  computeDlmmFeeShareMultiplier,
  computeFeeYieldPct,
  computeLpNetPnlPct,
  computeLpRiskRewardProfile,
  computePoolRiskScore,
  computePriceDriftPct,
  computeSimTransactionCostsSol,
  isPositionOutOfRange,
  LP_MIN_EXTREME_RISK_REWARD_RATIO,
  LP_MIN_REAL_RISK_REWARD_RATIO,
  LP_MIN_SIM_RISK_REWARD_RATIO,
  mergeRealExitRules,
  REAL_MIN_BINS_PER_SIDE,
  resolveAdaptiveExitRules,
  resolveEffectiveBins,
  shouldCloseByOor,
  strategyLikelyNeedsSidecarSwap,
} from "./lpEconomicsModel.js";
import { shouldWriteLpRunResolve } from "../utils/mongoHeartbeatWrite.js";

export { computeLpNetPnlPct, isPositionOutOfRange };

const OPEN_POSITION_COOLDOWN_MS = 45 * 60 * 1000;
const SIM_POOL_SCAN_PAGES = 4;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
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

export async function fetchSolPriceUsd() {
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

export { derivePoolSignals } from "./lpPoolSignalsSynthetic.js";

/**
 * @param {import("mongoose").LeanDocument<any>} run
 * @param {Record<string, unknown>} detail
 * @param {Record<string, unknown>} strategyExit
 * @param {number} hoursElapsed
 * @param {typeof LP_AGENT_EXPERIMENT_DEFAULTS} simDefaults
 */
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
  const feeShareMult = applyRiskAdjustedFeeMultiplier(rawFeeShareMult, riskScore);
  const feeYieldPct = inRange ? baseFeeYieldPct * feeShareMult : baseFeeYieldPct * feeShareMult * 0.25;
  const netPnlPct = computeLpNetPnlPct(priceDriftPct, feeYieldPct, inRange, riskScore);
  const simFeesEarnedSol = toNum(run.depositSol) * (feeYieldPct / 100);

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

  const needsSidecar = strategyLikelyNeedsSidecarSwap(run.binsBelow, run.binsAbove);
  const txCosts = computeSimTransactionCostsSol(run.depositSol, { needsSidecarSwap: needsSidecar });
  const openFeeSol =
    run.simOpenFeeSol != null && Number.isFinite(run.simOpenFeeSol) && toNum(run.simOpenFeeSol) > 0
      ? toNum(run.simOpenFeeSol)
      : txCosts.openFeeSol;
  const closeFeeSol = txCosts.closeFeeSol;
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
    peakPnlPct,
    riskScore,
    adaptiveExit,
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
      const startingBank =
        s.id === LP_REAL_MIRROR_STRATEGY_ID ? REAL_MIRROR_VIRTUAL_BANK_SOL : cfg.startingBankSol;
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
      let cash = startingBank;
      for (const r of settled) {
        const txFallback = computeSimTransactionCostsSol(r.depositSol, {
          needsSidecarSwap: strategyLikelyNeedsSidecarSwap(r.binsBelow, r.binsAbove),
        });
        const openFee = toNum(r.simOpenFeeSol, txFallback.openFeeSol);
        const closeFee = toNum(r.simCloseFeeSol, txFallback.closeFeeSol);
        const net =
          Number.isFinite(r.simNetPnlSol) && r.simNetPnlSol !== 0
            ? toNum(r.simNetPnlSol)
            : toNum(r.depositSol) * (toNum(r.simPnlPct) / 100) - openFee - closeFee;
        cash += net;
      }
      for (const r of openRuns) {
        const txFallback = computeSimTransactionCostsSol(r.depositSol, {
          needsSidecarSwap: strategyLikelyNeedsSidecarSwap(r.binsBelow, r.binsAbove),
        });
        const openFee = toNum(r.simOpenFeeSol, txFallback.openFeeSol);
        cash -= toNum(r.depositSol) + openFee;
      }
      await LpExperimentAgentState.create({
        experimentId: activeId,
        strategyId: s.id,
        cashSol: s.id === LP_REAL_MIRROR_STRATEGY_ID ? REAL_MIRROR_VIRTUAL_BANK_SOL : Math.max(0, cash),
        startingBankSol: startingBank,
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

const REAL_MIRROR_VIRTUAL_BANK_SOL = 1000;

function isSolPairCandidate(c) {
  return isSolPairPool(c);
}

/**
 * Pick the next SOL pool for one strategy (internal).
 * @param {string} realExperimentId — lp_real_config.experimentId (cooldown / recent positions)
 * @param {string|null} simExperimentId — sim lab cohort id (leader open run lookup)
 */
async function pickPoolForLeaderStrategy({
  strategyId,
  realExperimentId,
  simExperimentId,
  hasRecentPositionFn,
  allCandidates,
  maxCandidates,
}) {
  const leaderId = Number(strategyId);
  if (!Number.isInteger(leaderId)) return null;

  const solCandidates = allCandidates
    .filter((c) => c.strategyId === leaderId && c.gatePassed && isSolPairCandidate(c))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates);

  if (simExperimentId) {
    const leaderOpen = await LpExperimentRun.findOne({
      experimentId: simExperimentId,
      strategyId: leaderId,
      status: "open",
    })
      .sort({ createdAt: -1 })
      .lean();
    if (leaderOpen?.poolAddress) {
      const idx = solCandidates.findIndex((c) => c.poolAddress === leaderOpen.poolAddress);
      if (idx > 0) {
        const [match] = solCandidates.splice(idx, 1);
        solCandidates.unshift(match);
      } else if (idx < 0) {
        try {
          const detail = await fetchMeteoraPoolDetail(leaderOpen.poolAddress);
          if (
            passesRealPoolScreen(detail) &&
            (isSolMint(detail.baseMint) || isSolMint(detail.quoteMint))
          ) {
            const recent = await hasRecentPositionFn(
              realExperimentId,
              leaderId,
              leaderOpen.poolAddress,
            );
            if (!recent) {
              return {
                strategyId: leaderId,
                strategyName: leaderOpen.strategyName || `Strategy ${leaderId}`,
                poolAddress: leaderOpen.poolAddress,
                poolName: leaderOpen.poolName || detail.poolName,
                baseSymbol: leaderOpen.baseSymbol,
                quoteSymbol: leaderOpen.quoteSymbol,
                baseMint: detail.baseMint,
                quoteMint: detail.quoteMint,
                score: 0,
                gatePassed: true,
                gateReasons: [],
                signalSnapshot: leaderOpen.signalSnapshot || {},
                tvlUsd: detail.tvlUsd,
                volume24hUsd: detail.volume24hUsd,
                feeTvlRatio: detail.feeTvlRatio,
                fromSimOpenPool: true,
              };
            }
          }
        } catch {
          // Meteora detail fetch failed — continue with scored candidates
        }
      }
    }
  }

  for (const c of solCandidates) {
    const recent = await hasRecentPositionFn(realExperimentId, leaderId, c.poolAddress);
    if (!recent) return c;
  }
  return null;
}

/**
 * Pick the next SOL pool for real / mirror agents: real screen, leader strategy gates,
 * prefer the leader's open sim pool when still eligible, then walk top scores (avoids one-pool churn).
 */
export async function selectRealStylePoolCandidate({
  leaderStrategyId,
  experimentId,
  hasRecentPositionFn,
  maxCandidates = 24,
  rankedStrategyIds = [],
}) {
  const simState = await getSingletonStateDoc();
  const simExperimentId = simState?.activeExperimentId ?? null;
  const allCandidates = await getLpCandidatePools({ realMode: true });

  const tryIds = [
    Number(leaderStrategyId),
    ...rankedStrategyIds.map((id) => Number(id)),
  ].filter((id, idx, arr) => Number.isInteger(id) && arr.indexOf(id) === idx);

  for (const strategyId of tryIds) {
    const picked = await pickPoolForLeaderStrategy({
      strategyId,
      realExperimentId: experimentId,
      simExperimentId,
      hasRecentPositionFn,
      allCandidates,
      maxCandidates,
    });
    if (picked) return picked;
  }

  // Last resort: best gate-passed SOL pool from any strategy (still real-screened).
  const anySol = allCandidates
    .filter((c) => c.gatePassed && isSolPairCandidate(c))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates);
  for (const c of anySol) {
    const recent = await hasRecentPositionFn(experimentId, c.strategyId, c.poolAddress);
    if (!recent) return c;
  }

  return null;
}

/** USDC-quoted pools — sim-only (paper); real LP still requires a SOL leg. */
export function isUsdcPairPool(pool) {
  const base = String(pool?.baseMint || "");
  const quote = String(pool?.quoteMint || "");
  return base === USDC_MINT || quote === USDC_MINT;
}

/** Paper sim: SOL or USDC pairs (captures memecoin-USDC fee farms). */
export function isSimTradablePool(pool) {
  return isSolPairPool(pool) || isUsdcPairPool(pool);
}

/** Aggressive sim screen with minimum risk/reward hurdle. */
export function passesSimPoolScreen(pool, { binsBelow = 30, binsAbove = 30 } = {}) {
  const feeTvl = toNum(pool.feeTvlRatio);
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  if (tvl < 8_000 || vol < 15_000) return false;
  if (feeTvl < 0.00015) return false;
  const volTvl = tvl > 0 ? vol / tvl : 0;
  if (volTvl < 0.35 && feeTvl < 0.0008) return false;

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

/** Fee-earning velocity: fee/TVL × vol/TVL — higher on thin, high-flow pools. */
export function computeFeeVelocityScore(pool) {
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  const feeTvl = toNum(pool.feeTvlRatio);
  if (tvl <= 0) return 0;
  return feeTvl * (vol / tvl);
}

/** Penalize mega pools — sim chases fee density, not blue-chip TVL. */
function simPoolSizeMultiplier(tvlUsd) {
  const tvl = toNum(tvlUsd);
  if (tvl > 2_500_000) return 0.78;
  if (tvl > 900_000) return 0.88;
  if (tvl > 450_000) return 0.94;
  if (tvl <= 320_000) return 1.08;
  return 1;
}

/** Risk-adjusted ranking boost for signal cycle (profit potential × safety). */
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
    fetchMeteoraPoolPages({
      pages: SIM_POOL_SCAN_PAGES,
      limit: 100,
      sortKey: "fee",
      order: "desc",
      hideLowTvl: false,
    }),
    fetchMeteoraPoolPages({
      pages: 2,
      limit: 100,
      sortKey: "volume",
      order: "desc",
      hideLowTvl: false,
    }),
  ]);
  const seen = new Map();
  for (const pool of [...byFee, ...byVolume]) {
    if (pool.poolAddress) seen.set(pool.poolAddress, pool);
  }
  return [...seen.values()]
    .filter((p) => passesSimPoolScreen(p) && isSimTradablePool(p))
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

/** Stricter pool filters for on-chain LP (reduces IL-heavy memecoin / thin pools). */
export function passesRealPoolScreen(pool, { tokenSignals = null } = {}) {
  const feeTvl = toNum(pool.feeTvlRatio);
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  const minTvl = getLpRealMinTvlUsd();
  const minVol = getLpRealMinVol24hUsd();
  const maxVolTvl = getLpRealMaxVolTvlRatio();
  const maxFeeTvl = getLpRealMaxFeeTvlRatio();

  if (tvl < minTvl || vol < minVol) return false;
  // 0.035% daily minimum (thresholds elsewhere use Meteora percent points; stored ratio is decimal).
  if (feeTvl < 0.00035) return false;
  // Reject one-off fee spikes and hyper-churn meme pools.
  if (feeTvl > maxFeeTvl) return false;
  const volTvl = tvl > 0 ? vol / tvl : vol > 0 ? maxVolTvl + 1 : 0;
  if (volTvl > maxVolTvl) return false;

  // Risk/reward hurdle at real bin geometry — expected fees must exceed IL budget (positive EV).
  const rr = computeLpRiskRewardProfile({
    tvlUsd: tvl,
    volume24hUsd: vol,
    feeTvlRatio: feeTvl,
    binsBelow: REAL_MIN_BINS_PER_SIDE,
    binsAbove: REAL_MIN_BINS_PER_SIDE,
    holdHours: 4,
  });
  // Conservative grind: only low/medium risk tiers qualify for on-chain capital.
  if (rr.tier === "extreme" || rr.tier === "high") return false;
  if (rr.ratio < LP_MIN_REAL_RISK_REWARD_RATIO) return false;

  if (tokenSignals) {
    const safety = passesRealTokenSafety(tokenSignals);
    if (!safety.pass) return false;
  }

  return true;
}

/** Real LP txs require a SOL leg (USDC-only pairs are sim-only). */
export function isSolPairPool(pool) {
  return isSolMint(pool?.baseMint) || isSolMint(pool?.quoteMint);
}

export async function getLpCandidatePools({ realMode = false } = {}) {
  await ensureLpExperimentBootstrapped();
  const strategies = await resolveLpExperimentStrategies();
  const pools = realMode
    ? await fetchMeteoraPools({
        page: 1,
        limit: 120,
        sortKey: "tvl",
        order: "desc",
        hideLowTvl: true,
      })
    : await fetchSimCandidatePools();

  let poolList = realMode
    ? pools.filter((p) => passesRealPoolScreen(p) && isSolPairPool(p))
    : pools;

  if (realMode && getLpRealUseRealSignals()) {
    poolList = await enrichPoolsWithRealSignals(poolList, { maxPools: 48 });
    poolList = poolList.filter((p) => passesRealPoolScreen(p, { tokenSignals: p }));
  } else if (realMode) {
    poolList = poolList.map((pool) => ({
      ...pool,
      ...derivePoolSignals(pool),
      realSignalsAvailable: false,
    }));
  }

  const candidates = [];
  for (const strategy of strategies) {
    const scored = poolList.map((pool) => {
      const synthetic = realMode && pool.realSignalsAvailable ? pool : derivePoolSignals(pool);
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
        realSignalsAvailable: Boolean(pool.realSignalsAvailable),
        tokenSafety: pool.realSignalsAvailable
          ? passesRealTokenSafety(pool)
          : { pass: true, reasons: [] },
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

/**
 * Sim agent that mirrors the live LP agent: follows PnL leader, real pool screen, SOL pairs.
 * Skips wallet / cash gates (virtual bank only).
 */
export async function runLpRealMirrorSignalCycle() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 1, errors: ["no_experiment_state"], openedRuns: [], skippedRows: [] };
  }

  const simCfg = mergedSimConfig(state);
  const pick = await pickBestNetPnlStrategy();
  const leader = pick.strategy?.strategy;
  if (!leader) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [{ strategyId: LP_REAL_MIRROR_STRATEGY_ID, reason: pick.failureReason || "no_leader" }],
    };
  }

  const mirrorId = LP_REAL_MIRROR_STRATEGY_ID;
  const openCount = await LpExperimentRun.countDocuments({
    experimentId,
    strategyId: mirrorId,
    status: "open",
  });
  if (openCount >= simCfg.maxConcurrentPositions) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [{ strategyId: mirrorId, reason: "max_positions", leaderStrategyId: leader.id }],
    };
  }

  const poolCandidate = await selectRealStylePoolCandidate({
    leaderStrategyId: leader.id,
    experimentId,
    hasRecentPositionFn: hasRecentPosition,
  });
  if (!poolCandidate) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [{ strategyId: mirrorId, reason: "no_candidate", leaderStrategyId: leader.id }],
    };
  }

  const recent = await hasRecentPosition(experimentId, mirrorId, poolCandidate.poolAddress);
  if (recent) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [{ strategyId: mirrorId, reason: "cooldown_or_open", leaderStrategyId: leader.id }],
    };
  }

  const solPrice = await fetchSolPriceUsd();
  const depositSol = simCfg.maxPositionSol;
  const depositUsd = depositSol * solPrice;
  const leaderBins = resolveEffectiveBins(leader.binsBelow, leader.binsAbove);
  const openFeeSol = computeSimTransactionCostsSol(depositSol, {
    needsSidecarSwap: strategyLikelyNeedsSidecarSwap(leaderBins.binsBelow, leaderBins.binsAbove),
  }).openFeeSol;
  const mirrorStrategy = await resolveLpStrategyById(mirrorId);
  const poolDetail = await fetchMeteoraPoolDetail(poolCandidate.poolAddress);
  const pool = {
    poolAddress: poolCandidate.poolAddress,
    poolName: poolDetail.poolName || poolCandidate.poolName,
    baseSymbol: poolDetail.baseSymbol || poolCandidate.baseSymbol,
    quoteSymbol: poolDetail.quoteSymbol || poolCandidate.quoteSymbol,
    binStep: poolDetail.binStep,
    tvlUsd: poolDetail.tvlUsd ?? poolCandidate.tvlUsd,
    volume24hUsd: poolDetail.volume24hUsd ?? poolCandidate.volume24hUsd,
    feeTvlRatio: poolDetail.feeTvlRatio ?? poolCandidate.feeTvlRatio,
    activeBinId: poolDetail.activeBinId,
    currentPrice: poolDetail.currentPrice,
  };
  const synthetic = derivePoolSignals(pool);

  try {
    const created = await LpExperimentRun.create({
      experimentId,
      strategyId: mirrorId,
      strategyName: mirrorStrategy?.name || "Real mirror (sim)",
      lpShape: leader.lpShape,
      poolAddress: poolCandidate.poolAddress,
      poolName: poolCandidate.poolName,
      baseSymbol: poolCandidate.baseSymbol,
      quoteSymbol: poolCandidate.quoteSymbol,
      binStep: pool.binStep,
      tvlUsd: pool.tvlUsd,
      volume24hUsd: pool.volume24hUsd,
      organicScore: synthetic.organicScore,
      holderCount: synthetic.holderCount,
      mcapUsd: synthetic.mcapUsd,
      feeTvlRatio: pool.feeTvlRatio,
      binsBelow: leaderBins.binsBelow,
      binsAbove: leaderBins.binsAbove,
      activeBinAtOpen: pool.activeBinId,
      entryPriceUsd: pool.currentPrice,
      depositSol,
      depositUsd,
      signalSnapshot: poolCandidate.signalSnapshot,
      screeningSnapshot: {
        ...synthetic,
        score: poolCandidate.score,
        leaderStrategyId: leader.id,
        leaderStrategyName: leader.name,
        followMode: "real_mirror",
        binsClamped: leaderBins.clamped,
      },
      status: "open",
      openedAt: new Date(),
      simOpenFeeSol: openFeeSol,
      simCloseFeeSol: 0,
      simNetPnlSol: 0,
    });
    return {
      opened: 1,
      skipped: 0,
      errors: [],
      openedRuns: [
        {
          runId: String(created._id),
          strategyId: mirrorId,
          strategyName: created.strategyName,
          poolAddress: created.poolAddress,
          poolName: created.poolName,
          leaderStrategyId: leader.id,
        },
      ],
      skippedRows: [],
    };
  } catch (err) {
    return {
      opened: 0,
      skipped: 0,
      errors: [`mirror:${err instanceof Error ? err.message : String(err)}`],
      openedRuns: [],
      skippedRows: [],
    };
  }
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
  const pools = await fetchSimCandidatePools();
  const solPrice = await fetchSolPriceUsd();
  const opened = [];
  const skipped = [];
  const errors = [];

  const recentCutoff = new Date(Date.now() - OPEN_POSITION_COOLDOWN_MS);
  const [openAgg, agentRows, recentPoolRows] = await Promise.all([
    LpExperimentRun.aggregate([
      { $match: { experimentId, status: "open" } },
      { $group: { _id: "$strategyId", count: { $sum: 1 } } },
    ]),
    LpExperimentAgentState.find({ experimentId }).select({ strategyId: 1, cashSol: 1 }).lean(),
    LpExperimentRun.find({
      experimentId,
      $or: [{ status: "open" }, { createdAt: { $gte: recentCutoff } }],
    })
      .select({ strategyId: 1, poolAddress: 1, status: 1 })
      .lean(),
  ]);
  const openCountByStrategy = new Map(openAgg.map((r) => [Number(r._id), toNum(r.count)]));
  const cashByStrategy = new Map(agentRows.map((a) => [Number(a.strategyId), toNum(a.cashSol)]));
  /** @type {Set<string>} */
  const blockedPoolKeys = new Set();
  for (const row of recentPoolRows) {
    blockedPoolKeys.add(`${Number(row.strategyId)}:${row.poolAddress}`);
  }

  for (const strategy of strategies) {
    if (strategy.id === LP_REAL_MIRROR_STRATEGY_ID) continue;
    try {
      const openCount = openCountByStrategy.get(strategy.id) ?? 0;
      if (openCount >= simCfg.maxConcurrentPositions) {
        skipped.push({ strategyId: strategy.id, reason: "max_positions" });
        continue;
      }

      const cashSol = cashByStrategy.get(strategy.id) ?? 0;
      const depositSol = simCfg.maxPositionSol;
      const effectiveBins = resolveEffectiveBins(strategy.binsBelow, strategy.binsAbove);
      const openFeeSol = computeSimTransactionCostsSol(depositSol, {
        needsSidecarSwap: strategyLikelyNeedsSidecarSwap(effectiveBins.binsBelow, effectiveBins.binsAbove),
      }).openFeeSol;
      if (cashSol < depositSol + openFeeSol - 1e-12) {
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
          const enriched = {
            ...pool,
            ...synthetic,
            riskScore: rrMeta.profile.riskScore,
            riskRewardRatio: rrMeta.profile.ratio,
            riskTier: rrMeta.profile.tier,
          };
          const scoredRow = scorePool(strategy, enriched);
          const compoundBoost = 1 + Math.log1p(Math.max(0, cashSol - simCfg.startingBankSol)) / 20;
          const sizeBoost = simPoolSizeMultiplier(pool.tvlUsd);
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
            score: scoredRow.score * compoundBoost * rrMeta.boost * sizeBoost,
          };
        })
        .filter((x) => x.gatePassed)
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best) {
        skipped.push({ strategyId: strategy.id, reason: "no_candidate" });
        continue;
      }
      if (blockedPoolKeys.has(`${strategy.id}:${best.pool.poolAddress}`)) {
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
          binsBelow: effectiveBins.binsBelow,
          binsAbove: effectiveBins.binsAbove,
          activeBinAtOpen: best.pool.activeBinId,
          entryPriceUsd: best.pool.currentPrice,
          depositSol,
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
        blockedPoolKeys.add(`${strategy.id}:${created.poolAddress}`);
        openCountByStrategy.set(strategy.id, (openCountByStrategy.get(strategy.id) ?? 0) + 1);
        cashByStrategy.set(strategy.id, cashSol - costSol);
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

  const mirror = await runLpRealMirrorSignalCycle();

  return {
    opened: opened.length + mirror.opened,
    skipped: skipped.length + mirror.skipped,
    errors: [...errors, ...(mirror.errors || [])],
    openedRuns: [...opened, ...(mirror.openedRuns || [])],
    skippedRows: [...skipped, ...(mirror.skippedRows || [])],
    mirror,
  };
}

export async function resolveOpenLpRuns() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [] };
  }
  const openQuery = { status: "open", experimentId };
  const openRuns = await LpExperimentRun.find(openQuery)
    .select(
      "_id experimentId strategyId poolAddress entryPriceUsd activeBinAtOpen binsBelow binsAbove " +
        "depositSol depositUsd tvlUsd volume24hUsd feeTvlRatio simOpenFeeSol simPnlPct simNetPnlSol " +
        "simFeesEarnedSol simPriceDriftPct lastEvaluatedAt openedAt createdAt screeningSnapshot",
    )
    .sort({ createdAt: 1 })
    .lean();
  const resolvedRows = [];
  const errors = [];
  /** @type {import('mongoose').AnyBulkWriteOperation[]} */
  const bulkOps = [];
  const strategies = await resolveLpExperimentStrategies();
  const strategyById = new Map(strategies.map((s) => [s.id, s]));

  for (const run of openRuns) {
    try {
      const leaderFromSnapshot =
        run.strategyId === LP_REAL_MIRROR_STRATEGY_ID &&
        run.screeningSnapshot != null &&
        typeof run.screeningSnapshot === "object"
          ? Number(run.screeningSnapshot.leaderStrategyId)
          : NaN;
      const exitStrategyId =
        run.strategyId === LP_REAL_MIRROR_STRATEGY_ID && Number.isInteger(leaderFromSnapshot)
          ? leaderFromSnapshot
          : run.strategyId;
      const strategy = strategyById.get(exitStrategyId) ?? null;
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
      const detail = await fetchMeteoraPoolDetail(run.poolAddress);
      const now = Date.now();
      const openedAt = new Date(run.openedAt || run.createdAt || Date.now()).getTime();
      const hoursElapsed = Math.max(0, (now - openedAt) / 3_600_000);
      const fields = evaluateRunResolution(run, detail, strategy.exit, hoursElapsed, LP_AGENT_EXPERIMENT_DEFAULTS);

      if (!shouldWriteLpRunResolve(run, fields)) {
        continue;
      }

      const expId = run.experimentId || experimentId;
      if (fields.status !== "open" && expId && run.strategyId !== LP_REAL_MIRROR_STRATEGY_ID) {
        const retSol =
          toNum(run.depositSol) + toNum(run.depositSol) * (toNum(fields.simPnlPct) / 100) - toNum(fields.simCloseFeeSol);
        await LpExperimentAgentState.updateOne(
          { experimentId: expId, strategyId: run.strategyId },
          { $inc: { cashSol: retSol } },
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
              simFeesEarnedSol: fields.simFeesEarnedSol,
              simPriceDriftPct: fields.simPriceDriftPct,
              simPnlPct: fields.simPnlPct,
              simPnlUsd: fields.simPnlUsd,
              simOpenFeeSol: fields.simOpenFeeSol,
              simCloseFeeSol: fields.simCloseFeeSol,
              simNetPnlSol: fields.simNetPnlSol,
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
    await LpExperimentRun.bulkWrite(bulkOps, { ordered: false });
  }

  return {
    resolved: resolvedRows.length,
    openChecked: openRuns.length,
    errors,
    rows: resolvedRows,
  };
}

/** Min settled sim runs before real agent refuses a negative-PnL leader. */
export const LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE = (() => {
  const n = Number(process.env.LP_AGENT_REAL_MIN_DECIDED);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 12;
})();
/** Real LP requires this win rate when enough sim history exists. */
export const LP_REAL_MIN_WIN_RATE = (() => {
  const n = Number(process.env.LP_AGENT_REAL_MIN_WIN_RATE);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.58;
})();

/**
 * Composite score for real-agent leader: rewards high net PnL and high win rate together.
 * @param {ReturnType<typeof rankLpExperimentStrategiesByNetPnl>[number]} row
 */
export function computeRealLeaderScore(row) {
  const decided = toNum(row.decided);
  const winRate = row.winRate ?? 0;
  const sumPnl = toNum(row.sumNetPnlSol);
  if (sumPnl <= 0 || decided <= 0) return -999;

  const sampleFactor = Math.min(1, decided / LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE);
  const winFactor = Math.max(0, Math.min(1, (winRate - 0.4) / 0.55));
  const pnlFactor = Math.log1p(Math.max(0, sumPnl) * 12);
  return pnlFactor * (0.5 + winFactor * 0.5) * (0.3 + sampleFactor * 0.7);
}

/**
 * Rank sim strategies for real-agent selection: avg net PnL on settled runs first,
 * then total net PnL, win rate, and sample size.
 */
export async function rankLpExperimentStrategiesByNetPnl(experimentId) {
  if (!experimentId) return [];

  const rows = await LpExperimentRun.aggregate([
    {
      $match: {
        experimentId,
        status: { $in: ["win", "loss", "expired", "open"] },
      },
    },
    {
      $group: {
        _id: "$strategyId",
        sumNetPnlSol: { $sum: { $ifNull: ["$simNetPnlSol", 0] } },
        runCount: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        decided: {
          $sum: { $cond: [{ $in: ["$status", ["win", "loss", "expired"]] }, 1, 0] },
        },
        sumDecidedNetPnlSol: {
          $sum: {
            $cond: [
              { $in: ["$status", ["win", "loss", "expired"]] },
              { $ifNull: ["$simNetPnlSol", 0] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return rows
    .filter((row) => Number(row._id) !== LP_REAL_MIRROR_STRATEGY_ID)
    .map((row) => {
      const decided = toNum(row.decided);
      const runCount = toNum(row.runCount);
      const sumNetPnlSol = toNum(row.sumNetPnlSol);
      const sumDecidedNetPnlSol = toNum(row.sumDecidedNetPnlSol);
      const wins = toNum(row.wins);
      const avgNetPnlSol = runCount > 0 ? sumNetPnlSol / runCount : 0;
      const avgDecidedNetPnlSol = decided > 0 ? sumDecidedNetPnlSol / decided : avgNetPnlSol;
      const winRate = decided > 0 ? wins / decided : null;
      const rankScore = decided > 0 ? avgDecidedNetPnlSol : avgNetPnlSol;
      const realLeaderScore = computeRealLeaderScore({
        decided,
        winRate,
        sumNetPnlSol,
      });

      return {
        strategyId: Number(row._id),
        sumNetPnlSol,
        avgNetPnlSol,
        avgDecidedNetPnlSol,
        rankScore,
        realLeaderScore,
        decided,
        runCount,
        wins,
        winRate,
      };
    })
    .filter((row) => row.runCount > 0)
    .sort((a, b) => {
      if (b.realLeaderScore !== a.realLeaderScore) return b.realLeaderScore - a.realLeaderScore;
      if (b.sumNetPnlSol !== a.sumNetPnlSol) return b.sumNetPnlSol - a.sumNetPnlSol;
      if ((b.winRate ?? -1) !== (a.winRate ?? -1)) return (b.winRate ?? -1) - (a.winRate ?? -1);
      return b.decided - a.decided;
    });
}

async function countRealComparableSimDecisions(experimentId, strategyId) {
  const minValidated = getLpRealMinValidatedSimRuns();
  if (minValidated <= 0) return minValidated;

  const runs = await LpExperimentRun.find({
    experimentId,
    strategyId,
    status: { $in: ["closed_win", "closed_loss", "expired", "win", "loss"] },
  })
    .select("tvlUsd volume24hUsd feeTvlRatio baseMint quoteMint")
    .sort({ resolvedAt: -1, updatedAt: -1 })
    .limit(60)
    .lean();

  let count = 0;
  for (const run of runs) {
    const pool = {
      tvlUsd: run.tvlUsd,
      volume24hUsd: run.volume24hUsd,
      feeTvlRatio: run.feeTvlRatio,
      baseMint: run.baseMint,
      quoteMint: run.quoteMint,
    };
    if (!isSolPairPool(pool)) continue;
    if (!passesRealPoolScreen(pool)) continue;
    count += 1;
  }
  return count;
}

async function applyRealShadowGate(rows, experimentId) {
  const minValidated = getLpRealMinValidatedSimRuns();
  if (minValidated <= 0 || !experimentId) return rows;

  const validated = [];
  for (const row of rows) {
    const comparable = await countRealComparableSimDecisions(experimentId, row.strategyId);
    if (comparable >= minValidated) {
      validated.push({ ...row, realValidatedSimRuns: comparable });
    }
  }
  return validated.length > 0 ? validated : [];
}

async function filterQualifiedRealStrategyRows(ranked, experimentId) {
  const eligible = ranked.filter((row) => isLpRealEligibleStrategyId(row.strategyId));

  const qualified = eligible.filter(
    (row) =>
      row.decided >= LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE &&
      row.sumNetPnlSol > 0 &&
      (row.winRate ?? 0) >= LP_REAL_MIN_WIN_RATE,
  );
  if (qualified.length > 0) {
    const sorted = [...qualified].sort((a, b) => b.realLeaderScore - a.realLeaderScore);
    const shadowed = await applyRealShadowGate(sorted, experimentId);
    return shadowed.length > 0 ? shadowed : sorted;
  }

  if (
    eligible.length > 0 &&
    eligible[0].decided < LP_REAL_MIN_DECIDED_FOR_PROFIT_GATE &&
    eligible[0].sumNetPnlSol >= 0
  ) {
    const warming = [eligible[0]];
    const shadowed = await applyRealShadowGate(warming, experimentId);
    return shadowed.length > 0 ? shadowed : warming;
  }

  const warming = eligible.filter(
    (row) => row.sumNetPnlSol > 0 && row.decided >= 6 && (row.winRate ?? 0) >= 0.55,
  );
  if (warming.length > 0) {
    const sorted = [...warming].sort((a, b) => b.realLeaderScore - a.realLeaderScore);
    const shadowed = await applyRealShadowGate(sorted, experimentId);
    return shadowed.length > 0 ? shadowed : sorted;
  }

  // Safe fallback: best eligible with positive net PnL and ≥3 decided — prevents starvation
  // when win-rate gate is temporarily unmet. Prefer highest realLeaderScore.
  const safeFallback = eligible
    .filter((row) => row.sumNetPnlSol > 0 && row.decided >= 3)
    .sort((a, b) => b.realLeaderScore - a.realLeaderScore);
  if (safeFallback.length > 0) {
    const top = [{ ...safeFallback[0], safeFallback: true }];
    const shadowed = await applyRealShadowGate(top, experimentId);
    return shadowed.length > 0 ? shadowed : top;
  }

  return [];
}

/**
 * Soft fallback when no strategy passes profit gates — pick best eligible by composite score
 * even if slightly negative, so the agent can stay warm with reduced size rather than starve.
 * Caller must treat `safeFallback` / `softFallback` as lower conviction.
 * Prefer returning null over softFallback for live opens — softFallback is negative PnL.
 */
export async function selectSafeFallbackStrategyLeader(ranked) {
  const eligible = (ranked || []).filter((row) => isLpRealEligibleStrategyId(row.strategyId));
  if (eligible.length === 0) return null;
  const byScore = [...eligible].sort((a, b) => b.realLeaderScore - a.realLeaderScore);
  const positive = byScore.find((row) => row.sumNetPnlSol > 0 && row.decided >= 3);
  if (positive) return { ...positive, safeFallback: true };
  // Soft (negative) fallback — marked for size cut or skip by caller; do not prefer it.
  const leastBad = byScore.find((row) => row.decided >= 6 && (row.winRate ?? 0) >= 0.55);
  if (leastBad && leastBad.sumNetPnlSol > -0.05) {
    return { ...leastBad, softFallback: true };
  }
  return null;
}

async function selectProfitableStrategyLeader(ranked, experimentId) {
  const qualified = await filterQualifiedRealStrategyRows(ranked, experimentId);
  return qualified[0] ?? null;
}

/**
 * Top sim strategies for simultaneous real LP slots (win rate + net PnL composite).
 * @param {Awaited<ReturnType<typeof rankLpExperimentStrategiesByNetPnl>>} ranked
 * @param {{ maxCount?: number }} [opts]
 */
export async function selectQualifiedStrategiesForReal(ranked, { maxCount = 8, experimentId = null } = {}) {
  const expId =
    experimentId ??
    (await getSingletonStateDoc().then((s) => s?.activeExperimentId ?? null).catch(() => null));
  let rows = (await filterQualifiedRealStrategyRows(ranked, expId)).slice(0, Math.max(1, maxCount));
  if (rows.length === 0) {
    const fallback = await selectSafeFallbackStrategyLeader(ranked);
    // Never promote softFallback (negative/thin) to full-size opens — pause instead.
    if (fallback && !fallback.softFallback) rows = [fallback];
  }
  const out = [];
  for (const stats of rows) {
    if (!isLpRealEligibleStrategyId(stats.strategyId)) continue;
    const strategy = await resolveLpStrategyById(stats.strategyId);
    if (!strategy) continue;
    out.push({
      strategyId: strategy.id,
      strategyName: strategy.name,
      lpShape: strategy.lpShape,
      sumNetPnlSol: stats.sumNetPnlSol,
      avgNetPnlSol: stats.avgDecidedNetPnlSol,
      rankScore: stats.rankScore,
      decided: stats.decided,
      runCount: stats.runCount,
      winRate: stats.winRate,
      realLeaderScore: stats.realLeaderScore,
      safeFallback: Boolean(stats.safeFallback),
      softFallback: Boolean(stats.softFallback),
      strategy,
    });
  }
  return out;
}

/**
 * Pick the sim strategy the real LP agent should follow (highest net-PnL leader).
 * Returns { strategy, stats, failureReason } — failureReason is set when no pick is made.
 */
export async function pickBestNetPnlStrategy() {
  await ensureLpExperimentBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { strategy: null, stats: null, failureReason: "no_best_strategy", ranked: [] };
  }

  const ranked = await rankLpExperimentStrategiesByNetPnl(experimentId);
  if (ranked.length === 0) {
    return { strategy: null, stats: null, failureReason: "no_best_strategy", ranked };
  }

  const selected = await selectProfitableStrategyLeader(ranked, experimentId);
  if (!selected) {
    const fallback = await selectSafeFallbackStrategyLeader(ranked);
    // softFallback = negative/thin — pause opens rather than trade full-size losers.
    if (fallback && !fallback.softFallback) {
      const strategy = await resolveLpStrategyById(fallback.strategyId);
      if (strategy) {
        return {
          strategy: {
            strategyId: strategy.id,
            strategyName: strategy.name,
            lpShape: strategy.lpShape,
            sumNetPnlSol: fallback.sumNetPnlSol,
            avgNetPnlSol: fallback.avgDecidedNetPnlSol,
            rankScore: fallback.rankScore,
            decided: fallback.decided,
            runCount: fallback.runCount,
            winRate: fallback.winRate,
            realLeaderScore: fallback.realLeaderScore,
            safeFallback: true,
            softFallback: false,
            strategy,
          },
          stats: fallback,
          failureReason: null,
          ranked,
          usedSafeFallback: true,
        };
      }
    }
    return { strategy: null, stats: null, failureReason: "no_profitable_strategy", ranked };
  }

  const strategy = await resolveLpStrategyById(selected.strategyId);
  if (!strategy) {
    return { strategy: null, stats: null, failureReason: "no_best_strategy", ranked };
  }

  return {
    strategy: {
      strategyId: strategy.id,
      strategyName: strategy.name,
      lpShape: strategy.lpShape,
      sumNetPnlSol: selected.sumNetPnlSol,
      avgNetPnlSol: selected.avgDecidedNetPnlSol,
      rankScore: selected.rankScore,
      decided: selected.decided,
      runCount: selected.runCount,
      winRate: selected.winRate,
      realLeaderScore: selected.realLeaderScore,
      strategy,
    },
    stats: selected,
    failureReason: null,
    ranked,
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
      if (b.sumNetPnlSol !== a.sumNetPnlSol) return b.sumNetPnlSol - a.sumNetPnlSol;
      if (b.avgNetPnlSol !== a.avgNetPnlSol) return b.avgNetPnlSol - a.avgNetPnlSol;
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
