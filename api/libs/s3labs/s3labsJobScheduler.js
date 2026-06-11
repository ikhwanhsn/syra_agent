/**
 * S3Labs Jobs agent — fixed interval scheduler (default every 15 minutes).
 */

import {
  S3LABS_AGENTS_SCHEDULER_ENABLED,
  S3LABS_JOB_AGENT,
  S3LABS_JOB_INTERVAL_MINUTES,
} from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";
import { runS3labsJobPipeline } from "./s3labsJobPipeline.js";

/** @type {ReturnType<typeof setTimeout> | null} */
let jobTimer = null;

/**
 * @returns {number}
 */
function intervalMs() {
  return S3LABS_JOB_INTERVAL_MINUTES * 60 * 1000;
}

async function runJobCycle() {
  try {
    const result = await runS3labsJobPipeline();
    if (result.skipped) {
      console.log(`[s3labs-job] skipped: ${result.reason || "unknown"}`);
    } else {
      const title = result.data.lastJob?.title?.slice(0, 55) || "(none)";
      console.log(`[s3labs-job] posted: ${title}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[s3labs-job] failed:", msg);
    if (isS3labsTelegramConfigured()) {
      await sendS3labsTelegram(`⚠️ S3Labs Jobs agent gagal\n${msg.slice(0, 500)}`, {
        messageThreadId: S3LABS_JOB_AGENT.threadId,
        disableWebPagePreview: true,
      });
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
    console.log("[s3labs-job] scheduler disabled (S3LABS_AGENTS_SCHEDULER_ENABLED=false)");
    return;
  }

  const bootMs = S3LABS_JOB_AGENT.bootDelayMinutes * 60 * 1000;
  setTimeout(() => {
    void runJobCycle();
    scheduleNext();
  }, bootMs);

  console.log(
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
