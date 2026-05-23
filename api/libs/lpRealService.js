/**
 * LP Real Agent — on-chain Meteora DLMM execution from a backend-custodied agent wallet.
 * Dynamically follows the sim cohort strategy with highest sumNetPnlSol each signal tick.
 */
import LpRealConfig from "../models/LpRealConfig.js";
import LpRealPosition from "../models/LpRealPosition.js";
import LpExperimentRun from "../models/LpExperimentRun.js";
import LpExperimentState from "../models/LpExperimentState.js";
import AgentWallet from "../models/agent/AgentWallet.js";
import { LP_AGENT_EXPERIMENT_DEFAULTS } from "../config/lpAgentExperimentStrategies.js";
import { resolveLpStrategyById } from "./lpExperimentStrategyResolve.js";
import {
  ensureLpExperimentBootstrapped,
  getLpCandidatePools,
} from "./lpExperimentService.js";
import { executeIntent } from "../services/walletBroker.js";
import {
  buildOpenPositionTx,
  buildClosePositionTx,
  buildClaimFeesTx,
  fetchOnChainPosition,
  getAgentSolBalance,
} from "./meteoraDlmmExecutor.js";
import { fetchMeteoraPoolDetail } from "./meteoraDlmmClient.js";
import {
  getLpRealAllowedAgentAddress,
  isAllowedLpRealAgentAddress,
} from "../config/lpRealAgentAccess.js";

const OPEN_POSITION_COOLDOWN_MS = 90 * 60 * 1000;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const LP_REAL_TOOL_IDS = ["lp_real_open", "lp_real_close", "lp_real_claim"];

let bootPromise = null;
let cachedSolPrice = { value: 150, ts: 0 };

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function envAgentAddress() {
  return getLpRealAllowedAgentAddress();
}

/**
 * True when the signed-in session controls the allowlisted agent wallet (by agentAddress).
 * @param {string | null | undefined} viewerAnonymousId
 */
async function viewerIsLpRealOperator(viewerAnonymousId) {
  if (!viewerAnonymousId) return false;
  const allowed = getLpRealAllowedAgentAddress();
  const viewer = await AgentWallet.findOne({ anonymousId: viewerAnonymousId })
    .select("agentAddress")
    .lean();
  return Boolean(viewer?.agentAddress && viewer.agentAddress === allowed);
}

/**
 * Only the allowlisted agent wallet's linked session may enable/disable or operate cron.
 * @param {string} anonymousId
 */
async function assertLpRealOperator(anonymousId) {
  if (!anonymousId) {
    const err = new Error("auth_required");
    err.code = "auth_required";
    throw err;
  }
  const config = await getConfigDoc();
  if (!config) {
    const err = new Error("lp_real_not_bootstrapped");
    err.code = "lp_real_not_bootstrapped";
    throw err;
  }
  if (!isAllowedLpRealAgentAddress(config.agentAddress)) {
    const err = new Error("lp_real_wallet_not_allowlisted");
    err.code = "lp_real_wallet_not_allowlisted";
    throw err;
  }
  const isOp = await viewerIsLpRealOperator(anonymousId);
  if (!isOp) {
    const err = new Error("not_owner_of_lp_real_agent");
    err.code = "not_owner_of_lp_real_agent";
    throw err;
  }
  // Keep singleton owner id aligned with the active session (guest → wallet link migrations).
  if (config.anonymousId !== anonymousId) {
    await LpRealConfig.updateOne({ _id: "singleton" }, { $set: { anonymousId } });
    config.anonymousId = anonymousId;
  }
  return config;
}

/** Cron / signal safety: refuse if singleton config points at a non-allowlisted wallet. */
function assertLpRealConfigWalletAllowed(config) {
  if (!config || !isAllowedLpRealAgentAddress(config.agentAddress)) {
    throw new Error("lp_real_wallet_not_allowlisted");
  }
}

function envEnabledDefault() {
  const raw = (process.env.LP_AGENT_REAL_ENABLED || "").trim().toLowerCase();
  return raw === "true" || raw === "1";
}

