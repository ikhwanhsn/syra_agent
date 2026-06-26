/**
 * Macro Intelligence Scheduler — in-process cron (setInterval + singleFlight).
 */

import { BTC3_MACRO_CRON_MS, isBtc3MacroCronEnabled } from "../../config/btc3MacroConfig.js";
import { runMacroIntelligencePipeline } from "./macroIntelligencePipeline.js";
import { startupInfo, startupVerbose } from "../../utils/startupLog.js";

let intervalHandle = null;

export function getBtc3MacroCronIntervalMs() {
  return BTC3_MACRO_CRON_MS;
}

export function isBtc3MacroSchedulerRunning() {
  return intervalHandle !== null;
}

/**
 * @param {(fn: () => Promise<void>) => () => void} withSingleFlight
 * @param {(fn: () => Promise<void>) => () => void} runIfMongoConnected
 */
export function startBtc3MacroScheduler(withSingleFlight, runIfMongoConnected) {
  if (!isBtc3MacroCronEnabled()) {
    startupVerbose("[BTC3 macro] scheduler disabled (BTC3_MACRO_CRON_ENABLED=false)");
    return;
  }

  if (intervalHandle) return;

  const tick = runIfMongoConnected(
    withSingleFlight(() =>
      runMacroIntelligencePipeline()
        .then((out) => {
          if (!out.success) {
            console.warn("[BTC3 macro] pipeline:", out.error || out.errors?.[0]);
          }
        })
        .catch((err) =>
          console.warn("[BTC3 macro] pipeline failed:", err?.message || err),
        ),
    ),
  );

  intervalHandle = setInterval(tick, BTC3_MACRO_CRON_MS);
  startupInfo(`[BTC3 macro] scheduler started (interval ${BTC3_MACRO_CRON_MS}ms)`);

  setTimeout(tick, 15_000);
}

export function stopBtc3MacroScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
