/**
 * Periodically enforce Earn Yield kill switches across all products.
 *
 * Env:
 *   EARN_YIELD_KILL_MONITOR_ENABLED — default true
 *   EARN_YIELD_KILL_MONITOR_INTERVAL_MS — default 300000 (5 min)
 */
import { enforceEarnYieldKillSwitch } from './earnYieldService.js';
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

export function startEarnYieldKillMonitor() {
  if (!envBool('EARN_YIELD_KILL_MONITOR_ENABLED', true)) {
    startupVerbose('[earn-yield-kill] disabled (EARN_YIELD_KILL_MONITOR_ENABLED)');
    return;
  }

  const intervalMs = envInt('EARN_YIELD_KILL_MONITOR_INTERVAL_MS', 300_000);

  const tick = async () => {
    try {
      // null = all registered products (LP, cbBTC, BTC3, momentum, lst_loop, sniper)
      const out = await enforceEarnYieldKillSwitch(null);
      if (out?.paused) {
        const pausedIds = (out.results || [])
          .filter((r) => r.paused)
          .map((r) => r.productId)
          .join(',');
        console.warn(`[earn-yield-kill] paused products: ${pausedIds || 'unknown'}`);
      }
    } catch (e) {
      console.warn('[earn-yield-kill]', e instanceof Error ? e.message : e);
    }
  };

  void tick();
  setInterval(tick, intervalMs);
  startupVerbose(`[earn-yield-kill] started multi-product (every ${intervalMs}ms)`);
}
