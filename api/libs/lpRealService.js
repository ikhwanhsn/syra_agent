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
  clampPositionBinRange,
  computeCloseProceedsSol,
  fetchOnChainPosition,
  getAgentSolBalance,
  isSolMint,
  MAX_METEORA_POSITION_BINS,
  snapshotAgentWalletForPool,
} from "./meteoraDlmmExecutor.js";
import { ensureSidecarTokenForPool, sweepNonSolTokensToSol } from "./lpRealSidecarSwap.js";
import { fetchMeteoraPoolDetail } from "./meteoraDlmmClient.js";
import {
  getLpRealDefaultTargetBankSol,
  getLpRealFeeBufferSol,
  getLpRealMinWalletWhileLiveSol,
} from "../config/lpRealAgentAccess.js";

const LAMPORTS_PER_SOL = 1_000_000_000;
const OPEN_POSITION_COOLDOWN_MS = 90 * 60 * 1000;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const LP_REAL_TOOL_IDS = ["lp_real_open", "lp_real_close", "lp_real_claim", "lp_real_swap"];

/**
 * Map known Meteora DLMM Anchor error codes to a short, operator-friendly hint
 * so the dashboard shows something more actionable than `Custom:6040`.
 */
const METEORA_DLMM_ERROR_HINTS = Object.freeze({
  6000: "invalid_start_bin_index",
  6001: "invalid_bin_id",
  6002: "invalid_input",
  6003: "exceeded_amount_slippage",
  6004: "exceeded_bin_slippage",
  6007: "zero_liquidity",
  6008: "invalid_position",
  6009: "bin_array_not_found",
  6012: "pair_insufficient_liquidity",
  6018: "math_overflow_on_chain",
  6038: "bin_id_out_of_bound",
  6040: "position_width_exceeds_meteora_limit",
});

function isOrphanedLiveLpPosition(position) {
  return (
    position?.status === "error" &&
    Boolean(position?.openTxSig) &&
    !position?.closeTxSig
  );
}

function humanizeBrokerError(rawReason) {
  if (!rawReason) return "broker_pending_or_failed";
  if (rawReason === "pending_confirmation" || rawReason?.status === "pending_confirmation") {
    return "broker_pending_or_failed (policy requires user confirmation)";
  }
  const joined = Array.isArray(rawReason) ? rawReason.join(";") : String(rawReason);
  const splTokenFailed =
    /Tokenkeg[A-Za-z0-9]{30,}\s+failed/i.test(joined) ||
    /insufficient funds/i.test(joined) ||
    joined.includes("spl_insufficient_funds");
  if (splTokenFailed) {
    const splCustom = /"Custom"\s*:\s*(\d+)/.exec(joined);
    const code = splCustom ? Number(splCustom[1]) : null;
    if (code === 1) {
      return "spl_insufficient_funds (wallet missing pool token; sidecar swap may have failed)";
    }
    return code != null ? `spl_token_error:${code}` : "spl_insufficient_funds";
  }
  if (joined.includes("simulation_failed") || joined.includes("sim_returned_err")) {
    const custom = /"Custom"\s*:\s*(\d+)/.exec(joined);
    if (custom) {
      const code = Number(custom[1]);
      const hint = METEORA_DLMM_ERROR_HINTS[code];
      if (hint) {
        return `Simulation failed: ${hint.replace(/_/g, " ")} (dlmm_error:${code})`;
      }
      if (code < 100) {
        return "Simulation failed: transaction missing co-signatures or stale — retrying";
      }
      return `Simulation failed (dlmm_error:${code})`;
    }
    return "Simulation failed before agent could sign";
  }
  const match = /"Custom"\s*:\s*(\d+)/.exec(joined);
  if (match) {
    const code = Number(match[1]);
    const hint = METEORA_DLMM_ERROR_HINTS[code];
    if (hint) return `${hint} (dlmm_error:${code})`;
    if (code < 100) return "meteora_tx_missing_signatures";
    return `dlmm_error:${code}`;
  }
  return joined;
}

let cachedSolPrice = { value: 150, ts: 0 };

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function configAgentFilter(config) {
  const agentAddress = config?.agentAddress || config?._id;
  return agentAddress ? { agentAddress: String(agentAddress) } : null;
}