function envSlippageBps() {
  const n = Number(process.env.LP_AGENT_REAL_SLIPPAGE_BPS || 50);
  return Number.isFinite(n) && n > 0 ? n : 50;
}

export function isRealCronEnabled() {
  const raw = (process.env.LP_AGENT_REAL_ENABLED || "").trim().toLowerCase();
  return raw !== "false" && raw !== "0";
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

function computePriceDriftPct(entry, current) {
  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(current) || current <= 0) return 0;
  return (current / entry - 1) * 100;
}

function computeFeeYieldPct(feeTvlRatio, hoursElapsed) {
  const f = toNum(feeTvlRatio, 0);
  if (f <= 0 || hoursElapsed <= 0) return 0;
  return f * (hoursElapsed / 24) * 100;
}

function shouldCloseByOor(position, detail, exitRules, hoursElapsed) {
  const activeNow = toNum(detail.activeBinId, position.activeBinAtOpen);
  const activeAtOpen = toNum(position.activeBinAtOpen, activeNow);
  const delta = activeNow - activeAtOpen;
  const overBelow = Math.abs(Math.min(0, delta)) > toNum(position.binsBelow);
  const overAbove = Math.max(0, delta) > toNum(position.binsAbove);
  if (!overBelow && !overAbove) return false;
  return hoursElapsed * 60 >= toNum(exitRules?.oorWaitMin, 30);
}

function evaluateRealPositionExit(position, detail, hoursElapsed) {
  const exit = position.exitRules || {};
  const priceDriftPct = computePriceDriftPct(toNum(position.entryPriceUsd), toNum(detail.currentPrice));
  const feeYieldPct = computeFeeYieldPct(toNum(detail.feeTvlRatio, 0), hoursElapsed);
  const netPnlPct = priceDriftPct + feeYieldPct;

  let shouldClose = false;
  let resolution = null;
  let finalStatus = "open";

  if (priceDriftPct <= toNum(exit.stopLossPct, -15)) {
    shouldClose = true;
    finalStatus = "closed_loss";
    resolution = "stop_loss";
  } else if (netPnlPct >= toNum(exit.takeProfitPct, 10)) {
    shouldClose = true;
    finalStatus = "closed_win";
    resolution = "take_profit";
  } else if (shouldCloseByOor(position, detail, exit, hoursElapsed)) {
    shouldClose = true;
    finalStatus = netPnlPct >= LP_AGENT_EXPERIMENT_DEFAULTS.winThresholdPct ? "closed_win" : "closed_loss";
    resolution = "oor";
  } else if (hoursElapsed >= LP_AGENT_EXPERIMENT_DEFAULTS.maxRunAgeHours) {
    shouldClose = true;
    finalStatus = netPnlPct >= LP_AGENT_EXPERIMENT_DEFAULTS.winThresholdPct ? "closed_win" : "expired";
    resolution = "time_expiry";
  }

  return { shouldClose, resolution, finalStatus, netPnlPct, priceDriftPct, feeYieldPct };
}

async function getConfigDoc() {
  await ensureLpRealBootstrapped();
  return LpRealConfig.findById("singleton").lean();
}

/**
 * Bootstrap singleton config pinned to env agent address.
 */
export async function ensureLpRealBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const agentAddress = envAgentAddress();
    let config = await LpRealConfig.findById("singleton").lean();
    if (config) {
      if (!isAllowedLpRealAgentAddress(config.agentAddress)) {
        throw new Error(
          `LP real config agent ${config.agentAddress} is not allowlisted (expected ${agentAddress})`,
        );
      }
      return;
    }

    const wallet = await AgentWallet.findOne({ agentAddress }).lean();
    if (!wallet) {
      throw new Error(`AgentWallet not found for LP real agent address ${agentAddress}`);
    }

    const experimentId = `lp-real-cohort-${Date.now()}`;
    await LpRealConfig.create({
      _id: "singleton",
      anonymousId: wallet.anonymousId,
      agentAddress: wallet.agentAddress,
      enabled: envEnabledDefault(),
      experimentId,
      title: "LP Real Agent (Meteora DLMM)",
      startedAt: new Date(),
      targetBankSol: 10,
      maxPositionSol: 1,
      maxConcurrentPositions: 10,
      reserveSolForFees: 0.05,
      strategySelectionMode: "dynamic_best_net_pnl",
    });
  })().catch((err) => {
    bootPromise = null;
    throw err;
  });
  return bootPromise;
}

