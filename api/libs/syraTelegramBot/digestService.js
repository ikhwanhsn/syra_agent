/**
 * Syra Daily — shared digest content + send helpers for Telegram bot users.
 */
import { getAgentTool } from '../../config/agentTools.js';
import { executeAgentToolCall } from '../agentToolExecutor.js';
import { escapeTelegramHtml, isTelegramParseEntityError } from '../telegramFormat.js';
import {
  sendTelegramMessage,
  sendTelegramPhoto,
  TELEGRAM_CAPTION_MAX_LEN,
} from '../telegramBot.js';
import { getSyraTelegramBotToken } from '../../config/syraTelegramBotConfig.js';
import TelegramBotUser from '../../models/agent/TelegramBotUser.js';
import { recordTelegramBotEvent } from '../../utils/recordTelegramBotEvent.js';
import { buildTelegramChartAttachment } from './chartService.js';
import {
  assembleDigestSections,
  buildDigestPhotoCaption,
  buildDigestReplyMarkup,
} from './digestFormat.js';

export { buildDigestPhotoCaption } from './digestFormat.js';

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
 * @param {string} toolId
 * @param {Record<string, string>} params
 * @returns {Promise<unknown | null>}
 */
async function runDigestTool(toolId, params) {
  if (!getAgentTool(toolId)) return null;
  try {
    const result = await withTimeout(
      executeAgentToolCall({
        anonymousId: 'telegram-digest',
        toolId,
        params,
        useTreasury: true,
        skipUsdcCharge: true,
        ctx: {},
      }),
      DIGEST_TOOL_TIMEOUT_MS,
    );
    if (result?.body?.success && result.body.data) return result.body.data;
    return null;
  } catch (e) {
    console.warn(`[syra-digest] ${toolId} failed:`, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Build one shared morning digest (treasury-funded tools).
 * @returns {Promise<{ html: string; replyMarkup: object; chartAttachment?: { png: Buffer; caption: string; detailUrl: string } | null }>}
 */
export async function buildSyraDailyDigestContent() {
  const [newsData, sentimentData, eventData, signalData] = await Promise.all([
    runDigestTool('news', { ticker: 'general' }),
    runDigestTool('sentiment', { ticker: 'BTC' }),
    runDigestTool('event', { ticker: 'general' }),
    runDigestTool('signal', { token: 'bitcoin' }),
  ]);

  const { sectionLines, hasEvents, hasSignal } = assembleDigestSections({
    newsData,
    sentimentData,
    eventData,
    signalData,
  });

  /** @type {string[]} */
  const bodyLines =
    sectionLines.length > 0
      ? sectionLines
      : [
          '• Markets are moving — ask Syra for <b>BTC news</b> or a <b>SOL signal</b>.',
          '• Tip: short live-data asks work best.',
        ];

  const html = [
    '<b>☀️ Syra Daily</b>',
    '<i>What matters this morning</i>',
    '',
    ...bodyLines,
    '',
    'Tap a shortcut or ask anything.',
    '',
    '<i>/digest off</i> to pause · <i>/mute</i> to stop all digests',
  ].join('\n');

  const replyMarkup = buildDigestReplyMarkup({ hasEvents, hasSignal });

  /** @type {{ png: Buffer; caption: string; detailUrl: string } | null} */
  let chartAttachment = null;
  try {
    chartAttachment = await buildTelegramChartAttachment(
      'signal',
      { token: 'bitcoin' },
      signalData && typeof signalData === 'object' ? signalData : {},
    );
  } catch (e) {
    console.warn('[syra-digest] chart failed:', e instanceof Error ? e.message : e);
  }

  return { html, replyMarkup, chartAttachment };
}

const DIGEST_QUESTIONS = {
  btc_news: 'BTC news',
  sol_signal: 'SOL trading signal',
  smart_money: 'Smart money netflow today',
  btc_signal: 'BTC trading signal',
  events: 'Crypto events today',
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
 * @param {{ html: string; replyMarkup: object; chartAttachment?: { png: Buffer; caption: string; detailUrl: string } | null }} content
 * @param {number} [streak]
 */
export async function sendDigestToUser(user, content, streak = 0) {
  const token = getSyraTelegramBotToken();
  if (!token || !user?.chatId) return { ok: false };

  const streakLine =
    streak > 1 ? `\n\n<i>Day ${streak} checking markets with Syra</i>` : '';
  const fullHtml = `${content.html}${streakLine}`;
  const chatId = String(user.chatId);
  const chart = content.chartAttachment;

  const markSent = async () => {
    const now = new Date();
    await TelegramBotUser.updateOne(
      { telegramUserId: user.telegramUserId },
      { $set: { lastDigestAt: now } },
    );
    void recordTelegramBotEvent('tg_digest_sent', {
      telegramUserId: user.telegramUserId,
      anonymousId: user.anonymousId,
    });
  };

  if (chart?.png) {
    const chartKeyboard = chart.detailUrl
      ? {
          inline_keyboard: [[{ text: 'Open full chart ↗', url: chart.detailUrl }]],
        }
      : null;
    const header = escapeTelegramHtml(String(chart.caption || '').trim());
    const sep = '\n\n';
    const fitsInCaption =
      Boolean(header) && `${header}${sep}${fullHtml}`.length <= TELEGRAM_CAPTION_MAX_LEN;

    if (fitsInCaption) {
      const caption = buildDigestPhotoCaption(chart.caption, fullHtml);
      const replyMarkup = mergeDigestKeyboards(chartKeyboard, content.replyMarkup);
      let photoResult = await sendTelegramPhoto({
        token,
        chatId,
        photo: chart.png,
        caption,
        parseMode: 'HTML',
        replyMarkup,
      });
      if (!photoResult.ok && isTelegramParseEntityError(photoResult.error)) {
        photoResult = await sendTelegramPhoto({
          token,
          chatId,
          photo: chart.png,
          caption: caption.replace(/<[^>]+>/g, ''),
          parseMode: null,
          replyMarkup,
        });
      }
      if (photoResult.ok) {
        await markSent();
        return photoResult;
      }
    } else {
      const priceCaption = header.slice(0, TELEGRAM_CAPTION_MAX_LEN);
      let photoResult = await sendTelegramPhoto({
        token,
        chatId,
        photo: chart.png,
        caption: priceCaption || undefined,
        parseMode: priceCaption ? 'HTML' : null,
        replyMarkup: chartKeyboard || undefined,
      });
      if (!photoResult.ok && priceCaption && isTelegramParseEntityError(photoResult.error)) {
        photoResult = await sendTelegramPhoto({
          token,
          chatId,
          photo: chart.png,
          caption: priceCaption.replace(/<[^>]+>/g, ''),
          parseMode: null,
          replyMarkup: chartKeyboard || undefined,
        });
      }
      // Continue to text digest even if photo failed.
    }
  }

  let result = await sendTelegramMessage({
    token,
    chatId,
    text: fullHtml,
    parseMode: 'HTML',
    disableWebPagePreview: true,
    replyMarkup: content.replyMarkup,
  });
  if (!result.ok && isTelegramParseEntityError(result.error)) {
    result = await sendTelegramMessage({
      token,
      chatId,
      text: fullHtml.replace(/<[^>]+>/g, ''),
      parseMode: null,
      disableWebPagePreview: true,
      replyMarkup: content.replyMarkup,
    });
  }

  if (result.ok) await markSent();
  return result;
}

/**
 * @param {object | null | undefined} a
 * @param {object | null | undefined} b
 */
function mergeDigestKeyboards(a, b) {
  const rowsA = Array.isArray(a?.inline_keyboard) ? a.inline_keyboard : [];
  const rowsB = Array.isArray(b?.inline_keyboard) ? b.inline_keyboard : [];
  const rows = [...rowsA, ...rowsB];
  return rows.length > 0 ? { inline_keyboard: rows } : undefined;
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
