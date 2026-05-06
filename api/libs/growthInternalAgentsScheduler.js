/**
 * Three growth-focused internal agents (SYRA market, SYRA social, sector narrative).
 * Default 24h interval each; Telegram via Syra dev bot; Mongo DashboardResearch persistence.
 * Opt-out: GROWTH_INTERNAL_AGENTS_ENABLED=0. Social/sector need X_BEARER_TOKEN; all need OPENROUTER_API_KEY.
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

export const GROWTH_SYRA_MARKET_DB_ID = "growth-syra-market-latest";
export const GROWTH_SYRA_SOCIAL_DB_ID = "growth-syra-social-latest";
export const GROWTH_SECTOR_NARRATIVE_DB_ID = "growth-sector-narrative-latest";

const DEFAULT_INTERVAL_MS = 86_400_000;
const MIN_INTERVAL_MS = 3_600_000;
const MAX_INTERVAL_MS = 7 * 86_400_000;

function getIntervalMs() {
  const n = Number.parseInt(
    String(process.env.GROWTH_INTERNAL_AGENTS_INTERVAL_MS || "").trim(),
    10,
  );
  if (!Number.isFinite(n)) return DEFAULT_INTERVAL_MS;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, n));
}

function modelFromEnv() {
  const m = String(process.env.GROWTH_INTERNAL_AGENTS_MODEL || "").trim();
  return m || null;
}

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
  const data = await runGrowthSyraMarketAgent({ model: modelFromEnv() });
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
  const data = await runGrowthSyraSocialAgent({ model: modelFromEnv() });
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
  const data = await runGrowthSectorNarrativeAgent({ model: modelFromEnv() });
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
 */
function createLoop(tick, label) {
  let running = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;
  const intervalMs = getIntervalMs();
  const intervalLabel =
    intervalMs % 3_600_000 === 0
      ? `${intervalMs / 3_600_000}h`
      : `${Math.round(intervalMs / 60_000)} min`;

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
    timer = setTimeout(async () => {
      await run();
      scheduleNext();
    }, intervalMs);
  };

  /** @param {number} initialDelayMs */
  const arm = (initialDelayMs) => {
    if (timer) clearTimeout(timer);
    if (initialDelayMs > 0) {
      console.log(
        `[growth-internal] ${label} first run in ${Math.round(initialDelayMs / 1000)}s; then every ${intervalLabel}`,
      );
    }
    timer = setTimeout(async () => {
      await run();
      scheduleNext();
    }, initialDelayMs);
  };

  return { arm };
}

export function startGrowthInternalAgentsScheduler() {
  if (String(process.env.GROWTH_INTERNAL_AGENTS_ENABLED || "").trim() === "0") {
    console.log("[growth-internal] disabled (GROWTH_INTERNAL_AGENTS_ENABLED=0)");
    return;
  }

  const intervalMs = getIntervalMs();
  const intervalLabel =
    intervalMs % 3_600_000 === 0
      ? `${intervalMs / 3_600_000}h`
      : `${Math.round(intervalMs / 60_000)} min`;

  createLoop(() => runGrowthSyraMarketPipeline(), "syra-market").arm(0);
  createLoop(() => runGrowthSyraSocialPipeline(), "syra-social").arm(60_000);
  createLoop(() => runGrowthSectorNarrativePipeline(), "sector-narrative").arm(120_000);

  console.log(
    `[growth-internal] enabled (opt-out GROWTH_INTERNAL_AGENTS_ENABLED=0); every ${intervalLabel}; stagger market=0s social=60s sector=120s`,
  );
  if (!isXApiBearerConfigured()) {
    console.warn("[growth-internal] X_BEARER_TOKEN missing — social + sector agents will fail until set");
  }
}
