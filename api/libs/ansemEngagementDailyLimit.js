import AnsemEngagementDailyQuota from '../models/agent/AnsemEngagementDailyQuota.js';

const DEFAULT_DAILY_LIMIT = 1;

function getDailyLimit() {
  const raw = process.env.ANSEM_ENGAGEMENT_DAILY_LIMIT;
  if (raw === undefined || raw === '') return DEFAULT_DAILY_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_DAILY_LIMIT;
  return Math.floor(n);
}

function dayKey(anonymousId) {
  const ownerId = String(anonymousId || '').trim();
  const dayUtc = new Date().toISOString().slice(0, 10);
  return { ownerId, dayUtc, _id: `${ownerId}:${dayUtc}` };
}

/**
 * @param {string} anonymousId
 */
export async function getAnsemEngagementDailyQuota(anonymousId) {
  const limit = getDailyLimit();
  if (limit === 0) {
    return { limit: 0, used: 0, remaining: Number.POSITIVE_INFINITY };
  }
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
    return { limit, used: 0, remaining: limit };
  }

  const { ownerId, dayUtc, _id } = dayKey(anonymousId);
  try {
    const doc = await AnsemEngagementDailyQuota.findById(_id).lean().exec();
    const used = Math.max(0, Number(doc?.count) || 0);
    return {
      limit,
      used,
      remaining: Math.max(0, limit - used),
      anonymousId: ownerId,
      dayUtc,
    };
  } catch (e) {
    console.error('[ansemEngagementDailyLimit] getQuota failed:', e?.message || e);
    return { limit, used: 0, remaining: limit };
  }
}

/**
 * @param {string} anonymousId
 */
export async function tryConsumeAnsemEngagementDaily(anonymousId) {
  const limit = getDailyLimit();
  if (limit === 0) {
    return { allowed: true, limit: 0, used: 0, remaining: Number.POSITIVE_INFINITY };
  }
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
    return { allowed: false, limit, used: 0, remaining: 0 };
  }

  const { ownerId, dayUtc, _id } = dayKey(anonymousId);

  try {
    const doc = await AnsemEngagementDailyQuota.findOneAndUpdate(
      { _id },
      [
        { $set: { _pre: { $ifNull: ['$count', 0] } } },
        {
          $set: {
            count: {
              $cond: {
                if: { $lt: ['$_pre', limit] },
                then: { $add: ['$_pre', 1] },
                else: '$_pre',
              },
            },
            lastAskAllowed: { $lt: ['$_pre', limit] },
            anonymousId: ownerId,
            dayUtc,
          },
        },
        { $unset: '_pre' },
      ],
      { upsert: true, new: true },
    )
      .lean()
      .exec();

    const used = Math.max(0, Number(doc?.count) || 0);
    const allowed = !!doc?.lastAskAllowed;
    return {
      allowed,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  } catch (e) {
    console.error('[ansemEngagementDailyLimit] tryConsume failed:', e?.message || e);
    return { allowed: true, limit, used: 0, remaining: limit };
  }
}

/**
 * @param {string} anonymousId
 */
export async function refundAnsemEngagementDaily(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) return;
  const { _id } = dayKey(anonymousId);
  try {
    await AnsemEngagementDailyQuota.findOneAndUpdate(
      { _id, count: { $gt: 0 } },
      { $inc: { count: -1 } },
    ).exec();
  } catch (e) {
    console.error('[ansemEngagementDailyLimit] refund failed:', e?.message || e);
  }
}

export function buildAnsemEngagementDailyLimitMessage(limit = DEFAULT_DAILY_LIMIT) {
  return `You've used your ${limit} $ANSEM engagement check for today. Come back after midnight UTC.`;
}
