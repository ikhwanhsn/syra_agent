/**
 * AyeLabs experiment desk — paper (sim) lab service.
 *
 * Candidate discovery uses GMGN V/L radar (ayehuasca/gmgn-vl-radar gates), then resolves
 * Meteora DLMM pools by mint. Scoring/economics reuse the LP desk helpers.
 */
import mongoose from "mongoose";
import AyeLabsRun from "../models/AyeLabsRun.js";
import AyeLabsState from "../models/AyeLabsState.js";
import AyeLabsAgentState from "../models/AyeLabsAgentState.js";
import AyeLabsLesson from "../models/AyeLabsLesson.js";
import AyeLabsPoolMemory from "../models/AyeLabsPoolMemory.js";
import {
  AYE_LABS_DEFAULTS,
  AYE_LABS_REAL_MIRROR_STRATEGY_ID,
  AYE_LABS_SCREENING_BASE,
} from "../config/ayeLabsStrategies.js";
import {
  resolveAyeLabsStrategies,
  resolveAyeLabsStrategyById,
} from "./ayeLabsStrategyResolve.js";
import { getLpCandidatePools, fetchSolPriceUsd, derivePoolSignals } from "./lpExperimentService.js";
import { scorePool } from "./lpExperimentScoring.js";
import { fetchMeteoraPoolDetail, fetchMeteoraPoolsByTokenMint } from "./meteoraDlmmClient.js";
import {
  enrichRadarBoardFlow,
  fetchAyeLabsRadarBoard,
} from "./ayeLabsGmgnRadar.js";
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
    startingBankSol: toNum(s.startingBankSol, AYE_LABS_DEFAULTS.startingBankSol),
    maxPositionSol: toNum(s.maxPositionSol, AYE_LABS_DEFAULTS.maxPositionSol),
    maxConcurrentPositions: toNum(
      s.maxConcurrentPositions,
      AYE_LABS_DEFAULTS.maxConcurrentPositions,
    ),
    openFeeBps: toNum(s.openFeeBps, AYE_LABS_DEFAULTS.openFeeBps),
    closeFeeBps: toNum(s.closeFeeBps, AYE_LABS_DEFAULTS.closeFeeBps),
  };
}

async function getSingletonStateDoc() {
  return AyeLabsState.findById("singleton").lean();
}

/**
 * One-time boot: singleton state, cohort id on legacy runs, per-strategy virtual bank rows.
 */
