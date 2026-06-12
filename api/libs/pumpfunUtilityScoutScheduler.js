/**
 * Pump.fun Utility Scout — periodic refresh (default every 1h).
 */

import { isMongooseConnected } from "../config/mongoose.js";
import { PUMPFUN_UTILITY_SCOUT_CRON_MS } from "../config/pumpfunUtilityScoutConfig.js";
import { startupVerbose } from "../utils/startupLog.js";
import {
  getPumpfunUtilityScoutBriefForRead,
  isPumpfunUtilityScoutBriefStale,
  runPumpfunUtilityScoutAgent,
} from "./pumpfunUtilityScoutAgent.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

const BOOT_DELAY_MS = Math.min(
  150_000,
  Math.max(12_000, Number.parseInt(process.env.PUMPFUN_UTILITY_SCOUT_BOOT_DELAY_MS || "25000", 10)),
);

export async function runPumpfunUtilityScoutTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick already in flight" };
  }
  tickInFlight = true;
  try {
    const out = await runPumpfunUtilityScoutAgent();
    if (out.skipped) {
      startupVerbose("[pumpfun-utility-scout] tick skipped — snapshot fresh");
      return { success: true, skipped: true, ...out };
    }
    const top = out.data?.pumpfunUtilityPicks?.[0]?.symbol ?? "—";
    startupVerbose(
      `[pumpfun-utility-scout] OK top=${top} history=${out.data?.pastUtilityHistory?.length ?? 0} savedAt=${out.savedAt}`,
    );
    return { success: true, ...out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pumpfun-utility-scout] tick failed:", msg);
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startPumpfunUtilityScoutScheduler() {
  if (cronHandle) return;

  const ms = PUMPFUN_UTILITY_SCOUT_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    startupVerbose("[pumpfun-utility-scout] scheduler disabled (PUMPFUN_AGENTS_REFRESH_MS=0)");
    return;
  }

  cronHandle = setInterval(() => {
    runPumpfunUtilityScoutTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  startupVerbose(`[pumpfun-utility-scout] scheduler started (every ${Math.round(ms / 60_000)}m)`);

  setTimeout(async () => {
    if (!isMongooseConnected()) return;
    try {
      const existing = await getPumpfunUtilityScoutBriefForRead();
      if (!existing || isPumpfunUtilityScoutBriefStale(existing.savedAt)) {
        startupVerbose("[pumpfun-utility-scout] running initial or stale refresh");
        await runPumpfunUtilityScoutTick();
      }
    } catch (e) {
      console.warn(
        "[pumpfun-utility-scout] boot check failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }, BOOT_DELAY_MS);
}

export function stopPumpfunUtilityScoutScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
