/**
 * Meridian experiment desk — paper (sim) lab service.
 *
 * Reuses the LP desk's DLMM math end-to-end (candidate discovery, pool scoring, economics,
 * resolution) but keeps its own cohort/state/run collections so the Meridian roster evolves
 * independently. Meridian's edge is expressed purely through its strategy config + autolearn
 * (lessons + pool memory) — no bespoke DLMM math lives here.
 */
import mongoose from "mongoose";
import MeridianRun from "../models/MeridianRun.js";
import MeridianState from "../models/MeridianState.js";
import MeridianAgentState from "../models/MeridianAgentState.js";
import MeridianLesson from "../models/MeridianLesson.js";
import MeridianPoolMemory from "../models/MeridianPoolMemory.js";
import {
  MERIDIAN_DEFAULTS,
  MERIDIAN_REAL_MIRROR_STRATEGY_ID,
} from "../config/meridianStrategies.js";
import {
  resolveMeridianStrategies,
  resolveMeridianStrategyById,
} from "./meridianStrategyResolve.js";
import { getLpCandidatePools, fetchSolPriceUsd, derivePoolSignals } from "./lpExperimentService.js";
import { scorePool } from "./lpExperimentScoring.js";
import { fetchMeteoraPoolDetail } from "./meteoraDlmmClient.js";
import { getLpRealMaxModeledPeakPnlPct } from "../config/lpRealAgentAccess.js";
import {
  applyRiskAdjustedFeeMultiplier,
  computeDlmmFeeShareMultiplier,
  computeFeeYieldPct,
  computeLpNetPnlPct,
  computeLpRiskRewardProfile,
  computePoolRiskScore,
  computePriceDriftPct,
  computeSimTransactionCostsSol,
  getLpSimFeeCalibrationMult,
  isPositionOutOfRange,
  mergeRealExitRules,
  resolveAdaptiveExitRules,
  resolveEffectiveBins,
  shouldCloseByOor,
  strategyLikelyNeedsSidecarSwap,
} from "./lpEconomicsModel.js";

const OPEN_POSITION_COOLDOWN_MS = 45 * 60 * 1000;
/** After a losing/expired close, skip re-opening the same pool for this long. */
const POOL_MEMORY_LOSS_COOLDOWN_MS = 60 * 60 * 1000;
const REAL_MIRROR_VIRTUAL_BANK_SOL = 1000;
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

function mergedSimConfig(stateDoc) {
  const s = stateDoc?.simConfig || {};
  return {
    startingBankSol: toNum(s.startingBankSol, MERIDIAN_DEFAULTS.startingBankSol),
    maxPositionSol: toNum(s.maxPositionSol, MERIDIAN_DEFAULTS.maxPositionSol),
    maxConcurrentPositions: toNum(
      s.maxConcurrentPositions,
      MERIDIAN_DEFAULTS.maxConcurrentPositions,
    ),
    openFeeBps: toNum(s.openFeeBps, MERIDIAN_DEFAULTS.openFeeBps),
    closeFeeBps: toNum(s.closeFeeBps, MERIDIAN_DEFAULTS.closeFeeBps),
  };
}

async function getSingletonStateDoc() {
  return MeridianState.findById("singleton").lean();
}

/**
 * One-time boot: singleton state, cohort id on legacy runs, per-strategy virtual bank rows.
 */
