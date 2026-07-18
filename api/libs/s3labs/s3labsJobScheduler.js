/**
 * S3Labs Jobs Telegram agent — daily WIB schedule (0–1 post/day).
 * Website listings are refreshed by s3labsJobSyncScheduler (hourly scrape → Mongo).
 * This scheduler only posts occasional Telegram highlights.
 */

import { getMsUntilNextWibWallClock, getWibWallClockUtcMsToday } from "../wibDailyWallClock.js";
import {
  getS3labsPostsPerDayRange,
  S3LABS_AGENTS_SCHEDULER_ENABLED,
  S3LABS_JOB_AGENT,
  S3LABS_SCHEDULE_JITTER_MAX_MINUTES,
} from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";
import { runS3labsJobPipeline } from "./s3labsJobPipeline.js";
import { consumeNextDailySlot, getOrRefreshDailySchedule, hasMoreSlotsToday } from "./s3labsDailySchedule.js";
import { isTransientNetworkError } from "../../utils/resilientFetch.js";
import { startupVerbose } from "../../utils/startupLog.js";

/** @type {ReturnType<typeof setTimeout> | null} */
let jobTimer = null;

/**
 * @returns {number}
 */
function randomJitterMs() {
  const maxMin = S3LABS_SCHEDULE_JITTER_MAX_MINUTES;
  const minutes = Math.floor(Math.random() * (maxMin + 1));
  return minutes * 60 * 1000;
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const JOB_PIPELINE_RETRIES = 3;
const JOB_PIPELINE_RETRY_DELAY_MS = 2000;

/**
 * @returns {Promise<Awaited<ReturnType<typeof runS3labsJobPipeline>>>}
 */
async function runJobPipelineWithRetry() {
  /** @type {unknown} */
  let lastError = null;

  for (let attempt = 0; attempt <= JOB_PIPELINE_RETRIES; attempt += 1) {
    try {
      return await runS3labsJobPipeline();
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt < JOB_PIPELINE_RETRIES && isTransientNetworkError(e)) {
        console.warn(`[s3labs-job] transient error (attempt ${attempt + 1}/${JOB_PIPELINE_RETRIES + 1}): ${msg}`);
        await sleep(JOB_PIPELINE_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw e;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function runJobCycle() {
  try {
    const result = await runJobPipelineWithRetry();
    if (result.skipped) {
      startupVerbose(`[s3labs-job] skipped: ${result.reason || "unknown"}`);
    } else {
      const title = result.data.lastJob?.title?.slice(0, 55) || "(none)";
      startupVerbose(`[s3labs-job] posted: ${title}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isTransientNetworkError(e)) {
      console.warn("[s3labs-job] transient network error after retries (will retry next slot):", msg);
      return;
    }

    console.error("[s3labs-job] failed:", msg);
    if (isS3labsTelegramConfigured()) {
      try {
        await sendS3labsTelegram(`⚠️ S3Labs Jobs agent gagal\n${msg.slice(0, 500)}`, {
          messageThreadId: S3LABS_JOB_AGENT.threadId,
          disableWebPagePreview: true,
        });
      } catch (notifyErr) {
        const notifyMsg = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
        console.warn("[s3labs-job] failure notification send error:", notifyMsg);
      }
    }
  }
}

function clearJobTimer() {
  if (jobTimer) {
    clearTimeout(jobTimer);
    jobTimer = null;
  }
}

/**
 * Schedule the next random daily slot for jobs (or roll to tomorrow).
 */
function scheduleJobNext() {
  const def = S3LABS_JOB_AGENT;
  getOrRefreshDailySchedule(def.kind);

  const now = Date.now();
  let slot = null;
  let delayMs = 0;

  while (hasMoreSlotsToday(def.kind)) {
    const candidate = consumeNextDailySlot(def.kind);
    if (!candidate) break;
    const [hour, minute] = candidate;
    const targetMs = getWibWallClockUtcMsToday(new Date(), hour, minute);
    if (targetMs > now) {
      slot = candidate;
      delayMs = targetMs - now + randomJitterMs();
      break;
    }
  }

  if (!slot) {
    const waitMs = getMsUntilNextWibWallClock(new Date(), 0, 5) + randomJitterMs();
    startupVerbose(
      `[s3labs-job] no more slots today; next window in ${Math.round(waitMs / 60000)} min`,
    );
    clearJobTimer();
    jobTimer = setTimeout(() => scheduleJobNext(), waitMs);
    return;
  }

  const [hour, minute] = slot;
  const jitterMs = delayMs - (getWibWallClockUtcMsToday(new Date(), hour, minute) - now);
  const nextAt = new Date(Date.now() + delayMs).toISOString();

  startupVerbose(
    `[s3labs-job] next post in ${Math.round(delayMs / 60000)} min (~${nextAt}; WIB ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} +${Math.round(jitterMs / 60000)}m jitter) → topic ${def.threadId}`,
  );

  clearJobTimer();
  jobTimer = setTimeout(async () => {
    await runJobCycle();

    if (!hasMoreSlotsToday(def.kind)) {
      const rollMs = getMsUntilNextWibWallClock(new Date(), 0, 10) + randomJitterMs();
      clearJobTimer();
      jobTimer = setTimeout(() => scheduleJobNext(), rollMs);
    } else {
      scheduleJobNext();
    }
  }, delayMs);
}

/** Start the jobs agent on a daily WIB schedule (posts to t.me/s3labs/513). */
export function startS3labsJobScheduler() {
  if (!S3LABS_AGENTS_SCHEDULER_ENABLED) {
    startupVerbose("[s3labs-job] scheduler disabled (S3LABS_AGENTS_SCHEDULER_ENABLED=false)");
    return;
  }

  const { min, max } = getS3labsPostsPerDayRange("job");
  if (max <= 0) {
    startupVerbose("[s3labs-job] scheduler idle (postsPerDayMax=0; jobs live on website)");
    return;
  }

  const bootMs = S3LABS_JOB_AGENT.bootDelayMinutes * 60 * 1000;
  setTimeout(() => {
    scheduleJobNext();
  }, bootMs);

  startupVerbose(
    `[s3labs-job] scheduler on: ${min}–${max} posts/day (WIB) → topic ${S3LABS_JOB_AGENT.threadId}; Telegram=${isS3labsTelegramConfigured() ? "on" : "off"}`,
  );
}

/** @returns {void} */
export function stopS3labsJobScheduler() {
  clearJobTimer();
}
