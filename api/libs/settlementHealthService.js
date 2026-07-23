/**
 * Settled-only x402 health: payment_required → paid vs settle_failed.
 * Never sum amountUsd across non-paid outcomes (quoted GMV is misleading).
 */
import X402CallLog from '../models/X402CallLog.js';

const INBOUND = { direction: 'inbound' };

function roundRate(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10000) / 10000;
}

function roundUsd(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Aggregate settlement outcomes over a time window.
 * @param {Date} since
 * @param {{ networkRegex?: RegExp|string|null }} [opts]
 *   When networkRegex is set, only count rows whose network matches (e.g. /^solana/i for Earn Yield).
 * @returns {Promise<object>}
 */
export async function buildSettlementHealth(since, opts = {}) {
  const sinceDate = since instanceof Date && !Number.isNaN(since.getTime())
    ? since
    : new Date(Date.now() - 60 * 60 * 1000);

  const networkFilter =
    opts.networkRegex instanceof RegExp
      ? { network: { $regex: opts.networkRegex.source, $options: opts.networkRegex.flags || '' } }
      : typeof opts.networkRegex === 'string' && opts.networkRegex
        ? { network: { $regex: opts.networkRegex, $options: 'i' } }
        : {};

  const baseMatch = { ...INBOUND, createdAt: { $gte: sinceDate }, ...networkFilter };

  const [byOutcome, settledUsdAgg, topFailReasons] = await Promise.all([
    X402CallLog.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$outcome', count: { $sum: 1 } } },
    ]),
    X402CallLog.aggregate([
      {
        $match: {
          ...baseMatch,
          outcome: 'paid',
        },
      },
      { $group: { _id: null, total: { $sum: '$amountUsd' } } },
    ]),
    X402CallLog.aggregate([
      {
        $match: {
          ...baseMatch,
          outcome: 'settle_failed',
        },
      },
      { $group: { _id: '$errorReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  /** @type {Record<string, number>} */
  const counts = {};
  for (const row of byOutcome) {
    counts[String(row._id || 'unknown')] = row.count;
  }

  const paid = counts.paid || 0;
  const settleFailed = counts.settle_failed || 0;
  const paymentRequired = counts.payment_required || 0;
  const attemptedSettle = paid + settleFailed;
  const settleFailRate =
    attemptedSettle > 0 ? roundRate(settleFailed / attemptedSettle) : 0;
  const settleSuccessRate =
    attemptedSettle > 0 ? roundRate(paid / attemptedSettle) : 1;

  return {
    windowStartedAt: sinceDate.toISOString(),
    updatedAt: new Date().toISOString(),
    outcomes: {
      payment_required: paymentRequired,
      paid,
      settle_failed: settleFailed,
      verify_failed: counts.verify_failed || 0,
      upstream_error: counts.upstream_error || 0,
      error: counts.error || 0,
    },
    /** Settled USDC only (outcome=paid). Do not confuse with quoted amountUsd on 402s. */
    settledUsd: roundUsd(settledUsdAgg[0]?.total ?? 0),
    settleAttempted: attemptedSettle,
    settleFailRate,
    /** paid / (paid + settle_failed). Target ≥ 0.95 for Earn launch. */
    settleSuccessRate,
    /** True when settle_failed share of attempts exceeds the 5% alert threshold. */
    aboveAlertThreshold: attemptedSettle >= 10 && settleFailRate > 0.05,
    /** True when success rate meets Earn launch guardrail (≥95% with enough sample). */
    meetsLaunchGuardrail: attemptedSettle >= 10 && settleSuccessRate >= 0.95,
    networkScope: Object.keys(networkFilter).length > 0 ? 'filtered' : 'all',
    topFailReasons: topFailReasons.map((r) => ({
      reason: r._id ? String(r._id).slice(0, 200) : '(none)',
      count: r.count,
    })),
  };
}

/**
 * Multi-window settlement snapshot for dashboards.
 * @returns {Promise<object>}
 */
export async function buildSettlementHealthSnapshot() {
  const now = Date.now();
  const [last1h, last24h, last7d] = await Promise.all([
    buildSettlementHealth(new Date(now - 60 * 60 * 1000)),
    buildSettlementHealth(new Date(now - 24 * 60 * 60 * 1000)),
    buildSettlementHealth(new Date(now - 7 * 24 * 60 * 60 * 1000)),
  ]);

  return {
    note: 'settledUsd and paid counts are outcome=paid only — never use sum(amountUsd) across all outcomes as GMV',
    last1h,
    last24h,
    last7d,
    alertThreshold: {
      settleFailRate: 0.05,
      minAttempts: 10,
      window: '1h',
    },
  };
}
