/**
 * Earn Yield adapter — BTC3 Macro Allocation (equity / drawdown based).
 */
import Btc3RealConfig from "../../models/btc3/Btc3RealConfig.js";
import Btc3RealRebalance from "../../models/btc3/Btc3RealRebalance.js";
import AgentWallet from "../../models/agent/AgentWallet.js";
import { buildSettlementHealth } from "../settlementHealthService.js";
import {
  enableBtc3Real,
  disableBtc3Real,
  getBtc3RealState,
} from "../btc3/btc3RealService.js";
import { isAdminWalletAddress } from "../adminWallet.js";
import { siblingAnonymousId, purposeQuery } from "../agentWalletPurpose.js";
import {
  getEarnProduct,
  EARN_PRODUCT_BTC3,
  isEarnYieldBetaAllowed,
  isEarnYieldBetaOpen,
} from "../../config/earnProducts.js";
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

const PRODUCT = () => getEarnProduct(EARN_PRODUCT_BTC3);

/** Max drawdown from peak equity that still allows launch (fraction). */
const MAX_DRAWDOWN_FOR_READY = 0.25;

async function resolveInvestWallet(anonymousId) {
  const investAid = siblingAnonymousId(anonymousId, "invest");
  if (!investAid) return null;
  const wallet = await AgentWallet.findOne({
    anonymousId: investAid,
    chain: "solana",
    status: "active",
    ...purposeQuery("invest"),
  })
    .select("anonymousId agentAddress chain status purpose")
    .lean();
  return wallet;
}