/**
 * Pick strategy with highest sumNetPnlSol in active sim cohort.
 */
export async function pickBestStrategy() {
  await ensureLpExperimentBootstrapped();
  const simState = await LpExperimentState.findById("singleton").lean();
  const experimentId = simState?.activeExperimentId;
  if (!experimentId) return null;

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
        strategyName: { $last: "$strategyName" },
        lpShape: { $last: "$lpShape" },
        sumNetPnlSol: { $sum: { $ifNull: ["$simNetPnlSol", 0] } },
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        decided: {
          $sum: { $cond: [{ $in: ["$status", ["win", "loss", "expired"]] }, 1, 0] },
        },
      },
    },
    { $sort: { sumNetPnlSol: -1, wins: -1 } },
    { $limit: 1 },
  ]);

  if (rows.length > 0 && toNum(rows[0].decided) > 0) {
    const strategy = await resolveLpStrategyById(Number(rows[0]._id));
    if (strategy) {
      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        lpShape: strategy.lpShape,
        sumNetPnlSol: toNum(rows[0].sumNetPnlSol),
        strategy,
      };
    }
  }

  // Fallback: highest win rate among decided runs
  const fallback = await LpExperimentRun.aggregate([
    {
      $match: {
        experimentId,
        status: { $in: ["win", "loss", "expired"] },
      },
    },
    {
      $group: {
        _id: "$strategyId",
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        decided: { $sum: 1 },
      },
    },
    {
      $addFields: {
        winRate: { $cond: [{ $gt: ["$decided", 0] }, { $divide: ["$wins", "$decided"] }, 0] },
      },
    },
    { $sort: { winRate: -1, wins: -1 } },
    { $limit: 1 },
  ]);

  if (fallback.length === 0) return null;
  const strategy = await resolveLpStrategyById(Number(fallback[0]._id));
  if (!strategy) return null;
  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    lpShape: strategy.lpShape,
    sumNetPnlSol: 0,
    strategy,
  };
}

async function hasRecentRealPosition(experimentId, poolAddress) {
  const q = { experimentId, poolAddress };
  const open = await LpRealPosition.findOne({ ...q, status: { $in: ["open", "opening", "closing"] } })
    .sort({ createdAt: -1 })
    .lean();
  if (open) return true;
  const latest = await LpRealPosition.findOne(q).sort({ createdAt: -1 }).lean();
  if (!latest?.createdAt) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < OPEN_POSITION_COOLDOWN_MS;
}

async function brokerSignTx(anonymousId, toolId, serializedTxBase64, estimatedUsd, summary) {
  return executeIntent(
    { anonymousId, guest: false },
    {
      type: "tx_sign",
      chain: "solana",
      toolId,
      serializedTxBase64,
      estimatedUsd,
      summary,
    },
  );
}

function minBankSolForConfig(config) {
  return toNum(config?.targetBankSol, 10);
}

function canEnableLpReal(onChainBalanceSol, config) {
  const minBank = minBankSolForConfig(config);
  return toNum(onChainBalanceSol) >= minBank - 1e-9;
}

