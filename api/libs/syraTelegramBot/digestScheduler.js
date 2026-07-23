/**
 * Syra Daily digest scheduler — once per day at WIB wall clock.
 */
import {
  getTelegramDigestWibHour,
  getTelegramDigestWibMinute,
  isTelegramDigestEnabled,
  isSyraTelegramBotConfigured,
} from '../../config/syraTelegramBotConfig.js';
import { getMsUntilNextWibWallClock } from '../wibDailyWallClock.js';
import { startupVerbose } from '../../utils/startupLog.js';
import {
  buildSyraDailyDigestContent,
  findDigestRecipients,
  sendDigestToUser,
} from './digestService.js';

const SEND_GAP_MS = 80;

/**
 * @returns {Promise<{ sent: number; failed: number; recipients: number }>}
 */
export async function runSyraTelegramDailyDigest() {
  if (!isSyraTelegramBotConfigured()) {
    return { sent: 0, failed: 0, recipients: 0 };
  }

  const content = await buildSyraDailyDigestContent();
  const recipients = await findDigestRecipients();
  let sent = 0;
  let failed = 0;

  for (const user of recipients) {
    const streak = Number(user.digestDayStreak) || 0;
    try {
      const result = await sendDigestToUser(user, content, streak);
      if (result.ok) sent += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
    await new Promise((r) => setTimeout(r, SEND_GAP_MS));
  }

  startupVerbose(
    `[syra-telegram-digest] done recipients=${recipients.length} sent=${sent} failed=${failed}`,
  );
  return { sent, failed, recipients: recipients.length };
}

export function startSyraTelegramDigestScheduler() {
  if (!isTelegramDigestEnabled()) {
    startupVerbose('[syra-telegram-digest] disabled (TELEGRAM_DIGEST_ENABLED=false)');
    return;
  }
  if (!isSyraTelegramBotConfigured()) {
    startupVerbose('[syra-telegram-digest] skipped — bot not configured');
    return;
  }

  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const hour = getTelegramDigestWibHour();
  const minute = getTelegramDigestWibMinute();

  const tick = async () => {
    if (running) {
      console.warn('[syra-telegram-digest] skipped tick: previous run still in progress');
      return;
    }
    running = true;
    try {
      await runSyraTelegramDailyDigest();
    } catch (e) {
      console.error(
        '[syra-telegram-digest] pipeline failed:',
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs = getMsUntilNextWibWallClock(new Date(), hour, minute);
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    startupVerbose(
      `[syra-telegram-digest] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();
  startupVerbose(
    `[syra-telegram-digest] enabled; WIB daily ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} Asia/Jakarta`,
  );
}
