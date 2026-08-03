/**
 * Throttled Telegram alerts for Labs x402 PayTo underfunding.
 * Uses the shared Syra dev Telegram notifier.
 */

import {
  sendDevTelegram,
  isDevTelegramConfigured,
} from '../devTelegramNotifier.js';

/** One alert per chain per this window (1 hour). */
export const PAYTO_UNDERFUNDED_ALERT_THROTTLE_MS = 60 * 60 * 1000;

/** @type {Map<string, number>} chain -> last alert timestamp */
const lastAlertByChain = new Map();

/**
 * @param {string} chain
 * @returns {string}
 */
function normalizeChainKey(chain) {
  return String(chain || '').trim().toLowerCase() || 'unknown';
}

/**
 * Whether an alert may be sent for this chain right now (throttle gate).
 * Pure enough for tests when `now` is injected.
 * @param {string} chain
 * @param {number} [now]
 * @returns {boolean}
 */
export function canAlertPayToUnderfunded(chain, now = Date.now()) {
  const key = normalizeChainKey(chain);
  const last = lastAlertByChain.get(key);
  if (last == null) return true;
  return Number(now) - last >= PAYTO_UNDERFUNDED_ALERT_THROTTLE_MS;
}

/**
 * Mark chain as alerted at `now` (used by tests / after successful send).
 * @param {string} chain
 * @param {number} [now]
 */
export function markPayToUnderfundedAlerted(chain, now = Date.now()) {
  lastAlertByChain.set(normalizeChainKey(chain), Number(now) || Date.now());
}

/**
 * Clear throttle state (tests).
 */
export function resetPayToUnderfundedAlertState() {
  lastAlertByChain.clear();
}

/**
 * Send a throttled PayTo-underfunded alert for a Labs chain.
 * No-op when Telegram is not configured or within throttle window.
 *
 * @param {{
 *   chain: string;
 *   payToAddress?: string | null;
 *   failedCount?: number;
 *   reason?: string;
 *   sampleError?: string;
 *   now?: number;
 *   send?: typeof sendDevTelegram;
 * }} input
 * @returns {Promise<{ sent: boolean; skipped: 'unconfigured' | 'throttled' | null }>}
 */
export async function alertPayToUnderfunded(input = {}) {
  const chain = normalizeChainKey(input.chain);
  const now = input.now != null ? Number(input.now) : Date.now();
  const send = input.send || sendDevTelegram;

  if (!isDevTelegramConfigured() && input.send == null) {
    return { sent: false, skipped: 'unconfigured' };
  }

  if (!canAlertPayToUnderfunded(chain, now)) {
    return { sent: false, skipped: 'throttled' };
  }

  const payTo = String(input.payToAddress || '').trim() || '(unknown)';
  const failedCount = Math.max(0, Math.floor(Number(input.failedCount) || 0));
  const reason = String(input.reason || 'payto_underfunded').trim();
  const sample = String(input.sampleError || '').trim().slice(0, 300);

  const lines = [
    `⚠️ Labs x402 PayTo underfunded (${chain})`,
    `PayTo: ${payTo}`,
    `Failed payers this tick: ${failedCount}`,
    `Reason: ${reason}`,
  ];
  if (sample) lines.push(`Sample: ${sample}`);
  lines.push('Action: top up PayTo USDT0/USDC (+ native gas). Partial top-ups resume when funded.');

  const ok = await send(lines.join('\n'));
  if (ok) {
    markPayToUnderfundedAlerted(chain, now);
    return { sent: true, skipped: null };
  }
  return { sent: false, skipped: 'unconfigured' };
}
