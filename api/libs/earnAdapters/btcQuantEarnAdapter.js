/**
 * Earn Yield adapter — cbBTC Onchain Signal (BTC Quant real, lane btc1).
 */
import BtcQuantRealConfig from "../../models/BtcQuantRealConfig.js";
import BtcQuantRealPosition from "../../models/BtcQuantRealPosition.js";
import { buildSettlementHealth } from "../settlementHealthService.js";
import {
  enableBtcQuantReal,
  disableBtcQuantReal,
  getBtcQuantRealState,
} from "../btcQuantRealService.js";
import { isAdminWalletAddress } from "../adminWallet.js";
import { findOrEnsurePurposeWallet } from "../agentWalletProvision.js";
import {
  getEarnProduct,
  EARN_PRODUCT_CBBTC,
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

const LANE = "btc1";
const PRODUCT = () => getEarnProduct(EARN_PRODUCT_CBBTC);

function lanePositionFilter() {
  return { $or: [{ lane: "btc1" }, { lane: { $exists: false } }, { lane: null }] };
}

async function resolveInvestWallet(anonymousId) {
  const wallet = await findOrEnsurePurposeWallet(anonymousId, "invest");
  if (!wallet?.agentAddress) return null;
  return {
    anonymousId: wallet.anonymousId,
    agentAddress: wallet.agentAddress,
    chain: wallet.chain || "solana",
    status: wallet.status,
    purpose: wallet.purpose || "invest",
  };
}

export async function getStats() {
  const product = PRODUCT();
  const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const matchLane = lanePositionFilter();

  const [agg, recentAgg, openCount, settlement] = await Promise.all([
    BtcQuantRealPosition.aggregate([
      { $match: matchLane },
      {
        $group: {
          _id: null,
          wins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          losses: {
            $sum: {
              $cond: [{ $in: ["$status", ["closed_loss", "expired"]] }, 1, 0],
            },
          },
          errors: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
          realizedNetPnlUsd: {
            $sum: {
              $cond: [
                { $in: ["$status", ["closed_win", "closed_loss", "expired"]] },
                { $ifNull: ["$realNetPnlUsd", 0] },
                0,
              ],
            },
          },
          firstAt: { $min: "$openedAt" },
          lastAt: { $max: "$resolvedAt" },
        },
      },
    ]),
    BtcQuantRealPosition.aggregate([
      {
        $match: {
          ...matchLane,
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
            $sum: {
              $cond: [{ $in: ["$status", ["closed_loss", "expired"]] }, 1, 0],
            },
          },
          errors: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
        },
      },
    ]),
    BtcQuantRealPosition.countDocuments({
      ...matchLane,
      status: { $in: ["open", "opening", "closing"] },
    }),
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

  const realizedNetPnlUsd = Number(row.realizedNetPnlUsd) || 0;

  let aprPctHint = null;
  if (row.firstAt && row.lastAt && realizedNetPnlUsd !== 0) {
    const ms = new Date(row.lastAt).getTime() - new Date(row.firstAt).getTime();
    const days = Math.max(1, ms / (24 * 60 * 60 * 1000));
    const capitalHint = 200; // default maxNotionalUsd lab baseline
    aprPctHint = roundPct((realizedNetPnlUsd / capitalHint) * (365 / days));
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
    netPnl: round(realizedNetPnlUsd, 2),
    netPnlUsd: round(realizedNetPnlUsd, 2),
    realizedNetPnlUsd: round(realizedNetPnlUsd, 2),
    aprPctHint,
    paperVsRealNote:
      "Win rate and PnL are from Syra lab real-money cbBTC positions (lane btc1). Past performance is not a guarantee.",
    settlement24h: settlementSlice(settlement),
    firstPositionAt: row.firstAt ? new Date(row.firstAt).toISOString() : null,
    lastResolvedAt: row.lastAt ? new Date(row.lastAt).toISOString() : null,
  };
}

async function paperEdgeBlockerIfNeeded() {
  try {
    const { evaluateBtcQuantPaperEdge } = await import("../../config/btcQuantPaperEdge.js");
    const { getBtcQuantLaneDef } = await import("../../config/btcQuantLanes.js");
    const { EXPERIMENT_SUITE_BTC_ONCHAIN } = await import(
      "../../config/tradingExperimentStrategies.js"
    );
    const TradingExperimentRun = (await import("../../models/TradingExperimentRun.js")).default;
    const {
      pickBestBtcQuantStrategy,
      BTC_QUANT_MIN_DECIDED_FOR_LEADER,
      BTC_QUANT_MIN_WIN_RATE,
    } = await import("../btcQuantExperimentEvolution.js");
    const mongoose = (await import("mongoose")).default;
    const laneDef = getBtcQuantLaneDef(LANE);
    const state = await mongoose.connection.db
      .collection("btc_quant_experiment_state")
      .findOne({ _id: laneDef.stateId });
    const experimentId = state?.activeExperimentId ?? null;
    if (!experimentId) return "btc_quant_paper_edge_no_experiment";

    const match = {
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": experimentId,
      "summary.evolutionArchived": { $ne: true },
      $or: [
        { "summary.lane": "btc1" },
        { "summary.lane": { $exists: false } },
        { "summary.lane": null },
      ],
    };
    const byStatus = await TradingExperimentRun.aggregate([
      { $match: match },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);
    const statusMap = Object.fromEntries(byStatus.map((r) => [r._id || "null", r]));
    const decided =
      (statusMap.win?.n || 0) + (statusMap.loss?.n || 0) + (statusMap.expired?.n || 0);
    const best = await pickBestBtcQuantStrategy(experimentId);
    const evaled = evaluateBtcQuantPaperEdge({
      decided,
      leaderNetPnlUsd: best?.sumDecidedPnlUsd ?? null,
      leaderWinRate: best?.winRate ?? null,
      leaderDecided: best?.decided ?? null,
      hasQualifiedLeader: Boolean(
        best &&
          (best.decided || 0) >= BTC_QUANT_MIN_DECIDED_FOR_LEADER &&
          (best.winRate || 0) >= BTC_QUANT_MIN_WIN_RATE &&
          (best.sumDecidedPnlUsd || 0) > 0,
      ),
    });
    return evaled.pass ? null : "btc_quant_paper_edge_not_proven";
  } catch {
    return null;
  }
}

export async function getReadiness() {
  const product = PRODUCT();
  const [stats, { settlement1h, settlement24h }, paperBlocker] = await Promise.all([
    getStats(),
    fetchSolanaSettlementWindows(),
    paperEdgeBlockerIfNeeded(),
  ]);

  const sampleOk =
    (stats.recentDecided ?? 0) + (stats.recentErrors ?? 0) >= product.minSample;
  // Until we have a real sample, require net-positive AND min decided sample for "ready"
  // so empty lab does not auto-graduate.
  const hasTrackRecord = (stats.decided ?? 0) >= product.minSample;
  const errorRateForGuards = sampleOk ? stats.recentErrorRate : stats.errorRate;
  const errorKill = sampleOk && errorRateForGuards >= product.killErrorRate;
  const netPositive = hasTrackRecord && stats.netPnlUsd > 0;

  const extraBlockers = [];
  if (!hasTrackRecord) {
    extraBlockers.push(
      `insufficient_real_sample_${stats.decided ?? 0}_need_${product.minSample}`,
    );
  }
  if (paperBlocker) extraBlockers.push(paperBlocker);

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
    return { productId: EARN_PRODUCT_CBBTC, paused: false, readiness };
  }
  const result = await BtcQuantRealConfig.updateMany(
    { lane: LANE, publicEarnListed: true, depositsPaused: { $ne: true } },
    { $set: { depositsPaused: true, lastError: `auto_pause:${readiness.blockers.join(",")}` } },
  );
  console.warn(
    `[earn-yield:${EARN_PRODUCT_CBBTC}] kill switch: paused deposits on ${result.modifiedCount} configs —`,
    readiness.blockers.join(", "),
  );
  return {
    productId: EARN_PRODUCT_CBBTC,
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

  const state = await enableBtcQuantReal({
    anonymousId,
    enabledBy: enabledBy || ownerWallet || anonymousId,
    maxNotionalUsd: cap,
    lane: LANE,
  });

  await BtcQuantRealConfig.updateOne(
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

  const freshState = await getBtcQuantRealState({
    viewerAnonymousId: anonymousId,
    lane: LANE,
  });

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
      wins: freshState?.realWins ?? 0,
      losses: freshState?.realLosses ?? 0,
      openCount: freshState?.openPositions ?? 0,
    },
    nextStep: `Deposit ${product.minDeposit}–${cap} USDC to your invest agent wallet (/wallet?wallet=invest). The agent mirrors paper BUY signals into cbBTC via Jupiter.`,
  };
}

export async function disableForUser({ anonymousId, closeAll = false }) {
  const wallet = await resolveInvestWallet(anonymousId);
  if (!wallet?.agentAddress) {
    return { productId: EARN_PRODUCT_CBBTC, disabled: false, reason: "no_wallet" };
  }
  await BtcQuantRealConfig.updateOne(
    { _id: "singleton" },
    { $set: { publicEarnListed: false, depositsPaused: true } },
  );
  const state = await disableBtcQuantReal({ anonymousId, lane: LANE });
  // closeAll is honored via disableBtcQuantReal's closeAllRequested flag
  return {
    productId: EARN_PRODUCT_CBBTC,
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
    config = await BtcQuantRealConfig.findById("singleton").lean();
    // Only treat as "this user's" if agentAddress matches
    if (config?.agentAddress && config.agentAddress !== wallet.agentAddress) {
      // Platform lab config may be on a different wallet — user not enabled yet
      config = null;
    }
    state = await getBtcQuantRealState({ viewerAnonymousId: anonymousId, lane: LANE });
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
          wins: state.realWins,
          losses: state.realLosses,
          openCount: state.openPositions,
        }
      : null,
    canEnable: Boolean(allowed && wallet?.agentAddress),
    state,
  };
}

export const btcQuantEarnAdapter = {
  productId: EARN_PRODUCT_CBBTC,
  getStats,
  getReadiness,
  getUserStatus,
  enableForUser,
  disableForUser,
  enforceKill,
};

export default btcQuantEarnAdapter;