export async function getLpRealState({ viewerAnonymousId } = {}) {
  const allowedAgentAddress = envAgentAddress();
  const config = await getConfigDoc();
  if (!config) {
    return {
      config: null,
      onChainBalanceSol: 0,
      deployedSol: 0,
      availableSol: 0,
      openPositionsCount: 0,
      currentStrategy: null,
      minBankSol: 10,
      canEnable: false,
      allowedAgentAddress,
      isOperator: false,
    };
  }

  const openPositions = await LpRealPosition.find({
    experimentId: config.experimentId,
    status: { $in: ["open", "opening", "closing"] },
  }).lean();

  const deployedSol = openPositions.reduce((s, p) => s + toNum(p.depositSol), 0);
  const onChainBalanceSol = await getAgentSolBalance(config.agentAddress);
  const availableSol = Math.max(
    0,
    onChainBalanceSol - deployedSol - toNum(config.reserveSolForFees, 0.05),
  );

  let currentStrategy = null;
  if (config.currentStrategyId != null) {
    const s = await resolveLpStrategyById(config.currentStrategyId);
    if (s) {
      currentStrategy = { id: s.id, name: s.name, lpShape: s.lpShape };
    }
  }

  return {
    config: {
      agentAddress: config.agentAddress,
      enabled: config.enabled,
      targetBankSol: config.targetBankSol,
      maxPositionSol: config.maxPositionSol,
      maxConcurrentPositions: config.maxConcurrentPositions,
      reserveSolForFees: config.reserveSolForFees,
      currentStrategyId: config.currentStrategyId,
      lastSignalAt: config.lastSignalAt?.toISOString?.() ?? null,
      lastResolveAt: config.lastResolveAt?.toISOString?.() ?? null,
      lastError: config.lastError,
      experimentId: config.experimentId,
      closeAllRequested: config.closeAllRequested,
    },
    onChainBalanceSol,
    deployedSol,
    availableSol,
    openPositionsCount: openPositions.length,
    currentStrategy,
    minBankSol: minBankSolForConfig(config),
    canEnable: canEnableLpReal(onChainBalanceSol, config),
    allowedAgentAddress,
    isOperator: await viewerIsLpRealOperator(viewerAnonymousId),
  };
}

