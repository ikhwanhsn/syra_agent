/**
 * S3Labs Telegram bot — posts to forum topics (News / Developer / Event).
 *
 * Env: S3LABS_TELEGRAM_BOT_TOKEN, S3LABS_TELEGRAM_CHAT_ID
 *
 * @see https://core.telegram.org/bots/api#sendmessage
 */

import { sendTelegramMessage } from "./telegramBot.js";

/**
 * @typedef {'Markdown' | 'MarkdownV2' | 'HTML'} TelegramParseMode
 */

/**
 * @typedef {{
 *   parseMode?: TelegramParseMode | null;
 *   disableWebPagePreview?: boolean;
 *   messageThreadId: number;
 * }} SendS3labsTelegramOptions
 */

/**
 * @returns {{ token: string; chatId: string }}
 */
export function getS3labsTelegramConfig() {
  return {
    token: String(process.env.S3LABS_TELEGRAM_BOT_TOKEN || "").trim(),
    chatId: String(process.env.S3LABS_TELEGRAM_CHAT_ID || "@s3labs").trim(),
  };
}

/**
 * @returns {boolean}
 */
export function isS3labsTelegramConfigured() {
  const { token, chatId } = getS3labsTelegramConfig();
  return Boolean(token && chatId);
}

/**
 * @param {string} text
 * @param {SendS3labsTelegramOptions} options
 * @returns {Promise<boolean>}
 */
export async function sendS3labsTelegram(text, options) {
  const { token, chatId } = getS3labsTelegramConfig();
  if (!token || !chatId) return false;

  if (options.messageThreadId == null || !Number.isFinite(options.messageThreadId)) {
    console.warn("[s3labs-telegram] messageThreadId is required");
    return false;
  }

  const result = await sendTelegramMessage({
    token,
    chatId,
    text,
    parseMode: options.parseMode,
    disableWebPagePreview: options.disableWebPagePreview,
    messageThreadId: options.messageThreadId,
  });

  return result.ok;
}
