/**
 * Syra Daily — shared digest content + send helpers for Telegram bot users.
 */
import { getAgentTool } from '../../config/agentTools.js';
import { executeAgentToolCall } from '../agentToolExecutor.js';
import { escapeTelegramHtml } from '../telegramFormat.js';
import { sendTelegramMessage } from '../telegramBot.js';
import { getSyraTelegramBotToken } from '../../config/syraTelegramBotConfig.js';
import TelegramBotUser from '../../models/agent/TelegramBotUser.js';
import { recordTelegramBotEvent } from '../../utils/recordTelegramBotEvent.js';

const DIGEST_TOOL_TIMEOUT_MS = 40_000;

/**
 * @param {Promise<any>} promise
 * @param {number} ms
 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('digest_tool_timeout')), ms)),
  ]);
}

/**
 * Build one shared morning digest (treasury-funded tools).
 * @returns {Promise<{ html: string; replyMarkup: object }>}
 */
export async function buildSyraDailyDigestContent() {
  const bullets = [];

  const newsTool = getAgentTool('news');
  if (newsTool) {
    try {
      const result = await withTimeout(
        executeAgentToolCall({
          anonymousId: 'telegram-digest',
          toolId: 'news',
          params: { ticker: 'general' },
          useTreasury: true,
          skipUsdcCharge: true,
          ctx: {},
        }),
        DIGEST_TOOL_TIMEOUT_MS,
      );
      if (result?.body?.success && result.body.data) {
        const data = result.body.data;
        const items = Array.isArray(data?.news)
          ? data.news
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [];
        const top = items.slice(0, 2);
        for (const item of top) {
          const title = String(item?.title || item?.headline || '').trim();
          if (title) bullets.push(`• ${escapeTelegramHtml(title.slice(0, 140))}`);
        }
      }
    } catch (e) {
      console.warn('[syra-digest] news failed:', e instanceof Error ? e.message : e);
    }
  }

  const sentimentTool = getAgentTool('sentiment');
  if (sentimentTool) {
    try {
      const result = await withTimeout(
        executeAgentToolCall({
          anonymousId: 'telegram-digest',
          toolId: 'sentiment',
          params: { ticker: 'BTC' },
          useTreasury: true,
          skipUsdcCharge: true,
          ctx: {},
        }),
        DIGEST_TOOL_TIMEOUT_MS,
      );
      if (result?.body?.success && result.body.data) {
        const d = result.body.data;
        const label =
          d?.sentiment || d?.label || d?.overall || d?.summary || JSON.stringify(d).slice(0, 80);
        if (label) {
          bullets.push(`• BTC pulse: <b>${escapeTelegramHtml(String(label).slice(0, 100))}</b>`);
        }
      }
    } catch (e) {
      console.warn('[syra-digest] sentiment failed:', e instanceof Error ? e.message : e);
    }
  }

  if (bullets.length === 0) {
    bullets.push('• Markets are moving — ask Syra for <b>BTC news</b> or a <b>SOL signal</b>.');
    bullets.push('• Tip: short live-data asks work best.');
  }

  const html = [
    '<b>☀️ Syra Daily</b>',
    '<i>What matters this morning</i>',
    '',
    ...bullets.slice(0, 5),
    '',
    'Tap a shortcut or ask anything.',
    '',
    '<i>/digest off</i> to pause · <i>/mute</i> to stop all digests',
  ].join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: 'BTC news', callback_data: 'digest:q:btc_news' },
        { text: 'SOL signal', callback_data: 'digest:q:sol_signal' },
      ],
      [
        { text: 'Smart money today', callback_data: 'digest:q:smart_money' },
        { text: 'Ask Syra', callback_data: 'menu:ask' },
      ],
    ],
  };

  return { html, replyMarkup };
}

const DIGEST_QUESTIONS = {
  btc_news: 'BTC news',
  sol_signal: 'SOL trading signal',
  smart_money: 'Smart money netflow today',
};

/**
 * @param {string} key
 * @returns {string | null}
 */
export function resolveDigestQuestion(key) {
  return DIGEST_QUESTIONS[String(key || '')] || null;
}

/**
 * Users who should receive today's digest.
 * @returns {Promise<object[]>}
 */
