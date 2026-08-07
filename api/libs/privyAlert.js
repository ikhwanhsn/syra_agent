/**
 * Throttled Telegram alerts for Privy API failures (quota, auth, outages).
 */

import {
  sendDevTelegram,
  isDevTelegramConfigured,
} from './devTelegramNotifier.js';

/** One alert per error code per this window (30 minutes). */
export const PRIVY_ALERT_THROTTLE_MS = 30 * 60 * 1000;

/** @type {Map<string, number>} code -> last alert timestamp */
const lastAlertByCode = new Map();

/**
 * @param {string} code
 * @param {number} [now]
 * @returns {boolean}
 */
export function canAlertPrivyFailure(code, now = Date.now()) {
  const key = String(code || 'unknown').trim() || 'unknown';
  const last = lastAlertByCode.get(key);
  if (last == null) return true;
  return Number(now) - last >= PRIVY_ALERT_THROTTLE_MS;
}

/**
 * @param {string} code
 * @param {number} [now]
 */
export function markPrivyFailureAlerted(code, now = Date.now()) {
  lastAlertByCode.set(String(code || 'unknown').trim() || 'unknown', Number(now) || Date.now());
}

/** Clear throttle state (tests). */
export function resetPrivyAlertState() {
  lastAlertByCode.clear();
}

/**
 * @param {{
 *   code: string;
 *   status?: number | null;
 *   path?: string | null;
 *   message?: string | null;
 *   now?: number;
 *   send?: typeof sendDevTelegram;
 * }} input
 * @returns {Promise<{ sent: boolean; skipped: 'unconfigured' | 'throttled' | null }>}
 */
export async function alertPrivyFailure(input = {}) {
  const code = String(input.code || 'privy_error').trim() || 'privy_error';
  const now = input.now != null ? Number(input.now) : Date.now();
  const send = input.send || sendDevTelegram;

  if (!isDevTelegramConfigured() && input.send == null) {
    return { sent: false, skipped: 'unconfigured' };
  }

  if (!canAlertPrivyFailure(code, now)) {
    return { sent: false, skipped: 'throttled' };
  }

  const status = input.status != null ? String(input.status) : '-';
  const path = input.path ? String(input.path).slice(0, 120) : '-';
  const message = input.message ? String(input.message).slice(0, 280) : '-';

  const text = [
    '[Privy] API failure',
    `code: ${code}`,
    `status: ${status}`,
    `path: ${path}`,
    `message: ${message}`,
  ].join('\n');

  const ok = await send(text);
  if (ok) markPrivyFailureAlerted(code, now);
  return { sent: Boolean(ok), skipped: null };
}
