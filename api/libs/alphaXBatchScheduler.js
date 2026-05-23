/**
 * Alpha X batch — in-process refresh on a 24h interval (default).
 * First run after boot when no snapshot exists (or after ALPHA_X_BATCH_BOOT_DELAY_MS).
 */

import { isMongooseConnected } from "../config/mongoose.js";
import { ALPHA_X_BATCH_CRON_MS } from "../config/alphaXBatchConfig.js";
import {
  ALPHA_X_BATCH_CANONICAL_DB_ID,
  loadAlphaXBatchSnapshot,
  runAlphaXBatchPipeline,
} from "./alphaXBatchPipeline.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

const BOOT_DELAY_MS = Math.min(
  120_000,
  Math.max(
    5_000,
    Number.parseInt(process.env.ALPHA_X_BATCH_BOOT_DELAY_MS || "30000", 10),
  ),
);

export async function runAlphaXBatchTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick already in flight" };
  }
  tickInFlight = true;
  try {
    const out = await runAlphaXBatchPipeline();
    console.log(
      `[alpha-x-batch] pipeline OK (${out.data.summary.succeeded}/${out.data.summary.total} scored) savedAt=${out.savedAt}`,
    );
    return { success: true, ...out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[alpha-x-batch] pipeline failed:", msg);
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startAlphaXBatchScheduler() {
  if (cronHandle) return;

  const ms = ALPHA_X_BATCH_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    console.info("[alpha-x-batch] scheduler disabled (ALPHA_X_BATCH_CRON_MS=0)");
    return;
  }

  cronHandle = setInterval(() => {
    runAlphaXBatchTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  console.info(
    `[alpha-x-batch] scheduler started (every ${Math.round(ms / 3_600_000)}h)`,
  );

  setTimeout(async () => {
    if (!isMongooseConnected()) return;
    try {
      const existing = await loadAlphaXBatchSnapshot(ALPHA_X_BATCH_CANONICAL_DB_ID);
      if (!existing) {
        console.info("[alpha-x-batch] no snapshot in DB — running initial pipeline");
        await runAlphaXBatchTick();
      }
    } catch (e) {
      console.warn(
        "[alpha-x-batch] boot check failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }, BOOT_DELAY_MS);
}

export function stopAlphaXBatchScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
