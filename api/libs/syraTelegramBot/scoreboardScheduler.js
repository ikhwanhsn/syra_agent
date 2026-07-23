/**
 * Weekly Telegram growth scoreboard → SYRA_DEV_BOT (Monday WIB morning).
 */
import {
  computeTelegramScoreboard,
  formatTelegramScoreboardText,
} from './telegramScoreboard.js';
import { isDevTelegramConfigured, sendDevTelegram } from '../devTelegramNotifier.js';
import { getMsUntilNextWibWallClock } from '../wibDailyWallClock.js';
import { startupVerbose } from '../../utils/startupLog.js';

function isWibMonday(date = new Date()) {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.getUTCDay() === 1;
}

export async function runTelegramScoreboardNotify() {
  const board = await computeTelegramScoreboard(7);
  const text = formatTelegramScoreboardText(board);
  startupVerbose(`[syra-telegram-scoreboard]\n${text}`);
  if (isDevTelegramConfigured()) {
    await sendDevTelegram(text, { disableWebPagePreview: true });
  }
  return board;
}

export function startSyraTelegramScoreboardScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const hour = Number(process.env.TELEGRAM_SCOREBOARD_WIB_HOUR ?? 9);
  const minute = Number(process.env.TELEGRAM_SCOREBOARD_WIB_MINUTE ?? 0);

  const tick = async () => {
    if (!isWibMonday()) {
      startupVerbose('[syra-telegram-scoreboard] skip — not Monday WIB');
      return;
    }
    if (running) return;
    running = true;
    try {
      await runTelegramScoreboardNotify();
    } catch (e) {
      console.error(
        '[syra-telegram-scoreboard] failed:',
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs = getMsUntilNextWibWallClock(new Date(), hour, minute);
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delayMs);
    startupVerbose(
      `[syra-telegram-scoreboard] next check in ${Math.round(delayMs / 1000)}s (weekly Mon ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WIB)`,
    );
  };

  scheduleNext();
}
