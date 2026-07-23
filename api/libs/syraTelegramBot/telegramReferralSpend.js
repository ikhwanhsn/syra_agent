import TelegramReferralDailySpend from '../../models/agent/TelegramReferralDailySpend.js';
import { getTelegramReferralDailySpendCapUsd } from '../../config/syraTelegramBotConfig.js';

/**
 * @param {string} anonymousId
 * @returns {Promise<{ spentUsd: number; callCount: number; capUsd: number; remainingUsd: number; allowed: boolean }>}
 */
export async function getReferralDailySpend(anonymousId) {
  const capUsd = getTelegramReferralDailySpendCapUsd();
  const id = String(anonymousId || '').trim();
  if (!id) {
    return { spentUsd: 0, callCount: 0, capUsd, remainingUsd: capUsd, allowed: false };
  }
  const dayUtc = new Date().toISOString().slice(0, 10);
  const _id = `${id}:${dayUtc}`;
  try {
    const doc = await TelegramReferralDailySpend.findById(_id).lean();
    const spentUsd = Number(doc?.spentUsd) || 0;
    const callCount = Number(doc?.callCount) || 0;
    const remainingUsd = Math.max(0, capUsd - spentUsd);
    return {
      spentUsd,
      callCount,
      capUsd,
      remainingUsd,
      allowed: capUsd <= 0 ? true : spentUsd < capUsd,
    };
  } catch {
    return { spentUsd: 0, callCount: 0, capUsd, remainingUsd: capUsd, allowed: true };
  }
}

/**
 * Check whether a referrer can sponsor another tool call of `priceUsd`.
 * @param {string} referrerAnonymousId
 * @param {number} priceUsd
 */
export async function canReferrerSponsor(referrerAnonymousId, priceUsd) {
  const spend = await getReferralDailySpend(referrerAnonymousId);
  if (spend.capUsd <= 0) return { ...spend, allowed: true };
  const price = Number(priceUsd) || 0;
  if (price <= 0) return { ...spend, allowed: true };
  if (spend.spentUsd + price > spend.capUsd + 1e-9) {
    return { ...spend, allowed: false };
  }
  return { ...spend, allowed: true };
}

/**
 * Record USDC spent by a referrer sponsoring a referred user's tool.
 * @param {string} referrerAnonymousId
 * @param {number} priceUsd
 */
export async function recordReferralSponsoredSpend(referrerAnonymousId, priceUsd) {
  const id = String(referrerAnonymousId || '').trim();
  const amount = Number(priceUsd);
  if (!id || !Number.isFinite(amount) || amount <= 0) return;

  const dayUtc = new Date().toISOString().slice(0, 10);
  const _id = `${id}:${dayUtc}`;
  try {
    await TelegramReferralDailySpend.findOneAndUpdate(
      { _id },
      {
        $inc: { spentUsd: amount, callCount: 1 },
        $setOnInsert: { anonymousId: id, dayUtc },
      },
      { upsert: true },
    );
  } catch (e) {
    console.warn(
      '[telegramReferralSpend] record failed:',
      e instanceof Error ? e.message : String(e),
    );
  }
}
