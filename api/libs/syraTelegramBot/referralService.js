/**
 * Telegram referral — custom slug, share link, referred users bill referrer wallet for x402.
 */
import TelegramBotUser, { telegramAnonymousIdFrom } from '../../models/agent/TelegramBotUser.js';
import { getSyraTelegramBotMeta } from './syraTelegramBotMeta.js';
import { getSyraTelegramBotUsername } from '../../config/syraTelegramBotConfig.js';

const CODE_MIN = 3;
const CODE_MAX = 24;
const CODE_RE = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/;

const RESERVED_CODES = new Set([
  'start',
  'help',
  'wallet',
  'portfolio',
  'portofolio',
  'referral',
  'ref',
  'admin',
  'syra',
  'menu',
  'home',
  'cancel',
  'withdraw',
  'deposit',
]);

/**
 * @param {string} raw
 * @returns {{ ok: true; code: string } | { ok: false; error: string }}
 */
export function normalizeReferralCode(raw) {
  const code = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  if (!code) return { ok: false, error: 'Referral name cannot be empty.' };
  if (code.length < CODE_MIN) {
    return { ok: false, error: `Referral name must be at least ${CODE_MIN} characters.` };
  }
  if (code.length > CODE_MAX) {
    return { ok: false, error: `Referral name must be ${CODE_MAX} characters or fewer.` };
  }
  if (!CODE_RE.test(code)) {
    return {
      ok: false,
      error: 'Use letters, numbers, hyphens, or underscores (no spaces).',
    };
  }
  if (RESERVED_CODES.has(code)) {
    return { ok: false, error: 'That name is reserved. Pick another.' };
  }
  return { ok: true, code };
}

/**
 * @param {string | null | undefined} referralCode
 * @returns {Promise<string | null>}
 */
export async function buildReferralShareUrl(referralCode) {
  const code = String(referralCode || '').trim().toLowerCase();
  if (!code) return null;
  const meta = await getSyraTelegramBotMeta();
  const username = meta?.username || getSyraTelegramBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
}

/**
 * Wallet that pays for x402 when this Telegram user uses paid tools.
 * @param {{ anonymousId?: string; referredByAnonymousId?: string | null }} tgUser
 * @returns {string}
 */
export function resolvePayerAnonymousId(tgUser) {
  const referred = String(tgUser?.referredByAnonymousId || '').trim();
  if (referred) return referred;
  return String(tgUser?.anonymousId || '').trim();
}

/**
 * @param {string} referralCode
 * @returns {Promise<object | null>}
 */
export async function findReferrerByCode(referralCode) {
  const code = String(referralCode || '').trim().toLowerCase();
  if (!code) return null;
  return TelegramBotUser.findOne({ referralCode: code }).lean();
}

/**
 * @param {number} telegramUserId
 * @param {string} rawCode
 * @returns {Promise<{ ok: true; code: string; shareUrl: string } | { ok: false; error: string }>}
 */
export async function setUserReferralCode(telegramUserId, rawCode) {
  const normalized = normalizeReferralCode(rawCode);
  if (!normalized.ok) return normalized;

  const tid = Math.trunc(Number(telegramUserId));
  const self = await TelegramBotUser.findOne({ telegramUserId: tid }).lean();
  if (!self) return { ok: false, error: 'User not found. Send /start first.' };

  const taken = await TelegramBotUser.findOne({
    referralCode: normalized.code,
    telegramUserId: { $ne: tid },
  }).lean();
  if (taken) return { ok: false, error: 'That referral name is already taken.' };

  await TelegramBotUser.updateOne(
    { telegramUserId: tid },
    { $set: { referralCode: normalized.code } },
  );

  const shareUrl = await buildReferralShareUrl(normalized.code);
  if (!shareUrl) return { ok: false, error: 'Could not build share link. Try again later.' };

  return { ok: true, code: normalized.code, shareUrl };
}

