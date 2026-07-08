/**
 * Scheduler for x402 Labs auto-caller — periodically runs paid /insights/* calls from payer wallets.
 */
import { listActivePayerWallets } from './labWalletService.js';
import { runLabX402Payment, getLabX402Settings } from './labX402Payer.js';
import { checkLabDailyCallBudget } from './labX402CallLog.js';
import { startupVerbose } from '../../utils/startupLog.js';

/** @type {ReturnType<typeof setTimeout> | null} */
let timerId = null;
let running = false;

function computeJitteredDelay(baseMs, jitterPct) {
  const jitter = (jitterPct / 100) * baseMs;
  const offset = (Math.random() * 2 - 1) * jitter;
  return Math.max(60_000, Math.round(baseMs + offset));
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const settings = await getLabX402Settings();
    if (!settings.autoCallEnabled) return;

    const budget = await checkLabDailyCallBudget();
    if (!budget.allowed) {
      console.warn(
        `[lab-x402-scheduler] daily cap reached (${budget.count}/${budget.max}); skipping tick`,
      );
      return;
    }

    const payers = await listActivePayerWallets();
    if (payers.length === 0) return;

    for (const payer of payers) {
      const remaining = await checkLabDailyCallBudget();
      if (!remaining.allowed) break;
      try {
        await runLabX402Payment(payer.address, { trigger: 'scheduler' });
      } catch (e) {
        console.warn('[lab-x402-scheduler] payer call failed:', payer.address, e?.message || e);
      }
    }
  } catch (e) {
    console.warn('[lab-x402-scheduler] tick failed:', e?.message || e);
  } finally {
    running = false;
    scheduleNext();
  }
}

async function scheduleNext() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  try {
    const settings = await getLabX402Settings();
    if (!settings.autoCallEnabled) return;
    const delay = computeJitteredDelay(settings.intervalMs, settings.jitterPct);
    timerId = setTimeout(tick, delay);
  } catch {
    timerId = setTimeout(tick, 300_000);
  }
}

/**
 * Start the lab x402 scheduler. Safe to call once at boot; re-reads settings each tick.
 */
export function startLabX402Scheduler() {
  startupVerbose('[lab-x402-scheduler] started');
  scheduleNext();
}

/**
 * Restart scheduler after settings change (e.g. interval updated).
 */
export function restartLabX402Scheduler() {
  scheduleNext();
}
