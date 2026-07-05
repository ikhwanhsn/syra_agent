/**
 * Generic Telegram Bot API sendMessage helper.
 * @see https://core.telegram.org/bots/api#sendmessage
 */

import { fetchWithRetry } from "../utils/resilientFetch.js";

/** Telegram max message length (UTF-16 code units; we use JS string length as safe proxy). */
export const TELEGRAM_MESSAGE_MAX_LEN = 4096;

/** Max length for photo/document captions. */
export const TELEGRAM_CAPTION_MAX_LEN = 1024;

/** Forum "General" topic id — sendMessage rejects message_thread_id=1 ("thread not found"). */
export const TELEGRAM_GENERAL_FORUM_TOPIC_ID = 1;

/**
 * Telegram rejects sendMessage with message_thread_id=1 (General forum topic).
 * Omit the param; reply_to_message_id still anchors the thread when present.
 * @param {number | undefined | null} threadId
 * @returns {number | undefined}
 */
export function normalizeTelegramForumThreadId(threadId) {
  if (threadId == null || !Number.isFinite(threadId)) return undefined;
  const id = Math.trunc(threadId);
  if (id <= 0 || id === TELEGRAM_GENERAL_FORUM_TOPIC_ID) return undefined;
  return id;
}

/**
 * sendChatAction needs message_thread_id=1 for General forum topic (opposite of sendMessage).
 * @param {number | undefined | null} threadId
 * @returns {number | undefined}
 */
export function resolveTelegramTypingThreadId(threadId) {
  if (threadId == null || !Number.isFinite(threadId)) return undefined;
  const id = Math.trunc(threadId);
  return id > 0 ? id : undefined;
}

/**
 * @typedef {'Markdown' | 'MarkdownV2' | 'HTML'} TelegramParseMode
 */

/**
 * @typedef {{
 *   token: string;
 *   chatId: string;
 *   text: string;
 *   parseMode?: TelegramParseMode | null;
 *   disableWebPagePreview?: boolean;
 *   messageThreadId?: number | null;
 *   replyToMessageId?: number | null;
 *   replyMarkup?: object | null;
 * }} SendTelegramMessageOptions
 */

/**
 * @typedef {{
 *   token: string;
 *   chatId: string;
 *   action?: 'typing' | 'upload_photo' | 'record_video' | 'upload_video' | 'record_voice' | 'upload_voice' | 'upload_document' | 'choose_sticker' | 'find_location' | 'record_video_note' | 'upload_video_note';
 *   messageThreadId?: number | null;
 * }} SendTelegramChatActionOptions
 */

/**
 * @typedef {{
 *   token: string;
 *   chatId: string;
 *   messageId: number;
 * }} DeleteTelegramMessageOptions
 */

/**
 * Split long text into chunks suitable for Telegram sendMessage.
 * Prefers breaking on newlines near the max length.
 * @param {string} text
 * @param {number} [maxLen]
 * @returns {string[]}
 */
export function chunkTelegramText(text, maxLen = TELEGRAM_MESSAGE_MAX_LEN) {
  const s = typeof text === "string" ? text : String(text);
  if (s.length <= maxLen) return s ? [s] : [];

  const chunks = [];
  let rest = s;
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      chunks.push(rest);
      break;
    }
    let slice = rest.slice(0, maxLen);
    const nl = slice.lastIndexOf("\n");
    if (nl > maxLen * 0.6) {
      slice = slice.slice(0, nl + 1);
    }
    chunks.push(slice);
    rest = rest.slice(slice.length);
  }
  return chunks;
}

