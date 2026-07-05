/**
 * Syra Telegram AI bot — update handler (commands, wallet flows, brain Q&A).
 */
import { PublicKey } from '@solana/web3.js';
import {
  getSyraTelegramBotToken,
} from '../../config/syraTelegramBotConfig.js';
import { formatSyraSocialLinksTelegramHtml } from '../../config/syraSocialLinks.js';
import { formatTelegramNoToolExampleBullets, pickTelegramShortExamples } from '../../config/telegramExampleQuestions.js';
import { getAgentTool, getToolsForLlmSelection } from '../../config/agentTools.js';
import {
  sendTelegramMessage,
  sendTelegramChatAction,
  sendTelegramPhoto,
  answerTelegramCallbackQuery,
  editTelegramMessageText,
  chunkTelegramText,
} from '../telegramBot.js';
import { markdownToTelegramHtml, escapeTelegramHtml, isTelegramParseEntityError } from '../telegramFormat.js';
import { TELEGRAM_CAPTION_MAX_LEN } from '../telegramBot.js';
import { askSyraBrain } from './brainService.js';
import {
  ensureTelegramUserWallet,
  getWalletSummary,
  withdraw,
  getTelegramBotUser,
  setPendingAction,
  clearPendingAction,
  incrementMessageCount,
  setSuggestedQuestions,
  getSuggestedQuestion,
} from './walletService.js';
import {
  mainMenuKeyboard,
  walletKeyboard,
  portfolioKeyboard,
  followUpQuestionsKeyboard,
  referralKeyboard,
  withdrawTokenKeyboard,
  confirmWithdrawKeyboard,
  cancelOnlyKeyboard,
} from './keyboards.js';
import { followUpSuggestionsExpiry } from './answerButtonsService.js';
import {
  fetchTelegramWalletPortfolio,
  formatPortfolioTelegramHtml,
} from './portfolioService.js';
import {
  parseStartReferralPayload,
  linkReferredUser,
  setUserReferralCode,
  clearUserReferralCode,
  getReferralDashboard,
  resolvePayerAnonymousId,
  refreshTelegramUser,
} from './referralService.js';

const PENDING_ACTION_TTL_MS = 10 * 60 * 1000;
const TYPING_REFRESH_MS = 4200;

/**
 * @param {import('telegram').InlineKeyboardMarkup | undefined} a
 * @param {import('telegram').InlineKeyboardMarkup | undefined} b
 * @returns {import('telegram').InlineKeyboardMarkup | undefined}
 */
function mergeInlineKeyboards(a, b) {
  const rows = [
    ...(a?.inline_keyboard ?? []),
    ...(b?.inline_keyboard ?? []),
  ];
  return rows.length > 0 ? { inline_keyboard: rows } : undefined;
}

/**
 * Chart stat line + answer text in one Telegram photo caption (HTML, max 1024 chars).
 * @param {string} chartLine
 * @param {string} answerText
 */
function buildChartPhotoCaption(chartLine, answerText) {
  const header = escapeTelegramHtml(String(chartLine || '').trim());
  const rawAnswer = String(answerText || '').trim();
  if (!header) return markdownToTelegramHtml(rawAnswer).slice(0, TELEGRAM_CAPTION_MAX_LEN);
  if (!rawAnswer) return header.slice(0, TELEGRAM_CAPTION_MAX_LEN);

  const sep = '\n\n';
  const suffix = '…';
  let plain = rawAnswer;
  let body = markdownToTelegramHtml(plain);
  let caption = `${header}${sep}${body}`;
  while (caption.length > TELEGRAM_CAPTION_MAX_LEN && plain.length > 80) {
    plain = plain.slice(0, Math.max(80, plain.length - 120)).trimEnd();
    body = markdownToTelegramHtml(plain);
    caption = `${header}${sep}${body}${suffix}`;
  }
  if (caption.length > TELEGRAM_CAPTION_MAX_LEN) {
    caption = caption.slice(0, TELEGRAM_CAPTION_MAX_LEN - 1) + suffix;
  }
  return caption;
}

/**
 * @param {string | number} chatId
 * @param {string} text
 * @param {{ parseMode?: 'HTML' | null; replyMarkup?: object; disableWebPagePreview?: boolean }} [opts]
 */
