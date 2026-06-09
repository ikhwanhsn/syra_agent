/**
 * Pump.fun Alpha / Beta Play Radar — periodic refresh (default every 1h).
 */

import { isMongooseConnected } from "../config/mongoose.js";
import { PUMPFUN_ALPHA_TREND_CRON_MS } from "../config/pumpfunAlphaTrendConfig.js";
import {
  getPumpfunAlphaTrendForRead,
  isPumpfunAlphaTrendStale,
  runPumpfunAlphaTrendBatch,
} from "./pumpfunAlphaTrendPipeline.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

const BOOT_DELAY_MS = Math.min(
  120_000,
  Math.max(8_000, Number.parseInt(process.env.PUMPFUN_ALPHA_TREND_BOOT_DELAY_MS || "25000", 10)),
);

export async function runPumpfunAlphaTrendTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick already in flight" };
  }
  tickInFlight = true;
  try {
    const out = await runPumpfunAlphaTrendBatch();
    if (out.skipped) {
      console.info("[pumpfun-alpha-trend] tick skipped — all snapshots fresh");
      return { success: true, skipped: true };
    }
    const count = out.results?.length ?? 0;
    console.info(`[pumpfun-alpha-trend] OK refreshed ${count} snapshot(s)`);
    return { success: true, ...out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pumpfun-alpha-trend] tick failed:", msg);
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startPumpfunAlphaTrendScheduler() {
  if (cronHandle) return;

  const ms = PUMPFUN_ALPHA_TREND_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    console.info("[pumpfun-alpha-trend] scheduler disabled (PUMPFUN_AGENTS_REFRESH_MS=0)");
    return;
  }

  cronHandle = setInterval(() => {
    runPumpfunAlphaTrendTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  console.info(`[pumpfun-alpha-trend] scheduler started (every ${Math.round(ms / 60_000)}m)`);

  setTimeout(async () => {
    if (!isMongooseConnected()) return;
    try {
      const existing = await getPumpfunAlphaTrendForRead("week", "trend");
      if (!existing || isPumpfunAlphaTrendStale(existing.savedAt)) {
        console.info("[pumpfun-alpha-trend] running initial or stale refresh");
        await runPumpfunAlphaTrendTick();
      }
    } catch (e) {
      console.warn(
        "[pumpfun-alpha-trend] boot check failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }, BOOT_DELAY_MS);
}

export function stopPumpfunAlphaTrendScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