async function getViewerAgentWallet(anonymousId) {
  if (!anonymousId) return null;
  return AgentWallet.findOne({ anonymousId }).select("anonymousId agentAddress chain status").lean();
}

/**
 * Migrate legacy singleton row (v1) to per-agent document keyed by agentAddress.
 */
async function migrateLegacySingletonConfig(agentAddress) {
  const existing = await LpRealConfig.findOne({ agentAddress }).lean();
  if (existing) return existing;
  const legacy = await LpRealConfig.findOne({
    $or: [{ _id: "singleton" }, { agentAddress }],
  }).lean();
  if (!legacy || legacy.agentAddress !== agentAddress) return null;
  const doc = {
    _id: agentAddress,
    anonymousId: legacy.anonymousId,
    agentAddress: legacy.agentAddress,
    enabled: legacy.enabled,
    experimentId: legacy.experimentId,
    title: legacy.title,
    startedAt: legacy.startedAt,
    targetBankSol: legacy.targetBankSol,
    maxPositionSol: legacy.maxPositionSol,
    maxConcurrentPositions: legacy.maxConcurrentPositions,
    reserveSolForFees: legacy.reserveSolForFees,
    strategySelectionMode: legacy.strategySelectionMode,
    currentStrategyId: legacy.currentStrategyId,
    lastSignalAt: legacy.lastSignalAt,
    lastResolveAt: legacy.lastResolveAt,
    lastError: legacy.lastError,
    lastEnabledBy: legacy.lastEnabledBy,
    closeAllRequested: legacy.closeAllRequested,
  };
  await LpRealConfig.create(doc);
  return LpRealConfig.findOne({ agentAddress }).lean();
}

/**
 * @param {import("mongoose").LeanDocument<any>} wallet
 * @param {{ createIfMissing?: boolean }} [opts]
 */
async function getOrCreateConfigForWallet(wallet, opts = {}) {
  if (!wallet?.agentAddress) return null;
  let config = await LpRealConfig.findOne({ agentAddress: wallet.agentAddress }).lean();
  if (!config) config = await migrateLegacySingletonConfig(wallet.agentAddress);
  if (!config && opts.createIfMissing) {
    const experimentId = `lp-real-${wallet.agentAddress.slice(0, 8)}-${Date.now()}`;
    await LpRealConfig.create({
      _id: wallet.agentAddress,
      anonymousId: wallet.anonymousId,
      agentAddress: wallet.agentAddress,
      enabled: false,
      experimentId,
      title: "LP Real Agent (Meteora DLMM)",
      startedAt: new Date(),
      targetBankSol: getLpRealDefaultTargetBankSol(),
      maxPositionSol: 1,
      maxConcurrentPositions: 10,
      reserveSolForFees: 0.05,
      strategySelectionMode: "dynamic_best_net_pnl",
    });
    config = await LpRealConfig.findOne({ agentAddress: wallet.agentAddress }).lean();
  }
  if (config && config.anonymousId !== wallet.anonymousId) {
    await LpRealConfig.updateOne(
      { agentAddress: wallet.agentAddress },
      { $set: { anonymousId: wallet.anonymousId } },
    );
    config.anonymousId = wallet.anonymousId;
  }
  return config;
}

async function viewerIsLpRealOperator(viewerAnonymousId) {
  const wallet = await getViewerAgentWallet(viewerAnonymousId);
  if (!wallet?.agentAddress) return false;
  if (wallet.chain && wallet.chain !== "solana") return false;
  if (wallet.status && wallet.status !== "active") return false;
  return true;
}

