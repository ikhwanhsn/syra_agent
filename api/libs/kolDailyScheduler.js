/**
 * Daily KOL marketplace scheduler — refresh engagement metrics and finalize ended campaigns.
 */
import { isMongooseConnected } from "../config/mongoose.js";
import { runKolDailyTick } from "./kolMarketplaceService.js";
import { startupVerbose } from "../utils/startupLog.js";

const DEFAULT_CRON_MS = 24 * 60 * 60 * 1000;

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

function getCronMs() {
  const raw = Number(process.env.KOL_DAILY_CRON_MS || DEFAULT_CRON_MS);
  return Number.isFinite(raw) && raw >= 60_000 ? raw : DEFAULT_CRON_MS;
}

/**
 * @returns {Promise<{ success: boolean; refreshed?: unknown[]; finalized?: unknown[]; error?: string }>}
 */
export async function runKolDailySchedulerTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick_already_in_flight" };
  }

  tickInFlight = true;
  try {
    const result = await runKolDailyTick();
    if (result.profiles && !result.profiles.skipped) {
      startupVerbose(
        `[kol] X profiles refreshed=${result.profiles.refreshed} failed=${result.profiles.failed}`,
      );
    }
    return result;
  } catch (e) {
    console.warn("[kol] daily scheduler tick failed:", e instanceof Error ? e.message : e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    tickInFlight = false;
  }
}

export function startKolDailyScheduler() {
  if (cronHandle) return;

  const ms = getCronMs();
  cronHandle = setInterval(() => {
    runKolDailySchedulerTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  startupVerbose(`[kol] daily scheduler started (every ${Math.round(ms / 60000)} min)`);

  setTimeout(() => {
    runKolDailySchedulerTick().catch(() => {});
  }, 30_000);
}

export function stopKolDailyScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
