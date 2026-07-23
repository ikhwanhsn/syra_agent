/**
 * Earn Yield adapter — LP Auto (Meteora DLMM).
 */
import LpRealConfig from "../../models/LpRealConfig.js";
import LpRealPosition from "../../models/LpRealPosition.js";
import AgentWallet from "../../models/agent/AgentWallet.js";
import { buildSettlementHealth } from "../settlementHealthService.js";
import {
  enableLpReal,
  disableLpReal,
  getLpRealState,
  getLpRealSummary,
} from "../lpRealService.js";
import { isAdminWalletAddress } from "../adminWallet.js";
import { lpAnonymousIdFromChat } from "../agentWalletPurpose.js";
import { getEarnProduct, EARN_PRODUCT_LP, isEarnYieldBetaAllowed, isEarnYieldBetaOpen } from "../../config/earnProducts.js";
import {
  assertBetaAllowed,
  assertDepositsOpen,
  buildReadinessFromGuards,
  clampDepositCap,
  fetchSolanaSettlementWindows,
  round,
  roundPct,
  settlementSlice,
} from "./earnAdapterShared.js";

const PRODUCT = () => getEarnProduct(EARN_PRODUCT_LP);

const DEFAULT_MAX_POSITION_SOL = 1;
const DEFAULT_MAX_CONCURRENT = 3;

async function resolveLpAgentWallet(anonymousId) {
  const lpId = lpAnonymousIdFromChat(anonymousId) || String(anonymousId || "").trim();
  if (!lpId) return null;
  let wallet = await AgentWallet.findOne({ anonymousId: lpId, purpose: "lp" })
    .select("anonymousId agentAddress chain status purpose")
    .lean();
  if (!wallet) {
    wallet = await AgentWallet.findOne({ anonymousId: lpId })
      .select("anonymousId agentAddress chain status purpose")
      .lean();
  }
  return wallet;
}

