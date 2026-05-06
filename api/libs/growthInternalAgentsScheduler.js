/**
 * Three growth-focused internal agents (SYRA market, SYRA social, sector narrative).
 *
 * Schedule: daily at WIB anchor (see `./wibDailyWallClock.js`), staggered +0 / +60s / +120s. No run on boot.
 *
 * Social/sector need X_BEARER_TOKEN; all need OPENROUTER_API_KEY. Telegram via SYRA dev bot.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { isXApiBearerConfigured } from "./xApiClient.js";
import {
  runGrowthSyraMarketAgent,
  formatGrowthSyraMarketTelegram,
} from "../agents/growth-syra-market-agent.js";
import {
  runGrowthSyraSocialAgent,
  formatGrowthSyraSocialTelegram,
} from "../agents/growth-syra-social-agent.js";
import {
  runGrowthSectorNarrativeAgent,
  formatGrowthSectorNarrativeTelegram,
} from "../agents/growth-sector-narrative-agent.js";
import {
  getMsUntilNextWibWallClock,
  INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
} from "./wibDailyWallClock.js";

export const GROWTH_SYRA_MARKET_DB_ID = "growth-syra-market-latest";
export const GROWTH_SYRA_SOCIAL_DB_ID = "growth-syra-social-latest";
export const GROWTH_SECTOR_NARRATIVE_DB_ID = "growth-sector-narrative-latest";

/** Milliseconds after each WIB anchor: market, social, sector. */
const GROWTH_PIPELINE_STAGGER_MS = [0, 60_000, 120_000];

async function persistPayload(dbId, payload) {
  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: dbId },
    { id: dbId, payload, savedAt },
    { upsert: true, new: true },
  );
}

/**
 * @returns {Promise<{ success: true; data: object }>}
 */
export async function runGrowthSyraMarketPipeline() {
  const data = await runGrowthSyraMarketAgent({ model: null });
  await persistPayload(GROWTH_SYRA_MARKET_DB_ID, data);
  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatGrowthSyraMarketTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[growth-internal] Telegram send failed (syra market)");
  }
  return { success: true, data };
}

/**
 * @returns {Promise<{ success: true; data: object }>}
 */
export async function runGrowthSyraSocialPipeline() {
  if (!isXApiBearerConfigured()) {
    throw new Error("growth-syra-social: X_BEARER_TOKEN is not set");
  }
  const data = await runGrowthSyraSocialAgent({ model: null });
  await persistPayload(GROWTH_SYRA_SOCIAL_DB_ID, data);
  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatGrowthSyraSocialTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[growth-internal] Telegram send failed (syra social)");
  }
  return { success: true, data };
}

/**
 * @returns {Promise<{ success: true; data: object }>}
 */
export async function runGrowthSectorNarrativePipeline() {
  if (!isXApiBearerConfigured()) {
    throw new Error("growth-sector: X_BEARER_TOKEN is not set");
  }
  const data = await runGrowthSectorNarrativeAgent({ model: null });
  await persistPayload(GROWTH_SECTOR_NARRATIVE_DB_ID, data);
  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatGrowthSectorNarrativeTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[growth-internal] Telegram send failed (sector narrative)");
  }
  return { success: true, data };
}

/**
 * Run all three sequentially (market → social → sector). Continues after partial failure unless throw - we'll catch per step.
 * @returns {Promise<{ results: Array<{ id: string; ok: boolean; error?: string }> }>}
 */
export async function runAllGrowthInternalAgentsPipelines() {
  /** @type {Array<{ id: string; ok: boolean; error?: string }>} */
  const results = [];

  for (const { id, fn } of [
    { id: "growth-syra-market", fn: runGrowthSyraMarketPipeline },
    { id: "growth-syra-social", fn: runGrowthSyraSocialPipeline },
    { id: "growth-sector-narrative", fn: runGrowthSectorNarrativePipeline },
  ]) {
    try {
      await fn();
      results.push({ id, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[growth-internal] ${id} failed:`, msg);
      results.push({ id, ok: false, error: msg });
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(`Syra growth agent failed — ${id}\n${msg.slice(0, 2800)}`, {
          disableWebPagePreview: true,
        });
      }
    }
  }

  return { results };
}

/**
 * @param {() => Promise<unknown>} tick
 * @param {string} label
 * @param {number} staggerMs offset after each daily WIB anchor
 */
function createLoop(tick, label, staggerMs) {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  const run = async () => {
    if (running) {
      console.warn(`[growth-internal] skipped ${label}: still running`);
      return;
    }
    running = true;
    try {
      await tick();
      console.log(`[growth-internal] ${label} OK`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[growth-internal] ${label} failed:`, msg);
      if (isDevTelegramConfigured()) {
        await sendDevTelegram(`Syra growth — ${label}\n${msg.slice(0, 3200)}`, {
          disableWebPagePreview: true,
        });
      }
    } finally {
      running = false;
    }
  };

  const scheduleNext = () => {
    if (timer) clearTimeout(timer);
    const delayMs =
      getMsUntilNextWibWallClock(
        new Date(),
        INTERNAL_AGENT_PIPELINES_WIB_HOUR,
        INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
      ) + staggerMs;
    const nextAt = new Date(Date.now() + delayMs).toISOString();
    console.log(
      `[growth-internal] ${label} next run in ${Math.round(delayMs / 1000)}s (~${nextAt} UTC; WIB anchor + ${Math.round(staggerMs / 1000)}s)`,
    );
    timer = setTimeout(async () => {
      await run();
      scheduleNext();
    }, delayMs);
  };

  const arm = () => {
    if (timer) clearTimeout(timer);
    const initialDelayMs =
      getMsUntilNextWibWallClock(
        new Date(),
        INTERNAL_AGENT_PIPELINES_WIB_HOUR,
        INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
      ) + staggerMs;
    console.log(
      `[growth-internal] ${label} first run in ${Math.round(initialDelayMs / 1000)}s (daily WIB + ${Math.round(staggerMs / 1000)}s)`,
    );
    timer = setTimeout(async () => {
      await run();
      scheduleNext();
    }, initialDelayMs);
  };

  return { arm };
}

export function startGrowthInternalAgentsScheduler() {
  createLoop(() => runGrowthSyraMarketPipeline(), "syra-market", GROWTH_PIPELINE_STAGGER_MS[0]).arm();
  createLoop(() => runGrowthSyraSocialPipeline(), "syra-social", GROWTH_PIPELINE_STAGGER_MS[1]).arm();
  createLoop(() => runGrowthSectorNarrativePipeline(), "sector-narrative", GROWTH_PIPELINE_STAGGER_MS[2]).arm();

  console.log(
    `[growth-internal] enabled; WIB daily ${String(INTERNAL_AGENT_PIPELINES_WIB_HOUR).padStart(2, "0")}:${String(INTERNAL_AGENT_PIPELINES_WIB_MINUTE).padStart(2, "0")} Asia/Jakarta + stagger ${GROWTH_PIPELINE_STAGGER_MS.map((ms) => `${Math.round(ms / 1000)}s`).join(" / ")}`,
  );
  if (!isXApiBearerConfigured()) {
    console.warn("[growth-internal] X_BEARER_TOKEN missing — social + sector agents will fail until set");
  }
}
