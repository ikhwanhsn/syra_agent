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
 *   messageThreadId?: number;
 *   replyToMessageId?: number;
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
    replyToMessageId: options.replyToMessageId,
  });

  return result.ok;
}

/**
 * Reply in the S3Labs group (any topic). Used for @mention Q&A.
 * @param {string} text
 * @param {{ messageThreadId?: number; replyToMessageId?: number; disableWebPagePreview?: boolean }} options
 * @returns {Promise<boolean>}
 */
export async function sendS3labsTelegramReply(text, options = {}) {
  const { token, chatId } = getS3labsTelegramConfig();
  if (!token || !chatId) return false;

  const result = await sendTelegramMessage({
    token,
    chatId,
    text,
    disableWebPagePreview: options.disableWebPagePreview !== false,
    messageThreadId:
      options.messageThreadId != null && Number.isFinite(options.messageThreadId)
        ? options.messageThreadId
        : undefined,
    replyToMessageId: options.replyToMessageId,
  });

  return result.ok;
}
