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
