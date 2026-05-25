/**
 * Syra Trend Scout — daily WIB scheduler (news/events/trends → Telegram dev bot).
 *
 * Schedule: once per calendar day at 06:00 Asia/Jakarta (see wibDailyWallClock.js). No run on boot.
 * External cron: .github/workflows/syra-trend-scout-daily-wib.yml + POST /internal/trend-scout/run.
 */

import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import {
  getMsUntilNextWibWallClock,
  INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
} from "./wibDailyWallClock.js";
import { runSyraTrendScoutPipeline } from "./syraTrendScoutPipeline.js";
import {
  SYRA_TREND_SCOUT_WIB_HOUR,
  SYRA_TREND_SCOUT_WIB_MINUTE,
} from "../config/syraTrendScoutConfig.js";

/** Start scheduler: WIB daily anchor after each completion. */
export function startSyraTrendScoutScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[syra-trend-scout] skipped tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await runSyraTrendScoutPipeline();
      console.log("[syra-trend-scout] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[syra-trend-scout] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra · Trend Scout — run failed\n${msg.slice(0, 3500)}`,
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
      SYRA_TREND_SCOUT_WIB_HOUR ?? INTERNAL_AGENT_PIPELINES_WIB_HOUR,
      SYRA_TREND_SCOUT_WIB_MINUTE ?? INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
    );
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[syra-trend-scout] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(SYRA_TREND_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_TREND_SCOUT_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNextWibAnchor();
    }, delayMs);
  };

  scheduleNextWibAnchor();

  if (!isDevTelegramConfigured()) {
    console.warn(
      "[syra-trend-scout] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID",
    );
  }

  console.log(
    `[syra-trend-scout] enabled; WIB daily ${String(SYRA_TREND_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_TREND_SCOUT_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta; Telegram=${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
