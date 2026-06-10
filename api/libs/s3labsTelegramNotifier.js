/**
 * S3Labs Telegram bot — posts to forum topics (News / Developer / Event).
 *
 * Env: S3LABS_TELEGRAM_BOT_TOKEN, S3LABS_TELEGRAM_CHAT_ID
 *
 * @see https://core.telegram.org/bots/api#sendmessage
 */

import {
  deleteTelegramMessage,
  normalizeTelegramForumThreadId,
  sendTelegramChatAction,
  sendTelegramMessage,
} from "./telegramBot.js";
import { getAllowedS3labsChatId } from "./s3labs/s3labsTelegramAllowlist.js";

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
 * @typedef {{
 *   ok: boolean;
 *   messageId?: number;
 *   chatId?: string;
 * }} S3labsTelegramReplyResult
 */

/**
 * Reply in the S3Labs group (any topic). Used for @mention Q&A.
 * @param {string} text
 * @param {{ messageThreadId?: number; replyToMessageId?: number; disableWebPagePreview?: boolean }} options
 * @returns {Promise<S3labsTelegramReplyResult>}
 */
export async function sendS3labsTelegramReply(text, options = {}) {
  const { token, chatId: configuredChatId } = getS3labsTelegramConfig();
  if (!token) return { ok: false };

  const chatId = (await getAllowedS3labsChatId()) || configuredChatId.trim();
  if (!chatId) return { ok: false };

  const threadId = normalizeTelegramForumThreadId(options.messageThreadId);
  const base = {
    token,
    chatId,
    text,
    disableWebPagePreview: options.disableWebPagePreview !== false,
    replyToMessageId: options.replyToMessageId,
  };

  let result = await sendTelegramMessage({ ...base, messageThreadId: threadId });
  if (!result.ok && threadId != null) {
    result = await sendTelegramMessage({ ...base, messageThreadId: undefined });
  }

  return {
    ok: result.ok,
    messageId: result.messageId,
    chatId: result.ok ? chatId : undefined,
  };
}

/**
 * Delete a bot message in the S3Labs group (e.g. remove "processing" placeholder).
 * @param {string} chatId
 * @param {number} messageId
 * @returns {Promise<boolean>}
 */
export async function deleteS3labsTelegramMessage(chatId, messageId) {
  const { token } = getS3labsTelegramConfig();
  if (!token || !chatId || messageId == null) return false;

  const result = await deleteTelegramMessage({ token, chatId, messageId });
  return result.ok;
}

/**
 * Show "typing…" in the S3Labs group while the LLM is working.
 * @param {{ messageThreadId?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function sendS3labsTelegramTyping(options = {}) {
  const { token, chatId: configuredChatId } = getS3labsTelegramConfig();
  if (!token) return false;

  const chatId = (await getAllowedS3labsChatId()) || configuredChatId.trim();
  if (!chatId) return false;

  const result = await sendTelegramChatAction({
    token,
    chatId,
    action: "typing",
    messageThreadId: options.messageThreadId,
  });

  return result.ok;
}