export async function findDigestRecipients() {
  return TelegramBotUser.find({
    $and: [
      { $or: [{ digestEnabled: true }, { digestEnabled: null, messagesCount: { $gte: 1 } }] },
      { $or: [{ digestMutedAt: null }, { digestMutedAt: { $exists: false } }] },
    ],
  })
    .select('telegramUserId chatId anonymousId digestDayStreak lastDigestAt firstName')
    .lean();
}

/**
 * @param {object} user
 * @param {{ html: string; replyMarkup: object }} content
 * @param {number} [streak]
 */
export async function sendDigestToUser(user, content, streak = 0) {
  const token = getSyraTelegramBotToken();
  if (!token || !user?.chatId) return { ok: false };

  const streakLine =
    streak > 1
      ? `\n\n<i>Day ${streak} checking markets with Syra</i>`
      : '';

  const result = await sendTelegramMessage({
    token,
    chatId: String(user.chatId),
    text: `${content.html}${streakLine}`,
    parseMode: 'HTML',
    disableWebPagePreview: true,
    replyMarkup: content.replyMarkup,
  });

  if (result.ok) {
    const now = new Date();
    await TelegramBotUser.updateOne(
      { telegramUserId: user.telegramUserId },
      { $set: { lastDigestAt: now } },
    );
    void recordTelegramBotEvent('tg_digest_sent', {
      telegramUserId: user.telegramUserId,
      anonymousId: user.anonymousId,
    });
  }

  return result;
}

/**
 * Mark that the user engaged with today's digest (reply / button).
 * @param {number} telegramUserId
 */
export async function markDigestEngagement(telegramUserId) {
  const tid = Math.trunc(Number(telegramUserId));
  if (!Number.isFinite(tid)) return;

  const user = await TelegramBotUser.findOne({ telegramUserId: tid }).lean();
  if (!user?.lastDigestAt) return;

  const lastDigest = new Date(user.lastDigestAt);
  const now = new Date();
  const sameUtcDay =
    lastDigest.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (!sameUtcDay) return;

  if (user.lastDigestReplyAt) {
    const lastReply = new Date(user.lastDigestReplyAt);
    if (lastReply.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)) {
      return;
    }
  }

  const prevStreak = Number(user.digestDayStreak) || 0;
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const continued =
    user.lastDigestReplyAt &&
    new Date(user.lastDigestReplyAt).toISOString().slice(0, 10) === yesterdayKey;

  await TelegramBotUser.updateOne(
    { telegramUserId: tid },
    {
      $set: {
        lastDigestReplyAt: now,
        digestDayStreak: continued ? prevStreak + 1 : 1,
      },
    },
  );

  void recordTelegramBotEvent('tg_digest_reply', {
    telegramUserId: tid,
    anonymousId: user.anonymousId,
    props: { streak: continued ? prevStreak + 1 : 1 },
  });
}

/**
 * @param {number} telegramUserId
 * @param {boolean} enabled
 */
export async function setDigestPreference(telegramUserId, enabled) {
  const tid = Math.trunc(Number(telegramUserId));
  const update = enabled
    ? { $set: { digestEnabled: true, digestMutedAt: null } }
    : { $set: { digestEnabled: false } };
  await TelegramBotUser.updateOne({ telegramUserId: tid }, update);
  void recordTelegramBotEvent(enabled ? 'tg_digest_unmute' : 'tg_digest_mute', {
    telegramUserId: tid,
  });
}

/**
 * @param {number} telegramUserId
 */
export async function muteDigests(telegramUserId) {
  const tid = Math.trunc(Number(telegramUserId));
  await TelegramBotUser.updateOne(
    { telegramUserId: tid },
    { $set: { digestEnabled: false, digestMutedAt: new Date() } },
  );
  void recordTelegramBotEvent('tg_digest_mute', { telegramUserId: tid });
}

/**
 * Auto-enable digest after first meaningful message if still unset.
 * @param {number} telegramUserId
 */
export async function enableDigestIfUnset(telegramUserId) {
  await TelegramBotUser.updateOne(
    {
      telegramUserId: Math.trunc(Number(telegramUserId)),
      digestEnabled: null,
    },
    { $set: { digestEnabled: true } },
  );
}
