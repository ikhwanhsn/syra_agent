/**
 * Syra dev Telegram bot — shared notifier for internal alerts and agent team digests.
 *
 * Env (same as health monitor):
 * - SYRA_DEV_BOT_TOKEN
 * - SYRA_DEV_BOT_CHAT_ID
 *
 * @see https://core.telegram.org/bots/api#sendmessage
 */

/** Telegram max message length (UTF-16 code units; we use JS string length as safe proxy). */
export const TELEGRAM_MESSAGE_MAX_LEN = 4096;

/**
 * @typedef {'Markdown' | 'MarkdownV2' | 'HTML'} TelegramParseMode
 */

/**
 * @typedef {{ parseMode?: TelegramParseMode | null; disableWebPagePreview?: boolean }} SendDevTelegramOptions
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
 * Send one or more Telegram messages to the dev bot (chunked if needed).
 * @param {string} text
 * @param {SendDevTelegramOptions} [options]
 * @returns {Promise<boolean>} true if all chunks sent OK (or nothing to send); false if bot not configured or any send failed
 */
export async function sendDevTelegram(text, options = {}) {
  const token = String(process.env.SYRA_DEV_BOT_TOKEN || "").trim();
  const chatId = String(process.env.SYRA_DEV_BOT_CHAT_ID || "").trim();
  if (!token || !chatId) {
    return false;
  }

  const parseMode = options.parseMode === undefined ? undefined : options.parseMode;
  const disableWebPagePreview = options.disableWebPagePreview !== false;

  const parts = chunkTelegramText(text, TELEGRAM_MESSAGE_MAX_LEN);
  if (parts.length === 0) return true;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;

  for (let i = 0; i < parts.length; i++) {
    const body = {
      chat_id: chatId,
      text: parts[i],
      disable_web_page_preview: disableWebPagePreview,
    };
    if (parseMode != null && parseMode !== "") {
      body.parse_mode = parseMode;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn(
        "[dev-telegram] send failed",
        res.status,
        t.slice(0, 200),
        `(chunk ${i + 1}/${parts.length})`,
      );
      return false;
    }
  }

  return true;
}

/**
 * Whether dev Telegram is configured (token + chat id).
 * @returns {boolean}
 */
export function isDevTelegramConfigured() {
  return Boolean(
    String(process.env.SYRA_DEV_BOT_TOKEN || "").trim() &&
      String(process.env.SYRA_DEV_BOT_CHAT_ID || "").trim(),
  );
}