async function assertLpRealOperator(anonymousId) {
  if (!anonymousId) {
    const err = new Error("auth_required");
    err.code = "auth_required";
    throw err;
  }
  const wallet = await getViewerAgentWallet(anonymousId);
  if (!wallet?.agentAddress) {
    const err = new Error("agent_wallet_not_found");
    err.code = "agent_wallet_not_found";
    throw err;
  }
  if (wallet.status && wallet.status !== "active") {
    const err = new Error(`wallet_${wallet.status}`);
    err.code = `wallet_${wallet.status}`;
    throw err;
  }
  const config = await getOrCreateConfigForWallet(wallet, { createIfMissing: true });
  if (!config) {
    const err = new Error("lp_real_config_missing");
    err.code = "lp_real_config_missing";
    throw err;
  }
  return config;
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

/** Ensures sim lab is ready; per-agent LP real configs are created on demand. */
export async function ensureLpRealBootstrapped() {
  await ensureLpExperimentBootstrapped();
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
  return toNum(config?.targetBankSol, getLpRealDefaultTargetBankSol());
}

function minWalletToStartSol(config) {
  return (
    toNum(config?.maxPositionSol, 1) +
    toNum(config?.reserveSolForFees, 0.05) +
    getLpRealFeeBufferSol()
  );
}

function minWalletWhileLiveSol() {
  return getLpRealMinWalletWhileLiveSol();
}

function sumDeployedSol(openPositions) {
  return (openPositions || []).reduce((s, p) => s + toNum(p.depositSol), 0);
}

/** Economic book: liquid wallet + notional recorded in open positions. */
function computeTotalCapitalSol(onChainBalanceSol, deployedSol) {
  return toNum(onChainBalanceSol) + toNum(deployedSol);
}

/** SOL free in wallet for the next open (deployed capital already left the wallet). */
function computeAvailableSol(onChainBalanceSol, reserveSol) {
  return Math.max(0, toNum(onChainBalanceSol) - toNum(reserveSol, 0.05));
}

/** Liquid wallet SOL required to deposit one maxPositionSol slot (reserve kept in wallet). */
function canAffordPoolEntry({ onChainBalanceSol, config }) {
  const availableSol = computeAvailableSol(onChainBalanceSol, config?.reserveSolForFees);
  return availableSol >= toNum(config?.maxPositionSol, 1) - 1e-9;
}

function canOpenNewPosition({ onChainBalanceSol, config }) {
  return canAffordPoolEntry({ onChainBalanceSol, config });
}

function canTurnOnAgent({ onChainBalanceSol, openPositions, config }) {
  if ((openPositions || []).length > 0) return true;
  return onChainBalanceSol >= minWalletToStartSol(config) - 1e-9;
}

/** Configs that need resolve ticks: enabled agents + any agent with open Meteora positions. */
async function getConfigsForResolve() {
  const enabled = await LpRealConfig.find({ enabled: true }).lean();
  const openExperimentIds = await LpRealPosition.distinct("experimentId", {
    $or: [
      { status: { $in: ["open", "opening", "closing"] } },
      {
        status: "error",
        openTxSig: { $ne: null },
        $or: [{ closeTxSig: null }, { closeTxSig: "" }],
      },
    ],
  });
  const enabledExpIds = new Set(enabled.map((c) => c.experimentId).filter(Boolean));
  const extraIds = openExperimentIds.filter((id) => id && !enabledExpIds.has(id));
  if (!extraIds.length) return enabled;
  const extra = await LpRealConfig.find({ experimentId: { $in: extraIds } }).lean();
  return [...enabled, ...extra];
}

/** UI + enable gate before first Mongo row is created. */
function buildPreviewLpRealConfig(wallet, minBankSol) {
  return {
    agentAddress: wallet.agentAddress,
    enabled: false,
    targetBankSol: minBankSol,
    maxPositionSol: 1,
    maxConcurrentPositions: 10,
    reserveSolForFees: 0.05,
    currentStrategyId: null,
    lastSignalAt: null,
    lastResolveAt: null,
    lastError: null,
    experimentId: "",
    closeAllRequested: false,
  };
}

export async function getLpRealState({ viewerAnonymousId } = {}) {
  const minBankSol = getLpRealDefaultTargetBankSol();
  const wallet = viewerAnonymousId ? await getViewerAgentWallet(viewerAnonymousId) : null;
  const isOperator = await viewerIsLpRealOperator(viewerAnonymousId);

  if (!wallet || !isOperator) {
    return {
      config: null,
      onChainBalanceSol: 0,
      deployedSol: 0,
      totalCapitalSol: 0,
      availableSol: 0,
      openPositionsCount: 0,
      currentStrategy: null,
      minBankSol,
      minWalletToStartSol: minWalletToStartSol({ maxPositionSol: 1, reserveSolForFees: 0.05 }),
      canEnable: false,
      canTurnOn: false,
      canOpenNewPositions: false,
      isOperator,
    };
  }

  const onChainBalanceSol = await getAgentSolBalance(wallet.agentAddress);
  let config = await getOrCreateConfigForWallet(wallet, { createIfMissing: false });
  const preview = !config;

  if (!config) {
    config = {
      agentAddress: wallet.agentAddress,
      enabled: false,
      targetBankSol: minBankSol,
      maxPositionSol: 1,
      maxConcurrentPositions: 10,
      reserveSolForFees: 0.05,
      currentStrategyId: null,
      lastSignalAt: null,
      lastResolveAt: null,
      lastError: null,
      experimentId: "",
      closeAllRequested: false,
    };
  }

  if (preview) {
    const totalCapitalSol = onChainBalanceSol;
    const minStart = minWalletToStartSol(config);
    const availableSol = computeAvailableSol(onChainBalanceSol, config.reserveSolForFees);
    const canOpenNewPositions = canOpenNewPosition({ onChainBalanceSol, config });
    return {
      config: buildPreviewLpRealConfig(wallet, minBankSol),
      onChainBalanceSol,
      deployedSol: 0,
      totalCapitalSol,
      availableSol,
      openPositionsCount: 0,
      currentStrategy: null,
      minBankSol,
      minWalletToStartSol: minStart,
      canEnable: canOpenNewPositions,
      canTurnOn: canTurnOnAgent({ onChainBalanceSol, openPositions: [], config }),
      canOpenNewPositions,
      isOperator,
    };
  }

  const openPositions = await LpRealPosition.find({
    experimentId: config.experimentId,
    status: { $in: ["open", "opening", "closing"] },
  }).lean();

  const deployedSol = sumDeployedSol(openPositions);
  const totalCapitalSol = computeTotalCapitalSol(onChainBalanceSol, deployedSol);
  const availableSol = computeAvailableSol(onChainBalanceSol, config.reserveSolForFees);
  const minStart = minWalletToStartSol(config);
  const canOpenNewPositions = canOpenNewPosition({ onChainBalanceSol, config });
  const canEnable = canOpenNewPositions;
  const canTurnOn = canTurnOnAgent({ onChainBalanceSol, openPositions, config });

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
    totalCapitalSol,
    availableSol,
    openPositionsCount: openPositions.length,
    currentStrategy,
    minBankSol: minBankSolForConfig(config),
    minWalletToStartSol: minStart,
    canEnable,
    canTurnOn,
    canOpenNewPositions,
    isOperator,
  };
}