async function reply(chatId, text, opts = {}) {
  const token = getSyraTelegramBotToken();
  if (!token) return { ok: false, error: 'bot_token_missing' };
  const parts = chunkTelegramText(text, 4000);
  let lastResult = { ok: true };

  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    const payload = {
      token,
      chatId: String(chatId),
      text: parts[i],
      parseMode: opts.parseMode ?? 'HTML',
      disableWebPagePreview: opts.disableWebPagePreview !== false,
      ...(isLast && opts.replyMarkup ? { replyMarkup: opts.replyMarkup } : {}),
    };

    lastResult = await sendTelegramMessage(payload);
    if (!lastResult.ok && opts.parseMode === 'HTML') {
      lastResult = await sendTelegramMessage({
        ...payload,
        parseMode: null,
        text: parts[i].replace(/<[^>]+>/g, ''),
      });
    }
  }

  return lastResult;
}

/**
 * @param {string | number} chatId
 * @param {() => Promise<void>} work
 */
async function withTyping(chatId, work) {
  let active = true;
  const pump = (async () => {
    while (active) {
      await sendTelegramChatAction({ token: getSyraTelegramBotToken(), chatId: String(chatId), action: 'typing' });
      if (!active) break;
      await new Promise((r) => setTimeout(r, TYPING_REFRESH_MS));
    }
  })();
  try {
    await work();
  } finally {
    active = false;
    await pump.catch(() => {});
  }
}

/**
 * @param {number} n
 * @param {number} [decimals]
 */
