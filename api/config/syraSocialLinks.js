/**
 * Official Syra community links (mirrors web/src/content/syraAbout.ts SYRA_COMMUNITY_LINKS).
 */

/** @typedef {{ website: string; docs: string; x: string; telegram: string; telegramBot: string; supportEmail: string }} SyraSocialLinks */

const DEFAULTS = Object.freeze({
  website: 'https://syraa.fun',
  docs: 'https://docs.syraa.fun',
  x: 'https://x.com/syra_agent',
  telegram: 'https://t.me/syra_ai',
  telegramBot: 'https://t.me/syra_trading_bot',
  supportEmail: 'support@syraa.fun',
});

/**
 * @returns {SyraSocialLinks}
 */
export function getSyraSocialLinks() {
  return {
    website: (process.env.SYRA_WEBSITE_URL || DEFAULTS.website).trim(),
    docs: (process.env.SYRA_DOCS_URL || DEFAULTS.docs).trim(),
    x: (process.env.SYRA_X_URL || DEFAULTS.x).trim(),
    telegram: (process.env.SYRA_TELEGRAM_COMMUNITY_URL || DEFAULTS.telegram).trim(),
    telegramBot: (process.env.SYRA_TELEGRAM_BOT_PUBLIC_URL || DEFAULTS.telegramBot).trim(),
    supportEmail: (process.env.SYRA_SUPPORT_EMAIL || DEFAULTS.supportEmail).trim(),
  };
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Telegram HTML block for the home / start screen.
 * @returns {string}
 */
export function formatSyraSocialLinksTelegramHtml() {
  const links = getSyraSocialLinks();
  return [
    '<b>Follow Syra</b>',
    `🌐 <a href="${escapeHtml(links.website)}">syraa.fun</a> · 📖 <a href="${escapeHtml(links.docs)}">Docs</a>`,
    `X · <a href="${escapeHtml(links.x)}">@syra_agent</a> · ✈️ <a href="${escapeHtml(links.telegram)}">Community</a>`,
  ].join('\n');
}
