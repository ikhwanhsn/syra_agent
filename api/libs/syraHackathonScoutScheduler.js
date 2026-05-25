/**
 * Syra Hackathon Scout — daily WIB (06:30). One X search per run (cached 12h).
 */

import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { getMsUntilNextWibWallClock } from "./wibDailyWallClock.js";
import { runSyraHackathonScoutPipeline } from "./syraHackathonScoutPipeline.js";
import {
  SYRA_HACKATHON_SCOUT_WIB_HOUR,
  SYRA_HACKATHON_SCOUT_WIB_MINUTE,
} from "../config/syraHackathonScoutConfig.js";

export function startSyraHackathonScoutScheduler() {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let nextTimer = null;

  const tick = async () => {
    if (running) {
      console.warn("[syra-hackathon-scout] skipped tick: previous run in progress");
      return;
    }
    running = true;
    try {
      const out = await runSyraHackathonScoutPipeline();
      console.log(
        `[syra-hackathon-scout] OK — tweets=${out.data.tweetsSampled} new=${out.data.newSaved} cache=${out.data.fromCache}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[syra-hackathon-scout] pipeline failed:", msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(
          `Syra · Hackathon Scout — run failed\n${msg.slice(0, 3500)}`,
          { disableWebPagePreview: true },
        );
      }
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    if (nextTimer) clearTimeout(nextTimer);
    const delayMs = getMsUntilNextWibWallClock(
      new Date(),
      SYRA_HACKATHON_SCOUT_WIB_HOUR,
      SYRA_HACKATHON_SCOUT_WIB_MINUTE,
    );
    nextTimer = setTimeout(async () => {
      await tick();
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();
  console.log(
    `[syra-hackathon-scout] enabled; WIB ${String(SYRA_HACKATHON_SCOUT_WIB_HOUR).padStart(2, "0")}:${String(SYRA_HACKATHON_SCOUT_WIB_MINUTE).padStart(2, "0")}; 1 X search/run (12h cache)`,
  );
}