function fmtNum(n, decimals = 4) {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * @param {import('telegram').Message} message
 */
function extractTelegramUser(message) {
  const from = message?.from;
  if (!from?.id) return null;
  return {
    telegramUserId: from.id,
    chatId: message.chat?.id,
    username: from.username || null,
    firstName: from.first_name || null,
  };
}

/**
 * @param {string | null | undefined} [firstName]
 * @param {{ isNewWallet?: boolean }} [opts]
 */
function buildHomeText(firstName, { isNewWallet = false, referralLinkedCode = null } = {}) {
  const greeting = firstName ? `Hey ${escapeTelegramHtml(firstName)}` : 'Hey there';
  const lines = [
    `<b>⚡ ${greeting} — Syra Agent</b>`,
    '',
    '<b>Machine money for agents on Solana.</b>',
    '',
    'Earn, treasury, invest, spend, and grow — plus an AI copilot for crypto intel.',
    '',
    '<b>Talk to me about</b>',
    '• DeFi, trading, and tokenomics',
    '• Live prices, news, and on-chain intel',
    '• Anything crypto — casual or deep dive',
    '',
    'Type a question anytime, or pick a starter below.',
    '',
    formatSyraSocialLinksTelegramHtml(),
    '',
    isNewWallet
      ? '<i>✓ Your agent wallet is ready — /wallet to view & deposit.</i>'
      : '<i>Wallet & balance: /wallet</i>',
  ];
  if (referralLinkedCode) {
    lines.push(
      '',
      `<i>🔗 Linked to referral <code>${escapeTelegramHtml(String(referralLinkedCode))}</code> — paid tools bill their wallet.</i>`,
    );
  }
  return lines.join('\n');
}

/**
 * @param {string | number} chatId
 * @param {string | null | undefined} [firstName]
 * @param {number} [editMessageId]
 * @param {{ isNewWallet?: boolean; referralLinkedCode?: string | null }} [opts]
 */
async function showHomeMenu(chatId, firstName, editMessageId, opts = {}) {
  const text = buildHomeText(firstName, opts);
  const replyMarkup = mainMenuKeyboard();

  if (editMessageId) {
    const result = await editTelegramMessageText({
      token: getSyraTelegramBotToken(),
      chatId: String(chatId),
      messageId: editMessageId,
      text,
      parseMode: 'HTML',
      replyMarkup,
    });
    if (result.ok) return;
  }

  await reply(chatId, text, { replyMarkup });
}

/**
 * @param {{ agentAddress: string; solBalance: number; usdcBalance: number; custody?: string }} summary
 */
function buildWalletText(summary) {
  return [
    '<b>💰 Your Syra Wallet</b>',
    '',
    `<b>Address</b> (tap to copy):`,
    `<code>${escapeTelegramHtml(summary.agentAddress)}</code>`,
    '',
    `SOL: <b>${fmtNum(summary.solBalance, 6)}</b>`,
    `USDC: <b>${fmtNum(summary.usdcBalance, 2)}</b>`,
    '',
    summary.custody === 'privy'
      ? '<i>Keys secured in Privy TEE.</i>'
      : '<i>Syra agent wallet on Solana.</i>',
    '',
    'Deposit SOL or USDC on Solana to your agent wallet.',
    'Keep a small SOL balance for transaction fees.',
  ].join('\n');
}

function buildDepositText(agentAddress) {
  return [
    '<b>📥 Deposit</b>',
    '',
    'Send <b>SOL</b> or <b>USDC</b> on Solana to your agent wallet:',
    '',
    `<code>${escapeTelegramHtml(agentAddress)}</code>`,
    '',
    'Deposit SOL or USDC on Solana to your agent wallet.',
  ].join('\n');
}

function buildHelpText() {
  return [
    '<b>❓ Syra Bot Help</b>',
    '',
    '<b>Commands</b>',
    '/start — Welcome + create wallet',
    '/wallet — View balance & manage wallet',
    '/portfolio — View all token holdings',
    '/referral — Referral link & stats',
    '/help — This message',
    '',
    '<b>Chat</b>',
    'General crypto questions work anytime — no wallet or tools required.',
    'Examples:',
    escapeTelegramHtml(formatTelegramNoToolExampleBullets(3)),
    '',
    '<b>Wallet</b>',
    'Deposit SOL/USDC → use Withdraw to send funds out.',
    '',
    '<b>Referral</b>',
    '/referral — Create a custom link. Referred users bill paid tools from your wallet.',
  ].join('\n');
}

/**
 * @param {object} tgUser
 * @returns {Promise<string>}
 */
async function buildReferralText(tgUser) {
  const dash = await getReferralDashboard(tgUser);
  const lines = [
    '<b>🔗 Referral</b>',
    '',
    'Share your link — friends who join via it use <b>your wallet</b> for paid Syra tools (signals, news, etc.).',
    'Keep USDC + a little SOL in your wallet for their tool calls.',
    '',
  ];

  if (dash.referralCode) {
    lines.push(`<b>Your name:</b> <code>${escapeTelegramHtml(dash.referralCode)}</code>`);
    if (dash.shareUrl) {
      lines.push(`<b>Link:</b> ${escapeTelegramHtml(dash.shareUrl)}`);
    }
    lines.push(`<b>Referrals joined:</b> ${dash.referralCount}`);
  } else {
    lines.push('<i>No referral name yet.</i> Tap <b>Create name</b> or send:');
    lines.push('<code>/referral create yourname</code>');
  }

  if (dash.referredByCode) {
    lines.push('', `<i>Referred by:</i> <code>${escapeTelegramHtml(String(dash.referredByCode))}</code>`);
  }

  lines.push(
    '',
    '<b>Commands</b>',
    '<code>/referral create NAME</code> — set your link name',
    '<code>/referral remove</code> — remove your name',
  );

  return lines.join('\n');
}

/**
 * @param {object} tgUser
 * @param {string | number} chatId
 * @param {number} [editMessageId]
 */
async function showReferral(tgUser, chatId, editMessageId) {
  const text = await buildReferralText(tgUser);
  const dash = await getReferralDashboard(tgUser);
  const replyMarkup = referralKeyboard({
    hasCode: Boolean(dash.referralCode),
    shareUrl: dash.shareUrl,
  });

  if (editMessageId) {
    await editTelegramMessageText({
      token: getSyraTelegramBotToken(),
      chatId: String(chatId),
      messageId: editMessageId,
      text,
      parseMode: 'HTML',
      replyMarkup,
    });
    return;
  }

  await reply(chatId, text, { replyMarkup });
}

/**
 * @param {object} tgUser
 * @param {string | number} chatId
 * @param {string} text
 */
async function handleReferralCommand(tgUser, chatId, text) {
  const parts = String(text || '').trim().split(/\s+/);
  const sub = (parts[1] || '').toLowerCase();

  if (!sub || sub === 'help') {
    await showReferral(tgUser, chatId);
    return;
  }

  if (sub === 'remove' || sub === 'clear' || sub === 'delete') {
    const result = await clearUserReferralCode(tgUser.telegramUserId);
    if (!result.ok) {
      await reply(chatId, escapeTelegramHtml(result.error), { replyMarkup: referralKeyboard() });
      return;
    }
    const refreshed = await refreshTelegramUser(tgUser.telegramUserId);
    await reply(chatId, 'Referral name removed.', {
      replyMarkup: referralKeyboard({ hasCode: false }),
    });
    if (refreshed) await showReferral(refreshed, chatId);
    return;
  }

  if (sub === 'create' || sub === 'set' || sub === 'name') {
    const name = parts.slice(2).join(' ').trim();
    if (!name) {
      await setPendingAction(tgUser.telegramUserId, {
        type: 'referral_name',
        step: 'input',
        data: {},
        expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS),
      });
      await reply(chatId, 'Send your referral name (3–24 chars, letters/numbers/hyphens):', {
        replyMarkup: cancelOnlyKeyboard(),
      });
      return;
    }
    const result = await setUserReferralCode(tgUser.telegramUserId, name);
    if (!result.ok) {
      await reply(chatId, escapeTelegramHtml(result.error), { replyMarkup: referralKeyboard() });
      return;
    }
    const refreshed = await refreshTelegramUser(tgUser.telegramUserId);
    await reply(
      chatId,
      [
        '<b>Referral name set!</b>',
        '',
        `Name: <code>${escapeTelegramHtml(result.code)}</code>`,
        `Link: ${escapeTelegramHtml(result.shareUrl)}`,
        '',
        'Share it — referred users bill paid tools from your wallet.',
      ].join('\n'),
      {
        replyMarkup: referralKeyboard({ hasCode: true, shareUrl: result.shareUrl }),
      },
    );
    void refreshed;
    return;
  }

  // Shorthand: /referral myname
  const shorthand = parts.slice(1).join(' ').trim();
  if (shorthand) {
    const result = await setUserReferralCode(tgUser.telegramUserId, shorthand);
    if (!result.ok) {
      await reply(chatId, escapeTelegramHtml(result.error), { replyMarkup: referralKeyboard() });
      return;
    }
    await reply(
      chatId,
      [
        '<b>Referral name set!</b>',
        '',
        `Link: ${escapeTelegramHtml(result.shareUrl)}`,
      ].join('\n'),
      { replyMarkup: referralKeyboard({ hasCode: true, shareUrl: result.shareUrl }) },
    );
    return;
  }

  await showReferral(tgUser, chatId);
}

