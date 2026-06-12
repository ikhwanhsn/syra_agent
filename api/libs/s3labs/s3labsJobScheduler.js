/**
 * S3Labs Jobs agent — fixed interval scheduler (default every 45 minutes).
 */

import {
  S3LABS_AGENTS_SCHEDULER_ENABLED,
  S3LABS_JOB_AGENT,
  S3LABS_JOB_INTERVAL_MINUTES,
} from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";
import { runS3labsJobPipeline } from "./s3labsJobPipeline.js";
import { isTransientNetworkError } from "../../utils/resilientFetch.js";
import { startupVerbose } from "../../utils/startupLog.js";

/** @type {ReturnType<typeof setTimeout> | null} */
let jobTimer = null;

/**
 * @returns {number}
 */
function intervalMs() {
  return S3LABS_JOB_INTERVAL_MINUTES * 60 * 1000;
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
      console.warn("[s3labs-job] transient network error after retries (next cycle will retry):", msg);
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

function scheduleNext() {
  jobTimer = setTimeout(async () => {
    await runJobCycle();
    scheduleNext();
  }, intervalMs());
}

/** Start the jobs agent on a fixed interval (posts to t.me/s3labs/513). */
export function startS3labsJobScheduler() {
  if (!S3LABS_AGENTS_SCHEDULER_ENABLED) {
    startupVerbose("[s3labs-job] scheduler disabled (S3LABS_AGENTS_SCHEDULER_ENABLED=false)");
    return;
  }

  const bootMs = S3LABS_JOB_AGENT.bootDelayMinutes * 60 * 1000;
  setTimeout(() => {
    void runJobCycle();
    scheduleNext();
  }, bootMs);

  startupVerbose(
    `[s3labs-job] scheduler on: every ${S3LABS_JOB_INTERVAL_MINUTES}m → topic ${S3LABS_JOB_AGENT.threadId}; Telegram=${isS3labsTelegramConfigured() ? "on" : "off"}`,
  );
}

/** @returns {void} */
export function stopS3labsJobScheduler() {
  if (jobTimer) {
    clearTimeout(jobTimer);
    jobTimer = null;
  }
}
