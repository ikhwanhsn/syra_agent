/**
 * Syra Partnership Scout — daily WIB scheduler (06:15 Asia/Jakarta).
 */

import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { getMsUntilNextWibWallClock } from "./wibDailyWallClock.js";
import { runSyraPartnershipScoutPipeline } from "./syraPartnershipScoutPipeline.js";
import {
  SYRA_PARTNERSHIP_SCOUT_WIB_HOUR,
  SYRA_PARTNERSHIP_SCOUT_WIB_MINUTE,
} from "../config/syraPartnershipScoutConfig.js";

export function startSyraPartnershipScoutScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[syra-partnership-scout] skipped tick: previous run still in progress");
      return;
    }
    running = true;
    try {
      await runSyraPartnershipScoutPipeline();
      console.log("[syra-partnership-scout] pipeline completed OK");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[syra-partnership-scout] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra · Partnership Scout — run failed\n${msg.slice(0, 3500)}`,
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
      SYRA_PARTNERSHIP_SCOUT_WIB_HOUR,
      SYRA_PARTNERSHIP_SCOUT_WIB_MINUTE,
    );
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[syra-partnership-scout] next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; daily ${String(SYRA_PARTNERSHIP_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_PARTNERSHIP_SCOUT_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta)`,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNextWibAnchor();
    }, delayMs);
  };

  scheduleNextWibAnchor();

  if (!isDevTelegramConfigured()) {
    console.warn(
      "[syra-partnership-scout] Telegram disabled: set SYRA_DEV_BOT_TOKEN and SYRA_DEV_BOT_CHAT_ID",
    );
  }

  console.log(
    `[syra-partnership-scout] enabled; WIB ${String(SYRA_PARTNERSHIP_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_PARTNERSHIP_SCOUT_WIB_MINUTE).padStart(2, "0")}; Telegram=${isDevTelegramConfigured() ? "on" : "off"}`,
  );
}
