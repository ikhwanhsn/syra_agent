/**
 * Periodic $ANSEM post discovery — adds X authors to the engagement leaderboard.
 * Disabled when ANSEM_DISCOVERY_CRON_MS=0.
 */
import { isMongooseConnected } from '../config/mongoose.js';
import {
  getAnsemDiscoveryCronMs,
  runAnsemEngagementDiscoveryTick,
} from './ansemEngagementDiscoveryService.js';
import { startupVerbose } from '../utils/startupLog.js';

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/**
 * @returns {Promise<{ success: boolean; skipped?: string; authors?: number; upserted?: number; error?: string }>}
 */
export async function runAnsemEngagementDiscoverySchedulerTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: 'mongodb_not_connected' };
  }
  const result = await runAnsemEngagementDiscoveryTick();
  if (result.success && result.upserted != null && result.upserted > 0) {
    startupVerbose(
      `[ansem-discovery] upserted=${result.upserted} authors_seen=${result.authors ?? 0}`,
    );
  }
  return result;
}

export function startAnsemEngagementDiscoveryScheduler() {
  if (cronHandle) return;

  const ms = getAnsemDiscoveryCronMs();
  if (ms <= 0) {
    startupVerbose('[ansem-discovery] scheduler disabled (ANSEM_DISCOVERY_CRON_MS=0)');
    return;
  }

  cronHandle = setInterval(() => {
    runAnsemEngagementDiscoverySchedulerTick().catch((e) => {
      console.warn('[ansem-discovery] tick failed:', e instanceof Error ? e.message : e);
    });
  }, ms);

  if (typeof cronHandle.unref === 'function') {
    cronHandle.unref();
  }

  startupVerbose(`[ansem-discovery] scheduler started (every ${Math.round(ms / 60000)} min)`);

  const runOnStart = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.ANSEM_DISCOVERY_RUN_ON_START ?? '')
      .trim()
      .toLowerCase(),
  );
  if (runOnStart) {
    setTimeout(() => {
      runAnsemEngagementDiscoverySchedulerTick().catch(() => {});
    }, 45_000);
  }
}

export function stopAnsemEngagementDiscoveryScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