const TELEGRAM_CAPABILITY_TOOL_IDS = [
  'news',
  'signal',
  'sentiment',
  'spcx-intelligence',
  'equity-intelligence',
  'web-search',
  'trending-jupiter',
  'smart-money',
  'analytics-summary',
  'website-crawl',
  'arbitrage',
  'event',
];

function buildCapabilitiesText() {
  const highlighted = TELEGRAM_CAPABILITY_TOOL_IDS.map((id) => getAgentTool(id)).filter(Boolean);
  const totalCount = getToolsForLlmSelection().length;
  const remaining = Math.max(0, totalCount - highlighted.length);

  return [
    '<b>⚡ Syra Capabilities</b>',
    '',
    'Ask for live crypto data — Syra tools run when you need real-time answers:',
    '',
    ...highlighted.map((tool) => {
      const desc = String(tool.description || '').trim().replace(/\.\s*$/, '');
      return `• <b>${escapeTelegramHtml(tool.name)}</b> — ${escapeTelegramHtml(desc)}`;
    }),
    remaining > 0 ? `\n<i>…and ${remaining} more tools</i>` : '',
    '',
    'General questions work anytime — no tools required.',
    'Try:',
    escapeTelegramHtml(formatTelegramNoToolExampleBullets(2)),
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * @param {string} text
 */
function isCommand(text) {
  return typeof text === 'string' && text.trim().startsWith('/');
}

/**
 * @param {string} address
 */
function isValidSolanaAddress(address) {
  try {
    const pk = new PublicKey(String(address).trim());
    return pk.toBase58().length >= 32;
  } catch {
    return false;
  }
}

/**
 * @param {object} tgUser
 * @param {string | number} chatId
 */
async function showWallet(tgUser, chatId, editMessageId) {
  const summary = await getWalletSummary(tgUser.anonymousId);
  if (!summary) {
    const text = 'Wallet not found. Send /start to create one.';
    if (editMessageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId: editMessageId,
        text,
        parseMode: 'HTML',
        replyMarkup: mainMenuKeyboard(),
      });
    } else {
      await reply(chatId, text, { replyMarkup: mainMenuKeyboard() });
    }
    return;
  }

  const text = buildWalletText(summary);
  if (editMessageId) {
    await editTelegramMessageText({
      token: getSyraTelegramBotToken(),
      chatId: String(chatId),
      messageId: editMessageId,
      text,
      parseMode: 'HTML',
      replyMarkup: walletKeyboard(),
    });
  } else {
    await reply(chatId, text, { replyMarkup: walletKeyboard() });
  }
}

/**
 * @param {object} tgUser
 * @param {string | number} chatId
 * @param {number} [editMessageId]
 */
