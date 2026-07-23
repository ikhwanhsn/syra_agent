/**
 * Inline keyboard layouts for the Syra Telegram bot.
 */
import { getSyraSocialLinks } from '../../config/syraSocialLinks.js';

/**
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function mainMenuKeyboard() {
  const links = getSyraSocialLinks();
  return {
    inline_keyboard: [
      [{ text: '🧠 Ask Syra anything', callback_data: 'menu:ask' }],
      [{ text: '💡 Pick a starter question', callback_data: 'menu:examples' }],
      [
        { text: '⚡ Capabilities', callback_data: 'menu:capabilities' },
        { text: '❓ Help', callback_data: 'menu:help' },
      ],
      [{ text: '🔗 Referral', callback_data: 'menu:referral' }],
      [
        { text: '🌐 syraa.fun', url: links.website },
        { text: '📖 Docs', url: links.docs },
      ],
      [
        { text: 'X @syra_agent', url: links.x },
        { text: '✈️ Telegram', url: links.telegram },
      ],
    ],
  };
}

/**
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function walletKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔄 Refresh', callback_data: 'wallet:refresh' },
        { text: '📥 Deposit', callback_data: 'wallet:deposit' },
      ],
      [{ text: '📤 Withdraw', callback_data: 'wallet:withdraw' }],
      [{ text: '« Home', callback_data: 'menu:main' }],
    ],
  };
}

/**
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function portfolioKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🔄 Refresh', callback_data: 'portfolio:refresh' },
        { text: '💰 Wallet', callback_data: 'menu:wallet' },
      ],
      [{ text: '« Home', callback_data: 'menu:main' }],
    ],
  };
}

/**
 * @param {string[]} questions
 * @param {{ showHome?: boolean }} [opts]
 * @returns {import('telegram').InlineKeyboardMarkup | undefined}
 */
export function followUpQuestionsKeyboard(questions, opts = {}) {
  const showHome = opts.showHome === true;
  const rows = (Array.isArray(questions) ? questions : [])
    .slice(0, 3)
    .map((question, index) => [
      {
        text: String(question || '').trim(),
        callback_data: `fq:${index}`,
      },
    ]);

  if (showHome) {
    rows.push([{ text: '« Main Menu', callback_data: 'menu:main' }]);
  }

  if (rows.length === 0) return undefined;

  return { inline_keyboard: rows };
}

/**
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function withdrawTokenKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: 'USDC', callback_data: 'withdraw:token:usdc' },
        { text: 'SOL', callback_data: 'withdraw:token:sol' },
      ],
      [{ text: '✕ Cancel', callback_data: 'withdraw:cancel' }],
    ],
  };
}

/**
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function confirmWithdrawKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirm Withdraw', callback_data: 'withdraw:confirm' },
        { text: '✕ Cancel', callback_data: 'withdraw:cancel' },
      ],
    ],
  };
}

/**
 * @param {{ hasCode?: boolean; shareUrl?: string | null }} [opts]
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function referralKeyboard(opts = {}) {
  const rows = [];
  if (opts.shareUrl) {
    const shareUrl = String(opts.shareUrl);
    const shareText = encodeURIComponent(
      'Try Syra on Telegram — walleted crypto intel (news, signals, on-chain). Friends I invite use my stack.',
    );
    const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
    rows.push([{ text: '📤 Share referral link', url: telegramShare }]);
  }
  rows.push([
    { text: opts.hasCode ? '✏️ Change name' : '✨ Create name', callback_data: 'ref:create' },
  ]);
  if (opts.hasCode) {
    rows.push([{ text: '🗑 Remove name', callback_data: 'ref:clear' }]);
  }
  rows.push([
    { text: '🔄 Refresh', callback_data: 'ref:refresh' },
    { text: '« Home', callback_data: 'menu:main' },
  ]);
  return { inline_keyboard: rows };
}

/**
 * @returns {import('telegram').InlineKeyboardMarkup}
 */
export function cancelOnlyKeyboard() {
  return {
    inline_keyboard: [[{ text: '✕ Cancel', callback_data: 'withdraw:cancel' }]],
  };
}
