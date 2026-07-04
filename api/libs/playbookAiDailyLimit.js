import PlaybookAiDailyQuota from '../models/agent/PlaybookAiDailyQuota.js';

const DEFAULT_DAILY_LIMIT = 5;

function getDailyLimit() {
  const raw = process.env.PLAYBOOK_AI_DAILY_LIMIT;
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
 * @returns {Promise<{ limit: number; used: number; remaining: number }>}
 */
export async function getPlaybookAiDailyQuota(anonymousId) {
  const limit = getDailyLimit();
  if (limit === 0) {
    return { limit: 0, used: 0, remaining: Number.POSITIVE_INFINITY };
  }
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
    return { limit, used: 0, remaining: limit };
  }

  const { ownerId, dayUtc, _id } = dayKey(anonymousId);
  try {
    const doc = await PlaybookAiDailyQuota.findById(_id).lean().exec();
    const used = Math.max(0, Number(doc?.count) || 0);
    return {
      limit,
      used,
      remaining: Math.max(0, limit - used),
      anonymousId: ownerId,
      dayUtc,
    };
  } catch (e) {
    console.error('[playbookAiDailyLimit] getQuota failed:', e?.message || e);
    return { limit, used: 0, remaining: limit };
  }
}

/**
 * Try to consume one AI fill slot for this user for the current UTC day.
 * @param {string} anonymousId
 * @returns {Promise<{ allowed: boolean; limit: number; used: number; remaining: number }>}
 */
export async function tryConsumePlaybookAiDaily(anonymousId) {
  const limit = getDailyLimit();
  if (limit === 0) {
    return { allowed: true, limit: 0, used: 0, remaining: Number.POSITIVE_INFINITY };
  }
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
    return { allowed: false, limit, used: 0, remaining: 0 };
  }

  const { ownerId, dayUtc, _id } = dayKey(anonymousId);

  try {
    const doc = await PlaybookAiDailyQuota.findOneAndUpdate(
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
      { upsert: true, new: true }
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
    console.error('[playbookAiDailyLimit] tryConsume failed:', e?.message || e);
    return { allowed: true, limit, used: 0, remaining: limit };
  }
}

/**
 * Refund one slot after a failed generation (best-effort).
 * @param {string} anonymousId
 */
export async function refundPlaybookAiDaily(anonymousId) {
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) return;
  const { _id } = dayKey(anonymousId);
  try {
    await PlaybookAiDailyQuota.findOneAndUpdate(
      { _id, count: { $gt: 0 } },
      { $inc: { count: -1 } }
    ).exec();
  } catch (e) {
    console.error('[playbookAiDailyLimit] refund failed:', e?.message || e);
  }
}

export function buildPlaybookAiDailyLimitMessage(limit = DEFAULT_DAILY_LIMIT) {
  return `You've used all ${limit} AI playbook fills for today. Come back after midnight UTC.`;
}
