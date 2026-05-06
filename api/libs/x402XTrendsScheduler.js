/**
 * x402 X trends — in-process loop: X recent search + OpenRouter digest → Syra dev Telegram.
 *
 * Schedule: same WIB daily anchor as `./wibDailyWallClock.js` (no run on boot).
 *
 * Requires X_BEARER_TOKEN + OPENROUTER_API_KEY. Telegram: SYRA_DEV_BOT_TOKEN + SYRA_DEV_BOT_CHAT_ID.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import {
  runX402XTrendsAgent,
  formatX402XTrendsForTelegram,
} from "../agents/x402-x-trends-agent.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { isXApiBearerConfigured } from "./xApiClient.js";
import {
  getMsUntilNextWibWallClock,
  INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
} from "./wibDailyWallClock.js";

/** Mongo document id for latest x402 X trends run (monitoring + GET /internal/x402-x-trends/latest). */
export const X402_X_TRENDS_DB_ID = "x402-x-trends-latest";

/**
 * One full run: X search + LLM + Telegram (best-effort).
 * @returns {Promise<{ success: true; data: object }>}
 */
export async function runX402XTrendsPipeline() {
  if (!isXApiBearerConfigured()) {
    throw new Error("x402 X trends: X_BEARER_TOKEN is not set");
  }

  const data = await runX402XTrendsAgent({ model: null });

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

/** Start scheduler: WIB daily anchor after each completion. */
export function startX402XTrendsScheduler() {
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

  const scheduleNextWibAnchor = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs = getMsUntilNextWibWallClock(
      new Date(),
      INTERNAL_AGENT_PIPELINES_WIB_HOUR,
      INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
    );
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[x402-x-trends] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(INTERNAL_AGENT_PIPELINES_WIB_HOUR).padStart(2, "0")}:${String(INTERNAL_AGENT_PIPELINES_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNextWibAnchor();
    }, delayMs);
  };

  scheduleNextWibAnchor();

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
    `[x402-x-trends] enabled; WIB daily ${String(INTERNAL_AGENT_PIPELINES_WIB_HOUR).padStart(2, "0")}:${String(INTERNAL_AGENT_PIPELINES_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta; X=${isXApiBearerConfigured() ? "on" : "off"}; Telegram=${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
