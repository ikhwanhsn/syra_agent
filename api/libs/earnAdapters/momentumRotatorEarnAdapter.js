/**
 * Earn Yield adapter — Momentum Rotator real (USDC majors via Jupiter).
 */
import MomentumRotatorRealConfig from '../../models/MomentumRotatorRealConfig.js';
import MomentumRotatorRealPosition from '../../models/MomentumRotatorRealPosition.js';
import AgentWallet from '../../models/agent/AgentWallet.js';
import { buildSettlementHealth } from '../settlementHealthService.js';
import {
  enableMomentumReal,
  disableMomentumReal,
  getMomentumRealState,
  checkMomentumPaperGraduation,
} from '../momentumRotatorRealService.js';
import { getMomentumStats } from '../momentumRotatorService.js';
import { isAdminWalletAddress } from '../adminWallet.js';
import { siblingAnonymousId, purposeQuery } from '../agentWalletPurpose.js';
import {
  getEarnProduct,
  EARN_PRODUCT_MOMENTUM,
  isEarnYieldBetaAllowed,
  isEarnYieldBetaOpen,
  resolvePublicProductStatus,
} from '../../config/earnProducts.js';
import {
  assertBetaAllowed,
  assertDepositsOpen,
  buildReadinessFromGuards,
  clampDepositCap,
  fetchSolanaSettlementWindows,
  round,
  roundPct,
  settlementSlice,
} from './earnAdapterShared.js';

const PRODUCT = () => getEarnProduct(EARN_PRODUCT_MOMENTUM);
const PAPER_GRAD_MIN = 50;

async function resolveInvestWallet(anonymousId) {
  const investAid = siblingAnonymousId(anonymousId, 'invest');
  if (!investAid) return null;
  return AgentWallet.findOne({
    anonymousId: investAid,
    chain: 'solana',
    status: 'active',
    ...purposeQuery('invest'),
  })
    .select('anonymousId agentAddress chain status purpose')
    .lean();
}