export async function getStats() {
  const product = PRODUCT();
  const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [agg, recentAgg, cfg, settlement] = await Promise.all([
    Btc3RealRebalance.aggregate([
      {
        $group: {
          _id: null,
          executed: {
            $sum: { $cond: [{ $eq: ["$status", "executed"] }, 1, 0] },
          },
          errors: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
          skipped: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      "skipped_below_threshold",
                      "skipped_no_change",
                      "skipped_disabled",
                      "skipped_insufficient",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          realizedNetPnlUsd: {
            $sum: {
              $cond: [
                { $eq: ["$status", "executed"] },
                { $ifNull: ["$realNetPnlUsd", 0] },
                0,
              ],
            },
          },
          firstAt: { $min: "$createdAt" },
          lastAt: { $max: "$createdAt" },
          peakEquity: { $max: { $ifNull: ["$equityUsd", 0] } },
          lastEquity: { $last: "$equityUsd" },
        },
      },
    ]),
    Btc3RealRebalance.aggregate([
      {
        $match: {
          createdAt: { $gte: recentSince },
        },
      },
      {
        $group: {
          _id: null,
          executed: {
            $sum: { $cond: [{ $eq: ["$status", "executed"] }, 1, 0] },
          },
          errors: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
        },
      },
    ]),
    Btc3RealConfig.findById("singleton").lean(),
    buildSettlementHealth(new Date(Date.now() - 24 * 60 * 60 * 1000), {
      networkRegex: /^solana/i,
    }).catch(() => null),
  ]);

  const row = agg[0] || {};
  const recent = recentAgg[0] || {};
  const executed = Number(row.executed) || 0;
  const errors = Number(row.errors) || 0;
  const decided = executed; // rebalances that actually ran
  const settledOrErrored = decided + errors;
  const errorRate = settledOrErrored > 0 ? errors / settledOrErrored : 0;

  const recentExecuted = Number(recent.executed) || 0;
  const recentErrors = Number(recent.errors) || 0;
  const recentDecided = recentExecuted;
  const recentSettledOrErrored = recentDecided + recentErrors;
  const recentErrorRate =
    recentSettledOrErrored > 0 ? recentErrors / recentSettledOrErrored : 0;

  const realizedNetPnlUsd = Number(row.realizedNetPnlUsd) || 0;
  const baseline = Number(cfg?.capitalBaselineUsd) || 0;
  // Prefer state equity vs baseline when available
  let equityUsd = null;
  let returnPct = null;
  let drawdownPct = null;
  try {
    const state = await getBtc3RealState({});
    equityUsd = state.equityUsd;
    returnPct = state.returnPct;
    if (equityUsd != null && Number(row.peakEquity) > 0) {
      const peak = Number(row.peakEquity);
      drawdownPct = roundPct(Math.max(0, (peak - equityUsd) / peak));
    }
  } catch {
    /* best-effort */
  }

  // Net PnL: prefer realized from rebalances; fall back to equity - baseline
  let netPnlUsd = realizedNetPnlUsd;
  if (!(Math.abs(netPnlUsd) > 0) && equityUsd != null && baseline > 0) {
    netPnlUsd = equityUsd - baseline;
  }

  let aprPctHint = null;
  if (row.firstAt && row.lastAt && netPnlUsd !== 0 && baseline > 0) {
    const ms = new Date(row.lastAt).getTime() - new Date(row.firstAt).getTime();
    const days = Math.max(1, ms / (24 * 60 * 60 * 1000));
    aprPctHint = roundPct((netPnlUsd / baseline) * (365 / days));
  }

  return {
    productId: product.id,
    denom: product.denom,
    wins: null,
    losses: null,
    errors,
    decided,
    openCount: cfg?.enabled ? 1 : 0,
    winRate: null,
    winRatePct: null,
    errorRate,
    errorRatePct: roundPct(errorRate),
    recentErrorRate,
    recentErrorRatePct: roundPct(recentErrorRate),
    recentDecided,
    recentErrors,
    netPnl: round(netPnlUsd, 2),
    netPnlUsd: round(netPnlUsd, 2),
    realizedNetPnlUsd: round(realizedNetPnlUsd, 2),
    equityUsd: equityUsd != null ? round(equityUsd, 2) : null,
    returnPct: returnPct != null ? round(returnPct, 2) : null,
    drawdownPct,
    executedRebalances: executed,
    skippedRebalances: Number(row.skipped) || 0,
    capitalBaselineUsd: baseline > 0 ? round(baseline, 2) : null,
    aprPctHint,
    paperVsRealNote:
      "Equity and drawdown are from Syra lab real rebalances. No classic win rate — past performance is not a guarantee.",
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
  const hasTrackRecord = (stats.decided ?? 0) >= product.minSample;
  const errorRateForGuards = sampleOk ? stats.recentErrorRate : stats.errorRate;
  const errorKill = sampleOk && errorRateForGuards >= product.killErrorRate;

  // Equity-based: net positive vs baseline (or realized PnL)
  const netPositive = hasTrackRecord && stats.netPnlUsd > 0;

  const extraBlockers = [];
  if (!hasTrackRecord) {
    extraBlockers.push(
      `insufficient_real_sample_${stats.decided ?? 0}_need_${product.minSample}`,
    );
  }
  if (
    stats.drawdownPct != null &&
    stats.drawdownPct / 100 > MAX_DRAWDOWN_FOR_READY
  ) {
    extraBlockers.push(
      `drawdown_${stats.drawdownPct}pct_above_${roundPct(MAX_DRAWDOWN_FOR_READY)}pct`,
    );
  }

  return buildReadinessFromGuards(stats, product, {
    netPositive,
    errorRateForGuards,
    sampleOk: sampleOk || hasTrackRecord,
    errorKill,
    settlement1h,
    settlement24h,
    extraBlockers,
  });
}

export async function enforceKill() {
  const readiness = await getReadiness();
  if (!readiness.depositsShouldPause) {
    return { productId: EARN_PRODUCT_BTC3, paused: false, readiness };
  }
  const result = await Btc3RealConfig.updateMany(
    { publicEarnListed: true, depositsPaused: { $ne: true } },
    { $set: { depositsPaused: true, lastError: `auto_pause:${readiness.blockers.join(",")}` } },
  );
  console.warn(
    `[earn-yield:${EARN_PRODUCT_BTC3}] kill switch: paused deposits on ${result.modifiedCount} configs —`,
    readiness.blockers.join(", "),
  );
  return {
    productId: EARN_PRODUCT_BTC3,
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

  const wallet = await resolveInvestWallet(anonymousId);
  if (!wallet?.agentAddress) {
    const err = new Error(
      "invest_agent_wallet_required — create / fund your invest agent wallet first",
    );
    err.code = "invest_agent_wallet_required";
    throw err;
  }

  const cap = clampDepositCap(product, maxDeposit);

  const state = await enableBtc3Real({
    anonymousId,
    enabledBy: enabledBy || ownerWallet || anonymousId,
    maxNotionalUsd: cap,
  });

  await Btc3RealConfig.updateOne(
    { _id: "singleton" },
    {
      $set: {
        publicEarnListed: true,
        depositsPaused: false,
        publicMaxDepositUsdc: cap,
        maxNotionalUsd: cap,
        performanceFeeBps: product.performanceFeeBps,
        lastError: null,
      },
    },
  );

  const freshState = await getBtc3RealState({ viewerAnonymousId: anonymousId });

  return {
    productId: product.id,
    denom: product.denom,
    agentAddress: wallet.agentAddress,
    maxDeposit: cap,
    maxDepositUsdc: cap,
    performanceFeeBps: product.performanceFeeBps,
    state: freshState || state,
    summary: {
      netPnl: freshState?.realizedNetPnlUsd ?? 0,
      netPnlUsd: freshState?.realizedNetPnlUsd ?? 0,
      equityUsd: freshState?.equityUsd ?? null,
      returnPct: freshState?.returnPct ?? null,
      openCount: freshState?.enabled ? 1 : 0,
    },
    nextStep: `Deposit ${product.minDeposit}–${cap} USDC to your invest agent wallet (/wallet?wallet=invest). Macro pipeline rebalances USDC↔cbBTC toward target allocation.`,
  };
}

export async function disableForUser({ anonymousId, closeAll = false }) {
  const wallet = await resolveInvestWallet(anonymousId);
  if (!wallet?.agentAddress) {
    return { productId: EARN_PRODUCT_BTC3, disabled: false, reason: "no_wallet" };
  }
  await Btc3RealConfig.updateOne(
    { _id: "singleton" },
    { $set: { publicEarnListed: false, depositsPaused: true } },
  );
  const state = await disableBtc3Real({ anonymousId });
  return {
    productId: EARN_PRODUCT_BTC3,
    disabled: true,
    closeAll: Boolean(closeAll),
    state,
  };
}

export async function getUserStatus({ anonymousId, ownerWallet }) {
  const product = PRODUCT();
  const isAdmin = isAdminWalletAddress(ownerWallet);
  const allowed = isEarnYieldBetaAllowed(ownerWallet, { isAdmin });
  const wallet = anonymousId ? await resolveInvestWallet(anonymousId) : null;
  let config = null;
  let state = null;
  if (wallet?.agentAddress) {
    config = await Btc3RealConfig.findById("singleton").lean();
    if (config?.agentAddress && config.agentAddress !== wallet.agentAddress) {
      config = null;
    }
    state = await getBtc3RealState({ viewerAnonymousId: anonymousId });
  }
  const enabled = Boolean(
    config?.enabled &&
      config?.publicEarnListed &&
      !config?.depositsPaused &&
      config?.agentAddress === wallet?.agentAddress,
  );
  return {
    productId: product.id,
    denom: product.denom,
    allowed,
    betaOpen: isEarnYieldBetaOpen(),
    agentAddress: wallet?.agentAddress || null,
    enabled,
    config: config
      ? {
          enabled: config.enabled,
          publicEarnListed: config.publicEarnListed,
          depositsPaused: config.depositsPaused,
          publicMaxDeposit: config.publicMaxDepositUsdc,
          publicMaxDepositUsdc: config.publicMaxDepositUsdc,
          performanceFeeBps: config.performanceFeeBps,
          lastError: config.lastError,
          pausedNoStrategyAt: null,
        }
      : null,
    summary: state
      ? {
          netPnl: state.realizedNetPnlUsd,
          netPnlUsd: state.realizedNetPnlUsd,
          equityUsd: state.equityUsd,
          returnPct: state.returnPct,
          openCount: state.enabled ? 1 : 0,
        }
      : null,
    canEnable: Boolean(allowed && wallet?.agentAddress),
    state,
  };
}

export const btc3EarnAdapter = {
  productId: EARN_PRODUCT_BTC3,
  getStats,
  getReadiness,
  getUserStatus,
  enableForUser,
  disableForUser,
  enforceKill,
};

export default btc3EarnAdapter;
