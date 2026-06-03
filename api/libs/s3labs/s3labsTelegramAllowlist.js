/**
 * Restrict S3Labs bot actions to a single allowed Telegram chat.
 */

import { getS3labsTelegramConfig } from "../s3labsTelegramNotifier.js";

/** @type {string | null} */
let resolvedAllowedChatId = null;

/**
 * @param {string} token
 * @param {string} chatRef username (@s3labs) or numeric id
 * @returns {Promise<string | null>}
 */
async function resolveChatIdFromTelegram(token, chatRef) {
  const ref = chatRef.trim();
  if (!ref) return null;
  if (/^-?\d+$/.test(ref)) return ref;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/getChat?chat_id=${encodeURIComponent(ref)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const id = data?.result?.id;
  return id != null ? String(id) : null;
}

/**
 * @returns {Promise<string | null>}
 */
export async function getAllowedS3labsChatId() {
  const { token, chatId } = getS3labsTelegramConfig();
  if (!token || !chatId) return null;

  if (resolvedAllowedChatId) return resolvedAllowedChatId;

  if (/^-?\d+$/.test(chatId.trim())) {
    resolvedAllowedChatId = chatId.trim();
    return resolvedAllowedChatId;
  }

  const resolved = await resolveChatIdFromTelegram(token, chatId);
  if (resolved) {
    resolvedAllowedChatId = resolved;
    console.log(`[s3labs-telegram] resolved allowed chat ${chatId} → ${resolved}`);
  }
  return resolved;
}

/**
 * @param {number | string | undefined | null} incomingChatId
 * @returns {Promise<boolean>}
 */
export async function isAllowedS3labsChat(incomingChatId) {
  if (incomingChatId == null) return false;
  const allowed = await getAllowedS3labsChatId();
  if (!allowed) return false;

  const incoming = String(incomingChatId);
  const configured = getS3labsTelegramConfig().chatId.trim();

  if (incoming === allowed) return true;
  if (incoming === configured) return true;
  if (configured.startsWith("@") && incoming === configured) return false;

  return false;
}

/** @internal */
export function _resetAllowedChatCache() {
  resolvedAllowedChatId = null;
}
