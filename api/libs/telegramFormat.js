/**
 * Convert common LLM markdown to Telegram HTML (parse_mode=HTML).
 * @see https://core.telegram.org/bots/api#html-style
 */

/**
 * @param {string} text
 * @returns {string}
 */
export function escapeTelegramHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function markdownToTelegramHtml(raw) {
  const input = typeof raw === "string" ? raw.trim() : String(raw ?? "").trim();
  if (!input) return "";

  let text = escapeTelegramHtml(input);

  text = text.replace(/```([\s\S]*?)```/g, (_, code) => `<pre>${code.trim()}</pre>`);
  text = text.replace(/`([^`\n]+)`/g, (_, code) => `<code>${code}</code>`);
  text = text.replace(/\*\*([^*]+)\*\*/g, (_, label) => `<b>${label}</b>`);
  text = text.replace(/__([^_]+)__/g, (_, label) => `<b>${label}</b>`);
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_, label) => `<i>${label}</i>`);
  text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, (_, label) => `<i>${label}</i>`);
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
    `<a href="${url}">${label}</a>`,
  );
  text = text.replace(/^[*\-] /gm, "• ");

  return text;
}

/**
 * @param {string | undefined} error
 * @returns {boolean}
 */
export function isTelegramParseEntityError(error) {
  const msg = String(error || "").toLowerCase();
  return msg.includes("can't parse entities") || msg.includes("cant parse entities");
}
