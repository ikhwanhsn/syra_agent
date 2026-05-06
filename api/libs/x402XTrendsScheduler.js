/**
 * x402 X trends — in-process loop: X recent search + OpenRouter digest → Syra dev Telegram (24h default).
 * Enabled by default; set X402_X_TRENDS_ENABLED=0 to disable. Requires X_BEARER_TOKEN + OPENROUTER_API_KEY.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import {
  runX402XTrendsAgent,
  formatX402XTrendsForTelegram,
} from "../agents/x402-x-trends-agent.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { isXApiBearerConfigured } from "./xApiClient.js";

/** Mongo document id for latest x402 X trends run (monitoring + GET /internal/x402-x-trends/latest). */
export const X402_X_TRENDS_DB_ID = "x402-x-trends-latest";

const DEFAULT_INTERVAL_MS = 86_400_000;
const MIN_INTERVAL_MS = 3_600_000;
const MAX_INTERVAL_MS = 7 * 86_400_000;

/**
 * @returns {number}
 */
function getIntervalMs() {
  const n = Number.parseInt(
    String(process.env.X402_X_TRENDS_INTERVAL_MS || "").trim(),
    10,
  );
  if (!Number.isFinite(n)) return DEFAULT_INTERVAL_MS;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, n));
}

/**
 * @returns {string | null}
 */
function modelFromEnv() {
  const m = String(process.env.X402_X_TRENDS_MODEL || "").trim();
  return m || null;
}

/**
 * One full run: X search + LLM + Telegram (best-effort).
 * @returns {Promise<{ success: true; data: object }>}
 */
export async function runX402XTrendsPipeline() {
  if (!isXApiBearerConfigured()) {
    throw new Error("x402 X trends: X_BEARER_TOKEN is not set");
  }

  const model = modelFromEnv();
  const data = await runX402XTrendsAgent({ model });

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatX402XTrendsForTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) {
      console.warn("[x402-x-trends] Telegram send failed");
    }
  }

  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: X402_X_TRENDS_DB_ID },
    {
      id: X402_X_TRENDS_DB_ID,
      payload: data,
      savedAt,
    },
    { upsert: true, new: true },
  );

  return { success: true, data };
}

/**
 * Start scheduler: first run shortly after startup, then every 24h (configurable) after completion.
 */
export function startX402XTrendsScheduler() {
  if (String(process.env.X402_X_TRENDS_ENABLED || "").trim() === "0") {
    console.log("[x402-x-trends] disabled (X402_X_TRENDS_ENABLED=0)");
    return;
  }

  const intervalMs = getIntervalMs();
  const intervalLabel =
    intervalMs % 3_600_000 === 0
      ? `${intervalMs / 3_600_000}h`
      : `${Math.round(intervalMs / 60_000)} min`;

  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[x402-x-trends] skipped tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await runX402XTrendsPipeline();
      console.log("[x402-x-trends] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[x402-x-trends] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra — x402 pulse (X) — run failed\n${msg.slice(0, 3500)}`,
          { disableWebPagePreview: true },
        );
      }
    } finally {
      running = false;
    }
  };

  const scheduleAfter = (delayMs) => {
    if (nextTimer) clearTimeout(nextTimer);
    if (delayMs > 0) {
      const nextAt = new Date(Date.now() + delayMs).toISOString();
      console.log(
        `[x402-x-trends] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; every ${intervalLabel} after completion)`,
      );
    } else {
      console.log("[x402-x-trends] first pipeline run scheduled (startup)");
    }
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleAfter(intervalMs);
    }, delayMs);
  };

  scheduleAfter(0);

  if (!isXApiBearerConfigured()) {
    console.warn(
      "[x402-x-trends] X API disabled: set X_BEARER_TOKEN or runs will fail",
    );
  }
  if (!isDevTelegramConfigured()) {
    console.warn(
      "[x402-x-trends] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID",
    );
  }

  console.log(
    `[x402-x-trends] enabled (opt-out: X402_X_TRENDS_ENABLED=0); every ${intervalLabel}; X=${isXApiBearerConfigured() ? "on" : "off"}; Telegram=${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
