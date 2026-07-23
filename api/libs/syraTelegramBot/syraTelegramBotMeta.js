/**
 * Syra Telegram bot metadata and webhook registration.
 */
import {
  getSyraTelegramBotToken,
  getSyraTelegramWebhookSecret,
  getSyraTelegramWebhookUrl,
} from '../../config/syraTelegramBotConfig.js';

/** @type {{ id: number; username: string } | null} */
let botMeta = null;

/**
 * @returns {Promise<{ id: number; username: string } | null>}
 */
export async function getSyraTelegramBotMeta() {
  if (botMeta) return botMeta;
  const token = getSyraTelegramBotToken();
  if (!token) return null;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const result = data?.result;
  const username = typeof result?.username === 'string' ? result.username : '';
  const id = Number(result?.id);
  if (!username || !Number.isFinite(id)) return null;

  botMeta = { id, username };
  return botMeta;
}

/**
 * @param {string} webhookUrl
 * @returns {boolean}
 */
export function isPublicHttpsUrl(webhookUrl) {
  try {
    const parsed = new URL(webhookUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
  } catch {
    return false;
  }
}

/**
 * @returns {Promise<boolean>}
 */
export async function registerSyraTelegramWebhookIfConfigured() {
  const webhookUrl = getSyraTelegramWebhookUrl();
  if (!webhookUrl) return false;

  if (!isPublicHttpsUrl(webhookUrl)) {
    console.warn(
      '[syra-telegram] setWebhook skipped — SYRA_TELEGRAM_WEBHOOK_URL must be a public HTTPS URL',
    );
    return false;
  }

  const token = getSyraTelegramBotToken();
  if (!token) return false;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/setWebhook`;
  const body = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false,
  };
  const secret = getSyraTelegramWebhookSecret();
  if (secret) {
    body.secret_token = secret;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok !== true) {
    console.warn('[syra-telegram] setWebhook failed:', JSON.stringify(data).slice(0, 300));
    return false;
  }

  return true;
}

/**
 * @returns {Promise<void>}
 */
export async function registerSyraTelegramCommands() {
  const token = getSyraTelegramBotToken();
  if (!token) return;

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/setMyCommands`;
  const commands = [
    { command: 'start', description: 'Welcome & create wallet' },
    { command: 'wallet', description: 'View wallet & balances' },
    { command: 'portfolio', description: 'View all token holdings' },
    { command: 'referral', description: 'Referral link & stats' },
    { command: 'digest', description: 'Syra Daily on/off' },
    { command: 'mute', description: 'Mute daily digests' },
    { command: 'help', description: 'How to use Syra bot' },
  ];

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });
}

/**
 * @returns {Promise<void>}
 */
export async function deleteSyraTelegramWebhook() {
  const token = getSyraTelegramBotToken();
  if (!token) return;
  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/deleteWebhook`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: false }),
  });
}