/**
 * Show typing / upload indicator in a chat or forum topic.
 * @param {SendTelegramChatActionOptions} options
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function sendTelegramChatAction(options) {
  const token = String(options.token || "").trim();
  const chatId = String(options.chatId || "").trim();
  if (!token || !chatId) {
    return { ok: false, error: "token and chatId are required" };
  }

  const body = {
    chat_id: chatId,
    action: options.action || "typing",
  };
  const threadId = resolveTelegramTypingThreadId(options.messageThreadId);
  if (threadId != null) {
    body.message_thread_id = threadId;
  }

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendChatAction`;
  let res;
  try {
    res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.warn("[telegram-bot] sendChatAction network error:", err);
    return { ok: false, error: err };
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    const err = `Telegram chat action failed ${res.status}: ${t.slice(0, 200)}`;
    console.warn("[telegram-bot]", err);
    return { ok: false, error: err };
  }

  return { ok: true };
}

/**
 * Delete a message the bot sent (or can moderate) in a chat.
 * @param {DeleteTelegramMessageOptions} options
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function deleteTelegramMessage(options) {
  const token = String(options.token || "").trim();
  const chatId = String(options.chatId || "").trim();
  const messageId = options.messageId;

  if (!token || !chatId || messageId == null || !Number.isFinite(messageId)) {
    return { ok: false, error: "token, chatId, and messageId are required" };
  }

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/deleteMessage`;
  let res;
  try {
    res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: Math.trunc(messageId),
      }),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.warn("[telegram-bot] deleteMessage network error:", err);
    return { ok: false, error: err };
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    const err = `Telegram delete failed ${res.status}: ${t.slice(0, 200)}`;
    console.warn("[telegram-bot]", err);
    return { ok: false, error: err };
  }

  return { ok: true };
}

/**
 * Send one or more Telegram messages (chunked if needed).
 * @param {SendTelegramMessageOptions} options
 * @returns {Promise<{ ok: boolean; messageId?: number; error?: string }>}
 */
export async function sendTelegramMessage(options) {
  const token = String(options.token || "").trim();
  const chatId = String(options.chatId || "").trim();
  const text = typeof options.text === "string" ? options.text : String(options.text ?? "");

  if (!token || !chatId) {
    return { ok: false, error: "token and chatId are required" };
  }

  const parseMode = options.parseMode === undefined ? undefined : options.parseMode;
  const disableWebPagePreview = options.disableWebPagePreview !== false;

  const parts = chunkTelegramText(text, TELEGRAM_MESSAGE_MAX_LEN);
  if (parts.length === 0) return { ok: true };

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
  /** @type {number | undefined} */
  let firstMessageId;

  for (let i = 0; i < parts.length; i++) {
    const body = {
      chat_id: chatId,
      text: parts[i],
      disable_web_page_preview: disableWebPagePreview,
    };
    const threadId = normalizeTelegramForumThreadId(options.messageThreadId);
    if (threadId != null) {
      body.message_thread_id = threadId;
    }
    if (parseMode != null && parseMode !== "") {
      body.parse_mode = parseMode;
    }
    if (
      options.replyToMessageId != null &&
      Number.isFinite(options.replyToMessageId) &&
      options.replyToMessageId > 0
    ) {
      body.reply_to_message_id = options.replyToMessageId;
      // Don't fail when the quoted message was deleted ("message to be replied not found").
      body.allow_sending_without_reply = true;
    }
    if (options.replyMarkup != null && typeof options.replyMarkup === "object") {
      body.reply_markup = options.replyMarkup;
    }

    let res;
    try {
      res = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.warn("[telegram-bot] sendMessage network error:", err);
      return { ok: false, error: err };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const t = JSON.stringify(data).slice(0, 300);
      const err = `Telegram send failed ${res.status}: ${t} (chunk ${i + 1}/${parts.length})`;
      console.warn("[telegram-bot]", err);
      return { ok: false, error: err };
    }

    const messageId = data?.result?.message_id;
    if (i === 0 && typeof messageId === "number" && Number.isFinite(messageId)) {
      firstMessageId = messageId;
    }
  }

  return firstMessageId != null ? { ok: true, messageId: firstMessageId } : { ok: true };
}

/**
 * @typedef {{
 *   token: string;
 *   callbackQueryId: string;
 *   text?: string;
 *   showAlert?: boolean;
 * }} AnswerTelegramCallbackQueryOptions
 */

