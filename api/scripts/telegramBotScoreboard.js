/**
 * Telegram bot weekly scoreboard CLI.
 *
 *   cd api && node scripts/telegramBotScoreboard.js
 *   node scripts/telegramBotScoreboard.js --days=7 --notify
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  computeTelegramScoreboard,
  formatTelegramScoreboardText,
} from '../libs/syraTelegramBot/telegramScoreboard.js';
import { isDevTelegramConfigured, sendDevTelegram } from '../libs/devTelegramNotifier.js';

async function main() {
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const days = daysArg ? Number(daysArg.split('=')[1]) || 7 : 7;
  const notify = process.argv.includes('--notify');

  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  try {
    const board = await computeTelegramScoreboard(days);
    const text = formatTelegramScoreboardText(board);
    console.log(text);
    console.log('\nJSON:\n', JSON.stringify(board, null, 2));

    if (notify && isDevTelegramConfigured()) {
      await sendDevTelegram(text, { disableWebPagePreview: true });
      console.log('\nSent to SYRA_DEV_BOT.');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
