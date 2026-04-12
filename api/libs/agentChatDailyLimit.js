import AgentChatDailyQuota from '../models/agent/AgentChatDailyQuota.js';

function getDailyLimit() {
  const raw = process.env.AGENT_CHAT_DAILY_QUESTION_LIMIT;
  if (raw === undefined || raw === '') return 25;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 25;
  return Math.floor(n);
}

/** User-facing reply when the daily cap is reached (shown as the assistant message only). */
export function buildAgentChatDailyLimitMessage() {
  return [
    "You've reached your daily limit for questions on Syra for now.",
    'This helps us keep the service fast and fair for everyone.',
    'Please come back **tomorrow** (after midnight UTC) to continue chatting.',
    'If you need higher limits for your team or project, reach out through Syra support channels.',
  ].join('\n\n');
}

/**
 * Try to consume one question slot for this user for the current UTC day.
 * @param {string} anonymousId
 * @returns {Promise<{ allowed: boolean }>}
 */
export async function tryConsumeAgentChatDailyQuestion(anonymousId) {
  const limit = getDailyLimit();
  if (limit === 0) return { allowed: true };
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
    return { allowed: true };
  }
  const ownerId = anonymousId.trim();
  const dayUtc = new Date().toISOString().slice(0, 10);
  const _id = `${ownerId}:${dayUtc}`;

  try {
    const doc = await AgentChatDailyQuota.findOneAndUpdate(
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

    return { allowed: !!doc?.lastAskAllowed };
  } catch (e) {
    console.error('[agentChatDailyLimit] tryConsume failed:', e?.message || e);
    return { allowed: true };
  }
}