async function showPortfolio(tgUser, chatId, editMessageId) {
  const summary = await getWalletSummary(tgUser.anonymousId);
  if (!summary?.agentAddress) {
    const text = 'Wallet not found. Send /start first.';
    if (editMessageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId: editMessageId,
        text,
        parseMode: 'HTML',
        replyMarkup: mainMenuKeyboard(),
      });
    } else {
      await reply(chatId, text, { replyMarkup: mainMenuKeyboard() });
    }
    return;
  }

  const render = async () => {
    const portfolio = await fetchTelegramWalletPortfolio(summary.agentAddress);
    if (!portfolio) {
      const errText = 'Could not load portfolio. Try again in a moment.';
      if (editMessageId) {
        await editTelegramMessageText({
          token: getSyraTelegramBotToken(),
          chatId: String(chatId),
          messageId: editMessageId,
          text: errText,
          parseMode: 'HTML',
          replyMarkup: portfolioKeyboard(),
        });
      } else {
        await reply(chatId, errText, { replyMarkup: portfolioKeyboard() });
      }
      return;
    }

    const text = formatPortfolioTelegramHtml(portfolio, escapeTelegramHtml);
    if (editMessageId) {
      const result = await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId: editMessageId,
        text,
        parseMode: 'HTML',
        replyMarkup: portfolioKeyboard(),
      });
      if (!result.ok && isTelegramParseEntityError(result.error)) {
        await editTelegramMessageText({
          token: getSyraTelegramBotToken(),
          chatId: String(chatId),
          messageId: editMessageId,
          text: text.replace(/<[^>]+>/g, ''),
          parseMode: null,
          replyMarkup: portfolioKeyboard(),
        });
      }
      return;
    }

    const result = await reply(chatId, text, { replyMarkup: portfolioKeyboard() });
    if (!result.ok && isTelegramParseEntityError(result.error)) {
      await reply(chatId, text.replace(/<[^>]+>/g, ''), { parseMode: null, replyMarkup: portfolioKeyboard() });
    }
  };

  await withTyping(chatId, render);
}

/**
 * @param {object} tgUser
 * @param {string | number} chatId
 * @param {string} question
 */
async function handleBrainQuestion(tgUser, chatId, question) {
  await withTyping(chatId, async () => {
    const payerAnonymousId = resolvePayerAnonymousId(tgUser);
    const {
      text,
      chartAttachment,
      showFollowUps,
      followUpQuestions,
      showMainMenu,
      followUpExpiresAt,
    } = await askSyraBrain({
      anonymousId: tgUser.anonymousId,
      payerAnonymousId,
      question,
    });

    await incrementMessageCount(tgUser.telegramUserId);

    const followUps =
      showFollowUps && Array.isArray(followUpQuestions) ? followUpQuestions.slice(0, 3) : [];
    if (followUps.length > 0 && followUpExpiresAt) {
      await setSuggestedQuestions(tgUser.telegramUserId, followUps, followUpExpiresAt);
    }

    const replyMarkup =
      followUps.length > 0 || showMainMenu
        ? followUpQuestionsKeyboard(followUps, { showHome: showMainMenu })
        : undefined;

    const token = getSyraTelegramBotToken();

    if (chartAttachment?.png && token) {
      await sendTelegramChatAction({ token, chatId: String(chatId), action: 'upload_photo' });
      const chartKeyboard = chartAttachment.detailUrl
        ? {
            inline_keyboard: [[{ text: 'Open full chart ↗', url: chartAttachment.detailUrl }]],
          }
        : undefined;
      const combinedKeyboard = mergeInlineKeyboards(chartKeyboard, replyMarkup);
      const caption = buildChartPhotoCaption(chartAttachment.caption, text);

      let photoResult = await sendTelegramPhoto({
        token,
        chatId: String(chatId),
        photo: chartAttachment.png,
        caption,
        parseMode: 'HTML',
        replyMarkup: combinedKeyboard,
      });
      if (!photoResult.ok && isTelegramParseEntityError(photoResult.error)) {
        photoResult = await sendTelegramPhoto({
          token,
          chatId: String(chatId),
          photo: chartAttachment.png,
          caption: buildChartPhotoCaption(chartAttachment.caption, text).replace(/<[^>]+>/g, ''),
          parseMode: null,
          replyMarkup: combinedKeyboard,
        });
      }
      if (photoResult.ok) return;
    }

    let body = markdownToTelegramHtml(text);
    const result = await reply(chatId, body, { replyMarkup });
    if (!result.ok && isTelegramParseEntityError(result.error)) {
      await reply(chatId, text, { parseMode: null, replyMarkup });
    }
  });
}

/**
 * @param {object} tgUser
 * @param {string} text
 * @param {string | number} chatId
 */