export async function getStats() {
  const product = PRODUCT();
  const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [agg, recentAgg, openCount, settlement] = await Promise.all([
    MomentumRotatorRealPosition.aggregate([
      {
        $group: {
          _id: null,
          wins: { $sum: { $cond: [{ $eq: ['$status', 'closed_win'] }, 1, 0] } },
          losses: {
            $sum: { $cond: [{ $in: ['$status', ['closed_loss', 'expired']] }, 1, 0] },
          },
          errors: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
          realizedNetPnlUsd: {
            $sum: {
              $cond: [
                { $in: ['$status', ['closed_win', 'closed_loss', 'expired']] },
                { $ifNull: ['$realNetPnlUsd', 0] },
                0,
              ],
            },
          },
          firstAt: { $min: '$openedAt' },
          lastAt: { $max: '$resolvedAt' },
        },
      },
    ]),
    MomentumRotatorRealPosition.aggregate([
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
          wins: { $sum: { $cond: [{ $eq: ['$status', 'closed_win'] }, 1, 0] } },
          losses: {
            $sum: { $cond: [{ $in: ['$status', ['closed_loss', 'expired']] }, 1, 0] },
          },
          errors: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        },
      },
    ]),
    MomentumRotatorRealPosition.countDocuments({
      status: { $in: ['open', 'opening', 'closing'] },
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
  const recentDecided = (Number(recent.wins) || 0) + (Number(recent.losses) || 0);
  const recentErrors = Number(recent.errors) || 0;
  const recentSettledOrErrored = recentDecided + recentErrors;
  const recentErrorRate =
    recentSettledOrErrored > 0 ? recentErrors / recentSettledOrErrored : 0;
  const realizedNetPnlUsd = Number(row.realizedNetPnlUsd) || 0;

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
    paperVsRealNote:
      'Win rate and PnL are from Syra lab real-money momentum positions. Past performance is not a guarantee.',
    settlement24h: settlementSlice(settlement),
    firstPositionAt: row.firstAt ? new Date(row.firstAt).toISOString() : null,
    lastResolvedAt: row.lastAt ? new Date(row.lastAt).toISOString() : null,
  };
}

async function paperGraduationBlockers() {
  const [paper, graduation] = await Promise.all([
    getMomentumStats(),
    checkMomentumPaperGraduation(),
  ]);
  const totals = (paper.agents || []).reduce(
    (acc, a) => ({
      decided: acc.decided + (Number(a.decided) || 0),
      sumPnlUsd: acc.sumPnlUsd + (Number(a.sumPnlUsd) || 0),
    }),
    { decided: 0, sumPnlUsd: 0 },
  );
  const blockers = [];
  if (totals.decided < PAPER_GRAD_MIN) {
    blockers.push(`paper_sample_${totals.decided}_need_${PAPER_GRAD_MIN}`);
  }
  if (totals.sumPnlUsd <= 0) {
    blockers.push('paper_expectancy_not_positive');
  }
  if (!graduation.pass) blockers.push(graduation.reason || 'paper_graduation_failed');
  return blockers;
}

export async function getReadiness() {
  const product = PRODUCT();
  const [stats, { settlement1h, settlement24h }, paperBlockers] = await Promise.all([
    getStats(),
    fetchSolanaSettlementWindows(),
    paperGraduationBlockers(),
  ]);

  const sampleOk =
    (stats.recentDecided ?? 0) + (stats.recentErrors ?? 0) >= product.minSample;
  const hasTrackRecord = (stats.decided ?? 0) >= product.minSample;
  const errorRateForGuards = sampleOk ? stats.recentErrorRate : stats.errorRate;
  const errorKill = sampleOk && errorRateForGuards >= product.killErrorRate;
  const netPositive = hasTrackRecord && stats.netPnlUsd > 0;

  const extraBlockers = [...paperBlockers];
  if (!hasTrackRecord) {
    extraBlockers.push(
      `insufficient_real_sample_${stats.decided ?? 0}_need_${product.minSample}`,
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

export async function getBoardCard() {
  const product = PRODUCT();
  const [stats, readiness] = await Promise.all([getStats(), getReadiness()]);
  return {
    productId: product.id,
    label: product.label,
    status: resolvePublicProductStatus(product, readiness),
    denom: product.denom,
    stats,
    readiness: {
      ready: Boolean(readiness.ready),
      blockers: readiness.blockers || [],
      depositsPaused: Boolean(readiness.depositsShouldPause),
    },
  };
}

export async function enforceKill() {
  const readiness = await getReadiness();
  if (!readiness.depositsShouldPause) {
    return { productId: EARN_PRODUCT_MOMENTUM, paused: false, readiness };
  }
  const result = await MomentumRotatorRealConfig.updateMany(
    { publicEarnListed: true, depositsPaused: { $ne: true } },
    { $set: { depositsPaused: true, lastError: `auto_pause:${readiness.blockers.join(',')}` } },
  );
  return {
    productId: EARN_PRODUCT_MOMENTUM,
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
    const err = new Error('invest_agent_wallet_required');
    err.code = 'invest_agent_wallet_required';
    throw err;
  }

  const cap = clampDepositCap(product, maxDeposit);
  const state = await enableMomentumReal({
    anonymousId,
    enabledBy: enabledBy || ownerWallet || anonymousId,
    maxPositionUsd: cap,
    requireGraduation: true,
  });

  await MomentumRotatorRealConfig.updateOne(
    { agentAddress: wallet.agentAddress },
    {
      $set: {
        publicEarnListed: Boolean(readiness.ready),
        depositsPaused: false,
        publicMaxDepositUsd: cap,
        maxPositionUsd: cap,
        performanceFeeBps: product.performanceFeeBps,
        lastError: null,
      },
    },
  );

  const freshState = await getMomentumRealState({ viewerAnonymousId: anonymousId });
  return {
    productId: product.id,
    denom: product.denom,
    agentAddress: wallet.agentAddress,
    maxDeposit: cap,
    maxDepositUsdc: cap,
    performanceFeeBps: product.performanceFeeBps,
    state: freshState || state,
    nextStep: `Deposit ${product.minDeposit}–${cap} USDC to your invest agent wallet (/wallet?wallet=invest).`,
  };
}

export async function disableForUser({ anonymousId, closeAll = false }) {
  const wallet = await resolveInvestWallet(anonymousId);
  if (!wallet?.agentAddress) {
    return { productId: EARN_PRODUCT_MOMENTUM, disabled: false, reason: 'no_wallet' };
  }
  await MomentumRotatorRealConfig.updateOne(
    { agentAddress: wallet.agentAddress },
    { $set: { publicEarnListed: false, depositsPaused: true } },
  );
  const state = await disableMomentumReal({ anonymousId, closeAll: Boolean(closeAll) });
  return { productId: EARN_PRODUCT_MOMENTUM, disabled: true, closeAll: Boolean(closeAll), state };
}

export async function getUserStatus({ anonymousId, ownerWallet }) {
  const product = PRODUCT();
  const isAdmin = isAdminWalletAddress(ownerWallet);
  const allowed = isEarnYieldBetaAllowed(ownerWallet, { isAdmin });
  const wallet = anonymousId ? await resolveInvestWallet(anonymousId) : null;
  let config = null;
  let state = null;
  if (wallet?.agentAddress) {
    config = await MomentumRotatorRealConfig.findById(wallet.agentAddress).lean();
    state = await getMomentumRealState({ viewerAnonymousId: anonymousId });
  }
  return {
    productId: product.id,
    denom: product.denom,
    allowed,
    betaOpen: isEarnYieldBetaOpen(),
    agentAddress: wallet?.agentAddress || null,
    enabled: Boolean(
      config?.enabled && config?.publicEarnListed && !config?.depositsPaused,
    ),
    config: config
      ? {
          enabled: config.enabled,
          publicEarnListed: config.publicEarnListed,
          depositsPaused: config.depositsPaused,
          publicMaxDeposit: config.publicMaxDepositUsd,
          publicMaxDepositUsd: config.publicMaxDepositUsd,
          performanceFeeBps: config.performanceFeeBps,
          lastError: config.lastError,
        }
      : null,
    canEnable: Boolean(allowed && wallet?.agentAddress),
    state,
  };
}

export const momentumRotatorEarnAdapter = {
  productId: EARN_PRODUCT_MOMENTUM,
  getStats,
  getReadiness,
  getBoardCard,
  getUserStatus,
  enableForUser,
  disableForUser,
  enforceKill,
};

export default momentumRotatorEarnAdapter;
