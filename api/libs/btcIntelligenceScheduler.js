/**
 * Background refresh for BTC intelligence — tiered schedules derived from API rate limits.
 *
 * Instead of one heavy tick per minute, groups refresh on independent intervals:
 * - overview (fast, few calls)
 * - dashboard core (market sections, no RSS/LLM)
 * - news/sentiment (slow)
 * - bubblemap presets (one per tick, rotated)
 */
import { isMongooseConnected } from "../config/mongoose.js";
import { getBtcIntelligenceRefreshIntervals } from "../config/btcIntelligenceConfig.js";
import { startupVerbose } from "../utils/startupLog.js";
import { computeBtcOverview, computeBtcBubblemap, BTC_BUBBLEMAP_PRESETS } from "./btcIntelligenceService.js";
import {
  computeBtcDashboard,
  computeBtcDashboardNewsSentiment,
} from "./btcDashboardService.js";
import {
  BTC_SNAPSHOT_KEYS,
  btcBubblemapSnapshotKey,
  readBtcSnapshotPayload,
  recordBtcSnapshotError,
  writeBtcSnapshot,
} from "./btcIntelligenceStore.js";

/** @type {ReturnType<typeof setTimeout> | null} */
let tickTimer = null;

/** @type {boolean} */
let tickInFlight = false;

/** @type {{ overview: number; dashboard: number; newsSentiment: number; bubblemap: number }} */
const lastRunAt = {
  overview: 0,
  dashboard: 0,
  newsSentiment: 0,
  bubblemap: 0,
};

let bubblemapPresetIndex = 0;

/** In-memory cache of last dashboard payload — avoids Mongo read on every dashboard tick. */
/** @type {Record<string, unknown> | null} */
let cachedDashboardPayload = null;

