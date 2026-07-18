/**
 * Hackathon Scout — interval scheduler (Devpost + Web). Default 6h via HACKATHON_SCOUT_CRON_MS.
 */

import { isMongooseConnected } from "../../config/mongoose.js";
import { HACKATHON_SCOUT_CRON_MS } from "../../config/hackathonScoutConfig.js";
import { isDevTelegramConfigured, sendDevTelegram } from "../devTelegramNotifier.js";
import { runHackathonScoutPipeline } from "./hackathonScoutPipeline.js";
import { startupVerbose } from "../../utils/startupLog.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

/**
 * @returns {Promise<{ success: boolean; data?: unknown; error?: string }>}
 */
export async function runHackathonScoutSchedulerTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick_already_in_flight" };
  }

  tickInFlight = true;
  try {
    const out = await runHackathonScoutPipeline();
    console.log(
      `[hackathon-scout] OK — new=${out.data.totalNew} updated=${out.data.totalUpdated} errors=${out.data.errors.length}`,
    );
    return { success: true, data: out.data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[hackathon-scout] pipeline failed:", msg);
    if (isDevTelegramConfigured()) {
      await sendDevTelegram(`Syra · Hackathon Scout — run failed\n${msg.slice(0, 3500)}`, {
        disableWebPagePreview: true,
      });
    }
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startHackathonScoutScheduler() {
  if (cronHandle) return;

  const ms = HACKATHON_SCOUT_CRON_MS;
  cronHandle = setInterval(() => {
    runHackathonScoutSchedulerTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  startupVerbose(`[hackathon-scout] scheduler started (every ${Math.round(ms / 60000)} min)`);

  setTimeout(() => {
    runHackathonScoutSchedulerTick().catch(() => {});
  }, 30_000);
}

export function stopHackathonScoutScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