async function handlePendingAction(tgUser, text, chatId) {
  const pending = tgUser.pendingAction;
  if (!pending?.expiresAt || new Date(pending.expiresAt).getTime() < Date.now()) {
    await clearPendingAction(tgUser.telegramUserId);
    const expiredMarkup =
      pending?.type === 'referral_name' ? referralKeyboard() : walletKeyboard();
    const expiredHint =
      pending?.type === 'referral_name'
        ? 'Session expired. Open /referral to try again.'
        : 'Session expired. Tap Withdraw to start again.';
    await reply(chatId, expiredHint, { replyMarkup: expiredMarkup });
    return true;
  }

  if (pending.type === 'referral_name') {
    const result = await setUserReferralCode(tgUser.telegramUserId, text.trim());
    await clearPendingAction(tgUser.telegramUserId);
    if (!result.ok) {
      await reply(chatId, escapeTelegramHtml(result.error), { replyMarkup: referralKeyboard() });
      return true;
    }
    await reply(
      chatId,
      [
        '<b>Referral name set!</b>',
        '',
        `Name: <code>${escapeTelegramHtml(result.code)}</code>`,
        `Link: ${escapeTelegramHtml(result.shareUrl)}`,
        '',
        'Share it — referred users bill paid tools from your wallet.',
      ].join('\n'),
      { replyMarkup: referralKeyboard({ hasCode: true, shareUrl: result.shareUrl }) },
    );
    return true;
  }

  if (pending.type === 'withdraw') {
    if (pending.step === 'address') {
      const address = text.trim();
      if (!isValidSolanaAddress(address)) {
        await reply(chatId, 'Invalid Solana address. Please send a valid base58 address.', {
          replyMarkup: cancelOnlyKeyboard(),
        });
        return true;
      }
      await setPendingAction(tgUser.telegramUserId, {
        type: 'withdraw',
        step: 'token',
        data: { address },
        expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS),
      });
      await reply(chatId, 'Choose token to withdraw:', { replyMarkup: withdrawTokenKeyboard() });
      return true;
    }

    if (pending.step === 'amount') {
      const raw = text.trim().toLowerCase();
      const token = pending.data?.token === 'sol' ? 'sol' : 'usdc';
      let amount = null;

      if (raw === 'all' || raw === 'max') {
        const summary = await getWalletSummary(tgUser.anonymousId);
        amount = token === 'usdc' ? summary?.usdcBalance : summary?.solBalance;
      } else {
        amount = Number.parseFloat(raw.replace(/,/g, ''));
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        await reply(
          chatId,
          `Send a valid amount (e.g. <code>10</code> or <code>all</code>).`,
          { replyMarkup: cancelOnlyKeyboard() },
        );
        return true;
      }

      await setPendingAction(tgUser.telegramUserId, {
        type: 'withdraw',
        step: 'confirm',
        data: {
          address: pending.data?.address,
          token: getSyraTelegramBotToken(),
          amount,
        },
        expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS),
      });

      const symbol = token.toUpperCase();
      await reply(
        chatId,
        [
          '<b>Confirm withdrawal</b>',
          '',
          `To: <code>${escapeTelegramHtml(String(pending.data?.address))}</code>`,
          `Amount: <b>${fmtNum(amount, token === 'usdc' ? 2 : 6)} ${symbol}</b>`,
          '',
          'Tap Confirm to send.',
        ].join('\n'),
        { replyMarkup: confirmWithdrawKeyboard() },
      );
      return true;
    }
  }

  return false;
}

/**
 * @param {object} callbackQuery
 */
