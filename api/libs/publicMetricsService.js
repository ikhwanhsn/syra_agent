/**
 * Public x402 traction metrics — on-chain verifiable aggregates for /api/metrics.
 * Sources: X402CallLog (USD volume, payers), PaidApiCall (call counts).
 */
import PaidApiCall from '../models/PaidApiCall.js';
import X402CallLog from '../models/X402CallLog.js';
import { getPayaiPayToAddresses } from '../config/payaiX402Networks.js';
import { SYRA_LIVE_SUBLINE, SYRA_TAGLINE } from '../config/syraBranding.js';
import { buildActivationFunnel } from './activationFunnelService.js';
import { buildSettlementHealthSnapshot } from './settlementHealthService.js';
import { buildPublicBuybackSnapshot } from './publicBuybackMetrics.js';
import { buildPublicHolderFunnelSnapshot } from './holderFunnelService.js';
import { buildPublicRewardsSnapshot } from './syraUsageRewards.js';

const PAID_MATCH = { outcome: 'paid', direction: 'inbound' };

function roundUsd(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Resolve treasury addresses exposed on the public metrics page.
 * @returns {{ solana: string | null; base: string | null }}
 */
export function getPublicTreasuryAddresses() {
  const { solanaPayTo, evmPayTo } = getPayaiPayToAddresses();
  return {
    solana: solanaPayTo || process.env.SOLANA_PAYTO?.trim() || process.env.ADDRESS_PAYAI?.trim() || null,
    base: evmPayTo || process.env.BASE_PAYTO?.trim() || process.env.EVM_PAYTO?.trim() || null,
  };
}

/**
 * Build public metrics snapshot for leaderboards and /metrics page.
 */
export async function buildPublicMetricsSnapshot() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalPaidCalls,
    paidCallsLast24h,
    paidCallsLast7d,
    paidCallsLast30d,
    byPathAgg,
    dailyCallsAgg,
    x402PaidCalls,
    x402PaidLast24h,
    totalUsdAgg,
    usdLast24hAgg,
    usdLast7dAgg,
    uniquePayers,
    byNetworkAgg,
    recentPaid,
    activation,
    settlement,
    buyback,
    holders,
    rewards,
  ] = await Promise.all([
    PaidApiCall.countDocuments(),
    PaidApiCall.countDocuments({ createdAt: { $gte: oneDayAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    PaidApiCall.aggregate([
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    PaidApiCall.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    X402CallLog.countDocuments(PAID_MATCH),
    X402CallLog.countDocuments({ ...PAID_MATCH, createdAt: { $gte: oneDayAgo } }),
    X402CallLog.aggregate([{ $match: PAID_MATCH }, { $group: { _id: null, total: { $sum: '$amountUsd' } } }]),
    X402CallLog.aggregate([
      { $match: { ...PAID_MATCH, createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: null, total: { $sum: '$amountUsd' } } },
    ]),
    X402CallLog.aggregate([
      { $match: { ...PAID_MATCH, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amountUsd' } } },
    ]),
    X402CallLog.distinct('payer', { payer: { $ne: null }, ...PAID_MATCH }),
    X402CallLog.aggregate([
      { $match: { ...PAID_MATCH, network: { $ne: null } } },
      {
        $group: {
          _id: '$network',
          calls: { $sum: 1 },
          usd: { $sum: '$amountUsd' },
        },
      },
      { $sort: { calls: -1 } },
    ]),
    X402CallLog.find(PAID_MATCH, {
      path: 1,
      network: 1,
      amountUsd: 1,
      payer: 1,
      createdAt: 1,
      txSignature: 1,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    buildActivationFunnel().catch(() => null),
    buildSettlementHealthSnapshot().catch(() => null),
    buildPublicBuybackSnapshot().catch(() => null),
    buildPublicHolderFunnelSnapshot().catch(() => null),
    buildPublicRewardsSnapshot().catch(() => null),
  ]);

  const totalUsd = totalUsdAgg[0]?.total ?? 0;
  const usdLast24h = usdLast24hAgg[0]?.total ?? 0;
  const usdLast7d = usdLast7dAgg[0]?.total ?? 0;
  const treasury = getPublicTreasuryAddresses();
  // Prefer X402 paid outcomes for call counts so PaidApiCall duplicates cannot inflate traction.
  const callCount = x402PaidCalls > 0 ? x402PaidCalls : totalPaidCalls;
  const avgPerCall = callCount > 0 ? totalUsd / callCount : 0;

  return {
    success: true,
    service: 'Syra',
    tagline: `${SYRA_TAGLINE} — ${SYRA_LIVE_SUBLINE}`,
    updatedAt: now.toISOString(),
    /** All USD fields below are outcome=paid (settled) only — never quoted 402 amounts. */
    accountingNote:
      'totalUsdSettled / usdSettled are sum(amountUsd) where outcome=paid. Do not market sum(amountUsd) across payment_required.',
    lifetime: {
      totalCalls: callCount,
      totalUsdSettled: roundUsd(totalUsd),
      uniquePayingWallets: uniquePayers.length,
      avgUsdPerCall: roundUsd(avgPerCall),
    },
    last24h: {
      calls: Math.max(paidCallsLast24h, x402PaidLast24h),
      usdSettled: roundUsd(usdLast24h),
    },
    last7d: {
      calls: paidCallsLast7d,
      usdSettled: roundUsd(usdLast7d),
      uniquePayingWallets: activation?.northStar?.uniquePayingWalletsLast7d ?? null,
    },
    last30d: {
      calls: paidCallsLast30d,
    },
    northStar: activation?.northStar ?? {
      paidCallsLast7d,
      uniquePayingWalletsLast7d: null,
    },
    funnel: activation?.funnel ?? null,
    settlement: settlement ?? null,
    bySource: activation?.bySource ?? null,
    treasury,
    verifyOnChain: {
      hint: 'USDC transfers to treasury addresses below confirm settlements',
      explorers: {
        base: treasury.base ? `https://basescan.org/address/${treasury.base}` : null,
        solana: treasury.solana ? `https://solscan.io/account/${treasury.solana}` : null,
      },
    },
    byPath: byPathAgg.map((p) => ({ path: p._id, count: p.count })),
    byNetwork: byNetworkAgg.map((n) => ({
      network: n._id,
      calls: n.calls,
      usdSettled: roundUsd(n.usd),
    })),
    dailyCalls: dailyCallsAgg.map((d) => ({ date: d._id, count: d.count })),
    recentCalls: recentPaid.map(sanitizeLiveCall),
    buyback: buyback ?? null,
    holders: holders ?? null,
    rewards: rewards ?? null,
  };
}

/**
 * Sanitize a paid call for public SSE / live feed (no full payer addresses).
 * @param {Record<string, unknown>} row
 */
export function sanitizeLiveCall(row) {
  const payer = typeof row.payer === 'string' ? row.payer : '';
  const masked =
    payer.length > 12
      ? `${payer.slice(0, 4)}…${payer.slice(-4)}`
      : payer || null;
  return {
    path: row.path,
    network: row.network ?? null,
    amountUsd: roundUsd(row.amountUsd),
    payer: masked,
    txSignature: row.txSignature ?? null,
    at: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

/**
 * Fetch recent paid calls for SSE polling.
 * @param {Date} [since]
 */
export async function fetchRecentLiveCalls(since) {
  const match = { ...PAID_MATCH };
  if (since instanceof Date && !Number.isNaN(since.getTime())) {
    match.createdAt = { $gt: since };
  }
  const rows = await X402CallLog.find(match, {
    path: 1,
    network: 1,
    amountUsd: 1,
    payer: 1,
    createdAt: 1,
    txSignature: 1,
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return rows.map(sanitizeLiveCall);
}