export async function ensureMeridianBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let state = await MeridianState.findById("singleton").lean();
    const simDefaults = MERIDIAN_DEFAULTS;
    if (!state) {
      const activeExperimentId = `meridian-cohort-${Date.now()}`;
      await MeridianState.create({
        _id: "singleton",
        activeExperimentId,
        title: "Meridian DLMM compound simulation (10 SOL bank, 1 SOL slots)",
        startedAt: new Date(),
        simConfig: {
          startingBankSol: simDefaults.startingBankSol,
          maxPositionSol: simDefaults.maxPositionSol,
          maxConcurrentPositions: simDefaults.maxConcurrentPositions,
          openFeeBps: simDefaults.openFeeBps,
          closeFeeBps: simDefaults.closeFeeBps,
        },
      });
      await MeridianRun.updateMany(
        { $or: [{ experimentId: null }, { experimentId: { $exists: false } }] },
        { $set: { experimentId: activeExperimentId } },
      );
      state = await MeridianState.findById("singleton").lean();
    }
    const activeId = state?.activeExperimentId;
    if (!activeId) return;
    const strategies = await resolveMeridianStrategies();
    const cfg = mergedSimConfig(state);
    for (const s of strategies) {
      const exists = await MeridianAgentState.findOne({
        experimentId: activeId,
        strategyId: s.id,
      }).lean();
      if (exists) continue;
      const startingBank =
        s.id === MERIDIAN_REAL_MIRROR_STRATEGY_ID
          ? REAL_MIRROR_VIRTUAL_BANK_SOL
          : cfg.startingBankSol;
      const settled = await MeridianRun.find({
        experimentId: activeId,
        strategyId: s.id,
        status: { $in: ["win", "loss", "expired"] },
      }).lean();
      const openRuns = await MeridianRun.find({
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
      await MeridianAgentState.create({
        experimentId: activeId,
        strategyId: s.id,
        cashSol:
          s.id === MERIDIAN_REAL_MIRROR_STRATEGY_ID
            ? REAL_MIRROR_VIRTUAL_BANK_SOL
            : Math.max(0, cash),
        startingBankSol: startingBank,
      });
    }
  })().finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

/**
 * Resolve one open MeridianRun to sim economics. Copied from the LP resolver so the Meridian
 * desk stays byte-for-byte aligned on DLMM fee/IL math, but reads Meridian's `trailingDropPct`
 * exit key (mapped onto the shared trailing-giveback logic).
 */
