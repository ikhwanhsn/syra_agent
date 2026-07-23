/**
 * Syra Telegram AI bot — env configuration.
 * All flags read at call time (after dotenv.config in index.js).
 */

/**
 * @returns {string}
 */
export function getSyraTelegramBotToken() {
  return (process.env.SYRA_TELEGRAM_BOT_TOKEN || '').trim();
}

/**
 * @returns {string}
 */
export function getSyraTelegramBotUsername() {
  return (process.env.SYRA_TELEGRAM_BOT_USERNAME || '').trim();
}

/**
 * @returns {string}
 */
export function getSyraTelegramWebhookSecret() {
  return (process.env.SYRA_TELEGRAM_WEBHOOK_SECRET || '').trim();
}

/**
 * @returns {string}
 */
export function getSyraTelegramWebhookUrl() {
  return (process.env.SYRA_TELEGRAM_WEBHOOK_URL || '').trim();
}

/**
 * @returns {boolean}
 */
export function isSyraTelegramPollingEnabled() {
  const raw = process.env.SYRA_TELEGRAM_POLLING_ENABLED;
  if (typeof raw !== 'string' || !raw.trim()) {
    // Default: poll locally when no webhook URL is configured.
    return !getSyraTelegramWebhookUrl();
  }
  return raw.trim().toLowerCase() === 'true';
}

/**
 * @returns {boolean}
 */
export function isSyraTelegramBotEnabled() {
  const raw = process.env.SYRA_TELEGRAM_BOT_ENABLED;
  if (typeof raw !== 'string' || !raw.trim()) return true;
  return raw.trim().toLowerCase() !== 'false';
}

/**
 * @returns {boolean}
 */
export function isSyraTelegramBotConfigured() {
  return Boolean(getSyraTelegramBotToken());
}

/**
 * Free subsidized paid-tool calls per Telegram user per UTC day (D0 activation).
 * @returns {number}
 */
export function getTelegramFreeToolDailyLimit() {
  const raw = process.env.TELEGRAM_FREE_TOOL_DAILY_LIMIT;
  if (raw === undefined || raw === '') return 3;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 3;
  return Math.floor(n);
}

/**
 * Max USDC a referrer can spend sponsoring referred users' tools per UTC day.
 * 0 = unlimited.
 * @returns {number}
 */
export function getTelegramReferralDailySpendCapUsd() {
  const raw = process.env.TELEGRAM_REFERRAL_DAILY_SPEND_CAP_USD;
  if (raw === undefined || raw === '') return 5;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 5;
  return n;
}

/**
 * Minimum USDC balance required on referrer wallet before sponsoring (soft floor).
 * @returns {number}
 */
export function getTelegramReferralMinBalanceUsd() {
  const raw = process.env.TELEGRAM_REFERRAL_MIN_BALANCE_USD;
  if (raw === undefined || raw === '') return 0.05;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0.05;
  return n;
}

/**
 * Syra Daily digest hour in Asia/Jakarta (WIB).
 * @returns {number}
 */
export function getTelegramDigestWibHour() {
  const raw = process.env.TELEGRAM_DIGEST_WIB_HOUR;
  if (raw === undefined || raw === '') return 8;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 23) return 8;
  return Math.floor(n);
}

/**
 * Syra Daily digest minute in Asia/Jakarta (WIB).
 * @returns {number}
 */
export function getTelegramDigestWibMinute() {
  const raw = process.env.TELEGRAM_DIGEST_WIB_MINUTE;
  if (raw === undefined || raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 59) return 0;
  return Math.floor(n);
}

/**
 * @returns {boolean}
 */
export function isTelegramDigestEnabled() {
  const raw = process.env.TELEGRAM_DIGEST_ENABLED;
  if (typeof raw !== 'string' || !raw.trim()) return true;
  return raw.trim().toLowerCase() !== 'false';
}

/**
 * Canonical public bot username for CTAs (without @).
 * Falls back to SYRA_TELEGRAM_BOT_USERNAME env.
 * @returns {string}
 */
export function getSyraTelegramPublicBotUsername() {
  const fromEnv = (process.env.SYRA_TELEGRAM_PUBLIC_BOT_USERNAME || '').trim().replace(/^@/, '');
  if (fromEnv) return fromEnv;
  const configured = getSyraTelegramBotUsername().replace(/^@/, '');
  if (configured) return configured;
  return 'syra_trading_bot';
}

/**
 * @returns {string}
 */
export function getSyraTelegramPublicBotUrl() {
  return `https://t.me/${getSyraTelegramPublicBotUsername()}`;
}

/** @deprecated use getSyraTelegramBotToken() */
export const SYRA_TELEGRAM_BOT_TOKEN = '';
/** @deprecated use getters */
export const SYRA_TELEGRAM_BOT_USERNAME = '';
/** @deprecated use getters */
export const SYRA_TELEGRAM_WEBHOOK_SECRET = '';
/** @deprecated use getters */
export const SYRA_TELEGRAM_WEBHOOK_URL = '';
/** @deprecated use isSyraTelegramPollingEnabled() */
export const SYRA_TELEGRAM_POLLING_ENABLED = false;
/** @deprecated use isSyraTelegramBotEnabled() */
export const SYRA_TELEGRAM_BOT_ENABLED = true;