async function handleCallbackQuery(callbackQuery) {
  const data = String(callbackQuery.data || '');
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const from = callbackQuery.from;
  if (!chatId || !from?.id) return;

  await answerTelegramCallbackQuery({
    token: getSyraTelegramBotToken(),
    callbackQueryId: String(callbackQuery.id),
  });

  const tgUser = await getTelegramBotUser(from.id);
  if (!tgUser) {
    await reply(chatId, 'Send /start first to set up your wallet.');
    return;
  }

  if (data.startsWith('fq:')) {
    const index = Number.parseInt(data.slice(3), 10);
    const question = await getSuggestedQuestion(tgUser.telegramUserId, index);
    if (!question) {
      await reply(chatId, 'That suggestion expired — ask me anything.', {
        replyMarkup: mainMenuKeyboard(),
      });
      return;
    }
    await handleBrainQuestion(tgUser, chatId, question);
    return;
  }

  if (data === 'menu:main') {
    await showHomeMenu(chatId, from.first_name, messageId);
    return;
  }

  if (data === 'menu:wallet' || data === 'wallet:refresh') {
    await showWallet(tgUser, chatId, data === 'wallet:refresh' ? messageId : undefined);
    return;
  }

  if (data === 'portfolio:refresh') {
    await showPortfolio(tgUser, chatId, messageId);
    return;
  }

  if (data === 'wallet:deposit') {
    const summary = await getWalletSummary(tgUser.anonymousId);
    if (!summary) {
      await reply(chatId, 'Wallet not found. Send /start first.');
      return;
    }
    const text = buildDepositText(summary.agentAddress);
    if (messageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId,
        text,
        parseMode: 'HTML',
        replyMarkup: walletKeyboard(),
      });
    } else {
      await reply(chatId, text, { replyMarkup: walletKeyboard() });
    }
    return;
  }

  if (data === 'wallet:withdraw') {
    await setPendingAction(tgUser.telegramUserId, {
      type: 'withdraw',
      step: 'address',
      data: {},
      expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS),
    });
    const msg =
      '<b>📤 Withdraw</b>\n\nSend the Solana address you want to withdraw to.';
    if (messageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId,
        text: msg,
        parseMode: 'HTML',
        replyMarkup: cancelOnlyKeyboard(),
      });
    } else {
      await reply(chatId, msg, { replyMarkup: cancelOnlyKeyboard() });
    }
    return;
  }

  if (data === 'withdraw:cancel') {
    const pendingType = tgUser.pendingAction?.type;
    await clearPendingAction(tgUser.telegramUserId);
    if (pendingType === 'referral_name') {
      await showReferral(tgUser, chatId, messageId);
    } else {
      await showWallet(tgUser, chatId, messageId);
    }
    return;
  }

  if (data === 'withdraw:token:usdc' || data === 'withdraw:token:sol') {
    const token = data.endsWith(':sol') ? 'sol' : 'usdc';
    const pending = tgUser.pendingAction;
    if (pending?.step !== 'token') {
      await reply(chatId, 'Start withdraw again from Wallet menu.');
      return;
    }
    await setPendingAction(tgUser.telegramUserId, {
      type: 'withdraw',
      step: 'amount',
      data: { ...pending.data, token },
      expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS),
    });
    await reply(
      chatId,
      `How much <b>${token.toUpperCase()}</b> to send?\n\nSend a number or <code>all</code>.`,
      { replyMarkup: cancelOnlyKeyboard() },
    );
    return;
  }

  if (data === 'withdraw:confirm') {
    const pending = tgUser.pendingAction;
    if (pending?.step !== 'confirm' || !pending.data?.address) {
      await reply(chatId, 'Nothing to confirm. Start withdraw again.');
      return;
    }

    await withTyping(chatId, async () => {
      try {
        const { signature } = await withdraw(
          tgUser.anonymousId,
          pending.data.address,
          pending.data.amount,
          pending.data.token === 'sol' ? 'sol' : 'usdc',
        );
        await clearPendingAction(tgUser.telegramUserId);
        const txUrl = `https://solscan.io/tx/${signature}`;
        await reply(
          chatId,
          [
            '<b>✅ Withdrawal sent</b>',
            '',
            `<a href="${txUrl}">View on Solscan</a>`,
          ].join('\n'),
          { replyMarkup: walletKeyboard() },
        );
      } catch (e) {
        await reply(
          chatId,
          `Withdraw failed: ${escapeTelegramHtml(e instanceof Error ? e.message : 'error')}`,
          { replyMarkup: walletKeyboard() },
        );
      }
    });
    return;
  }

  if (data === 'menu:help') {
    const text = buildHelpText();
    if (messageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId,
        text,
        parseMode: 'HTML',
        replyMarkup: mainMenuKeyboard(),
      });
    } else {
      await reply(chatId, text, { replyMarkup: mainMenuKeyboard() });
    }
    return;
  }

  if (data === 'menu:capabilities') {
    const text = buildCapabilitiesText();
    if (messageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId,
        text,
        parseMode: 'HTML',
        replyMarkup: mainMenuKeyboard(),
      });
    } else {
      await reply(chatId, text, { replyMarkup: mainMenuKeyboard() });
    }
    return;
  }

  if (data === 'menu:ask') {
    await reply(
      chatId,
      [
        '<b>🧠 Ask Syra</b>',
        '',
        'Type any crypto question — DeFi, trading, tokens, markets, and more.',
        '',
        'General questions work anytime. I pull live data when you need it.',
      ].join('\n'),
      { replyMarkup: mainMenuKeyboard() },
    );
    return;
  }

  if (data === 'menu:examples') {
    const examples = pickTelegramShortExamples(3);
    const expiresAt = followUpSuggestionsExpiry();
    await setSuggestedQuestions(tgUser.telegramUserId, examples, expiresAt);
    await reply(
      chatId,
      '<b>💡 Starter questions</b>\n\nTap one — or type your own anytime.',
      { replyMarkup: followUpQuestionsKeyboard(examples, { showHome: true }) },
    );
    return;
  }

  if (data === 'menu:referral' || data === 'ref:refresh') {
    await showReferral(tgUser, chatId, data === 'ref:refresh' ? messageId : undefined);
    return;
  }

  if (data === 'ref:create') {
    await setPendingAction(tgUser.telegramUserId, {
      type: 'referral_name',
      step: 'input',
      data: {},
      expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS),
    });
    const msg =
      '<b>✨ Referral name</b>\n\nSend your name (3–24 chars, letters/numbers/hyphens):';
    if (messageId) {
      await editTelegramMessageText({
        token: getSyraTelegramBotToken(),
        chatId: String(chatId),
        messageId,
        text: msg,
        parseMode: 'HTML',
        replyMarkup: cancelOnlyKeyboard(),
      });
    } else {
      await reply(chatId, msg, { replyMarkup: cancelOnlyKeyboard() });
    }
    return;
  }

  if (data === 'ref:clear') {
    const result = await clearUserReferralCode(tgUser.telegramUserId);
    if (!result.ok) {
      await reply(chatId, escapeTelegramHtml(result.error), { replyMarkup: referralKeyboard() });
      return;
    }
    const refreshed = await refreshTelegramUser(tgUser.telegramUserId);
    if (refreshed) {
      await showReferral(refreshed, chatId, messageId);
    } else {
      await reply(chatId, 'Referral name removed.', { replyMarkup: referralKeyboard() });
    }
    return;
  }
}