export async function ensureAyeLabsBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let state = await AyeLabsState.findById("singleton").lean();
    const simDefaults = AYE_LABS_DEFAULTS;
    if (!state) {
      const activeExperimentId = `ayeLabs-cohort-${Date.now()}`;
      await AyeLabsState.create({
        _id: "singleton",
        activeExperimentId,
        title: "AyeLabs GMGN V/L radar + DLMM paper (10 SOL bank, 1h max hold)",
        startedAt: new Date(),
        simConfig: {
          startingBankSol: simDefaults.startingBankSol,
          maxPositionSol: simDefaults.maxPositionSol,
          maxConcurrentPositions: simDefaults.maxConcurrentPositions,
          openFeeBps: simDefaults.openFeeBps,
          closeFeeBps: simDefaults.closeFeeBps,
        },
      });
      await AyeLabsRun.updateMany(
        { $or: [{ experimentId: null }, { experimentId: { $exists: false } }] },
        { $set: { experimentId: activeExperimentId } },
      );
      state = await AyeLabsState.findById("singleton").lean();
    }
    const activeId = state?.activeExperimentId;
    if (!activeId) return;
    const strategies = await resolveAyeLabsStrategies();
    const cfg = mergedSimConfig(state);
    for (const s of strategies) {
      const exists = await AyeLabsAgentState.findOne({
        experimentId: activeId,
        strategyId: s.id,
      }).lean();
      if (exists) continue;
      const startingBank =
        s.id === AYE_LABS_REAL_MIRROR_STRATEGY_ID
          ? REAL_MIRROR_VIRTUAL_BANK_SOL
          : cfg.startingBankSol;
      const settled = await AyeLabsRun.find({
        experimentId: activeId,
        strategyId: s.id,
        status: { $in: ["win", "loss", "expired"] },
      }).lean();
      const openRuns = await AyeLabsRun.find({
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
      await AyeLabsAgentState.create({
        experimentId: activeId,
        strategyId: s.id,
        cashSol:
          s.id === AYE_LABS_REAL_MIRROR_STRATEGY_ID
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
 * Resolve one open AyeLabsRun to sim economics. Copied from the LP resolver so the AyeLabs
 * desk stays byte-for-byte aligned on DLMM fee/IL math, but reads AyeLabs's `trailingDropPct`
 * exit key (mapped onto the shared trailing-giveback logic).
 */
function evaluateAyeLabsRunResolution(run, detail, strategyExit, hoursElapsed, simDefaults) {
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
  // Honor AyeLabs's trailingDropPct by mapping it onto the shared trailingGivebackPct field.
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

function checkRadarCondition(condition, signals) {
  const v = signals[condition.field];
  const target = condition.value;
  switch (condition.op) {
    case "eq":
      return v === target;
    case "gte":
      return Number(v) >= Number(target);
    case "lte":
      return Number(v) <= Number(target);
    case "gt":
      return Number(v) > Number(target);
    case "lt":
      return Number(v) < Number(target);
    default:
      return false;
  }
}

/** Radar signalGate fields (vl_ratio, FLOW, S×) live on the pool, not in LP buildLpSignals. */
function applyAyeLabsRadarGate(strategy, pool) {
  const gate = strategy.signalGate || {};
  const reasons = [];
  const all = Array.isArray(gate.all) ? gate.all : [];
  const any = Array.isArray(gate.any) ? gate.any : [];
  for (const cond of all) {
    if (!checkRadarCondition(cond, pool)) {
      reasons.push(`all:${cond.field}:${cond.op}:${String(cond.value)}`);
    }
  }
  if (any.length > 0) {
    let passCount = 0;
    for (const cond of any) {
      if (checkRadarCondition(cond, pool)) passCount += 1;
    }
    const required = Number.isFinite(Number(gate.minPasses)) ? Number(gate.minPasses) : 1;
    if (passCount < required) reasons.push(`any:minPasses:${passCount}/${required}`);
  }
  return { pass: reasons.length === 0, reasons };
}

/**
 * GMGN V/L radar board → Meteora DLMM pools (mint match + LP candidate intersect).
 * @returns {Promise<{ pools: object[], meta: {
 *   gmgnOk: boolean;
 *   gmgnError: string | null;
 *   radarTokens: number;
 *   poolCount: number;
 *   reason: string | null;
 * } }>}
 */
async function fetchAyeLabsPoolUniverse() {
  const screen = AYE_LABS_SCREENING_BASE;
  const emptyMeta = {
    gmgnOk: false,
    gmgnError: null,
    radarTokens: 0,
    poolCount: 0,
    reason: null,
  };
  const board = await fetchAyeLabsRadarBoard(screen);
  if (!board.ok) {
    console.warn("[AyeLabs] GMGN radar unavailable:", board.error || "unknown");
    return {
      pools: [],
      meta: {
        ...emptyMeta,
        gmgnError: board.error || "gmgn_unavailable",
        reason: "gmgn_unavailable",
      },
    };
  }
  if (board.tokens.length === 0) {
    return { pools: [], meta: { ...emptyMeta, gmgnOk: true, reason: "empty_radar_board" } };
  }

  const enrichedTokens = await enrichRadarBoardFlow(board.tokens, screen.boardLimit || 10);
  const mintToRadar = new Map();
  for (const t of enrichedTokens) {
    const mint = String(t.address || t.token_address || "").trim();
    if (mint) mintToRadar.set(mint, t);
  }
  if (mintToRadar.size === 0) {
    return {
      pools: [],
      meta: {
        ...emptyMeta,
        gmgnOk: true,
        radarTokens: board.tokens.length,
        reason: "no_radar_mints",
      },
    };
  }

  const lpCandidates = await getLpCandidatePools({ realMode: false }).catch(() => []);
  const byAddr = new Map();

  for (const c of lpCandidates) {
    const base = String(c.baseMint || "").trim();
    const quote = String(c.quoteMint || "").trim();
    const radar = mintToRadar.get(base) || mintToRadar.get(quote);
    if (!radar || !c.poolAddress || byAddr.has(c.poolAddress)) continue;
    byAddr.set(c.poolAddress, {
      poolAddress: c.poolAddress,
      poolName: c.poolName,
      baseSymbol: c.baseSymbol || radar.symbol,
      quoteSymbol: c.quoteSymbol,
      baseMint: c.baseMint,
      quoteMint: c.quoteMint,
      tvlUsd: c.tvlUsd ?? toNum(radar.liquidity),
      volume24hUsd: c.volume24hUsd ?? toNum(radar.volume),
      feeTvlRatio: c.feeTvlRatio,
      holderCount: toNum(radar.holder_count ?? radar.holderCount),
      mcapUsd: toNum(radar.market_cap ?? radar.marketCap),
      vl_ratio: toNum(radar.vl_ratio),
      flow_ratio: radar.flow_ratio,
      flow_bullish: Boolean(radar.flow_bullish),
      flow_bearish: Boolean(radar.flow_bearish),
      swap_speed: radar.swap_speed,
      swaps_5m: toNum(radar.swaps_5m),
      swaps_1h: toNum(radar.swaps_1h),
      radarSymbol: radar.symbol,
      radarAddress: radar.address || radar.token_address,
    });
  }

  // Resolve Meteora pools for radar mints not already in the LP candidate set.
  for (const [mint, radar] of mintToRadar) {
    const already = [...byAddr.values()].some(
      (p) => p.baseMint === mint || p.quoteMint === mint || p.radarAddress === mint,
    );
    if (already) continue;
    try {
      const pools = await fetchMeteoraPoolsByTokenMint(mint, {
        textQueries: radar.symbol ? [String(radar.symbol)] : [],
        maxPages: 3,
      });
      const rows = Array.isArray(pools) ? pools : [];
      for (const row of rows.slice(0, 2)) {
        const addr = String(row.address || row.pool_address || row.pubkey || "").trim();
        if (!addr || byAddr.has(addr)) continue;
        const tvl = toNum(row.tvl || row.liquidity || radar.liquidity);
        const vol = toNum(row.volume_24h || row.trade_volume_24h || radar.volume);
        byAddr.set(addr, {
          poolAddress: addr,
          poolName: row.name || `${radar.symbol || "TOKEN"}-SOL`,
          baseSymbol: radar.symbol || null,
          quoteSymbol: "SOL",
          baseMint: mint,
          quoteMint: null,
          tvlUsd: tvl,
          volume24hUsd: vol,
          feeTvlRatio: tvl > 0 ? vol / tvl / 24 : null,
          holderCount: toNum(radar.holder_count ?? radar.holderCount),
          mcapUsd: toNum(radar.market_cap ?? radar.marketCap),
          vl_ratio: toNum(radar.vl_ratio),
          flow_ratio: radar.flow_ratio,
          flow_bullish: Boolean(radar.flow_bullish),
          flow_bearish: Boolean(radar.flow_bearish),
          swap_speed: radar.swap_speed,
          swaps_5m: toNum(radar.swaps_5m),
          swaps_1h: toNum(radar.swaps_1h),
          radarSymbol: radar.symbol,
          radarAddress: mint,
        });
      }
    } catch (e) {
      console.warn("[AyeLabs] meteora mint resolve failed:", mint, e?.message || e);
    }
  }

  const pools = [...byAddr.values()].sort((a, b) => toNum(b.vl_ratio) - toNum(a.vl_ratio));
  return {
    pools,
    meta: {
      gmgnOk: true,
      gmgnError: null,
      radarTokens: mintToRadar.size,
      poolCount: pools.length,
      reason: pools.length === 0 ? "no_meteora_match" : null,
    },
  };
}

/** Score a pool universe for a single AyeLabs strategy at its effective (real-clamped) bins. */
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
        holdHours: 1,
      });
      const enriched = {
        ...pool,
        ...synthetic,
        riskScore: rr.riskScore,
        riskRewardRatio: rr.ratio,
        riskTier: rr.tier,
        // Keep raw radar fields for AyeLabs gates (not overwritten by synthetic).
        vl_ratio: toNum(pool.vl_ratio),
        flow_ratio: pool.flow_ratio,
        flow_bullish: Boolean(pool.flow_bullish),
        flow_bearish: Boolean(pool.flow_bearish),
        swap_speed: pool.swap_speed,
        swaps_5m: toNum(pool.swaps_5m),
        swaps_1h: toNum(pool.swaps_1h),
      };
      const strategyForScore = {
        ...strategy,
        screeningOverrides: {
          minTvlUsd: strategy.screeningOverrides?.minTvlUsd ?? AYE_LABS_SCREENING_BASE.minTvlUsd,
          minVolume24hUsd: 0,
          minOrganic: 0,
        },
        signalGate: { minPasses: 0 },
      };
      const scoredRow = scorePool(strategyForScore, enriched);
      const radarGate = applyAyeLabsRadarGate(strategy, enriched);
      const gatePassed = scoredRow.gatePassed && radarGate.pass;
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
      const vlBoost = Math.min(2, 1 + toNum(pool.vl_ratio) * 0.15);
      return {
        pool,
        synthetic: enriched,
        adaptiveExit,
        ...scoredRow,
        gatePassed,
        gateReasons: [...(scoredRow.gateReasons || []), ...radarGate.reasons],
        score: gatePassed ? toNum(scoredRow.score) * vlBoost : 0,
      };
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

export async function getAyeLabsPoolMemory(poolAddress) {
  const addr = String(poolAddress || "").trim();
  if (!addr) return null;
  return AyeLabsPoolMemory.findOne({ poolAddress: addr }).lean();
}

async function loadPoolMemoryMap(poolAddresses) {
  const addrs = [...new Set((poolAddresses || []).map((a) => String(a)).filter(Boolean))];
  if (addrs.length === 0) return new Map();
  const rows = await AyeLabsPoolMemory.find({ poolAddress: { $in: addrs } }).lean();
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
  await AyeLabsPoolMemory.updateOne(
    { poolAddress: addr },
    { $inc: inc, $set: set, $setOnInsert: { poolAddress: addr } },
    { upsert: true },
  );
}

/**
 * Append a one-line lesson for a closed run — AyeLabs's autolearn journal.
 */
export async function recordAyeLabsLesson(run, fields) {
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
    await AyeLabsLesson.create({
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
  const open = await AyeLabsRun.findOne({ ...q, status: "open" }).sort({ createdAt: -1 }).lean();
  if (open) return true;
  const latest = await AyeLabsRun.findOne(q).sort({ createdAt: -1 }).lean();
  if (!latest?.createdAt) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < OPEN_POSITION_COOLDOWN_MS;
}

/**
 * Sim mirror that follows the current AyeLabs net-PnL leader (pinned strategy 98).
 * Virtual bank only — no cash gate.
 */
async function runAyeLabsMirrorSignalCycle(universe) {
  await ensureAyeLabsBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 1, errors: [], openedRuns: [], skippedRows: [] };
  }
  const simCfg = mergedSimConfig(state);
  const pick = await pickBestAyeLabsStrategy();
  const leader = pick.strategy?.strategy;
  if (!leader) {
    return {
      opened: 0,
      skipped: 1,
      errors: [],
      openedRuns: [],
      skippedRows: [
        { strategyId: AYE_LABS_REAL_MIRROR_STRATEGY_ID, reason: pick.failureReason || "no_leader" },
      ],
    };
  }

  const mirrorId = AYE_LABS_REAL_MIRROR_STRATEGY_ID;
  const openCount = await AyeLabsRun.countDocuments({
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
    const created = await AyeLabsRun.create({
      experimentId,
      strategyId: mirrorId,
      strategyName: (await resolveAyeLabsStrategyById(mirrorId))?.name || "AyeLabs Real Mirror",
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
 * Open new paper positions across all AyeLabs strategies (cash-gated per strategy).
 */
export async function runAyeLabsSignalCycle() {
  await ensureAyeLabsBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { opened: 0, skipped: 0, errors: ["no_experiment_state"], openedRuns: [], skippedRows: [] };
  }
  const simCfg = mergedSimConfig(state);
  const strategies = await resolveAyeLabsStrategies();
  const { pools: universe, meta: radarMeta } = await fetchAyeLabsPoolUniverse();
  const solPrice = await fetchSolPriceUsd();
  const opened = [];
  const skipped = [];
  const errors = [];

  if (universe.length === 0) {
    const mirror = await runAyeLabsMirrorSignalCycle(universe);
    const reason = radarMeta?.reason || "no_universe";
    if (reason === "gmgn_unavailable" && radarMeta?.gmgnError) {
      errors.push(`gmgn:${radarMeta.gmgnError}`);
    }
    return {
      opened: mirror.opened,
      skipped: 1 + mirror.skipped,
      errors: [...errors, ...(mirror.errors || [])],
      openedRuns: [...(mirror.openedRuns || [])],
      skippedRows: [{ reason }, ...(mirror.skippedRows || [])],
      radar: radarMeta,
      mirror,
    };
  }

  const recentCutoff = new Date(Date.now() - OPEN_POSITION_COOLDOWN_MS);
  const [openAgg, agentRows, recentPoolRows, memoryMap] = await Promise.all([
    AyeLabsRun.aggregate([
      { $match: { experimentId, status: "open" } },
      { $group: { _id: "$strategyId", count: { $sum: 1 } } },
    ]),
    AyeLabsAgentState.find({ experimentId }).select({ strategyId: 1, cashSol: 1 }).lean(),
    AyeLabsRun.find({
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
    if (strategy.id === AYE_LABS_REAL_MIRROR_STRATEGY_ID) continue;
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
      const reserved = await AyeLabsAgentState.findOneAndUpdate(
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
        const created = await AyeLabsRun.create({
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
        await AyeLabsAgentState.updateOne(
          { experimentId, strategyId: strategy.id },
          { $inc: { cashSol: costSol } },
        );
        throw createErr;
      }
    } catch (err) {
      errors.push(`strategy:${strategy.id}:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const mirror = await runAyeLabsMirrorSignalCycle(universe);

  return {
    opened: opened.length + mirror.opened,
    skipped: skipped.length + mirror.skipped,
    errors: [...errors, ...(mirror.errors || [])],
    openedRuns: [...opened, ...(mirror.openedRuns || [])],
    skippedRows: [...skipped, ...(mirror.skippedRows || [])],
    radar: radarMeta,
    mirror,
  };
}

/**
 * Resolve all open AyeLabs runs; return cash, record lessons, update pool memory on close.
 */
export async function resolveOpenAyeLabsRuns() {
  await ensureAyeLabsBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [] };
  }
  const openRuns = await AyeLabsRun.find({ status: "open", experimentId })
    .sort({ createdAt: 1 })
    .lean();
  const resolvedRows = [];
  const errors = [];
  const strategies = await resolveAyeLabsStrategies();
  const strategyById = new Map(strategies.map((s) => [s.id, s]));

  for (const run of openRuns) {
    try {
      const leaderFromSnapshot =
        run.strategyId === AYE_LABS_REAL_MIRROR_STRATEGY_ID &&
        run.screeningSnapshot != null &&
        typeof run.screeningSnapshot === "object"
          ? Number(run.screeningSnapshot.leaderStrategyId)
          : NaN;
      const exitStrategyId =
        run.strategyId === AYE_LABS_REAL_MIRROR_STRATEGY_ID && Number.isInteger(leaderFromSnapshot)
          ? leaderFromSnapshot
          : run.strategyId;
      const strategy = strategyById.get(exitStrategyId) ?? null;
      if (!strategy) {
        await AyeLabsRun.updateOne(
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
      const fields = evaluateAyeLabsRunResolution(
        run,
        detail,
        strategy.exit,
        hoursElapsed,
        AYE_LABS_DEFAULTS,
      );

      if (fields.status === "open") {
        await AyeLabsRun.updateOne(
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
      if (run.strategyId !== AYE_LABS_REAL_MIRROR_STRATEGY_ID) {
        const retSol =
          toNum(run.depositSol) +
          toNum(run.depositSol) * (toNum(fields.simPnlPct) / 100) -
          toNum(fields.simCloseFeeSol);
        await AyeLabsAgentState.updateOne(
          { experimentId: run.experimentId || experimentId, strategyId: run.strategyId },
          { $inc: { cashSol: retSol } },
        );
      }

      await AyeLabsRun.updateOne(
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

      await Promise.all([recordAyeLabsLesson(run, fields), updatePoolMemoryOnClose(run, fields)]);

      resolvedRows.push({
        runId: String(run._id),
        status: fields.status,
        resolution: fields.resolution,
        strategyId: run.strategyId,
      });
    } catch (err) {
      errors.push(`run:${String(run._id)}:${err instanceof Error ? err.message : String(err)}`);
      await AyeLabsRun.updateOne(
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
 * Rank AyeLabs strategies by settled net PnL (SOL) for real-agent leader selection.
 */
export async function rankAyeLabsStrategiesByNetPnl(experimentId) {
  if (!experimentId) return [];
  const rows = await AyeLabsRun.aggregate([
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
    .filter((row) => Number(row._id) !== AYE_LABS_REAL_MIRROR_STRATEGY_ID)
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
 * Pick the sim strategy the real AyeLabs agent should follow (highest net-PnL leader).
 * Returns { strategy, stats, failureReason, ranked }.
 */
export async function pickBestAyeLabsStrategy() {
  await ensureAyeLabsBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { strategy: null, stats: null, failureReason: "no_experiment_state", ranked: [] };
  }
  const ranked = await rankAyeLabsStrategiesByNetPnl(experimentId);
  if (ranked.length === 0) {
    return { strategy: null, stats: null, failureReason: "no_best_strategy", ranked };
  }
  // Prefer a profitable, decided leader; fall back to best-ranked warm strategy for the mirror.
  const profitable = ranked.find((r) => r.decided >= 3 && r.sumNetPnlSol > 0);
  const selected = profitable || ranked[0];
  const strategy = await resolveAyeLabsStrategyById(selected.strategyId);
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
    usedFallback: !profitable,
  };
}

export async function getAyeLabsLabState() {
  await ensureAyeLabsBootstrapped();
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
    AyeLabsAgentState.find({ experimentId: state.activeExperimentId }).sort({ strategyId: 1 }).lean(),
    AyeLabsRun.aggregate([
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
    screening: { ...AYE_LABS_SCREENING_BASE },
    strategySource: "gmgn-vl-radar",
    gmgnConfigured: Boolean(process.env.GMGN_API_KEY?.trim()),
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

export async function getAyeLabsStats() {
  await ensureAyeLabsBootstrapped();
  const state = await getSingletonStateDoc();
  const experimentId = state?.activeExperimentId;
  const strategies = await resolveAyeLabsStrategies();
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
    AyeLabsRun.aggregate([
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
    AyeLabsRun.find({ ...match, status: "open" }).select({ strategyId: 1 }).lean(),
    AyeLabsAgentState.find({ experimentId }).lean(),
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

export async function listAyeLabsStrategies() {
  const strategies = await resolveAyeLabsStrategies();
  return strategies.map((s) => ({
    id: s.id,
    name: s.name,
    lpShape: s.lpShape,
    binsBelow: s.binsBelow,
    binsAbove: s.binsAbove,
    screeningOverrides: s.screeningOverrides || null,
    exit: s.exit || null,
    notes: s.notes || "",
    isMirror: s.id === AYE_LABS_REAL_MIRROR_STRATEGY_ID,
  }));
}

export async function listAyeLabsRuns({
  limit = DEFAULT_LIST_LIMIT,
  offset = 0,
  strategyId,
  status,
  symbol,
  experimentId: experimentIdOverride,
} = {}) {
  await ensureAyeLabsBootstrapped();
  const state = await getSingletonStateDoc();
  const q = {};
  if (experimentIdOverride && String(experimentIdOverride).trim()) {
    q.experimentId = String(experimentIdOverride).trim();
  } else if (state?.activeExperimentId) {
    q.experimentId = state.activeExperimentId;
  } else {
    return { rows: [], total: 0 };
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
    AyeLabsRun.find(q).sort({ createdAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
    AyeLabsRun.countDocuments(q),
  ]);
  return { rows: runs, total };
}

/**
 * Wipe all AyeLabs sim runs + per-agent ledger rows and start a new cohort from zero.
 * Never touches real AyeLabs positions/config.
 */
export async function resetAyeLabsFromScratch(opts = {}) {
  await ensureAyeLabsBootstrapped();
  const state = await AyeLabsState.findById("singleton");
  if (!state) throw new Error("AyeLabs state missing");
  const cfg = mergedSimConfig(state);
  await AyeLabsRun.deleteMany({});
  await AyeLabsAgentState.deleteMany({});
  const nextId = `ayeLabs-cohort-${Date.now()}`;
  state.activeExperimentId = nextId;
  state.title =
    typeof opts.title === "string" && opts.title.trim()
      ? opts.title.trim()
      : "AyeLabs GMGN V/L radar paper lab (reset)";
  state.startedAt = new Date();
  state.simConfig = {
    startingBankSol: cfg.startingBankSol,
    maxPositionSol: cfg.maxPositionSol,
    maxConcurrentPositions: cfg.maxConcurrentPositions,
    openFeeBps: cfg.openFeeBps,
    closeFeeBps: cfg.closeFeeBps,
  };
  await state.save();
  const strategies = await resolveAyeLabsStrategies();
  for (const s of strategies) {
    const startingBank =
      s.id === AYE_LABS_REAL_MIRROR_STRATEGY_ID ? REAL_MIRROR_VIRTUAL_BANK_SOL : cfg.startingBankSol;
    await AyeLabsAgentState.create({
      experimentId: nextId,
      strategyId: s.id,
      cashSol: startingBank,
      startingBankSol: startingBank,
    });
  }
  bootPromise = null;
  return { nextExperimentId: nextId };
}