export async function getLpRealSummary({ viewerAnonymousId } = {}) {
  const wallet = viewerAnonymousId ? await getViewerAgentWallet(viewerAnonymousId) : null;
  const config = wallet ? await getOrCreateConfigForWallet(wallet, { createIfMissing: false }) : null;
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

export async function listLpRealPositions({ limit, offset, status, experimentId, viewerAnonymousId } = {}) {
  const wallet = viewerAnonymousId ? await getViewerAgentWallet(viewerAnonymousId) : null;
  const config = wallet ? await getOrCreateConfigForWallet(wallet, { createIfMissing: false }) : null;
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
  const wallet = await AgentWallet.findOne({ anonymousId })
    .select("allowedTools perTxCapUsd dailySpendCapUsd hourlySpendCapUsd")
    .lean();
  if (!wallet) throw new Error("agent_wallet_not_found");

  const tools = new Set([...(wallet.allowedTools || []), ...LP_REAL_TOOL_IDS]);
  // updateOne avoids full-document validate() — agentSecretKey is select:false and must not be re-saved.
  await AgentWallet.updateOne(
    { anonymousId },
    {
      $set: {
        allowedTools: [...tools],
        perTxCapUsd: Math.max(toNum(wallet.perTxCapUsd, 50), perTxCapUsd),
        dailySpendCapUsd: Math.max(toNum(wallet.dailySpendCapUsd, 250), dailySpendCapUsd),
        hourlySpendCapUsd: Math.max(toNum(wallet.hourlySpendCapUsd, 100), solPrice * 5),
      },
    },
  );
}

export async function enableLpReal({ anonymousId, enabledBy }) {
  const config = await assertLpRealOperator(anonymousId);
  const onChainBalanceSol = await getAgentSolBalance(config.agentAddress);
  const openPositions = await LpRealPosition.find({
    experimentId: config.experimentId,
    status: { $in: ["open", "opening", "closing"] },
  }).lean();
  const deployedSol = sumDeployedSol(openPositions);
  const totalCapitalSol = computeTotalCapitalSol(onChainBalanceSol, deployedSol);
  const minStart = minWalletToStartSol(config);
  const canStart = canTurnOnAgent({ onChainBalanceSol, openPositions, config });
  if (!canStart) {
    const availableSol = computeAvailableSol(onChainBalanceSol, config.reserveSolForFees);
    const err = new Error(
      `insufficient_balance: wallet ${onChainBalanceSol.toFixed(4)} SOL ` +
        `(${availableSol.toFixed(4)} available after reserve); ` +
        `need ~${minStart.toFixed(2)} SOL wallet to enter a pool`,
    );
    err.code = "insufficient_balance";
    err.onChainBalanceSol = onChainBalanceSol;
    err.totalCapitalSol = totalCapitalSol;
    err.minWalletToStartSol = minStart;
    throw err;
  }
  await bumpWalletPolicyForLpReal(anonymousId);
  await LpRealConfig.updateOne(configAgentFilter(config), {
    $set: {
      enabled: true,
      lastEnabledBy: enabledBy || anonymousId,
      lastError: null,
      closeAllRequested: false,
    },
  });
  return getLpRealState({ viewerAnonymousId: anonymousId });
}

export async function disableLpReal({ anonymousId, closeAll = false }) {
  const config = await assertLpRealOperator(anonymousId);
  await LpRealConfig.updateOne(configAgentFilter(config), {
    $set: {
      enabled: false,
      closeAllRequested: Boolean(closeAll),
    },
  });
  if (closeAll) {
    await resolveLpRealPositions({ forceCloseAll: true, agentAddress: config.agentAddress });
  }
  return getLpRealState({ viewerAnonymousId: anonymousId });
}

async function runLpRealSignalCycleForConfig(config) {
  const agentFilter = configAgentFilter(config);
  const errors = [];
  const opened = [];
  const skipped = [];

  const onChainBalance = await getAgentSolBalance(config.agentAddress);
  const openPositionsEarly = await LpRealPosition.find({
    experimentId: config.experimentId,
    status: { $in: ["open", "opening", "closing"] },
  }).lean();
  const deployedEarly = sumDeployedSol(openPositionsEarly);
  const totalCapital = computeTotalCapitalSol(onChainBalance, deployedEarly);
  const availableEarly = computeAvailableSol(onChainBalance, config.reserveSolForFees);

  if (!canOpenNewPosition({ onChainBalanceSol: onChainBalance, config })) {
    const reason = "insufficient_available_sol";
    await LpRealConfig.updateOne(agentFilter, {
      $set: { lastError: reason, lastSignalAt: new Date() },
    });
    return {
      agentAddress: config.agentAddress,
      opened: 0,
      skipped: 1,
      errors: [reason],
      openedRows: opened,
      skippedRows: [{ reason, onChainBalance, totalCapital, availableSol: availableEarly }],
    };
  }

  if (
    openPositionsEarly.length > 0 &&
    onChainBalance < minWalletWhileLiveSol() - 1e-9
  ) {
    await LpRealConfig.updateOne(agentFilter, {
      $set: { lastError: "low_wallet_fee_reserve", lastSignalAt: new Date() },
    });
  }

  try {
    const best = await pickBestStrategy();
    if (!best?.strategy) {
      skipped.push({ reason: "no_best_strategy" });
      await LpRealConfig.updateOne(
        agentFilter,
        { $set: { lastSignalAt: new Date(), lastError: "no_best_strategy" } },
      );
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: skipped.length,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    await LpRealConfig.updateOne(
      agentFilter,
      { $set: { currentStrategyId: best.strategyId, lastSignalAt: new Date(), lastError: null } },
    );

    const openCount = await LpRealPosition.countDocuments({
      experimentId: config.experimentId,
      status: { $in: ["open", "opening", "closing"] },
    });
    if (openCount >= config.maxConcurrentPositions) {
      skipped.push({ reason: "max_positions" });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 1,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    const openPositions = openPositionsEarly;
    const deployedSol = deployedEarly;
    const availableSol = availableEarly;

    if (availableSol < config.maxPositionSol) {
      skipped.push({ reason: "insufficient_available_sol", availableSol });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 1,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    const candidates = await getLpCandidatePools();
    const solCandidates = candidates.filter(
      (c) =>
        c.strategyId === best.strategyId &&
        c.gatePassed &&
        (isSolMint(c.baseMint) || isSolMint(c.quoteMint)),
    );
    const poolCandidate = solCandidates.sort((a, b) => b.score - a.score)[0];

    if (!poolCandidate) {
      skipped.push({ reason: "no_candidate", strategyId: best.strategyId });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 1,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    if (await hasRecentRealPosition(config.experimentId, poolCandidate.poolAddress)) {
      skipped.push({ reason: "cooldown_or_open", pool: poolCandidate.poolAddress });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 1,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    const solPrice = await fetchSolPriceUsd();
    const depositSol = config.maxPositionSol;
    const depositUsd = depositSol * solPrice;
    const strategy = best.strategy;

    const poolDetail = await fetchMeteoraPoolDetail(poolCandidate.poolAddress);
    if (!isSolMint(poolDetail.baseMint) && !isSolMint(poolDetail.quoteMint)) {
      skipped.push({ reason: "non_sol_pool", pool: poolCandidate.poolAddress });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 1,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    // Pre-clamp once for telemetry — buildOpenPositionTx clamps again defensively.
    const clampedRange = clampPositionBinRange(strategy.binsBelow, strategy.binsAbove);
    if (clampedRange.binsBelow === 0 && clampedRange.binsAbove === 0) {
      const errMsg = `strategy_bin_range_invalid (strategy:${strategy.id})`;
      errors.push(errMsg);
      await LpRealConfig.updateOne(agentFilter, { $set: { lastError: errMsg } });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 0,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    let sidecar = {};
    try {
      const sidecarResult = await ensureSidecarTokenForPool({
        anonymousId: config.anonymousId,
        agentAddress: config.agentAddress,
        baseMint: poolDetail.baseMint,
        quoteMint: poolDetail.quoteMint,
        otherSymbol: isSolMint(poolDetail.baseMint)
          ? poolCandidate.quoteSymbol
          : poolCandidate.baseSymbol,
        depositSol,
        binsBelow: clampedRange.binsBelow,
        binsAbove: clampedRange.binsAbove,
        solPriceUsd: solPrice,
      });
      sidecar = {
        swappedSolLamports: sidecarResult.swappedSolLamports,
        otherTokenRaw: sidecarResult.otherTokenRaw,
      };
    } catch (sidecarErr) {
      const msg = sidecarErr instanceof Error ? sidecarErr.message : String(sidecarErr);
      errors.push(`sidecar_swap:${msg}`);
      await LpRealConfig.updateOne(agentFilter, { $set: { lastError: msg, lastSignalAt: new Date() } });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 1,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
    }

    const txBuild = await buildOpenPositionTx({
      lbPairAddress: poolCandidate.poolAddress,
      binsBelow: clampedRange.binsBelow,
      binsAbove: clampedRange.binsAbove,
      lpShape: strategy.lpShape,
      depositSol,
      agentPubkey: config.agentAddress,
      slippageBps: envSlippageBps(),
      sidecar,
    });

    if (clampedRange.clamped) {
      console.info(
        `[lpReal] clamped position width for strategy ${strategy.id} (${strategy.name}): ` +
          `${strategy.binsBelow}/${strategy.binsAbove} -> ${txBuild.effectiveBinsBelow}/${txBuild.effectiveBinsAbove} ` +
          `(max ${MAX_METEORA_POSITION_BINS} bins)`,
      );
    }

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
      binsBelow: txBuild.effectiveBinsBelow,
      binsAbove: txBuild.effectiveBinsAbove,
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
      const rawErrMsg =
        brokerResult.status === "denied"
          ? (brokerResult.reasons || []).join(";")
          : "broker_pending_or_failed";
      const errMsg = humanizeBrokerError(rawErrMsg);
      await LpRealPosition.updateOne(
        { _id: pending._id },
        { $set: { status: "error", errorMessage: errMsg, resolvedAt: new Date() } },
      );
      errors.push(errMsg);
      await LpRealConfig.updateOne(agentFilter, { $set: { lastError: errMsg } });
      return {
        agentAddress: config.agentAddress,
        opened: 0,
        skipped: 0,
        errors,
        openedRows: opened,
        skippedRows: skipped,
      };
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
    await LpRealConfig.updateOne(agentFilter, { $set: { lastError: msg, lastSignalAt: new Date() } });
  }

  return {
    agentAddress: config.agentAddress,
    opened: opened.length,
    skipped: skipped.length,
    errors,
    openedRows: opened,
    skippedRows: skipped,
  };
}

export async function runLpRealSignalCycle() {
  if (!isRealCronEnabled()) {
    return { skipped: true, reason: "env_disabled" };
  }

  const configs = await LpRealConfig.find({ enabled: true }).lean();
  if (!configs.length) {
    return { skipped: true, reason: "no_enabled_configs", agents: 0 };
  }

  const results = [];
  for (const config of configs) {
    results.push(await runLpRealSignalCycleForConfig(config));
  }

  const opened = results.reduce((n, r) => n + r.opened, 0);
  const skipped = results.reduce((n, r) => n + r.skipped, 0);
  const errors = results.flatMap((r) => r.errors || []);
  return { agents: configs.length, opened, skipped, errors, results };
}

async function resolveLpRealPositionsForConfig(config, { forceCloseAll = false } = {}) {
  const agentFilter = configAgentFilter(config);
  const shouldSweepToSol = Boolean(forceCloseAll || config.closeAllRequested);
  const openRuns = await LpRealPosition.find({
    experimentId: config.experimentId,
    $or: [
      { status: { $in: ["open", "closing"] } },
      {
        status: "error",
        openTxSig: { $ne: null },
        $or: [{ closeTxSig: null }, { closeTxSig: "" }],
      },
    ],
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
        forceCloseAll ||
        config.closeAllRequested ||
        exitEval.shouldClose ||
        isOrphanedLiveLpPosition(position);

      if (!shouldClose) {
        await LpRealPosition.updateOne({ _id: position._id }, { $set: { processing: false } });
        continue;
      }

      await LpRealPosition.updateOne({ _id: position._id }, { $set: { status: "closing" } });

      const walletBefore = await snapshotAgentWalletForPool(
        config.agentAddress,
        position.poolAddress,
      );

      if (position.status === "error") {
        await LpRealPosition.updateOne({ _id: position._id }, { $set: { status: "open" } });
        position.status = "open";
      }

      const closeTx = await buildClosePositionTx({
        lbPairAddress: position.poolAddress,
        positionPubkey: position.positionPubkey,
        agentPubkey: config.agentAddress,
        positionSecretEnc: position.positionSecretEnc,
        activeBinAtOpen: position.activeBinAtOpen,
        binsBelow: position.binsBelow,
        binsAbove: position.binsAbove,
        slippageBps: envSlippageBps(),
      });

      const closeTxs =
        closeTx.serializedTxBase64List?.length > 0
          ? closeTx.serializedTxBase64List
          : [closeTx.serializedTxBase64];

      let closeResult = { status: "denied", reasons: ["no_close_tx"] };
      for (let i = 0; i < closeTxs.length; i += 1) {
        closeResult = await brokerSignTx(
          config.anonymousId,
          "lp_real_close",
          closeTxs[i],
          position.depositUsd / closeTxs.length,
          `Close LP position ${position.poolName}${closeTxs.length > 1 ? ` (${i + 1}/${closeTxs.length})` : ""}`,
        );
        if (closeResult.status !== "ok") break;
      }

      if (closeResult.status !== "ok") {
        const rawErrMsg =
          closeResult.status === "denied"
            ? (closeResult.reasons || []).join(";")
            : "close_broker_failed";
        const errMsg = humanizeBrokerError(rawErrMsg);
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
      const walletAfter = await snapshotAgentWalletForPool(
        config.agentAddress,
        position.poolAddress,
      );
      const feeRow = await LpRealPosition.findById(position._id).select("realFeesClaimedSol").lean();
      const priorFeesClaimedSol = toNum(feeRow?.realFeesClaimedSol, 0);
      const pricePerToken =
        toNum(onChain?.currentPrice, 0) ||
        toNum(poolDetail.currentPrice, 0) ||
        toNum(position.entryPriceUsd, 0);
      let proceedsSol = computeCloseProceedsSol({
        before: walletBefore,
        after: walletAfter,
        pricePerToken,
      });
      if (proceedsSol == null || !Number.isFinite(proceedsSol)) {
        const dX = BigInt(walletAfter.xRaw) - BigInt(walletBefore.xRaw);
        const dY = BigInt(walletAfter.yRaw) - BigInt(walletBefore.yRaw);
        if (walletBefore.solIsX) {
          proceedsSol = Number(dX) / LAMPORTS_PER_SOL;
        } else if (walletBefore.solIsY) {
          proceedsSol = Number(dY) / LAMPORTS_PER_SOL;
        } else {
          proceedsSol = 0;
        }
      }
      const realNetPnlSol = proceedsSol + priorFeesClaimedSol - toNum(position.depositSol, 0);
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
            realFinalSolOut: proceedsSol,
            realNetPnlSol,
            realNetPnlUsd,
            realFeesClaimedSol: priorFeesClaimedSol,
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
    status: { $in: ["open", "opening", "closing"] },
  });

  if (shouldSweepToSol && stillOpen === 0) {
    try {
      const solPrice = await fetchSolPriceUsd();
      const sweep = await sweepNonSolTokensToSol({
        anonymousId: config.anonymousId,
        agentAddress: config.agentAddress,
        solPriceUsd: solPrice,
      });
      for (const sweepErr of sweep.errors) {
        errors.push(`sweep:${sweepErr}`);
      }
    } catch (sweepErr) {
      const msg = sweepErr instanceof Error ? sweepErr.message : String(sweepErr);
      errors.push(`sweep:${msg}`);
    }
  }

  if (config.closeAllRequested && stillOpen === 0) {
    await LpRealConfig.updateOne(agentFilter, { $set: { closeAllRequested: false } });
  }

  await LpRealConfig.updateOne(agentFilter, { $set: { lastResolveAt: new Date() } });

  return {
    agentAddress: config.agentAddress,
    resolved: resolvedRows.length,
    openChecked: openRuns.length,
    errors,
    rows: resolvedRows,
  };
}

export async function resolveLpRealPositions({ forceCloseAll = false, agentAddress = null } = {}) {
  if (!isRealCronEnabled() && !forceCloseAll) {
    return { resolved: 0, openChecked: 0, errors: [], rows: [], agents: 0 };
  }

  let configs;
  if (agentAddress) {
    const one = await LpRealConfig.findOne({ agentAddress }).lean();
    configs = one ? [one] : [];
  } else if (forceCloseAll) {
    configs = await LpRealConfig.find({}).lean();
  } else {
    configs = await getConfigsForResolve();
  }

  if (!configs.length) {
    return { resolved: 0, openChecked: 0, errors: ["no_config"], rows: [], agents: 0 };
  }

  const results = [];
  for (const config of configs) {
    const closeThisAgent =
      forceCloseAll && (!agentAddress || config.agentAddress === agentAddress);
    results.push(await resolveLpRealPositionsForConfig(config, { forceCloseAll: closeThisAgent }));
  }

  return {
    agents: configs.length,
    resolved: results.reduce((n, r) => n + r.resolved, 0),
    openChecked: results.reduce((n, r) => n + r.openChecked, 0),
    errors: results.flatMap((r) => r.errors || []),
    rows: results.flatMap((r) => r.rows || []),
    results,
  };
}
