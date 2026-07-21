/**
 * Activation funnel cohorts from X402CallLog + PaidApiCall.
 * Stages: first payment_required → first paid → D7 repeat payer.
 */
import PaidApiCall from '../models/PaidApiCall.js';
import X402CallLog from '../models/X402CallLog.js';

const INBOUND = { direction: 'inbound' };
const MS_DAY = 24 * 60 * 60 * 1000;

function roundRate(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

/**
 * Build funnel snapshot for KPI + public metrics.
 * @returns {Promise<object>}
 */
export async function buildActivationFunnel() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_DAY);

  const [payerFirstEvents, paidBySource, paidCallsLast7d, uniquePayersLast7d] = await Promise.all([
    X402CallLog.aggregate([
      {
        $match: {
          ...INBOUND,
          payer: { $ne: null, $exists: true, $type: 'string' },
          outcome: { $in: ['payment_required', 'paid'] },
        },
      },
      {
        $group: {
          _id: '$payer',
          firstPaymentRequired: {
            $min: {
              $cond: [{ $eq: ['$outcome', 'payment_required'] }, '$createdAt', '$$REMOVE'],
            },
          },
          firstPaid: {
            $min: {
              $cond: [{ $eq: ['$outcome', 'paid'] }, '$createdAt', '$$REMOVE'],
            },
          },
          lastPaid: {
            $max: {
              $cond: [{ $eq: ['$outcome', 'paid'] }, '$createdAt', '$$REMOVE'],
            },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$outcome', 'paid'] }, 1, 0] },
          },
        },
      },
    ]),
    PaidApiCall.aggregate([
      { $group: { _id: { $ifNull: ['$source', 'api'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    PaidApiCall.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    X402CallLog.distinct('payer', {
      ...INBOUND,
      outcome: 'paid',
      payer: { $ne: null },
      createdAt: { $gte: sevenDaysAgo },
    }),
  ]);

  let sawPaymentRequired = 0;
  let convertedToPaid = 0;
  let eligibleForD7 = 0;
  let d7Repeat = 0;
  let firstPaidLast30d = 0;

  for (const row of payerFirstEvents) {
    const first402 = row.firstPaymentRequired ? new Date(row.firstPaymentRequired) : null;
    const firstPaid = row.firstPaid ? new Date(row.firstPaid) : null;
    const lastPaid = row.lastPaid ? new Date(row.lastPaid) : null;

    if (first402 && !Number.isNaN(first402.getTime())) {
      sawPaymentRequired += 1;
      if (firstPaid && !Number.isNaN(firstPaid.getTime())) {
        convertedToPaid += 1;
      }
    } else if (firstPaid && !Number.isNaN(firstPaid.getTime())) {
      // Paid without a logged payment_required (e.g. retry-only logs) — count as converted cohort base
      convertedToPaid += 1;
      sawPaymentRequired += 1;
    }

    if (firstPaid && !Number.isNaN(firstPaid.getTime())) {
      if (firstPaid >= thirtyDaysAgo) {
        firstPaidLast30d += 1;
      }
      const ageMs = now.getTime() - firstPaid.getTime();
      if (ageMs >= 7 * MS_DAY) {
        eligibleForD7 += 1;
        if (lastPaid && lastPaid.getTime() - firstPaid.getTime() >= 7 * MS_DAY) {
          d7Repeat += 1;
        }
      }
    }
  }

  const conversionRate =
    sawPaymentRequired > 0 ? roundRate(convertedToPaid / sawPaymentRequired) : 0;
  const d7RepeatRate = eligibleForD7 > 0 ? roundRate(d7Repeat / eligibleForD7) : 0;

  const bySource = Object.fromEntries(
    paidBySource.map((s) => [String(s._id || 'api'), s.count]),
  );
  const mcpPaidCalls = (bySource.mcp ?? 0) + (bySource['mcp-server'] ?? 0);

  return {
    northStar: {
      paidCallsLast7d,
      uniquePayingWalletsLast7d: uniquePayersLast7d.length,
    },
    funnel: {
      payersSawPaymentRequired: sawPaymentRequired,
      payersConvertedToPaid: convertedToPaid,
      paymentRequiredToPaidRate: conversionRate,
      firstPaidPayersLast30d: firstPaidLast30d,
      d7EligiblePayers: eligibleForD7,
      d7RepeatPayers: d7Repeat,
      d7RepeatRate,
    },
    bySource: {
      ...bySource,
      mcpPaidCalls,
    },
    updatedAt: now.toISOString(),
  };
}