/**
 * @param {number} telegramUserId
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
export async function clearUserReferralCode(telegramUserId) {
  const tid = Math.trunc(Number(telegramUserId));
  const self = await TelegramBotUser.findOne({ telegramUserId: tid }).lean();
  if (!self?.referralCode) {
    return { ok: false, error: 'You do not have a referral name set.' };
  }
  await TelegramBotUser.updateOne({ telegramUserId: tid }, { $set: { referralCode: null } });
  return { ok: true };
}

/**
 * Link a new/existing user to a referrer via /start payload. First referrer wins (immutable).
 * @param {number} telegramUserId
 * @param {string} payload
 * @returns {Promise<{ linked: boolean; referrerCode?: string; reason?: string }>}
 */
export async function linkReferredUser(telegramUserId, payload) {
  const codeRaw = String(payload || '').trim();
  if (!codeRaw) return { linked: false, reason: 'empty_payload' };

  const normalized = normalizeReferralCode(codeRaw);
  if (!normalized.ok) return { linked: false, reason: 'invalid_code' };

  const tid = Math.trunc(Number(telegramUserId));
  const user = await TelegramBotUser.findOne({ telegramUserId: tid }).lean();
  if (!user) return { linked: false, reason: 'user_missing' };
  if (user.referredByAnonymousId) return { linked: false, reason: 'already_linked' };

  const referrer = await findReferrerByCode(normalized.code);
  if (!referrer) return { linked: false, reason: 'referrer_not_found' };
  if (referrer.telegramUserId === tid) return { linked: false, reason: 'self_referral' };

  const now = new Date();
  const updated = await TelegramBotUser.findOneAndUpdate(
    { telegramUserId: tid, referredByAnonymousId: null },
    {
      $set: {
        referredByAnonymousId: referrer.anonymousId,
        referredAt: now,
      },
    },
    { new: true },
  ).lean();

  if (!updated?.referredByAnonymousId) {
    return { linked: false, reason: 'already_linked' };
  }

  await TelegramBotUser.updateOne(
    { telegramUserId: referrer.telegramUserId },
    { $inc: { referralCount: 1 } },
  );

  return { linked: true, referrerCode: normalized.code };
}

/**
 * @param {string} text
 * @returns {string | null}
 */
export function parseStartReferralPayload(text) {
  const parts = String(text || '').trim().split(/\s+/);
  if (!parts[0]?.toLowerCase().startsWith('/start')) return null;
  let payload = parts.slice(1).join(' ').trim();
  if (!payload) return null;
  if (payload.includes('@')) {
    payload = payload.split('@')[0].trim();
  }
  return payload || null;
}

/**
 * @param {object} tgUser
 * @returns {Promise<{ referralCode: string | null; shareUrl: string | null; referralCount: number; referredByCode: string | null; payerAnonymousId: string }>}
 */
export async function getReferralDashboard(tgUser) {
  const referralCode = tgUser?.referralCode ? String(tgUser.referralCode) : null;
  const shareUrl = referralCode ? await buildReferralShareUrl(referralCode) : null;
  let referredByCode = null;
  if (tgUser?.referredByAnonymousId) {
    const ref = await TelegramBotUser.findOne({
      anonymousId: String(tgUser.referredByAnonymousId),
    })
      .select('referralCode firstName username')
      .lean();
    referredByCode = ref?.referralCode || ref?.firstName || ref?.username || null;
  }
  return {
    referralCode,
    shareUrl,
    referralCount: Number(tgUser?.referralCount) || 0,
    referredByCode,
    payerAnonymousId: resolvePayerAnonymousId(tgUser),
  };
}

/**
 * @param {number} telegramUserId
 * @returns {Promise<object | null>}
 */
export async function refreshTelegramUser(telegramUserId) {
  return TelegramBotUser.findOne({ telegramUserId: Math.trunc(Number(telegramUserId)) }).lean();
}
