/**
 * Generic Telegram Bot API sendMessage helper.
 * @see https://core.telegram.org/bots/api#sendmessage
 */

/** Telegram max message length (UTF-16 code units; we use JS string length as safe proxy). */
export const TELEGRAM_MESSAGE_MAX_LEN = 4096;

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
 * }} SendTelegramMessageOptions
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
 * Send one or more Telegram messages (chunked if needed).
 * @param {SendTelegramMessageOptions} options
 * @returns {Promise<{ ok: boolean; error?: string }>}
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

  for (let i = 0; i < parts.length; i++) {
    const body = {
      chat_id: chatId,
      text: parts[i],
      disable_web_page_preview: disableWebPagePreview,
    };
    if (
      options.messageThreadId != null &&
      Number.isFinite(options.messageThreadId) &&
      options.messageThreadId > 0
    ) {
      body.message_thread_id = options.messageThreadId;
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
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      const err = `Telegram send failed ${res.status}: ${t.slice(0, 300)} (chunk ${i + 1}/${parts.length})`;
      console.warn("[telegram-bot]", err);
      return { ok: false, error: err };
    }
  }

  return { ok: true };
}