/**
 * @param {object} update
 */
export async function handleSyraTelegramUpdate(update) {
  if (!getSyraTelegramBotToken()) return;

  try {
    if (update?.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }

    const message = update?.message;
    if (!message?.text) return;

    const userInput = extractTelegramUser(message);
    if (!userInput?.chatId) return;

    const text = String(message.text).trim();
    const chatId = userInput.chatId;
    const lower = text.toLowerCase();

    if (lower.startsWith('/start')) {
      try {
        const walletResult = await ensureTelegramUserWallet(userInput);
        const startPayload = parseStartReferralPayload(text);
        let referralLinkedCode = null;
        if (startPayload) {
          const link = await linkReferredUser(userInput.telegramUserId, startPayload);
          if (link.linked && link.referrerCode) {
            referralLinkedCode = link.referrerCode;
          }
        }
        await showHomeMenu(chatId, userInput.firstName, undefined, {
          isNewWallet: walletResult.isNewWallet,
          referralLinkedCode,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[syra-telegram] /start failed:', msg);
        const isDb =
          /mongo|connect|ECONNREFUSED|buffering timed out|server selection/i.test(msg);
        await reply(
          chatId,
          isDb
            ? 'Syra is still connecting to the database. Wait a few seconds and send /start again.'
            : `Could not create your wallet: ${escapeTelegramHtml(msg)}`,
          { replyMarkup: mainMenuKeyboard() },
        );
      }
      return;
    }

    let tgUser = await getTelegramBotUser(userInput.telegramUserId);
    if (!tgUser) {
      const walletResult = await ensureTelegramUserWallet(userInput);
      tgUser = walletResult.telegramUser;
    }

    if (lower.startsWith('/wallet')) {
      await showWallet(tgUser, chatId);
      return;
    }

    if (lower.startsWith('/portfolio') || lower.startsWith('/portofolio')) {
      await showPortfolio(tgUser, chatId);
      return;
    }

    const command = lower.split(/\s/)[0].split('@')[0];
    if (command === '/referral' || command === '/ref') {
      await handleReferralCommand(tgUser, chatId, text);
      return;
    }

    if (lower.startsWith('/help')) {
      await reply(chatId, buildHelpText(), { replyMarkup: mainMenuKeyboard() });
      return;
    }

    if (isCommand(text)) {
      await reply(chatId, 'Unknown command. Try /help or just ask me a question.', {
        replyMarkup: mainMenuKeyboard(),
      });
      return;
    }

    if (tgUser.pendingAction) {
      const handled = await handlePendingAction(tgUser, text, chatId);
      if (handled) return;
    }

    await handleBrainQuestion(tgUser, chatId, text);
  } catch (e) {
    console.error('[syra-telegram] handleSyraTelegramUpdate error:', e instanceof Error ? e.stack || e.message : e);
    const chatId = update?.message?.chat?.id ?? update?.callback_query?.message?.chat?.id;
    if (chatId) {
      await reply(chatId, 'Something went wrong. Please try again in a moment.', {
        replyMarkup: mainMenuKeyboard(),
      }).catch(() => {});
    }
  }
}

/**
 * @returns {boolean}
 */
export function isSyraTelegramBotReady() {
  return Boolean(getSyraTelegramBotToken());
}
