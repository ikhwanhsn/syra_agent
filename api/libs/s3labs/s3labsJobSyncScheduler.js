/**
 * S3Labs Jobs website sync scheduler — keeps Mongo job store fresh for /jobs.
 * Independent of Telegram highlight posts (s3labsJobScheduler).
 */

import { isMongooseConnected } from "../../config/mongoose.js";
import {
  S3LABS_JOB_SYNC_CRON_MS,
  S3LABS_JOB_SYNC_SCHEDULER_ENABLED,
} from "../../config/s3labsJobSyncConfig.js";
import { isTransientNetworkError } from "../../utils/resilientFetch.js";
import { startupVerbose } from "../../utils/startupLog.js";
import { runS3labsJobSyncPipeline } from "./s3labsJobSyncPipeline.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

/**
 * @returns {Promise<{ success: boolean; data?: unknown; error?: string }>}
 */
export async function runS3labsJobSyncSchedulerTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick_already_in_flight" };
  }

  tickInFlight = true;
  try {
    const out = await runS3labsJobSyncPipeline();
    return { success: true, data: out.data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isTransientNetworkError(e)) {
      console.warn("[s3labs-job-sync] transient error:", msg);
    } else {
      console.error("[s3labs-job-sync] pipeline failed:", msg);
    }
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startS3labsJobSyncScheduler() {
  if (cronHandle) return;

  if (!S3LABS_JOB_SYNC_SCHEDULER_ENABLED) {
    startupVerbose("[s3labs-job-sync] scheduler disabled (S3LABS_JOB_SYNC_SCHEDULER_ENABLED=false)");
    return;
  }

  const ms = S3LABS_JOB_SYNC_CRON_MS;
  cronHandle = setInterval(() => {
    runS3labsJobSyncSchedulerTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  startupVerbose(`[s3labs-job-sync] scheduler started (every ${Math.round(ms / 60000)} min)`);

  // First sync shortly after boot so /jobs is warm without waiting a full interval.
  setTimeout(() => {
    runS3labsJobSyncSchedulerTick().catch(() => {});
  }, 45_000);
}

export function stopS3labsJobSyncScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