function isSchedulerEnabled() {
  const raw = String(process.env.BTC_INTELLIGENCE_CRON_ENABLED ?? "true").trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

function scheduleNextTick() {
  if (tickTimer) clearTimeout(tickTimer);
  const { tickMs } = getBtcIntelligenceRefreshIntervals();
  tickTimer = setTimeout(() => {
    runBtcIntelligenceSchedulerTick()
      .catch(() => {})
      .finally(() => scheduleNextTick());
  }, tickMs);
  if (typeof tickTimer.unref === "function") {
    tickTimer.unref();
  }
}

async function refreshOverview() {
  const started = Date.now();
  const overview = await computeBtcOverview();
  await writeBtcSnapshot(BTC_SNAPSHOT_KEYS.overview, overview, {
    refreshDurationMs: Date.now() - started,
  });
  return BTC_SNAPSHOT_KEYS.overview;
}

async function refreshDashboardCore() {
  const started = Date.now();
  const overview =
    (await readBtcSnapshotPayload(BTC_SNAPSHOT_KEYS.overview)) ?? (await computeBtcOverview());
  const partial = await computeBtcDashboard(overview, {
    skipNews: true,
    skipSentiment: true,
  });
  const existing =
    cachedDashboardPayload ?? (await readBtcSnapshotPayload(BTC_SNAPSHOT_KEYS.dashboard));
  const merged = {
    ...partial,
    sections: {
      ...partial.sections,
      news: existing?.sections?.news ?? partial.sections.news,
      sentiment: existing?.sections?.sentiment ?? partial.sections.sentiment,
    },
  };
  await writeBtcSnapshot(BTC_SNAPSHOT_KEYS.dashboard, merged, {
    refreshDurationMs: Date.now() - started,
  });
  cachedDashboardPayload = merged;
  return BTC_SNAPSHOT_KEYS.dashboard;
}

async function refreshNewsSentiment() {
  const started = Date.now();
  const slow = await computeBtcDashboardNewsSentiment();
  const existing =
    cachedDashboardPayload ?? (await readBtcSnapshotPayload(BTC_SNAPSHOT_KEYS.dashboard));
  if (!existing?.sections) {
    return null;
  }
  const updated = {
    ...existing,
    sections: {
      ...existing.sections,
      news: slow.news ?? existing.sections.news,
      sentiment: slow.sentiment ?? existing.sections.sentiment,
    },
    computedAt: new Date().toISOString(),
  };
  await writeBtcSnapshot(BTC_SNAPSHOT_KEYS.dashboard, updated, {
    refreshDurationMs: Date.now() - started,
  });
  cachedDashboardPayload = updated;
  return `${BTC_SNAPSHOT_KEYS.dashboard}:news-sentiment`;
}

async function refreshNextBubblemap() {
  const preset = BTC_BUBBLEMAP_PRESETS[bubblemapPresetIndex];
  bubblemapPresetIndex = (bubblemapPresetIndex + 1) % BTC_BUBBLEMAP_PRESETS.length;
  const key = btcBubblemapSnapshotKey(preset.exchange, preset.interval, preset.limit);
  const started = Date.now();
  const bubblemap = await computeBtcBubblemap(preset);
  await writeBtcSnapshot(key, bubblemap, {
    refreshDurationMs: Date.now() - started,
  });
  return key;
}

/**
 * @returns {Promise<{ success: boolean; error?: string; refreshed?: string[]; intervals?: ReturnType<typeof getBtcIntelligenceRefreshIntervals> }>}
 */
export async function runBtcIntelligenceSchedulerTick() {
  if (!isSchedulerEnabled()) {
    return { success: false, error: "scheduler_disabled" };
  }
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick_already_in_flight" };
  }

  tickInFlight = true;
  const refreshed = [];
  const now = Date.now();
  const intervals = getBtcIntelligenceRefreshIntervals();

  try {
    if (now - lastRunAt.overview >= intervals.overviewMs) {
      try {
        refreshed.push(await refreshOverview());
        lastRunAt.overview = now;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[btc-intelligence] overview refresh failed:", msg);
        await recordBtcSnapshotError(BTC_SNAPSHOT_KEYS.overview, msg);
      }
    }

    if (now - lastRunAt.dashboard >= intervals.dashboardMs) {
      try {
        refreshed.push(await refreshDashboardCore());
        lastRunAt.dashboard = now;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[btc-intelligence] dashboard refresh failed:", msg);
        await recordBtcSnapshotError(BTC_SNAPSHOT_KEYS.dashboard, msg);
      }
    }

    if (now - lastRunAt.newsSentiment >= intervals.newsSentimentMs) {
      try {
        const key = await refreshNewsSentiment();
        if (key) refreshed.push(key);
        lastRunAt.newsSentiment = now;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[btc-intelligence] news/sentiment refresh failed:", msg);
      }
    }

    if (now - lastRunAt.bubblemap >= intervals.bubblemapMs) {
      const preset = BTC_BUBBLEMAP_PRESETS[bubblemapPresetIndex];
      const key = btcBubblemapSnapshotKey(preset.exchange, preset.interval, preset.limit);
      try {
        refreshed.push(await refreshNextBubblemap());
        lastRunAt.bubblemap = now;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[btc-intelligence] bubblemap refresh failed (${key}):`, msg);
        await recordBtcSnapshotError(key, msg);
        bubblemapPresetIndex = (bubblemapPresetIndex + 1) % BTC_BUBBLEMAP_PRESETS.length;
        lastRunAt.bubblemap = now;
      }
    }

    if (refreshed.length > 0) {
      startupVerbose(`[btc-intelligence] refreshed: ${refreshed.join(", ")}`);
    }

    return { success: true, refreshed, intervals };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[btc-intelligence] scheduler tick failed:", msg);
    return { success: false, error: msg };
  } finally {
    tickInFlight = false;
  }
}

export function startBtcIntelligenceScheduler() {
  if (tickTimer || !isSchedulerEnabled()) return;

  const intervals = getBtcIntelligenceRefreshIntervals();
  startupVerbose(
    `[btc-intelligence] scheduler started (tick=${Math.round(intervals.tickMs / 1000)}s ` +
      `overview=${Math.round(intervals.overviewMs / 1000)}s ` +
      `dashboard=${Math.round(intervals.dashboardMs / 1000)}s ` +
      `news=${Math.round(intervals.newsSentimentMs / 1000)}s ` +
      `bubblemap=${Math.round(intervals.bubblemapMs / 1000)}s ` +
      `coingecko=${intervals.coingeckoPerMin}/min)`,
  );

  setTimeout(() => {
    runBtcIntelligenceSchedulerTick().catch(() => {});
  }, intervals.startupDelayMs);

  scheduleNextTick();
}

export function stopBtcIntelligenceScheduler() {
  if (tickTimer) {
    clearTimeout(tickTimer);
    tickTimer = null;
  }
}
