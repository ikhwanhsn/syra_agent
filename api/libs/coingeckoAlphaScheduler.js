/**
 * CoinGecko Alpha — daily in-process refresh (default every 24h).
 */

import { isMongooseConnected } from "../config/mongoose.js";
import { COINGECKO_ALPHA_CRON_MS, COINGECKO_ALPHA_DB_ID } from "../config/coingeckoAlphaConfig.js";
import { loadAlphaXBatchSnapshot } from "./alphaXBatchPipeline.js";
import {
  isCoingeckoAlphaBriefStale,
  runCoingeckoAlphaPipeline,
} from "./coingeckoAlphaPipeline.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

const BOOT_DELAY_MS = Math.min(
  180_000,
  Math.max(
    10_000,
    Number.parseInt(process.env.COINGECKO_ALPHA_BOOT_DELAY_MS || "45000", 10),
  ),
);

export async function runCoingeckoAlphaTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick already in flight" };
  }
  tickInFlight = true;
  try {
    const out = await runCoingeckoAlphaPipeline();
    console.log(
      `[coingecko-alpha] pipeline OK top=${out.data.topGainer?.symbol} +${out.data.topGainer?.priceChange24hPct?.toFixed?.(1)}% savedAt=${out.savedAt}`,
    );
    return { success: true, ...out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[coingecko-alpha] pipeline failed:", msg);
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startCoingeckoAlphaScheduler() {
  if (cronHandle) return;

  const ms = COINGECKO_ALPHA_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    console.info("[coingecko-alpha] scheduler disabled (COINGECKO_ALPHA_CRON_MS=0)");
    return;
  }

  cronHandle = setInterval(() => {
    runCoingeckoAlphaTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  console.info(
    `[coingecko-alpha] scheduler started (every ${Math.round(ms / 3_600_000)}h)`,
  );

  setTimeout(async () => {
    if (!isMongooseConnected()) return;
    try {
      const existing = await loadAlphaXBatchSnapshot(COINGECKO_ALPHA_DB_ID);
      if (!existing || isCoingeckoAlphaBriefStale(existing.savedAt)) {
        console.info("[coingecko-alpha] running initial or stale refresh");
        await runCoingeckoAlphaTick();
      }
    } catch (e) {
      console.warn(
        "[coingecko-alpha] boot check failed:",
        e instanceof Error ? e.message : e,
      );
    }
  }, BOOT_DELAY_MS);
}

export function stopCoingeckoAlphaScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
