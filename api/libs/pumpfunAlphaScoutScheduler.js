/**
 * Pump.fun Alpha Scout — periodic refresh (default every 1h).
 */

import { isMongooseConnected } from "../config/mongoose.js";
import { PUMPFUN_ALPHA_SCOUT_CRON_MS } from "../config/pumpfunAlphaScoutConfig.js";
import { startupVerbose } from "../utils/startupLog.js";
import {
  getPumpfunAlphaScoutBriefForRead,
  isPumpfunAlphaScoutBriefStale,
  runPumpfunAlphaScoutAgent,
} from "./pumpfunAlphaScoutAgent.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

const BOOT_DELAY_MS = Math.min(
  120_000,
  Math.max(8_000, Number.parseInt(process.env.PUMPFUN_ALPHA_SCOUT_BOOT_DELAY_MS || "20000", 10)),
);

export async function runPumpfunAlphaScoutTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick already in flight" };
  }
  tickInFlight = true;
  try {
    const out = await runPumpfunAlphaScoutAgent();
    if (out.skipped) {
      startupVerbose("[pumpfun-alpha-scout] tick skipped — snapshot fresh");
      return { success: true, skipped: true, ...out };
    }
    const top = out.data?.predictedAlphas?.[0]?.symbol ?? out.data?.currentAlphaRunners?.[0]?.symbol ?? "—";
    startupVerbose(
      `[pumpfun-alpha-scout] OK top=${top} history=${out.data?.pastAlphaHistory?.length ?? 0} savedAt=${out.savedAt}`,
    );
    return { success: true, ...out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pumpfun-alpha-scout] tick failed:", msg);
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startPumpfunAlphaScoutScheduler() {
  if (cronHandle) return;

  const ms = PUMPFUN_ALPHA_SCOUT_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    startupVerbose("[pumpfun-alpha-scout] scheduler disabled (PUMPFUN_AGENTS_REFRESH_MS=0)");
    return;
  }

  cronHandle = setInterval(() => {
    runPumpfunAlphaScoutTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  startupVerbose(`[pumpfun-alpha-scout] scheduler started (every ${Math.round(ms / 60_000)}m)`);

  setTimeout(async () => {
    if (!isMongooseConnected()) return;
    try {
      const existing = await getPumpfunAlphaScoutBriefForRead();
      if (!existing || isPumpfunAlphaScoutBriefStale(existing.savedAt)) {
        startupVerbose("[pumpfun-alpha-scout] running initial or stale refresh");
        await runPumpfunAlphaScoutTick();
      }
    } catch (e) {
      console.warn(
        "[pumpfun-alpha-scout] boot check failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }, BOOT_DELAY_MS);
}

export function stopPumpfunAlphaScoutScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
