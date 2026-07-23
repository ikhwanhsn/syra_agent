/**
 * Telegram bot funnel scoreboard (7d window vs 30-day growth targets).
 */
import TelegramBotEvent from '../../models/agent/TelegramBotEvent.js';
import TelegramBotUser from '../../models/agent/TelegramBotUser.js';

export const TELEGRAM_SCOREBOARD_TARGETS = {
  d0MessageRate: 0.7,
  d1ReturnRate: 0.25,
  referralAttributedShare: 0.2,
  digestReplyRateMin: 0.05,
  paidToolsGrowthMultiple: 3,
};

/**
 * @param {number} [days=7]
 */
export async function computeTelegramScoreboard(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const [users, eventsByType, totalUsers, messagedUsers, referredUsers, digestEnabled] =
    await Promise.all([
      TelegramBotUser.countDocuments({ createdAt: { $gte: since } }),
      TelegramBotEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
      TelegramBotUser.countDocuments({}),
      TelegramBotUser.countDocuments({ messagesCount: { $gt: 0 } }),
      TelegramBotUser.countDocuments({ referredByAnonymousId: { $ne: null } }),
      TelegramBotUser.countDocuments({
        $and: [
          { $or: [{ digestEnabled: true }, { digestEnabled: null, messagesCount: { $gte: 1 } }] },
          { $or: [{ digestMutedAt: null }, { digestMutedAt: { $exists: false } }] },
        ],
      }),
    ]);

  /** @type {Record<string, number>} */
  const counts = {};
  for (const row of eventsByType) {
    counts[row._id] = row.count;
  }

  const starts = counts.tg_start || 0;
  const firstMessages = counts.tg_first_message || 0;
  const freeTools = counts.tg_free_tool || 0;
  const paidTools = counts.tg_paid_tool || 0;
  const depositPrompts = counts.tg_deposit_prompt || 0;
  const referralShares = counts.tg_referral_share || 0;
  const referralLinked = counts.tg_referral_linked || 0;
  const digestsSent = counts.tg_digest_sent || 0;
  const digestOpens = counts.tg_digest_open || 0;
  const digestReplies = counts.tg_digest_reply || 0;

  const d0Rate = starts > 0 ? firstMessages / starts : messagedUsers / Math.max(totalUsers, 1);
  const digestReplyRate = digestsSent > 0 ? digestReplies / digestsSent : 0;
  const referralShareOfNew = users > 0 ? referralLinked / users : 0;

  const killDigest =
    digestsSent >= 50 && digestReplyRate < TELEGRAM_SCOREBOARD_TARGETS.digestReplyRateMin;

  return {
    windowDays: days,
    sinceIso,
    totals: {
      registeredUsers: totalUsers,
      messagedUsers,
      referredUsers,
      digestEligible: digestEnabled,
    },
    window: {
      newUsers: users,
      starts,
      firstMessages,
      freeTools,
      paidTools,
      depositPrompts,
      referralShares,
      referralLinked,
      digestsSent,
      digestOpens,
      digestReplies,
    },
    rates: {
      d0MessageRate: d0Rate,
      digestReplyRate,
      referralAttributedShare: referralShareOfNew,
    },
    targets: TELEGRAM_SCOREBOARD_TARGETS,
    flags: {
      killDigestSuggestion: killDigest,
      d0OnTrack: d0Rate >= TELEGRAM_SCOREBOARD_TARGETS.d0MessageRate,
      referralOnTrack: referralShareOfNew >= TELEGRAM_SCOREBOARD_TARGETS.referralAttributedShare,
    },
  };
}

/**
 * @param {Awaited<ReturnType<typeof computeTelegramScoreboard>>} board
 */
export function formatTelegramScoreboardText(board) {
  const pct = (n) => `${(n * 100).toFixed(1)}%`;
  const lines = [
    `Syra Telegram scoreboard (${board.windowDays}d)`,
    `since ${board.sinceIso.slice(0, 10)}`,
    '',
    `Users: ${board.totals.registeredUsers} registered · ${board.totals.messagedUsers} messaged · ${board.totals.referredUsers} referred`,
    `Digest eligible: ${board.totals.digestEligible}`,
    '',
    `Window: +${board.window.newUsers} users · ${board.window.starts} starts · ${board.window.firstMessages} first msgs`,
    `Tools: ${board.window.freeTools} free · ${board.window.paidTools} paid · ${board.window.depositPrompts} deposit prompts`,
    `Referral: ${board.window.referralLinked} linked · ${board.window.referralShares} share setups`,
    `Digest: ${board.window.digestsSent} sent · ${board.window.digestOpens} opens · ${board.window.digestReplies} replies`,
    '',
    `D0 message rate: ${pct(board.rates.d0MessageRate)} (target ≥${pct(board.targets.d0MessageRate)}) ${board.flags.d0OnTrack ? 'OK' : 'BELOW'}`,
    `Referral attributed: ${pct(board.rates.referralAttributedShare)} (target ≥${pct(board.targets.referralAttributedShare)}) ${board.flags.referralOnTrack ? 'OK' : 'BELOW'}`,
    `Digest reply rate: ${pct(board.rates.digestReplyRate)} (kill if <${pct(board.targets.digestReplyRateMin)} after volume)`,
  ];
  if (board.flags.killDigestSuggestion) {
    lines.push(
      '',
      'KILL CRITERIA: digest reply rate below floor with enough sends — pause or rewrite digest.',
    );
  }
  lines.push('', 'North star: paid tool calls from Telegram (not vanity MAU).');
  return lines.join('\n');
}
