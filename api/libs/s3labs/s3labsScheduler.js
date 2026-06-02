/**
 * S3Labs agents — staggered WIB schedules with jitter (natural posting rhythm).
 *
 * Each agent posts 4×/day at different clock times; boot delays desync first runs.
 */

import { getMsUntilNextWibWallClock } from "../wibDailyWallClock.js";
import {
  S3LABS_AGENT_DEFINITIONS,
  S3LABS_AGENTS_SCHEDULER_ENABLED,
  S3LABS_SCHEDULE_JITTER_MAX_MINUTES,
} from "../../config/s3labsAgentsConfig.js";
import { isS3labsTelegramConfigured, sendS3labsTelegram } from "../s3labsTelegramNotifier.js";
import {
  runS3labsNewsPipeline,
  runS3labsDeveloperPipeline,
  runS3labsEventPipeline,
} from "./s3labsPipeline.js";

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
 * Schedule one agent's next run at its WIB slot + jitter.
 * @param {import("../../config/s3labsAgentsConfig.js").S3labsAgentDefinition} def
 * @param {number} slotIndex
 */
function scheduleAgentSlot(def, slotIndex) {
  const slots = def.wibSlots;
  const [hour, minute] = slots[slotIndex % slots.length];
  const jitterMs = randomJitterMs();
  const delayMs = getMsUntilNextWibWallClock(new Date(), hour, minute) + jitterMs;
  const nextAt = new Date(Date.now() + delayMs).toISOString();

  console.log(
    `[s3labs-${def.kind}] next post in ${Math.round(delayMs / 60000)} min (~${nextAt}; WIB ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} + jitter) → topic ${def.threadId}`,
  );

  setTimeout(async () => {
    const run = PIPELINES[def.kind];
    try {
      const result = await run();
      if (result.skipped) {
        console.log(`[s3labs-${def.kind}] skipped: ${result.reason || "unknown"}`);
      } else {
        console.log(
          `[s3labs-${def.kind}] posted: ${result.data.pick?.title?.slice(0, 55) || "(none)"}`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[s3labs-${def.kind}] failed:`, msg);
      if (isS3labsTelegramConfigured()) {
        await sendS3labsTelegram(`⚠️ S3Labs ${def.kind} agent gagal\n${msg.slice(0, 500)}`, {
          messageThreadId: def.threadId,
          disableWebPagePreview: true,
        });
      }
    }
    scheduleAgentSlot(def, slotIndex + 1);
  }, delayMs);
}

/** Start all S3Labs forum agents with desynced boot delays. */
export function startS3labsAgentsScheduler() {
  if (!S3LABS_AGENTS_SCHEDULER_ENABLED) {
    console.log("[s3labs-agents] scheduler disabled (S3LABS_AGENTS_SCHEDULER_ENABLED=false)");
    return;
  }

  for (const def of S3LABS_AGENT_DEFINITIONS) {
    const bootMs = def.bootDelayMinutes * 60 * 1000;
    setTimeout(() => {
      scheduleAgentSlot(def, 0);
    }, bootMs);
  }

  console.log(
    `[s3labs-agents] scheduler on: ${S3LABS_AGENT_DEFINITIONS.length} agents × ${S3LABS_AGENT_DEFINITIONS[0].wibSlots.length} slots/day; jitter 0–${S3LABS_SCHEDULE_JITTER_MAX_MINUTES}m; Telegram=${isS3labsTelegramConfigured() ? "on" : "off"}`,
  );
}

/** @deprecated Use startS3labsAgentsScheduler */
export function startS3labsNewsScheduler() {
  startS3labsAgentsScheduler();
}
