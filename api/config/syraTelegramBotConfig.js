/**
 * Syra Telegram AI bot — configuration.
 * Non-secret knobs are code constants; TOKEN / WEBHOOK_SECRET stay in env.
 */
import { optionalSecret } from './secrets.js';

const SYRA_TELEGRAM_BOT_USERNAME = '@syra_agent_bot';
const SYRA_TELEGRAM_WEBHOOK_URL = '';
const SYRA_TELEGRAM_POLLING_ENABLED = true;
const SYRA_TELEGRAM_BOT_ENABLED = true;

/**
 * @returns {string}
 */
export function getSyraTelegramBotToken() {
  return optionalSecret('SYRA_TELEGRAM_BOT_TOKEN');
}

/**
 * @returns {string}
 */
export function getSyraTelegramBotUsername() {
  return SYRA_TELEGRAM_BOT_USERNAME;
}

/**
 * @returns {string}
 */
export function getSyraTelegramWebhookSecret() {
  return optionalSecret('SYRA_TELEGRAM_WEBHOOK_SECRET');
}

/**
 * @returns {string}
 */
export function getSyraTelegramWebhookUrl() {
  return SYRA_TELEGRAM_WEBHOOK_URL;
}

/**
 * @returns {boolean}
 */
export function isSyraTelegramPollingEnabled() {
  return SYRA_TELEGRAM_POLLING_ENABLED;
}

/**
 * @returns {boolean}
 */
export function isSyraTelegramBotEnabled() {
  return SYRA_TELEGRAM_BOT_ENABLED;
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
  return 3;
}

/**
 * Max USDC a referrer can spend sponsoring referred users' tools per UTC day.
 * 0 = unlimited.
 * @returns {number}
 */
export function getTelegramReferralDailySpendCapUsd() {
  return 5;
}

/**
 * Minimum USDC balance required on referrer wallet before sponsoring (soft floor).
 * @returns {number}
 */
export function getTelegramReferralMinBalanceUsd() {
  return 0.05;
}

/**
 * Syra Daily digest hour in Asia/Jakarta (WIB).
 * @returns {number}
 */
export function getTelegramDigestWibHour() {
  return 8;
}

/**
 * Syra Daily digest minute in Asia/Jakarta (WIB).
 * @returns {number}
 */
export function getTelegramDigestWibMinute() {
  return 0;
}

/**
 * @returns {boolean}
 */
export function isTelegramDigestEnabled() {
  return true;
}

/**
 * Canonical public bot username for CTAs (without @).
 * @returns {string}
 */
export function getSyraTelegramPublicBotUsername() {
  return getSyraTelegramBotUsername().replace(/^@/, '') || 'syra_agent_bot';
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
export { SYRA_TELEGRAM_BOT_USERNAME };
/** @deprecated use getters */
export const SYRA_TELEGRAM_WEBHOOK_SECRET = '';
/** @deprecated use getters */
export { SYRA_TELEGRAM_WEBHOOK_URL };
/** @deprecated use isSyraTelegramPollingEnabled() */
export { SYRA_TELEGRAM_POLLING_ENABLED };
/** @deprecated use isSyraTelegramBotEnabled() */
export { SYRA_TELEGRAM_BOT_ENABLED };