export async function getLpRealSummary() {
  const config = await getConfigDoc();
  if (!config) {
    return {
      realizedNetPnlSol: 0,
      realizedNetPnlUsd: 0,
      wins: 0,
      losses: 0,
      openCount: 0,
      totalFeesClaimedSol: 0,
      deployedSol: 0,
    };
  }

  const match = { experimentId: config.experimentId };
  const [agg, openCount] = await Promise.all([
    LpRealPosition.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          wins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          losses: {
            $sum: {
              $cond: [{ $in: ["$status", ["closed_loss", "expired", "error"]] }, 1, 0],
            },
          },
          realizedNetPnlSol: {
            $sum: {
              $cond: [
                { $in: ["$status", ["closed_win", "closed_loss", "expired"]] },
                { $ifNull: ["$realNetPnlSol", 0] },
                0,
              ],
            },
          },
          realizedNetPnlUsd: {
            $sum: {
              $cond: [
                { $in: ["$status", ["closed_win", "closed_loss", "expired"]] },
                { $ifNull: ["$realNetPnlUsd", 0] },
                0,
              ],
            },
          },
          totalFeesClaimedSol: { $sum: { $ifNull: ["$realFeesClaimedSol", 0] } },
          deployedSol: {
            $sum: {
              $cond: [
                { $in: ["$status", ["open", "opening", "closing"]] },
                { $ifNull: ["$depositSol", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
    LpRealPosition.countDocuments({
      ...match,
      status: { $in: ["open", "opening", "closing"] },
    }),
  ]);

  const row = agg[0] || {};
  return {
    realizedNetPnlSol: toNum(row.realizedNetPnlSol),
    realizedNetPnlUsd: toNum(row.realizedNetPnlUsd),
    wins: toNum(row.wins),
    losses: toNum(row.losses),
    openCount,
    totalFeesClaimedSol: toNum(row.totalFeesClaimedSol),
    deployedSol: toNum(row.deployedSol),
  };
}

export async function listLpRealPositions({ limit, offset, status, experimentId } = {}) {
  const config = await getConfigDoc();
  const expId = experimentId || config?.experimentId;
  if (!expId) return { positions: [], total: 0, limit: DEFAULT_LIST_LIMIT, offset: 0 };

  const lim = Math.min(MAX_LIST_LIMIT, Math.max(1, toNum(limit, DEFAULT_LIST_LIMIT)));
  const off = Math.max(0, toNum(offset, 0));
  const query = { experimentId: expId };
  if (status) query.status = status;

  const [positions, total] = await Promise.all([
    LpRealPosition.find(query).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    LpRealPosition.countDocuments(query),
  ]);

  return {
    positions: positions.map((p) => ({
      id: String(p._id),
      experimentId: p.experimentId,
      strategyId: p.strategyId,
      strategyName: p.strategyName,
      lpShape: p.lpShape,
      poolAddress: p.poolAddress,
      poolName: p.poolName,
      baseSymbol: p.baseSymbol,
      quoteSymbol: p.quoteSymbol,
      status: p.status,
      resolution: p.resolution,
      depositSol: p.depositSol,
      depositUsd: p.depositUsd,
      realNetPnlSol: p.realNetPnlSol,
      realNetPnlUsd: p.realNetPnlUsd,
      realFeesClaimedSol: p.realFeesClaimedSol,
      openTxSig: p.openTxSig,
      closeTxSig: p.closeTxSig,
      positionPubkey: p.positionPubkey,
      openedAt: p.openedAt?.toISOString?.() ?? null,
      resolvedAt: p.resolvedAt?.toISOString?.() ?? null,
      errorMessage: p.errorMessage,
    })),
    total,
    limit: lim,
    offset: off,
  };
}

async function bumpWalletPolicyForLpReal(anonymousId) {
  const solPrice = await fetchSolPriceUsd();
  const perTxCapUsd = Math.max(250, solPrice * 1.5);
  const dailySpendCapUsd = Math.max(2500, solPrice * 12);
  const wallet = await AgentWallet.findOne({ anonymousId });
  if (!wallet) throw new Error("agent_wallet_not_found");

  const tools = new Set([...(wallet.allowedTools || []), ...LP_REAL_TOOL_IDS]);
  wallet.allowedTools = [...tools];
  wallet.perTxCapUsd = Math.max(toNum(wallet.perTxCapUsd, 50), perTxCapUsd);
  wallet.dailySpendCapUsd = Math.max(toNum(wallet.dailySpendCapUsd, 250), dailySpendCapUsd);
  wallet.hourlySpendCapUsd = Math.max(toNum(wallet.hourlySpendCapUsd, 100), solPrice * 5);
  await wallet.save();
}

export async function enableLpReal({ anonymousId, enabledBy }) {
  const config = await assertLpRealOperator(anonymousId);
  const onChainBalanceSol = await getAgentSolBalance(config.agentAddress);
  const minBank = minBankSolForConfig(config);
  if (!canEnableLpReal(onChainBalanceSol, config)) {
    const err = new Error(
      `insufficient_balance: wallet has ${onChainBalanceSol.toFixed(4)} SOL; need at least ${minBank} SOL`,
    );
    err.code = "insufficient_balance";
    err.onChainBalanceSol = onChainBalanceSol;
    err.minBankSol = minBank;
    throw err;
  }
  await bumpWalletPolicyForLpReal(anonymousId);
  await LpRealConfig.updateOne(
    { _id: "singleton" },
    {
      $set: {
        enabled: true,
        lastEnabledBy: enabledBy || anonymousId,
        lastError: null,
        closeAllRequested: false,
      },
    },
  );
  return getLpRealState();
}

export async function disableLpReal({ anonymousId, closeAll = false }) {
  const config = await assertLpRealOperator(anonymousId);
  await LpRealConfig.updateOne(
    { _id: "singleton" },
    {
      $set: {
        enabled: false,
        closeAllRequested: Boolean(closeAll),
      },
    },
  );
  if (closeAll) {
    await resolveLpRealPositions({ forceCloseAll: true });
  }
  return getLpRealState();
}

export async function runLpRealSignalCycle() {
  if (!isRealCronEnabled()) {
    return { skipped: true, reason: "env_disabled" };
  }

  const config = await getConfigDoc();
  if (!config?.enabled) {
    return { skipped: true, reason: "config_disabled" };
  }
  try {
    assertLpRealConfigWalletAllowed(config);
  } catch (err) {
    return {
      skipped: true,
      reason: "wallet_not_allowlisted",
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }

  const errors = [];
  const opened = [];
  const skipped = [];

  try {
    const best = await pickBestStrategy();
    if (!best?.strategy) {
      skipped.push({ reason: "no_best_strategy" });
      await LpRealConfig.updateOne(
        { _id: "singleton" },
        { $set: { lastSignalAt: new Date(), lastError: "no_best_strategy" } },
      );
      return { opened: 0, skipped: skipped.length, errors, openedRows: opened, skippedRows: skipped };
    }

    await LpRealConfig.updateOne(
      { _id: "singleton" },
      { $set: { currentStrategyId: best.strategyId, lastSignalAt: new Date(), lastError: null } },
    );

    const openCount = await LpRealPosition.countDocuments({
      experimentId: config.experimentId,
      status: { $in: ["open", "opening", "closing"] },
    });
    if (openCount >= config.maxConcurrentPositions) {
      skipped.push({ reason: "max_positions" });
      return { opened: 0, skipped: 1, errors, openedRows: opened, skippedRows: skipped };
    }

    const onChainBalance = await getAgentSolBalance(config.agentAddress);
    const openPositions = await LpRealPosition.find({
      experimentId: config.experimentId,
      status: { $in: ["open", "opening", "closing"] },
    }).lean();
    const deployedSol = openPositions.reduce((s, p) => s + toNum(p.depositSol), 0);
    const availableSol = onChainBalance - deployedSol - toNum(config.reserveSolForFees, 0.05);

    if (availableSol < config.maxPositionSol) {
      skipped.push({ reason: "insufficient_balance", availableSol });
      return { opened: 0, skipped: 1, errors, openedRows: opened, skippedRows: skipped };
    }

    const candidates = await getLpCandidatePools();
    const poolCandidate = candidates
      .filter((c) => c.strategyId === best.strategyId && c.gatePassed)
      .sort((a, b) => b.score - a.score)[0];

    if (!poolCandidate) {
      skipped.push({ reason: "no_candidate", strategyId: best.strategyId });
      return { opened: 0, skipped: 1, errors, openedRows: opened, skippedRows: skipped };
    }

    if (await hasRecentRealPosition(config.experimentId, poolCandidate.poolAddress)) {
      skipped.push({ reason: "cooldown_or_open", pool: poolCandidate.poolAddress });
      return { opened: 0, skipped: 1, errors, openedRows: opened, skippedRows: skipped };
    }

    const solPrice = await fetchSolPriceUsd();
    const depositSol = config.maxPositionSol;
    const depositUsd = depositSol * solPrice;
    const strategy = best.strategy;

    const poolDetail = await fetchMeteoraPoolDetail(poolCandidate.poolAddress);

    const txBuild = await buildOpenPositionTx({
      lbPairAddress: poolCandidate.poolAddress,
      binsBelow: strategy.binsBelow,
      binsAbove: strategy.binsAbove,
      lpShape: strategy.lpShape,
      depositSol,
      agentPubkey: config.agentAddress,
      slippageBps: envSlippageBps(),
    });

    const pending = await LpRealPosition.create({
      experimentId: config.experimentId,
      strategyId: strategy.id,
      strategyName: strategy.name,
      lpShape: strategy.lpShape,
      poolAddress: poolCandidate.poolAddress,
      poolName: poolCandidate.poolName || poolDetail.poolName,
      baseSymbol: poolCandidate.baseSymbol,
      quoteSymbol: poolCandidate.quoteSymbol,
      baseMint: poolDetail.baseMint,
      quoteMint: poolDetail.quoteMint,
      binStep: poolDetail.binStep,
      binsBelow: strategy.binsBelow,
      binsAbove: strategy.binsAbove,
      activeBinAtOpen: txBuild.activeBinAtOpen,
      entryPriceUsd: poolDetail.currentPrice,
      positionPubkey: txBuild.positionPubkey,
      positionSecretEnc: txBuild.positionSecretEnc,
      depositSol,
      depositUsd,
      exitRules: strategy.exit || {},
      signalSnapshot: poolCandidate.signalSnapshot,
      screeningSnapshot: { score: poolCandidate.score },
      status: "opening",
      openedAt: new Date(),
    });

    const brokerResult = await brokerSignTx(
      config.anonymousId,
      "lp_real_open",
      txBuild.serializedTxBase64,
      depositUsd,
      `Open LP position ${poolCandidate.poolName} (${depositSol} SOL)`,
    );

    if (brokerResult.status !== "ok") {
      const errMsg =
        brokerResult.status === "denied"
          ? (brokerResult.reasons || []).join(";")
          : "broker_pending_or_failed";
      await LpRealPosition.updateOne(
        { _id: pending._id },
        { $set: { status: "error", errorMessage: errMsg, resolvedAt: new Date() } },
      );
      errors.push(errMsg);
      await LpRealConfig.updateOne({ _id: "singleton" }, { $set: { lastError: errMsg } });
      return { opened: 0, skipped: 0, errors, openedRows: opened, skippedRows: skipped };
    }

    await LpRealPosition.updateOne(
      { _id: pending._id },
      { $set: { status: "open", openTxSig: brokerResult.signature } },
    );
    opened.push({
      positionId: String(pending._id),
      poolAddress: poolCandidate.poolAddress,
      strategyId: strategy.id,
      txSig: brokerResult.signature,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    await LpRealConfig.updateOne({ _id: "singleton" }, { $set: { lastError: msg, lastSignalAt: new Date() } });
  }

  return { opened: opened.length, skipped: skipped.length, errors, openedRows: opened, skippedRows: skipped };
}

export async function resolveLpRealPositions({ forceCloseAll = false } = {}) {
  if (!isRealCronEnabled() && !forceCloseAll) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [] };
  }

  const config = await getConfigDoc();
  if (!config) return { resolved: 0, openChecked: 0, errors: ["no_config"], rows: [] };
  try {
    assertLpRealConfigWalletAllowed(config);
  } catch (err) {
    return {
      resolved: 0,
      openChecked: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      rows: [],
    };
  }

  const openRuns = await LpRealPosition.find({
    experimentId: config.experimentId,
    status: { $in: ["open", "closing"] },
  })
    .select("+positionSecretEnc")
    .sort({ openedAt: 1 })
    .lean();

  const resolvedRows = [];
  const errors = [];

  for (const position of openRuns) {
    const locked = await LpRealPosition.findOneAndUpdate(
      { _id: position._id, processing: { $ne: true } },
      { $set: { processing: true, lastEvaluatedAt: new Date() } },
      { new: true },
    )
      .select("+positionSecretEnc")
      .lean();

    if (!locked) continue;

    try {
      const poolDetail = await fetchMeteoraPoolDetail(position.poolAddress);
      const now = Date.now();
      const openedAt = new Date(position.openedAt || position.createdAt).getTime();
      const hoursElapsed = Math.max(0, (now - openedAt) / 3_600_000);

      let onChain = null;
      try {
        onChain = await fetchOnChainPosition(position.positionPubkey, position.poolAddress);
      } catch (chainErr) {
        errors.push(`onchain:${String(position._id)}:${chainErr instanceof Error ? chainErr.message : String(chainErr)}`);
      }

      const exitEval = evaluateRealPositionExit(position, poolDetail, hoursElapsed);
      const claimThreshold = toNum(position.exitRules?.claimFeesAtSol, 0);
      const unclaimedFees = toNum(onChain?.unclaimedFeeSol, 0);

      if (
        unclaimedFees >= claimThreshold &&
        claimThreshold > 0 &&
        position.status === "open" &&
        !forceCloseAll
      ) {
        try {
          const claimTx = await buildClaimFeesTx({
            lbPairAddress: position.poolAddress,
            positionPubkey: position.positionPubkey,
            agentPubkey: config.agentAddress,
            positionSecretEnc: position.positionSecretEnc,
          });
          const claimResult = await brokerSignTx(
            config.anonymousId,
            "lp_real_claim",
            claimTx.serializedTxBase64,
            unclaimedFees * (await fetchSolPriceUsd()),
            `Claim LP fees for ${position.poolName}`,
          );
          if (claimResult.status === "ok") {
            await LpRealPosition.updateOne(
              { _id: position._id },
              {
                $inc: { realFeesClaimedSol: unclaimedFees },
                $push: { claimTxSigs: claimResult.signature },
              },
            );
          }
        } catch (claimErr) {
          errors.push(`claim:${String(position._id)}:${claimErr instanceof Error ? claimErr.message : String(claimErr)}`);
        }
      }

      const shouldClose =
        forceCloseAll || config.closeAllRequested || exitEval.shouldClose;

      if (!shouldClose) {
        await LpRealPosition.updateOne({ _id: position._id }, { $set: { processing: false } });
        continue;
      }

      await LpRealPosition.updateOne({ _id: position._id }, { $set: { status: "closing" } });

      const balanceBefore = await getAgentSolBalance(config.agentAddress);

      const closeTx = await buildClosePositionTx({
        lbPairAddress: position.poolAddress,
        positionPubkey: position.positionPubkey,
        agentPubkey: config.agentAddress,
        positionSecretEnc: position.positionSecretEnc,
        slippageBps: envSlippageBps(),
      });

      const closeResult = await brokerSignTx(
        config.anonymousId,
        "lp_real_close",
        closeTx.serializedTxBase64,
        position.depositUsd,
        `Close LP position ${position.poolName}`,
      );

      if (closeResult.status !== "ok") {
        const errMsg =
          closeResult.status === "denied"
            ? (closeResult.reasons || []).join(";")
            : "close_broker_failed";
        await LpRealPosition.updateOne(
          { _id: position._id },
          {
            $set: {
              status: "error",
              errorMessage: errMsg,
              processing: false,
              resolvedAt: new Date(),
            },
          },
        );
        errors.push(errMsg);
        continue;
      }

      await new Promise((r) => setTimeout(r, 2000));
      const balanceAfter = await getAgentSolBalance(config.agentAddress);
      const solDelta = balanceAfter - balanceBefore;
      const feesClaimed = toNum(position.realFeesClaimedSol) + unclaimedFees;
      const realNetPnlSol = solDelta + feesClaimed;
      const realNetPnlUsd =
        position.depositSol > 0 ? realNetPnlSol * (position.depositUsd / position.depositSol) : 0;

      let finalStatus = forceCloseAll || config.closeAllRequested ? "closed_loss" : exitEval.finalStatus;
      if (forceCloseAll || config.closeAllRequested) {
        exitEval.resolution = "manual_close";
        if (realNetPnlSol > 0) finalStatus = "closed_win";
      }

      await LpRealPosition.updateOne(
        { _id: position._id },
        {
          $set: {
            status: finalStatus,
            resolution: exitEval.resolution,
            closeTxSig: closeResult.signature,
            realFinalSolOut: solDelta,
            realNetPnlSol,
            realNetPnlUsd,
            realFeesClaimedSol: feesClaimed,
            processing: false,
            resolvedAt: new Date(),
          },
        },
      );

      resolvedRows.push({
        positionId: String(position._id),
        status: finalStatus,
        resolution: exitEval.resolution,
        realNetPnlSol,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`resolve:${String(position._id)}:${msg}`);
      await LpRealPosition.updateOne(
        { _id: position._id },
        {
          $set: {
            status: "error",
            errorMessage: msg,
            processing: false,
            resolvedAt: new Date(),
          },
        },
      );
    }
  }

  const stillOpen = await LpRealPosition.countDocuments({
    experimentId: config.experimentId,
    status: { $in: ["open", "closing"] },
  });
  if (config.closeAllRequested && stillOpen === 0) {
    await LpRealConfig.updateOne({ _id: "singleton" }, { $set: { closeAllRequested: false } });
  }

  await LpRealConfig.updateOne({ _id: "singleton" }, { $set: { lastResolveAt: new Date() } });

  return {
    resolved: resolvedRows.length,
    openChecked: openRuns.length,
    errors,
    rows: resolvedRows,
  };
}