export async function getStats() {
  const product = PRODUCT();
  const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [agg, recentAgg, openCount, settlement] = await Promise.all([
    LpRealPosition.aggregate([
      {
        $group: {
          _id: null,
          wins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          losses: {
            $sum: { $cond: [{ $in: ["$status", ["closed_loss", "expired"]] }, 1, 0] },
          },
          errors: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
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
          feesClaimedSol: { $sum: { $ifNull: ["$realFeesClaimedSol", 0] } },
          firstAt: { $min: "$openedAt" },
          lastAt: { $max: "$resolvedAt" },
        },
      },
    ]),
    LpRealPosition.aggregate([
      {
        $match: {
          $or: [
            { openedAt: { $gte: recentSince } },
            { resolvedAt: { $gte: recentSince } },
            { updatedAt: { $gte: recentSince } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          wins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          losses: {
            $sum: { $cond: [{ $in: ["$status", ["closed_loss", "expired"]] }, 1, 0] },
          },
          errors: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
        },
      },
    ]),
    LpRealPosition.countDocuments({ status: { $in: ["open", "opening", "closing"] } }),
    buildSettlementHealth(new Date(Date.now() - 24 * 60 * 60 * 1000), {
      networkRegex: /^solana/i,
    }).catch(() => null),
  ]);

  const row = agg[0] || {};
  const recent = recentAgg[0] || {};
  const wins = Number(row.wins) || 0;
  const losses = Number(row.losses) || 0;
  const errors = Number(row.errors) || 0;
  const decided = wins + losses;
  const settledOrErrored = decided + errors;
  const winRate = decided > 0 ? wins / decided : null;
  const errorRate = settledOrErrored > 0 ? errors / settledOrErrored : 0;

  const recentWins = Number(recent.wins) || 0;
  const recentLosses = Number(recent.losses) || 0;
  const recentErrors = Number(recent.errors) || 0;
  const recentDecided = recentWins + recentLosses;
  const recentSettledOrErrored = recentDecided + recentErrors;
  const recentErrorRate =
    recentSettledOrErrored > 0 ? recentErrors / recentSettledOrErrored : 0;

  const realizedNetPnlSol = Number(row.realizedNetPnlSol) || 0;
  const realizedNetPnlUsd = Number(row.realizedNetPnlUsd) || 0;

  let aprPctHint = null;
  if (row.firstAt && row.lastAt && realizedNetPnlSol !== 0) {
    const ms = new Date(row.lastAt).getTime() - new Date(row.firstAt).getTime();
    const days = Math.max(1, ms / (24 * 60 * 60 * 1000));
    const capitalHint = 10;
    aprPctHint = roundPct((realizedNetPnlSol / capitalHint) * (365 / days));
  }

  return {
    productId: product.id,
    denom: product.denom,
    wins,
    losses,
    errors,
    decided,
    openCount,
    winRate,
    winRatePct: winRate != null ? roundPct(winRate) : null,
    errorRate,
    errorRatePct: roundPct(errorRate),
    recentErrorRate,
    recentErrorRatePct: roundPct(recentErrorRate),
    recentDecided,
    recentErrors,
    netPnl: round(realizedNetPnlSol),
    netPnlUsd: round(realizedNetPnlUsd, 2),
    /** @deprecated prefer netPnl — kept for LP board back-compat */
    realizedNetPnlSol: round(realizedNetPnlSol),
    realizedNetPnlUsd: round(realizedNetPnlUsd, 2),
    feesClaimedSol: round(Number(row.feesClaimedSol) || 0),
    aprPctHint,
    paperVsRealNote:
      "Win rate and PnL are from Syra lab real-money positions. Past performance is not a guarantee. Paper sim can look different.",
    settlement24h: settlementSlice(settlement),
    firstPositionAt: row.firstAt ? new Date(row.firstAt).toISOString() : null,
    lastResolvedAt: row.lastAt ? new Date(row.lastAt).toISOString() : null,
  };
}

export async function getReadiness() {
  const product = PRODUCT();
  const [stats, { settlement1h, settlement24h }] = await Promise.all([
    getStats(),
    fetchSolanaSettlementWindows(),
  ]);

  const sampleOk =
    (stats.recentDecided ?? 0) + (stats.recentErrors ?? 0) >= product.minSample;
  const errorRateForGuards = sampleOk ? stats.recentErrorRate : stats.errorRate;
  const errorKill = sampleOk && errorRateForGuards >= product.killErrorRate;
  const netPositive = stats.netPnl > 0;

  return buildReadinessFromGuards(stats, product, {
    netPositive,
    errorRateForGuards,
    sampleOk,
    errorKill,
    settlement1h,
    settlement24h,
  });
}

export async function enforceKill() {
  const readiness = await getReadiness();
  if (!readiness.depositsShouldPause) {
    return { productId: EARN_PRODUCT_LP, paused: false, readiness };
  }
  const result = await LpRealConfig.updateMany(
    { publicEarnListed: true, depositsPaused: { $ne: true } },
    { $set: { depositsPaused: true, lastError: `auto_pause:${readiness.blockers.join(",")}` } },
  );
  console.warn(
    `[earn-yield:${EARN_PRODUCT_LP}] kill switch: paused deposits on ${result.modifiedCount} configs —`,
    readiness.blockers.join(", "),
  );
  return {
    productId: EARN_PRODUCT_LP,
    paused: true,
    modifiedCount: result.modifiedCount,
    readiness,
  };
}

export async function enableForUser({ anonymousId, ownerWallet, maxDeposit, enabledBy }) {
  const product = PRODUCT();
  assertBetaAllowed(ownerWallet, anonymousId);

  const readiness = await getReadiness();
  assertDepositsOpen(readiness);

  const wallet = await resolveLpAgentWallet(anonymousId);
  if (!wallet?.agentAddress) {
    const err = new Error("lp_agent_wallet_required — create / fund your LP agent wallet first");
    err.code = "lp_agent_wallet_required";
    throw err;
  }

  const cap = clampDepositCap(product, maxDeposit);

  const state = await enableLpReal({
    anonymousId: wallet.anonymousId || anonymousId,
    enabledBy: enabledBy || ownerWallet || anonymousId,
  });

  await LpRealConfig.updateOne(
    { agentAddress: wallet.agentAddress },
    {
      $set: {
        publicEarnListed: true,
        depositsPaused: false,
        publicMaxDepositSol: cap,
        targetBankSol: cap,
        maxPositionSol: Math.min(DEFAULT_MAX_POSITION_SOL, cap),
        maxConcurrentPositions: DEFAULT_MAX_CONCURRENT,
        performanceFeeBps: product.performanceFeeBps,
        pausedNoStrategyAt: null,
        lastError: null,
      },
    },
  );

  const summary = await getLpRealSummary({ viewerAnonymousId: wallet.anonymousId || anonymousId });
  const freshState = await getLpRealState({ viewerAnonymousId: wallet.anonymousId || anonymousId });

  return {
    productId: product.id,
    denom: product.denom,
    agentAddress: wallet.agentAddress,
    maxDeposit: cap,
    maxDepositSol: cap,
    performanceFeeBps: product.performanceFeeBps,
    state: freshState || state,
    summary,
    nextStep: `Deposit ${product.minDeposit}–${cap} SOL to your LP agent wallet (/wallet?wallet=lp), then the agent opens Meteora positions automatically.`,
  };
}

export async function disableForUser({ anonymousId, closeAll = false }) {
  const wallet = await resolveLpAgentWallet(anonymousId);
  if (!wallet?.agentAddress) {
    return { productId: EARN_PRODUCT_LP, disabled: false, reason: "no_wallet" };
  }
  await LpRealConfig.updateOne(
    { agentAddress: wallet.agentAddress },
    { $set: { publicEarnListed: false, depositsPaused: true } },
  );
  const state = await disableLpReal({
    anonymousId: wallet.anonymousId || anonymousId,
    closeAll,
  });
  return {
    productId: EARN_PRODUCT_LP,
    disabled: true,
    closeAll: Boolean(closeAll),
    state,
  };
}

export async function getUserStatus({ anonymousId, ownerWallet }) {
  const product = PRODUCT();
  const isAdmin = isAdminWalletAddress(ownerWallet);
  const allowed = isEarnYieldBetaAllowed(ownerWallet, { isAdmin });
  const wallet = anonymousId ? await resolveLpAgentWallet(anonymousId) : null;
  let config = null;
  let summary = null;
  let state = null;
  if (wallet?.agentAddress) {
    config = await LpRealConfig.findOne({ agentAddress: wallet.agentAddress }).lean();
    summary = await getLpRealSummary({ viewerAnonymousId: wallet.anonymousId || anonymousId });
    state = await getLpRealState({ viewerAnonymousId: wallet.anonymousId || anonymousId });
  }
  return {
    productId: product.id,
    denom: product.denom,
    allowed,
    betaOpen: isEarnYieldBetaOpen(),
    agentAddress: wallet?.agentAddress || null,
    enabled: Boolean(config?.enabled && config?.publicEarnListed && !config?.depositsPaused),
    config: config
      ? {
          enabled: config.enabled,
          publicEarnListed: config.publicEarnListed,
          depositsPaused: config.depositsPaused,
          publicMaxDeposit: config.publicMaxDepositSol,
          publicMaxDepositSol: config.publicMaxDepositSol,
          performanceFeeBps: config.performanceFeeBps,
          lastError: config.lastError,
          pausedNoStrategyAt: config.pausedNoStrategyAt,
        }
      : null,
    summary: summary
      ? {
          ...summary,
          netPnl: summary.realizedNetPnlSol,
          netPnlUsd: summary.realizedNetPnlUsd,
        }
      : null,
    canEnable: Boolean(allowed && state?.canTurnOn),
    state,
  };
}

export const lpEarnAdapter = {
  productId: EARN_PRODUCT_LP,
  getStats,
  getReadiness,
  getUserStatus,
  enableForUser,
  disableForUser,
  enforceKill,
};

export default lpEarnAdapter;
