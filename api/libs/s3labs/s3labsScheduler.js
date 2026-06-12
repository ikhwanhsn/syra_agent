/**
 * S3Labs agents — random daily WIB schedules (3–5 posts/agent/day) with jitter.
 */

import { getMsUntilNextWibWallClock, getWibWallClockUtcMsToday } from "../wibDailyWallClock.js";
import {
  S3LABS_AGENT_DEFINITIONS,
  S3LABS_AGENTS_SCHEDULER_ENABLED,
  S3LABS_POSTS_PER_DAY_MAX,
  S3LABS_POSTS_PER_DAY_MIN,
  S3LABS_SCHEDULE_JITTER_MAX_MINUTES,
} from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";
import {
  runS3labsNewsPipeline,
  runS3labsDeveloperPipeline,
  runS3labsEventPipeline,
} from "./s3labsPipeline.js";
import { consumeNextDailySlot, getOrRefreshDailySchedule, hasMoreSlotsToday } from "./s3labsDailySchedule.js";
import { startupVerbose } from "../../utils/startupLog.js";
import { isTransientNetworkError } from "../../utils/resilientFetch.js";

/** @type {Record<string, () => Promise<unknown>>} */
const PIPELINES = {
  news: runS3labsNewsPipeline,
  developer: runS3labsDeveloperPipeline,
  event: runS3labsEventPipeline,
};

/**
 * @returns {number}
 */
function randomJitterMs() {
  const maxMin = S3LABS_SCHEDULE_JITTER_MAX_MINUTES;
  const minutes = Math.floor(Math.random() * (maxMin + 1));
  return minutes * 60 * 1000;
}

/**
 * Schedule the next random slot for one agent (or roll to tomorrow).
 * @param {import("../../config/s3labsAgentsConfig.js").S3labsAgentDefinition} def
 */
function scheduleAgentNext(def) {
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
      `[s3labs-${def.kind}] all slots done for today; next window in ${Math.round(waitMs / 60000)} min`,
    );
    setTimeout(() => scheduleAgentNext(def), waitMs);
    return;
  }

  const [hour, minute] = slot;
  const jitterMs = delayMs - (getWibWallClockUtcMsToday(new Date(), hour, minute) - now);
  const nextAt = new Date(Date.now() + delayMs).toISOString();

  startupVerbose(
    `[s3labs-${def.kind}] next post in ${Math.round(delayMs / 60000)} min (~${nextAt}; WIB ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} +${Math.round(jitterMs / 60000)}m jitter) → topic ${def.threadId}`,
  );

  setTimeout(async () => {
    const run = PIPELINES[def.kind];
    try {
      const result = await run();
      if (result.skipped) {
        startupVerbose(`[s3labs-${def.kind}] skipped: ${result.reason || "unknown"}`);
      } else {
        startupVerbose(
          `[s3labs-${def.kind}] posted: ${result.data.pick?.title?.slice(0, 55) || "(none)"}`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isTransientNetworkError(e)) {
        console.warn(`[s3labs-${def.kind}] transient network error (will retry next slot):`, msg);
      } else {
        console.error(`[s3labs-${def.kind}] failed:`, msg);
        if (isS3labsTelegramConfigured()) {
          try {
            await sendS3labsTelegram(`⚠️ S3Labs ${def.kind} agent gagal\n${msg.slice(0, 500)}`, {
              messageThreadId: def.threadId,
              disableWebPagePreview: true,
            });
          } catch (notifyErr) {
            const notifyMsg = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
            console.warn(`[s3labs-${def.kind}] failure notification send error:`, notifyMsg);
          }
        }
      }
    }

    if (!hasMoreSlotsToday(def.kind)) {
      const delayMs = getMsUntilNextWibWallClock(new Date(), 0, 10) + randomJitterMs();
      setTimeout(() => scheduleAgentNext(def), delayMs);
    } else {
      scheduleAgentNext(def);
    }
  }, delayMs);
}

/** Start all S3Labs forum agents with desynced boot delays. */
export function startS3labsAgentsScheduler() {
  if (!S3LABS_AGENTS_SCHEDULER_ENABLED) {
    startupVerbose("[s3labs-agents] scheduler disabled (S3LABS_AGENTS_SCHEDULER_ENABLED=false)");
    return;
  }

  for (const def of S3LABS_AGENT_DEFINITIONS) {
    const bootMs = def.bootDelayMinutes * 60 * 1000;
    setTimeout(() => {
      scheduleAgentNext(def);
    }, bootMs);
  }

  startupVerbose(
    `[s3labs-agents] scheduler on: ${S3LABS_AGENT_DEFINITIONS.length} agents × ${S3LABS_POSTS_PER_DAY_MIN}–${S3LABS_POSTS_PER_DAY_MAX} random posts/day; jitter 0–${S3LABS_SCHEDULE_JITTER_MAX_MINUTES}m; Telegram=${isS3labsTelegramConfigured() ? "on" : "off"}`,
  );
}

/** @deprecated Use startS3labsAgentsScheduler */
export function startS3labsNewsScheduler() {
  startS3labsAgentsScheduler();
}