/**
 * @param {AnswerTelegramCallbackQueryOptions} options
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function answerTelegramCallbackQuery(options) {
  const token = String(options.token || "").trim();
  const callbackQueryId = String(options.callbackQueryId || "").trim();
  if (!token || !callbackQueryId) {
    return { ok: false, error: "token and callbackQueryId are required" };
  }

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/answerCallbackQuery`;
  const body = { callback_query_id: callbackQueryId };
  if (options.text) body.text = String(options.text).slice(0, 200);
  if (options.showAlert) body.show_alert = true;

  try {
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `answerCallbackQuery failed ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, error: err };
  }
}

/**
 * @typedef {{
 *   token: string;
 *   chatId: string;
 *   photo: Buffer | Uint8Array;
 *   filename?: string;
 *   caption?: string;
 *   parseMode?: TelegramParseMode | null;
 *   replyMarkup?: object | null;
 * }} SendTelegramPhotoOptions
 */

/**
 * Send a photo (PNG/JPEG) to a Telegram chat.
 * @param {SendTelegramPhotoOptions} options
 * @returns {Promise<{ ok: boolean; messageId?: number; error?: string }>}
 */
export async function sendTelegramPhoto(options) {
  const token = String(options.token || "").trim();
  const chatId = String(options.chatId || "").trim();
  const photo = options.photo;

  if (!token || !chatId || !photo || !(photo instanceof Uint8Array || Buffer.isBuffer(photo))) {
    return { ok: false, error: "token, chatId, and photo buffer are required" };
  }

  const form = new FormData();
  form.append("chat_id", chatId);
  const filename = options.filename || "chart.png";
  form.append("photo", new Blob([photo], { type: "image/png" }), filename);

  if (options.caption && String(options.caption).trim()) {
    form.append("caption", String(options.caption).slice(0, TELEGRAM_CAPTION_MAX_LEN));
  }
  if (options.parseMode != null && options.parseMode !== "") {
    form.append("parse_mode", options.parseMode);
  }
  if (options.replyMarkup != null && typeof options.replyMarkup === "object") {
    form.append("reply_markup", JSON.stringify(options.replyMarkup));
  }

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`;
  try {
    const res = await fetchWithRetry(url, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok !== true) {
      const err = data.description || JSON.stringify(data).slice(0, 300);
      console.warn("[telegram-bot] sendPhoto failed:", err);
      return { ok: false, error: err };
    }
    const messageId = data.result?.message_id;
    return { ok: true, ...(typeof messageId === "number" ? { messageId } : {}) };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.warn("[telegram-bot] sendPhoto network error:", err);
    return { ok: false, error: err };
  }
}

/**
 * @typedef {{
 *   token: string;
 *   chatId: string;
 *   messageId: number;
 *   text: string;
 *   parseMode?: TelegramParseMode | null;
 *   disableWebPagePreview?: boolean;
 *   replyMarkup?: object | null;
 * }} EditTelegramMessageTextOptions
 */

/**
 * @param {EditTelegramMessageTextOptions} options
 * @returns {Promise<{ ok: boolean; error?: string }>}
 */
export async function editTelegramMessageText(options) {
  const token = String(options.token || "").trim();
  const chatId = String(options.chatId || "").trim();
  const messageId = options.messageId;
  const text = typeof options.text === "string" ? options.text : String(options.text ?? "");

  if (!token || !chatId || messageId == null || !Number.isFinite(messageId)) {
    return { ok: false, error: "token, chatId, messageId, and text are required" };
  }

  const body = {
    chat_id: chatId,
    message_id: Math.trunc(messageId),
    text: text.slice(0, TELEGRAM_MESSAGE_MAX_LEN),
    disable_web_page_preview: options.disableWebPagePreview !== false,
  };
  if (options.parseMode != null && options.parseMode !== "") {
    body.parse_mode = options.parseMode;
  }
  if (options.replyMarkup != null && typeof options.replyMarkup === "object") {
    body.reply_markup = options.replyMarkup;
  }

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/editMessageText`;
  try {
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: JSON.stringify(data).slice(0, 300) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
