/**
 * Alert when inbound settle_failed rate exceeds 5% of (paid + settle_failed) over 1h.
 * Uses SYRA_DEV_BOT_TOKEN / SYRA_DEV_BOT_CHAT_ID via sendDevTelegram.
 *
 * Env:
 *   SETTLE_FAILED_MONITOR_ENABLED — default true when Mongo is used
 *   SETTLE_FAILED_MONITOR_INTERVAL_MS — default 300000 (5 min)
 *   SETTLE_FAILED_MONITOR_COOLDOWN_MS — default 3600000 (1h between repeat alerts)
 *   SETTLE_FAILED_MONITOR_THRESHOLD — default 0.05
 *   SETTLE_FAILED_MONITOR_MIN_ATTEMPTS — default 10
 */
import { buildSettlementHealth } from './settlementHealthService.js';
import { isDevTelegramConfigured, sendDevTelegram } from './devTelegramNotifier.js';
import { startupVerbose } from '../utils/startupLog.js';

function envBool(name, defaultValue) {
  const raw = String(process.env[name] ?? '').trim().toLowerCase();
  if (!raw) return defaultValue;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  return defaultValue;
}

function envInt(name, fallback) {
  const n = Number.parseInt(String(process.env[name] || ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envFloat(name, fallback) {
  const n = Number.parseFloat(String(process.env[name] || ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Starts setInterval; safe to call once at process startup.
 */
export function startSettleFailedMonitor() {
  if (!envBool('SETTLE_FAILED_MONITOR_ENABLED', true)) {
    startupVerbose('[settle-failed-monitor] disabled (SETTLE_FAILED_MONITOR_ENABLED)');
    return;
  }

  const intervalMs = envInt('SETTLE_FAILED_MONITOR_INTERVAL_MS', 300_000);
  const cooldownMs = envInt('SETTLE_FAILED_MONITOR_COOLDOWN_MS', 3_600_000);
  const threshold = envFloat('SETTLE_FAILED_MONITOR_THRESHOLD', 0.05);
  const minAttempts = envInt('SETTLE_FAILED_MONITOR_MIN_ATTEMPTS', 10);

  /** @type {number} */
  let lastAlertAt = 0;
  /** Was last tick below threshold (for recovery log). */
  let wasHealthy = true;

  const tick = async () => {
    try {
      const health = await buildSettlementHealth(new Date(Date.now() - 60 * 60 * 1000));
      const { settleFailRate, settleAttempted, outcomes, settledUsd, topFailReasons } = health;
      const breached =
        settleAttempted >= minAttempts && settleFailRate > threshold;

      if (!breached) {
        if (!wasHealthy) {
          console.info(
            `[settle-failed-monitor] recovered: failRate=${(settleFailRate * 100).toFixed(1)}% attempts=${settleAttempted}`,
          );
        }
        wasHealthy = true;
        return;
      }

      wasHealthy = false;
      const now = Date.now();
      if (now - lastAlertAt < cooldownMs) return;

      const top = (topFailReasons || [])
        .slice(0, 3)
        .map((r) => `• ${r.count}× ${r.reason}`)
        .join('\n');

      const msg = [
        '🚨 Syra x402 settle_failed rate high',
        `Window: last 1h`,
        `Fail rate: ${(settleFailRate * 100).toFixed(1)}% (threshold ${(threshold * 100).toFixed(0)}%)`,
        `Attempts: ${settleAttempted} (paid=${outcomes.paid}, settle_failed=${outcomes.settle_failed})`,
        `Settled USD (paid only): $${settledUsd}`,
        `payment_required: ${outcomes.payment_required}`,
        top ? `Top reasons:\n${top}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      lastAlertAt = now;
      if (isDevTelegramConfigured()) {
        const sent = await sendDevTelegram(msg, { disableWebPagePreview: true });
        if (!sent) console.error('[settle-failed-monitor]', msg);
      } else {
        console.error('[settle-failed-monitor]', msg);
      }
    } catch (e) {
      console.warn(
        '[settle-failed-monitor] tick failed:',
        e instanceof Error ? e.message : e,
      );
    }
  };

  void tick();
  setInterval(tick, intervalMs);
  startupVerbose(
    `[settle-failed-monitor] enabled: every ${intervalMs}ms, alert if settle_failed > ${threshold * 100}% of attempts (min ${minAttempts}) over 1h`,
  );
}
