/**
 * Syra Growth Scout — daily WIB scheduler (users + TVL → growth recommendations).
 */

import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import {
  getMsUntilNextWibWallClock,
  INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
} from "./wibDailyWallClock.js";
import { runSyraGrowthScoutPipeline } from "./syraGrowthScoutPipeline.js";
import {
  SYRA_GROWTH_SCOUT_WIB_HOUR,
  SYRA_GROWTH_SCOUT_WIB_MINUTE,
} from "../config/syraGrowthScoutConfig.js";
import { startupVerbose } from "../utils/startupLog.js";

export function startSyraGrowthScoutScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[syra-growth-scout] skipped tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await runSyraGrowthScoutPipeline();
      startupVerbose("[syra-growth-scout] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[syra-growth-scout] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra · Growth Scout — run failed\n${msg.slice(0, 3500)}`,
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
      SYRA_GROWTH_SCOUT_WIB_HOUR ?? INTERNAL_AGENT_PIPELINES_WIB_HOUR,
      SYRA_GROWTH_SCOUT_WIB_MINUTE ?? INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
    );
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    startupVerbose(
      `[syra-growth-scout] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(SYRA_GROWTH_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_GROWTH_SCOUT_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNextWibAnchor();
    }, delayMs);
  };

  scheduleNextWibAnchor();

  if (!isDevTelegramConfigured()) {
    startupVerbose(
      "[syra-growth-scout] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID",
    );
  }

  startupVerbose(
    `[syra-growth-scout] enabled; WIB daily ${String(SYRA_GROWTH_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_GROWTH_SCOUT_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta; Telegram=${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
