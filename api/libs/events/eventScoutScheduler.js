/**
 * Event Scout — 24h interval scheduler (Web + X + Luma).
 */

import { isMongooseConnected } from "../../config/mongoose.js";
import { EVENT_SCOUT_CRON_MS } from "../../config/eventScoutConfig.js";
import { isDevTelegramConfigured, sendDevTelegram } from "../devTelegramNotifier.js";
import { runEventScoutPipeline } from "./eventScoutPipeline.js";
import { startupVerbose } from "../../utils/startupLog.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

/**
 * @returns {Promise<{ success: boolean; data?: unknown; error?: string }>}
 */
export async function runEventScoutSchedulerTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick_already_in_flight" };
  }

  tickInFlight = true;
  try {
    const out = await runEventScoutPipeline();
    console.log(
      `[event-scout] OK — new=${out.data.totalNew} updated=${out.data.totalUpdated} errors=${out.data.errors.length}`,
    );
    return { success: true, data: out.data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[event-scout] pipeline failed:", msg);
    if (isDevTelegramConfigured()) {
      await sendDevTelegram(`Syra · Event Scout — run failed\n${msg.slice(0, 3500)}`, {
        disableWebPagePreview: true,
      });
    }
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startEventScoutScheduler() {
  if (cronHandle) return;

  const ms = EVENT_SCOUT_CRON_MS;
  cronHandle = setInterval(() => {
    runEventScoutSchedulerTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  startupVerbose(`[event-scout] scheduler started (every ${Math.round(ms / 60000)} min)`);

  setTimeout(() => {
    runEventScoutSchedulerTick().catch(() => {});
  }, 30_000);
}

export function stopEventScoutScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