function evaluateMeridianRunResolution(run, detail, strategyExit, hoursElapsed, simDefaults) {
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
  // Honor Meridian's trailingDropPct by mapping it onto the shared trailingGivebackPct field.
  const strategyExitMapped =
    strategyExit && typeof strategyExit === "object"
      ? {
          ...strategyExit,
          trailingGivebackPct:
            strategyExit.trailingGivebackPct != null
              ? strategyExit.trailingGivebackPct
              : strategyExit.trailingDropPct,
        }
      : {};
  const adaptiveExit =
    snapshot.adaptiveExit && typeof snapshot.adaptiveExit === "object"
      ? snapshot.adaptiveExit
      : resolveAdaptiveExitRules(strategyExitMapped, poolContext, run.binsBelow, run.binsAbove);
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
  const simFeesEarnedSol = toNum(run.depositSol) * (feeYieldPct / 100);

  const maxPeak = getLpRealMaxModeledPeakPnlPct();
  const priorPeak = Math.min(maxPeak, toNum(snapshot.peakPnlPct));
  const peakPnlPct = Math.min(maxPeak, Math.max(priorPeak, netPnlPct));
  let status = "open";
  let resolution = null;
  if (priceDriftPct <= toNum(exit.stopLossPct, -15)) {
    status = "loss";
    resolution = "stop_loss";
  } else if (netPnlPct >= toNum(exit.takeProfitPct, 5)) {
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

  // Relabel by net-after-fees so "wins" cannot be money-losing.
  if (status === "win" && simNetPnlSol < 0) {
    status = "loss";
    resolution = resolution === "take_profit" ? "tp_below_cost" : resolution || "net_negative";
  } else if (status === "loss" && simNetPnlSol > 0) {
    status = "win";
  } else if (status === "expired" && simNetPnlSol > 0) {
    status = "win";
  }

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

/**
 * Deduped pool universe for Meridian scoring. Reuses the LP candidate discovery (Meteora scan +
 * screening) and collapses per-strategy rows down to one entry per pool.
 */
async function fetchMeridianPoolUniverse() {
  const candidates = await getLpCandidatePools({ realMode: false });
  const byAddr = new Map();
  for (const c of candidates) {
    if (!c.poolAddress || byAddr.has(c.poolAddress)) continue;
    byAddr.set(c.poolAddress, {
      poolAddress: c.poolAddress,
      poolName: c.poolName,
      baseSymbol: c.baseSymbol,
      quoteSymbol: c.quoteSymbol,
      baseMint: c.baseMint,
      quoteMint: c.quoteMint,
      tvlUsd: c.tvlUsd,
      volume24hUsd: c.volume24hUsd,
      feeTvlRatio: c.feeTvlRatio,
    });
  }
  return [...byAddr.values()];
}

/** Score a pool universe for a single Meridian strategy at its effective (real-clamped) bins. */
function scoreUniverseForStrategy(strategy, universe, effectiveBins) {
  return universe
    .map((pool) => {
      const synthetic = derivePoolSignals(pool);
      const rr = computeLpRiskRewardProfile({
        tvlUsd: pool.tvlUsd,
        volume24hUsd: pool.volume24hUsd,
        feeTvlRatio: pool.feeTvlRatio,
        volatilityScore: synthetic.volatilityScore,
        binsBelow: effectiveBins.binsBelow,
        binsAbove: effectiveBins.binsAbove,
        holdHours: 4,
      });
      const enriched = {
        ...pool,
        ...synthetic,
        riskScore: rr.riskScore,
        riskRewardRatio: rr.ratio,
        riskTier: rr.tier,
      };
      const scoredRow = scorePool(strategy, enriched);
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
      return { pool, synthetic: enriched, adaptiveExit, ...scoredRow };
    })
    .filter((x) => x.gatePassed)
    .sort((a, b) => b.score - a.score);
}

/**
 * Pool memory penalty (0–1) applied to a candidate score. Returns 0 (skip) when the pool is in a
 * loss cooldown, otherwise down-weights pools with a losing track record on this desk.
 */
export function applyPoolMemoryPenalty(memory, { now = Date.now() } = {}) {
  if (!memory) return 1;
  if (memory.cooldownUntil && new Date(memory.cooldownUntil).getTime() > now) return 0;
  const wins = toNum(memory.wins);
  const losses = toNum(memory.losses);
  const decided = wins + losses;
  if (decided < 2) return 1;
  const winRate = wins / decided;
  if (toNum(memory.sumPnlSol) < 0 && winRate < 0.4) return 0.35;
  if (winRate < 0.45) return 0.65;
  if (winRate >= 0.6) return 1.1;
  return 1;
}

export async function getMeridianPoolMemory(poolAddress) {
  const addr = String(poolAddress || "").trim();
  if (!addr) return null;
  return MeridianPoolMemory.findOne({ poolAddress: addr }).lean();
}

async function loadPoolMemoryMap(poolAddresses) {
  const addrs = [...new Set((poolAddresses || []).map((a) => String(a)).filter(Boolean))];
  if (addrs.length === 0) return new Map();
  const rows = await MeridianPoolMemory.find({ poolAddress: { $in: addrs } }).lean();
  return new Map(rows.map((r) => [r.poolAddress, r]));
}

async function updatePoolMemoryOnClose(run, fields) {
  const addr = String(run.poolAddress || "").trim();
  if (!addr) return;
  const isLoss = fields.status === "loss" || fields.status === "expired";
  const inc = {
    sumPnlSol: toNum(fields.simNetPnlSol),
    ...(fields.status === "win" ? { wins: 1 } : {}),
    ...(isLoss ? { losses: 1 } : {}),
  };
  const set = {
    lastOutcome: fields.status,
    ...(isLoss ? { cooldownUntil: new Date(Date.now() + POOL_MEMORY_LOSS_COOLDOWN_MS) } : {}),
  };
  await MeridianPoolMemory.updateOne(
    { poolAddress: addr },
    { $inc: inc, $set: set, $setOnInsert: { poolAddress: addr } },
    { upsert: true },
  );
}

/**
 * Append a one-line lesson for a closed run — Meridian's autolearn journal.
 */
export async function recordMeridianLesson(run, fields) {
  try {
    const pnl = toNum(fields.simNetPnlSol);
    const reason = fields.resolution || fields.status;
    let lesson;
    if (fields.status === "win") {
      lesson = `Win via ${reason} on ${run.poolName || run.poolAddress} (+${pnl.toFixed(4)} SOL).`;
    } else if (fields.status === "expired") {
      lesson = `Expired flat on ${run.poolName || run.poolAddress}; fee yield too thin to clear costs.`;
    } else {
      lesson = `Loss via ${reason} on ${run.poolName || run.poolAddress} (${pnl.toFixed(4)} SOL); tighten screen or widen bins.`;
    }
    await MeridianLesson.create({
      experimentId: run.experimentId || null,
      poolAddress: run.poolAddress || null,
      poolName: run.poolName || null,
      lesson,
      closeReason: reason,
      pnlSol: pnl,
      strategyId: run.strategyId ?? null,
      createdAt: new Date(),
    });
  } catch {
    // Journaling must never block resolution.
  }
}

async function hasRecentPosition(experimentId, strategyId, poolAddress) {
  const q = { strategyId, poolAddress, experimentId };
  const open = await MeridianRun.findOne({ ...q, status: "open" }).sort({ createdAt: -1 }).lean();
  if (open) return true;
  const latest = await MeridianRun.findOne(q).sort({ createdAt: -1 }).lean();
  if (!latest?.createdAt) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < OPEN_POSITION_COOLDOWN_MS;
}

/**
 * Sim mirror that follows the current Meridian net-PnL leader (pinned strategy 98).
 * Virtual bank only — no cash gate.
 */
async function runMeridianMirrorSignalCycle(universe) {
  await ensureMeridianBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 1, errors: [], openedRuns: [], skippedRows: [] };
  }
  const simCfg = mergedSimConfig(state);
  const pick = await pickBestMeridianStrategy();
  const leader = pick.strategy?.strategy;
  if (!leader) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [
        { strategyId: MERIDIAN_REAL_MIRROR_STRATEGY_ID, reason: pick.failureReason || "no_leader" },
      ],
    };
  }

  const mirrorId = MERIDIAN_REAL_MIRROR_STRATEGY_ID;
  const openCount = await MeridianRun.countDocuments({
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

  const leaderBins = resolveEffectiveBins(leader.binsBelow, leader.binsAbove);
  const scored = scoreUniverseForStrategy(leader, universe, leaderBins);
  const memoryMap = await loadPoolMemoryMap(scored.map((s) => s.pool.poolAddress));
  let best = null;
  for (const cand of scored) {
    if (applyPoolMemoryPenalty(memoryMap.get(cand.pool.poolAddress)) <= 0) continue;
    if (await hasRecentPosition(experimentId, mirrorId, cand.pool.poolAddress)) continue;
    best = cand;
    break;
  }
  if (!best) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [{ strategyId: mirrorId, reason: "no_candidate", leaderStrategyId: leader.id }],
    };
  }

  try {
    const solPrice = await fetchSolPriceUsd();
    const depositSol = simCfg.maxPositionSol;
    const depositUsd = depositSol * solPrice;
    const openFeeSol = computeSimTransactionCostsSol(depositSol, {
      needsSidecarSwap: strategyLikelyNeedsSidecarSwap(leaderBins.binsBelow, leaderBins.binsAbove),
    }).openFeeSol;
    const detail = await fetchMeteoraPoolDetail(best.pool.poolAddress);
    const created = await MeridianRun.create({
      experimentId,
      strategyId: mirrorId,
      strategyName: (await resolveMeridianStrategyById(mirrorId))?.name || "Meridian Real Mirror",
      lpShape: leader.lpShape,
      poolAddress: best.pool.poolAddress,
      poolName: detail.poolName || best.pool.poolName,
      baseSymbol: detail.baseSymbol || best.pool.baseSymbol,
      quoteSymbol: detail.quoteSymbol || best.pool.quoteSymbol,
      binStep: detail.binStep,
      tvlUsd: detail.tvlUsd ?? best.pool.tvlUsd,
      volume24hUsd: detail.volume24hUsd ?? best.pool.volume24hUsd,
      organicScore: best.synthetic.organicScore,
      holderCount: best.synthetic.holderCount,
      mcapUsd: best.synthetic.mcapUsd,
      feeTvlRatio: detail.feeTvlRatio ?? best.pool.feeTvlRatio,
      binsBelow: leaderBins.binsBelow,
      binsAbove: leaderBins.binsAbove,
      activeBinAtOpen: detail.activeBinId,
      entryPriceUsd: detail.currentPrice,
      depositSol,
      depositUsd,
      signalSnapshot: best.signalSnapshot,
      screeningSnapshot: {
        ...best.synthetic,
        score: best.score,
        adaptiveExit: best.adaptiveExit,
        leaderStrategyId: leader.id,
        leaderStrategyName: leader.name,
        followMode: "real_mirror",
        binsClamped: leaderBins.clamped,
        peakPnlPct: 0,
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

/**
 * Open new paper positions across all Meridian strategies (cash-gated per strategy).
 */
export async function runMeridianSignalCycle() {
  await ensureMeridianBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 0, errors: ["no_experiment_state"], openedRuns: [], skippedRows: [] };
  }
  const simCfg = mergedSimConfig(state);
  const strategies = await resolveMeridianStrategies();
  const universe = await fetchMeridianPoolUniverse();
  const solPrice = await fetchSolPriceUsd();
  const opened = [];
  const skipped = [];
  const errors = [];

  if (universe.length === 0) {
    const mirror = await runMeridianMirrorSignalCycle(universe);
    return {
      opened: mirror.opened,
      skipped: 1 + mirror.skipped,
      errors: [...(mirror.errors || [])],
      openedRuns: [...(mirror.openedRuns || [])],
      skippedRows: [{ reason: "no_universe" }, ...(mirror.skippedRows || [])],
      mirror,
    };
  }

  const recentCutoff = new Date(Date.now() - OPEN_POSITION_COOLDOWN_MS);
  const [openAgg, agentRows, recentPoolRows, memoryMap] = await Promise.all([
    MeridianRun.aggregate([
      { $match: { experimentId, status: "open" } },
      { $group: { _id: "$strategyId", count: { $sum: 1 } } },
    ]),
    MeridianAgentState.find({ experimentId }).select({ strategyId: 1, cashSol: 1 }).lean(),
    MeridianRun.find({
      experimentId,
      $or: [{ status: "open" }, { createdAt: { $gte: recentCutoff } }],
    })
      .select({ strategyId: 1, poolAddress: 1, status: 1 })
      .lean(),
    loadPoolMemoryMap(universe.map((p) => p.poolAddress)),
  ]);
  const openCountByStrategy = new Map(openAgg.map((r) => [Number(r._id), toNum(r.count)]));
  const cashByStrategy = new Map(agentRows.map((a) => [Number(a.strategyId), toNum(a.cashSol)]));
  /** @type {Set<string>} */
  const blockedPoolKeys = new Set();
  for (const row of recentPoolRows) {
    blockedPoolKeys.add(`${Number(row.strategyId)}:${row.poolAddress}`);
  }

  for (const strategy of strategies) {
    if (strategy.id === MERIDIAN_REAL_MIRROR_STRATEGY_ID) continue;
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
        needsSidecarSwap: strategyLikelyNeedsSidecarSwap(
          effectiveBins.binsBelow,
          effectiveBins.binsAbove,
        ),
      }).openFeeSol;
      if (cashSol < depositSol + openFeeSol - 1e-12) {
        skipped.push({ strategyId: strategy.id, reason: "insufficient_cash" });
        continue;
      }

      const scored = scoreUniverseForStrategy(strategy, universe, effectiveBins).map((row) => {
        const penalty = applyPoolMemoryPenalty(memoryMap.get(row.pool.poolAddress));
        const compoundBoost =
          1 + Math.log1p(Math.max(0, cashSol - simCfg.startingBankSol)) / 20;
        return { ...row, penalty, score: row.score * penalty * compoundBoost };
      });
      const best = scored.filter((x) => x.penalty > 0).sort((a, b) => b.score - a.score)[0];
      if (!best) {
        skipped.push({ strategyId: strategy.id, reason: "no_candidate" });
        continue;
      }
      if (blockedPoolKeys.has(`${strategy.id}:${best.pool.poolAddress}`)) {
        skipped.push({ strategyId: strategy.id, reason: "cooldown_or_open" });
        continue;
      }

      const costSol = depositSol + openFeeSol;
      const reserved = await MeridianAgentState.findOneAndUpdate(
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
        const detail = await fetchMeteoraPoolDetail(best.pool.poolAddress);
        const created = await MeridianRun.create({
          experimentId,
          strategyId: strategy.id,
          strategyName: strategy.name,
          lpShape: strategy.lpShape,
          poolAddress: best.pool.poolAddress,
          poolName: detail.poolName || best.pool.poolName,
          baseSymbol: detail.baseSymbol || best.pool.baseSymbol,
          quoteSymbol: detail.quoteSymbol || best.pool.quoteSymbol,
          binStep: detail.binStep,
          tvlUsd: detail.tvlUsd ?? best.pool.tvlUsd,
          volume24hUsd: detail.volume24hUsd ?? best.pool.volume24hUsd,
          organicScore: best.synthetic.organicScore,
          holderCount: best.synthetic.holderCount,
          mcapUsd: best.synthetic.mcapUsd,
          feeTvlRatio: detail.feeTvlRatio ?? best.pool.feeTvlRatio,
          binsBelow: effectiveBins.binsBelow,
          binsAbove: effectiveBins.binsAbove,
          activeBinAtOpen: detail.activeBinId,
          entryPriceUsd: detail.currentPrice,
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
            poolMemoryPenalty: best.penalty,
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
        await MeridianAgentState.updateOne(
          { experimentId, strategyId: strategy.id },
          { $inc: { cashSol: costSol } },
        );
        throw createErr;
      }
    } catch (err) {
      errors.push(`strategy:${strategy.id}:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const mirror = await runMeridianMirrorSignalCycle(universe);

  return {
    opened: opened.length + mirror.opened,
    skipped: skipped.length + mirror.skipped,
    errors: [...errors, ...(mirror.errors || [])],
    openedRuns: [...opened, ...(mirror.openedRuns || [])],
    skippedRows: [...skipped, ...(mirror.skippedRows || [])],
    mirror,
  };
}

/**
 * Resolve all open Meridian runs; return cash, record lessons, update pool memory on close.
 */
export async function resolveOpenMeridianRuns() {
  await ensureMeridianBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [] };
  }
  const openRuns = await MeridianRun.find({ status: "open", experimentId })
    .sort({ createdAt: 1 })
    .lean();
  const resolvedRows = [];
  const errors = [];
  const strategies = await resolveMeridianStrategies();
  const strategyById = new Map(strategies.map((s) => [s.id, s]));

  for (const run of openRuns) {
    try {
      const leaderFromSnapshot =
        run.strategyId === MERIDIAN_REAL_MIRROR_STRATEGY_ID &&
        run.screeningSnapshot != null &&
        typeof run.screeningSnapshot === "object"
          ? Number(run.screeningSnapshot.leaderStrategyId)
          : NaN;
      const exitStrategyId =
        run.strategyId === MERIDIAN_REAL_MIRROR_STRATEGY_ID && Number.isInteger(leaderFromSnapshot)
          ? leaderFromSnapshot
          : run.strategyId;
      const strategy = strategyById.get(exitStrategyId) ?? null;
      if (!strategy) {
        await MeridianRun.updateOne(
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
      const fields = evaluateMeridianRunResolution(
        run,
        detail,
        strategy.exit,
        hoursElapsed,
        MERIDIAN_DEFAULTS,
      );

      if (fields.status === "open") {
        await MeridianRun.updateOne(
          { _id: run._id },
          {
            $set: {
              tvlUsd: fields.tvlUsd,
              volume24hUsd: fields.volume24hUsd,
              feeTvlRatio: fields.feeTvlRatio,
              simFeesEarnedSol: fields.simFeesEarnedSol,
              simPriceDriftPct: fields.simPriceDriftPct,
              simPnlPct: fields.simPnlPct,
              simPnlUsd: fields.simPnlUsd,
              simOpenFeeSol: fields.simOpenFeeSol,
              lastEvaluatedAt: new Date(),
              "screeningSnapshot.peakPnlPct": fields.peakPnlPct,
            },
          },
        );
        continue;
      }

      // Settle: return capital + PnL to the virtual bank (mirror uses a fixed bank — skip).
      if (run.strategyId !== MERIDIAN_REAL_MIRROR_STRATEGY_ID) {
        const retSol =
          toNum(run.depositSol) +
          toNum(run.depositSol) * (toNum(fields.simPnlPct) / 100) -
          toNum(fields.simCloseFeeSol);
        await MeridianAgentState.updateOne(
          { experimentId: run.experimentId || experimentId, strategyId: run.strategyId },
          { $inc: { cashSol: retSol } },
        );
      }

      await MeridianRun.updateOne(
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
            resolvedAt: new Date(),
          },
        },
      );

      await Promise.all([recordMeridianLesson(run, fields), updatePoolMemoryOnClose(run, fields)]);

      resolvedRows.push({
        runId: String(run._id),
        status: fields.status,
        resolution: fields.resolution,
        strategyId: run.strategyId,
      });
    } catch (err) {
      errors.push(`run:${String(run._id)}:${err instanceof Error ? err.message : String(err)}`);
      await MeridianRun.updateOne(
        { _id: run._id },
        {
          $set: {
            status: "error",
            resolution: "resolve_error",
            errorMessage: String(err),
            resolvedAt: new Date(),
          },
        },
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

/**
 * Rank Meridian strategies by settled net PnL (SOL) for real-agent leader selection.
 */
export async function rankMeridianStrategiesByNetPnl(experimentId) {
  if (!experimentId) return [];
  const rows = await MeridianRun.aggregate([
    { $match: { experimentId, status: { $in: ["win", "loss", "expired", "open"] } } },
    {
      $group: {
        _id: "$strategyId",
        sumNetPnlSol: { $sum: { $ifNull: ["$simNetPnlSol", 0] } },
        runCount: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        decided: { $sum: { $cond: [{ $in: ["$status", ["win", "loss", "expired"]] }, 1, 0] } },
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
    .filter((row) => Number(row._id) !== MERIDIAN_REAL_MIRROR_STRATEGY_ID)
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
      return {
        strategyId: Number(row._id),
        sumNetPnlSol,
        avgNetPnlSol,
        avgDecidedNetPnlSol,
        rankScore,
        decided,
        runCount,
        wins,
        winRate,
      };
    })
    .filter((row) => row.runCount > 0)
    .sort((a, b) => {
      if (b.sumNetPnlSol !== a.sumNetPnlSol) return b.sumNetPnlSol - a.sumNetPnlSol;
      if ((b.winRate ?? -1) !== (a.winRate ?? -1)) return (b.winRate ?? -1) - (a.winRate ?? -1);
      return b.decided - a.decided;
    });
}

/**
 * Pick the sim strategy the real Meridian agent should follow (highest net-PnL leader).
 * Returns { strategy, stats, failureReason, ranked }.
 */
export async function pickBestMeridianStrategy() {
  await ensureMeridianBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { strategy: null, stats: null, failureReason: "no_experiment_state", ranked: [] };
  }
  const ranked = await rankMeridianStrategiesByNetPnl(experimentId);
  if (ranked.length === 0) {
    return { strategy: null, stats: null, failureReason: "no_best_strategy", ranked };
  }
  // Prefer a profitable, decided leader. Never fall back to a red strategy for live/mirror.
  const profitable = ranked.find((r) => r.decided >= 3 && r.sumNetPnlSol > 0);
  if (!profitable) {
    return {
      strategy: null,
      stats: null,
      failureReason: "no_profitable_leader",
      ranked,
      usedFallback: false,
    };
  }
  const selected = profitable;
  const strategy = await resolveMeridianStrategyById(selected.strategyId);
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
      strategy,
    },
    stats: selected,
    failureReason: null,
    ranked,
    usedFallback: false,
  };
}

export async function getMeridianLabState() {
  await ensureMeridianBootstrapped();
  const state = await getSingletonStateDoc();
  const referenceSolPriceUsd = await fetchSolPriceUsd();
  if (!state) {
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
  const [agents, openAgg] = await Promise.all([
    MeridianAgentState.find({ experimentId: state.activeExperimentId }).sort({ strategyId: 1 }).lean(),
    MeridianRun.aggregate([
      { $match: { experimentId: state.activeExperimentId, status: "open" } },
      { $group: { _id: "$strategyId", count: { $sum: 1 }, deployedSol: { $sum: "$depositSol" } } },
    ]),
  ]);
  const openMap = new Map(openAgg.map((x) => [x._id, x]));
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

export async function getMeridianStats() {
  await ensureMeridianBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  const strategies = await resolveMeridianStrategies();
  if (!experimentId) {
    return {
      agents: strategies.map((strategy) => ({
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
      })),
      experimentId: null,
    };
  }
  const match = { experimentId };
  const [statsRows, openRows, agentRows] = await Promise.all([
    MeridianRun.aggregate([
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
        },
      },
    ]),
    MeridianRun.find({ ...match, status: "open" }).select({ strategyId: 1 }).lean(),
    MeridianAgentState.find({ experimentId }).lean(),
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
    experimentId,
  };
}

export async function listMeridianStrategies() {
  const strategies = await resolveMeridianStrategies();
  return strategies.map((s) => ({
    id: s.id,
    name: s.name,
    lpShape: s.lpShape,
    binsBelow: s.binsBelow,
    binsAbove: s.binsAbove,
    screeningOverrides: s.screeningOverrides || null,
    exit: s.exit || null,
    notes: s.notes || "",
    isMirror: s.id === MERIDIAN_REAL_MIRROR_STRATEGY_ID,
  }));
}

export async function listMeridianRuns({
  limit = DEFAULT_LIST_LIMIT,
  offset = 0,
  strategyId,
  status,
  symbol,
  experimentId: experimentIdOverride,
} = {}) {
  await ensureMeridianBootstrapped();
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
    MeridianRun.find(q).sort({ createdAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
    MeridianRun.countDocuments(q),
  ]);
  return { runs, total };
}

/**
 * Wipe all Meridian sim runs + per-agent ledger rows and start a new cohort from zero.
 * Never touches real Meridian positions/config.
 */
export async function resetMeridianFromScratch(opts = {}) {
  await ensureMeridianBootstrapped();
  const state = await MeridianState.findById("singleton");
  if (!state) throw new Error("Meridian state missing");
  const cfg = mergedSimConfig(state);
  await MeridianRun.deleteMany({});
  await MeridianAgentState.deleteMany({});
  const nextId = `meridian-cohort-${Date.now()}`;
  state.activeExperimentId = nextId;
  state.title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : "Meridian DLMM compound simulation (reset)";
  state.startedAt = new Date();
  state.simConfig = {
    startingBankSol: cfg.startingBankSol,
    maxPositionSol: cfg.maxPositionSol,
    maxConcurrentPositions: cfg.maxConcurrentPositions,
    openFeeBps: cfg.openFeeBps,
    closeFeeBps: cfg.closeFeeBps,
  };
  await state.save();
  const strategies = await resolveMeridianStrategies();
  for (const s of strategies) {
    const startingBank =
      s.id === MERIDIAN_REAL_MIRROR_STRATEGY_ID ? REAL_MIRROR_VIRTUAL_BANK_SOL : cfg.startingBankSol;
    await MeridianAgentState.create({
      experimentId: nextId,
      strategyId: s.id,
      cashSol: startingBank,
      startingBankSol: startingBank,
    });
  }
  bootPromise = null;
  return { nextExperimentId: nextId };
}
