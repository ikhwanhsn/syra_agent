/**
 * Long-polling fallback for Syra Telegram bot (local dev without public webhook URL).
 */
import {
  getSyraTelegramBotToken,
  isSyraTelegramBotEnabled,
  isSyraTelegramBotConfigured,
} from '../../config/syraTelegramBotConfig.js';
import { handleSyraTelegramUpdate } from './handler.js';

/** @type {number} */
let offset = 0;

/** @type {boolean} */
let polling = false;

/** @type {number} */
let conflictFailures = 0;

const MAX_CONFLICT_FAILURES = 5;

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollOnce() {
  const token = getSyraTelegramBotToken();
  if (!token) return;

  const url = new URL(`https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('timeout', '25');
  url.searchParams.set('allowed_updates', JSON.stringify(['message', 'callback_query']));

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 409) {
      conflictFailures += 1;
      console.warn(
        '[syra-telegram-poll] getUpdates conflict (409) — another process may be using this bot token',
      );
      if (conflictFailures >= MAX_CONFLICT_FAILURES) {
        console.warn('[syra-telegram-poll] stopping after repeated 409 conflicts');
        stopSyraTelegramPolling();
      }
      await sleep(Math.min(30_000, 2_000 * conflictFailures));
      return;
    }

    const body = await res.text().catch(() => '');
    console.warn('[syra-telegram-poll] getUpdates failed:', res.status, body.slice(0, 200));
    return;
  }

  conflictFailures = 0;
  const data = await res.json();
  if (data?.ok === false) {
    console.warn('[syra-telegram-poll] Telegram API error:', JSON.stringify(data).slice(0, 200));
    return;
  }

  const updates = Array.isArray(data?.result) ? data.result : [];

  for (const update of updates) {
    if (typeof update?.update_id === 'number') {
      offset = update.update_id + 1;
    }
    try {
      await handleSyraTelegramUpdate(update);
    } catch (e) {
      console.error('[syra-telegram] update handler error:', e instanceof Error ? e.message : e);
    }
  }
}

/**
 * @param {{ force?: boolean }} [options]
 */
export async function startSyraTelegramPolling(options = {}) {
  if (!options.force && !isSyraTelegramBotEnabled()) return;
  if (!isSyraTelegramBotConfigured()) return;
  if (polling) return;

  polling = true;
  conflictFailures = 0;

  const loop = async () => {
    while (polling) {
      try {
        await pollOnce();
      } catch (e) {
        console.warn('[syra-telegram-poll]', e instanceof Error ? e.message : e);
        await sleep(3_000);
      }
    }
  };

  void loop();
}

export function stopSyraTelegramPolling() {
  polling = false;
}
