import TelegramFreeToolQuota from '../../models/agent/TelegramFreeToolQuota.js';
import { getTelegramFreeToolDailyLimit } from '../../config/syraTelegramBotConfig.js';

/**
 * Try to consume one free paid-tool slot for this Telegram user (UTC day).
 * @param {string} anonymousId
 * @returns {Promise<{ allowed: boolean; remaining: number; limit: number }>}
 */
export async function tryConsumeTelegramFreeTool(anonymousId) {
  const limit = getTelegramFreeToolDailyLimit();
  if (limit <= 0) return { allowed: false, remaining: 0, limit };
  if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
    return { allowed: false, remaining: 0, limit };
  }

  const ownerId = anonymousId.trim();
  const dayUtc = new Date().toISOString().slice(0, 10);
  const _id = `${ownerId}:${dayUtc}`;

  try {
    const doc = await TelegramFreeToolQuota.findOneAndUpdate(
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
            lastConsumeAllowed: { $lt: ['$_pre', limit] },
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

    const allowed = !!doc?.lastConsumeAllowed;
    const count = Number(doc?.count) || 0;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      limit,
    };
  } catch (e) {
    console.error('[telegramFreeToolQuota] tryConsume failed:', e?.message || e);
    return { allowed: false, remaining: 0, limit };
  }
}

/**
 * Peek remaining free slots without consuming.
 * @param {string} anonymousId
 * @returns {Promise<{ remaining: number; limit: number; used: number }>}
 */
export async function getTelegramFreeToolRemaining(anonymousId) {
  const limit = getTelegramFreeToolDailyLimit();
  if (limit <= 0 || !anonymousId) return { remaining: 0, limit, used: 0 };
  const dayUtc = new Date().toISOString().slice(0, 10);
  const _id = `${String(anonymousId).trim()}:${dayUtc}`;
  try {
    const doc = await TelegramFreeToolQuota.findById(_id).lean();
    const used = Number(doc?.count) || 0;
    return { remaining: Math.max(0, limit - used), limit, used };
  } catch {
    return { remaining: limit, limit, used: 0 };
  }
}

/**
 * Whether this tool can be subsidized (treasury / skip charge) for free quota.
 * @param {{ agentDirect?: boolean; path?: string; nansenPath?: string; zerionPath?: string; birdeyePath?: string; blocksizePath?: string; dexterPath?: string; topledgerPath?: string; stablecryptoPath?: string; stablesocialPath?: string; stableenrichPath?: string; purchVaultPath?: string }} tool
 */
export function canSubsidyTelegramTool(tool) {
  if (!tool) return false;
  if (tool.agentDirect) return true;
  const external =
    tool.nansenPath ||
    tool.zerionPath ||
    tool.birdeyePath ||
    tool.blocksizePath ||
    tool.dexterPath ||
    tool.dexterCatalog ||
    tool.topledgerPath ||
    tool.stablecryptoPath ||
    tool.stablesocialPath ||
    tool.stableenrichPath ||
    tool.purchVaultPath;
  return !external && Boolean(tool.path);
}
