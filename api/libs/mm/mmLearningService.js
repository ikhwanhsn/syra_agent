/**
 * SYRA MM learning  - tune spread/size/grid from closed round trips.
 * Reward = volume; hard constraint = realized PnL >= 0.
 * Overrides evolve incrementally from current effective params (not absolute jumps from defaults).
 */
import MmLearningState from "../../models/MmLearningState.js";
import MmRun from "../../models/MmRun.js";
import {
  MM_DEFAULTS,
  MM_STRATEGY_POPULATION,
  estimateMmRoundTripCostPct,
} from "../../config/mmAgentConfig.js";
import { evaluateMmPaperEdge } from "../../config/mmPaperEdge.js";

const GLOBAL_ID = "singleton";

/** Default min gap between evolutions (post-resolve fires often). */
export const MM_LEARNING_MIN_INTERVAL_MS_DEFAULT = 60 * 60_000;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {Record<string, unknown> | null | undefined} overrides
 * @param {Record<string, unknown>} baseCfg
 */
export function resolveCurrentMmParams(overrides, baseCfg) {
  const o = overrides ?? {};
  return {
    spreadBps: toNum(o.spreadBps, baseCfg.spreadBps),
    orderSizeUsd: toNum(o.orderSizeUsd, baseCfg.orderSizeUsd),
    gridLevels: Math.floor(toNum(o.gridLevels, baseCfg.gridLevels)),
    maxInventoryUsd: toNum(o.maxInventoryUsd, baseCfg.maxInventoryUsd),
    minEdgeBufferPct: toNum(o.minEdgeBufferPct, baseCfg.minEdgeBufferPct),
    inventorySkewFactor: toNum(o.inventorySkewFactor, baseCfg.inventorySkewFactor),
    deploySlicePct: toNum(o.deploySlicePct, baseCfg.deploySlicePct),
  };
}

/**
 * Incremental override steps from current params + closed-run analysis.
 * Pure  - no I/O. Excludes mid_fallback trips from caller-supplied `honestClosed`.
 *
 * @param {{
 *   honestClosed: Array<Record<string, unknown>>;
 *   current: ReturnType<typeof resolveCurrentMmParams>;
 *   baseCfg: Record<string, unknown>;
 *   existingCooldowns?: Array<{ strategyId: string; reason?: string | null; until: Date | string }>;
 *   now?: number;
 * }} input
 */
export function computeMmLearningDelta(input) {
  const {
    honestClosed,
    current,
    baseCfg,
    existingCooldowns = [],
    now = Date.now(),
  } = input;

  const lessons = [];
  /** @type {Record<string, number>} */
  const thresholdOverrides = { ...current };
  /** @type {Record<string, { roundTrips: number; volumeUsd: number; pnlUsd: number; avgPnlPct: number; volumePerDollar: number }>} */
  const strategyStats = {};
  /** @type {Array<{ strategyId: string; reason: string; until: Date }>} */
  const strategyCooldowns = [];

  let totalVolume = 0;
  let totalPnl = 0;

  for (const run of honestClosed) {
    totalVolume += toNum(run.volumeUsd);
    totalPnl += toNum(run.simPnlUsd);
    const sid = String(run.strategyId ?? "");
    if (!sid) continue;
    if (!strategyStats[sid]) {
      strategyStats[sid] = {
        roundTrips: 0,
        volumeUsd: 0,
        pnlUsd: 0,
        avgPnlPct: 0,
        volumePerDollar: 0,
      };
    }
    strategyStats[sid].roundTrips += 1;
    strategyStats[sid].volumeUsd += toNum(run.volumeUsd);
    strategyStats[sid].pnlUsd += toNum(run.simPnlUsd);
  }

  const startingBank = toNum(baseCfg.startingBankUsd, MM_DEFAULTS.startingBankUsd);
  for (const stats of Object.values(strategyStats)) {
    stats.avgPnlPct =
      stats.roundTrips > 0
        ? (stats.pnlUsd / Math.max(1, stats.volumeUsd / 2)) * 100
        : 0;
    stats.volumePerDollar = startingBank > 0 ? stats.volumeUsd / startingBank : 0;
  }

  const profitableStrategies = Object.entries(strategyStats).filter(([, s]) => s.pnlUsd >= 0);
  const losingStrategies = Object.entries(strategyStats).filter(([, s]) => s.pnlUsd < 0);

  let promotedStrategyId = "adaptive";
  if (profitableStrategies.length > 0) {
    profitableStrategies.sort((a, b) => b[1].volumeUsd - a[1].volumeUsd);
    promotedStrategyId = profitableStrategies[0][0];
    lessons.push(
      `Strategy "${promotedStrategyId}" leads volume ($${profitableStrategies[0][1].volumeUsd.toFixed(0)}) with non-negative PnL  - promoted.`,
    );
  }

  // Small incremental steps from *current* effective params (not MM_DEFAULTS jumps).
  if (totalPnl < 0) {
    lessons.push(
      `Overall PnL negative ($${totalPnl.toFixed(2)})  - widening spread and reducing size.`,
    );
    thresholdOverrides.spreadBps = clamp(current.spreadBps + 5, 15, 120);
    thresholdOverrides.orderSizeUsd = clamp(current.orderSizeUsd * 0.9, 8, 80);
    thresholdOverrides.minEdgeBufferPct = clamp(current.minEdgeBufferPct + 0.02, 0.05, 0.3);
  } else if (totalPnl >= 0 && totalVolume > 0) {
    const efficiency = totalVolume / Math.max(1, startingBank);
    if (efficiency < 5) {
      lessons.push(
        `Volume efficiency low (${efficiency.toFixed(1)}x bank)  - tightening spread for more fills.`,
      );
      thresholdOverrides.spreadBps = clamp(current.spreadBps - 3, 15, 120);
      thresholdOverrides.gridLevels = clamp(current.gridLevels + 1, 1, 5);
    } else {
      lessons.push(
        `Profitable with ${efficiency.toFixed(1)}x bank volume  - slightly increasing deploy slice.`,
      );
      thresholdOverrides.deploySlicePct = clamp(current.deploySlicePct * 1.05, 0.15, 0.5);
    }
  }

  const roundTripCost = estimateMmRoundTripCostPct(
    toNum(baseCfg.quoteSlippageBps, MM_DEFAULTS.quoteSlippageBps),
  );
  const avgSpreadCapture = honestClosed
    .map((r) => toNum(r.spreadBps))
    .filter((v) => v > 0);
  if (avgSpreadCapture.length >= 5) {
    const meanSpread = avgSpreadCapture.reduce((a, b) => a + b, 0) / avgSpreadCapture.length;
    if (meanSpread / 100 < roundTripCost && totalPnl < 0) {
      lessons.push(
        `Captured spread (${(meanSpread / 100).toFixed(2)}%) below round-trip cost (${roundTripCost.toFixed(2)}%)  - raising min edge buffer.`,
      );
      thresholdOverrides.minEdgeBufferPct = clamp(current.minEdgeBufferPct + 0.03, 0.05, 0.3);
    }
  }

  const maxInv = toNum(baseCfg.maxInventoryUsd, MM_DEFAULTS.maxInventoryUsd);
  const highInvLosses = honestClosed.filter(
    (r) => toNum(r.inventoryUsdAfter) > maxInv * 0.85 && toNum(r.simPnlUsd) < 0,
  );
  if (highInvLosses.length >= 3) {
    lessons.push(
      `${highInvLosses.length} losses near max inventory  - increasing skew and lowering max inventory.`,
    );
    thresholdOverrides.inventorySkewFactor = clamp(current.inventorySkewFactor + 0.05, 0.3, 0.85);
    thresholdOverrides.maxInventoryUsd = clamp(current.maxInventoryUsd * 0.92, 60, maxInv);
  }

  for (const [sid, stats] of losingStrategies) {
    if (stats.roundTrips >= 4 && stats.pnlUsd < -5) {
      lessons.push(
        `Strategy "${sid}" losing ($${stats.pnlUsd.toFixed(2)})  - 8h cooldown.`,
      );
      strategyCooldowns.push({
        strategyId: sid,
        reason: `negative_pnl:${stats.pnlUsd.toFixed(2)}`,
        until: new Date(now + 8 * 60 * 60_000),
      });
    }
  }

  const tightStats = strategyStats.tight;
  const wideStats = strategyStats.wide;
  if (tightStats && wideStats && tightStats.roundTrips >= 5 && wideStats.roundTrips >= 5) {
    if (tightStats.pnlUsd >= 0 && tightStats.volumeUsd > wideStats.volumeUsd * 1.2) {
      lessons.push("Tight spread outperforming on volume with positive PnL  - favoring tighter quotes.");
      thresholdOverrides.spreadBps = clamp(
        Math.min(thresholdOverrides.spreadBps, current.spreadBps - 2),
        15,
        120,
      );
    }
  }

  // Merge cooldowns: keep still-active prior entries, then add/replace by strategyId.
  const mergedById = new Map();
  for (const c of existingCooldowns) {
    if (!c?.strategyId || !c.until) continue;
    const untilMs = new Date(c.until).getTime();
    if (untilMs > now) {
      mergedById.set(c.strategyId, {
        strategyId: c.strategyId,
        reason: c.reason ?? null,
        until: new Date(untilMs),
      });
    }
  }
  for (const c of strategyCooldowns) {
    mergedById.set(c.strategyId, c);
  }

  // Only persist keys that differ from base defaults (keep doc small / readable).
  /** @type {Record<string, number>} */
  const persistedOverrides = {};
  const keys = [
    "spreadBps",
    "orderSizeUsd",
    "gridLevels",
    "maxInventoryUsd",
    "minEdgeBufferPct",
    "inventorySkewFactor",
    "deploySlicePct",
  ];
  for (const key of keys) {
    const next = thresholdOverrides[key];
    const baseVal = toNum(baseCfg[key], MM_DEFAULTS[key]);
    if (next !== baseVal) persistedOverrides[key] = next;
  }

  const summary = `Analyzed ${honestClosed.length} honest round trips  - volume $${totalVolume.toFixed(0)}, PnL $${totalPnl.toFixed(2)}, promoted "${promotedStrategyId}", ${mergedById.size} cooldowns.`;

  return {
    lessons,
    thresholdOverrides: persistedOverrides,
    effectiveParams: thresholdOverrides,
    strategyStats,
    promotedStrategyId,
    strategyCooldowns: [...mergedById.values()],
    totalVolume,
    totalPnl,
    summary,
  };
}

/**
 * Count consecutive identical promotions at the end of history (including next).
 * @param {Array<{ strategyId?: string }>} history
 * @param {string} nextId
 */
export function computePromotionStability(history, nextId) {
  let stability = 1;
  for (let i = (history?.length ?? 0) - 1; i >= 0; i -= 1) {
    if (history[i]?.strategyId === nextId) stability += 1;
    else break;
  }
  return stability;
}

async function getLearningDoc() {
  let doc = await MmLearningState.findById(GLOBAL_ID).lean();
  if (!doc) {
    await MmLearningState.create({
      _id: GLOBAL_ID,
      lessons: [],
      thresholdOverrides: {},
      strategyStats: {},
      promotedStrategyId: "adaptive",
      strategyCooldowns: [],
      promotedHistory: [],
    });
    doc = await MmLearningState.findById(GLOBAL_ID).lean();
  }
  return doc;
}

/**
 * @param {Record<string, unknown>} baseCfg
 */
export async function getEffectiveMmConfig(baseCfg) {
  const doc = await getLearningDoc();
  return {
    ...baseCfg,
    ...resolveCurrentMmParams(doc?.thresholdOverrides, baseCfg),
  };
}

/**
 * @returns {Promise<string | null>}
 */
export async function getPromotedStrategyId() {
  const doc = await getLearningDoc();
  return doc?.promotedStrategyId ?? "adaptive";
}

/**
 * @param {string} strategyId
 */
export async function isStrategyOnCooldown(strategyId) {
  const doc = await getLearningDoc();
  const now = Date.now();
  const cooldowns = doc?.strategyCooldowns ?? [];
  return cooldowns.some(
    (c) => c.strategyId === strategyId && c.until && new Date(c.until).getTime() > now,
  );
}

/**
 * Build paper-edge readiness metrics for overview / dossier.
 * @param {Record<string, unknown>} baseCfg
 * @param {Record<string, unknown> | null} learningDoc
 */
export async function buildMmPaperEdgeMetrics(baseCfg, learningDoc = null) {
  const doc = learningDoc ?? (await getLearningDoc());
  const closed = await MmRun.find({
    status: "closed",
    resolution: "round_trip_complete",
    resolvedAt: { $ne: null },
  })
    .sort({ resolvedAt: -1 })
    .limit(300)
    .lean();

  const midFallbackCount = closed.filter((r) => r.fillSource === "mid_fallback").length;
  const honest = closed.filter((r) => r.fillSource !== "mid_fallback");
  const midFallbackFrac = closed.length > 0 ? midFallbackCount / closed.length : 0;

  const promotedId = doc?.promotedStrategyId ?? "adaptive";
  let promotedNetPnlUsd = 0;
  let wins = 0;
  let losses = 0;
  for (const r of honest) {
    const pnl = toNum(r.simPnlUsd);
    if (r.strategyId === promotedId) promotedNetPnlUsd += pnl;
    if (pnl > 0) wins += 1;
    else if (pnl < 0) losses += 1;
  }

  const history = doc?.promotedHistory ?? [];
  const promotionStability = computePromotionStability(history, promotedId);

  const maxInv = toNum(
    doc?.thresholdOverrides?.maxInventoryUsd,
    baseCfg.maxInventoryUsd ?? MM_DEFAULTS.maxInventoryUsd,
  );
  const latestInv = honest[0] ? toNum(honest[0].inventoryUsdAfter) : 0;
  const inventoryDriftFrac = maxInv > 0 ? Math.abs(latestInv) / maxInv : 0;

  const evaluation = evaluateMmPaperEdge({
    honestRoundTrips: honest.length,
    promotedNetPnlUsd,
    midFallbackFrac,
    inventoryDriftFrac,
    promotionStability,
  });

  return {
    honestRoundTrips: honest.length,
    closedSample: closed.length,
    midFallbackCount,
    midFallbackFrac,
    promotedStrategyId: promotedId,
    promotedNetPnlUsd: Math.round(promotedNetPnlUsd * 100) / 100,
    winRate: honest.length > 0 ? wins / honest.length : null,
    inventoryDriftFrac: Math.round(inventoryDriftFrac * 1000) / 1000,
    promotionStability,
    evaluation,
  };
}

/**
 * @param {Record<string, unknown>} baseCfg
 */
export async function getMmLearningSnapshot(baseCfg) {
  const doc = await getLearningDoc();
  const effectiveConfig = await getEffectiveMmConfig(baseCfg);
  const now = Date.now();
  const activeCooldowns = (doc?.strategyCooldowns ?? []).filter(
    (c) => c.until && new Date(c.until).getTime() > now,
  );
  const paperEdge = await buildMmPaperEdgeMetrics(baseCfg, doc);

  return {
    lessons: doc?.lessons ?? [],
    thresholdOverrides: doc?.thresholdOverrides ?? {},
    strategyStats: doc?.strategyStats ?? {},
    promotedStrategyId: doc?.promotedStrategyId ?? "adaptive",
    strategyCooldowns: activeCooldowns.map((c) => ({
      strategyId: c.strategyId,
      reason: c.reason ?? null,
      until: new Date(c.until).toISOString(),
    })),
    lastEvolutionAt: doc?.lastEvolutionAt?.toISOString?.() ?? null,
    lastEvolutionSummary: doc?.lastEvolutionSummary ?? null,
    runsAnalyzed: doc?.runsAnalyzed ?? 0,
    baseConfig: {
      spreadBps: baseCfg.spreadBps,
      orderSizeUsd: baseCfg.orderSizeUsd,
      gridLevels: baseCfg.gridLevels,
      maxInventoryUsd: baseCfg.maxInventoryUsd,
      minEdgeBufferPct: baseCfg.minEdgeBufferPct,
      inventorySkewFactor: baseCfg.inventorySkewFactor,
      deploySlicePct: baseCfg.deploySlicePct,
    },
    effectiveConfig: {
      spreadBps: effectiveConfig.spreadBps,
      orderSizeUsd: effectiveConfig.orderSizeUsd,
      gridLevels: effectiveConfig.gridLevels,
      maxInventoryUsd: effectiveConfig.maxInventoryUsd,
      minEdgeBufferPct: effectiveConfig.minEdgeBufferPct,
      inventorySkewFactor: effectiveConfig.inventorySkewFactor,
      deploySlicePct: effectiveConfig.deploySlicePct,
    },
    creatorFeeBps: baseCfg.creatorFeeBps,
    paperEdge,
  };
}

/**
 * Analyze closed round trips and tune parameters.
 * @param {{ force?: boolean }} [opts]  - force skips rate limit (manual / daily cron).
 */
export async function runMmLearning(opts = {}) {
  const force = Boolean(opts.force);
  const minRuns = Number(process.env.MM_LEARNING_MIN_RUNS || 8);
  const minIntervalMs = (() => {
    const raw = Number(process.env.MM_LEARNING_MIN_INTERVAL_MS);
    return Number.isFinite(raw) && raw >= 60_000
      ? Math.floor(raw)
      : MM_LEARNING_MIN_INTERVAL_MS_DEFAULT;
  })();

  const doc = await getLearningDoc();
  if (!force && doc?.lastEvolutionAt) {
    const elapsed = Date.now() - new Date(doc.lastEvolutionAt).getTime();
    if (elapsed < minIntervalMs) {
      return {
        skipped: true,
        reason: "rate_limited",
        elapsedMs: elapsed,
        minIntervalMs,
      };
    }
  }

  const closed = await MmRun.find({
    status: "closed",
    resolution: "round_trip_complete",
    resolvedAt: { $ne: null },
  })
    .sort({ resolvedAt: -1 })
    .limit(300)
    .lean();

  // Exclude legacy mid_fallback fills that invent zero-impact PnL.
  const honestClosed = closed.filter((r) => r.fillSource !== "mid_fallback");
  const excludedMidFallback = closed.length - honestClosed.length;

  if (honestClosed.length < minRuns) {
    return {
      skipped: true,
      reason: "insufficient_runs",
      closedCount: closed.length,
      honestCount: honestClosed.length,
      excludedMidFallback,
      minRuns,
    };
  }

  const baseCfg = { ...MM_DEFAULTS };
  const current = resolveCurrentMmParams(doc?.thresholdOverrides, baseCfg);
  const now = Date.now();

  const delta = computeMmLearningDelta({
    honestClosed,
    current,
    baseCfg,
    existingCooldowns: doc?.strategyCooldowns ?? [],
    now,
  });

  const prevHistory = Array.isArray(doc?.promotedHistory) ? [...doc.promotedHistory] : [];
  const promotedHistory = [
    ...prevHistory,
    { strategyId: delta.promotedStrategyId, at: new Date(now) },
  ].slice(-20);

  const promotionStability = computePromotionStability(prevHistory, delta.promotedStrategyId);

  await MmLearningState.updateOne(
    { _id: GLOBAL_ID },
    {
      $set: {
        lessons: delta.lessons.slice(0, 30),
        thresholdOverrides: delta.thresholdOverrides,
        strategyStats: delta.strategyStats,
        promotedStrategyId: delta.promotedStrategyId,
        strategyCooldowns: delta.strategyCooldowns,
        promotedHistory,
        lastEvolutionAt: new Date(now),
        lastEvolutionSummary: delta.summary,
        runsAnalyzed: honestClosed.length,
      },
    },
    { upsert: true },
  );

  return {
    skipped: false,
    closedCount: closed.length,
    honestCount: honestClosed.length,
    excludedMidFallback,
    totalVolume: delta.totalVolume,
    totalPnl: delta.totalPnl,
    lessons: delta.lessons,
    thresholdOverrides: delta.thresholdOverrides,
    strategyStats: delta.strategyStats,
    promotedStrategyId: delta.promotedStrategyId,
    strategyCooldowns: delta.strategyCooldowns.length,
    promotionStability,
    summary: delta.summary,
  };
}

export const MM_LEARNING_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 24 * 60 * 60_000,
});

export function mmLearningConfigFromEnv() {
  const enabledRaw = (process.env.MM_LEARNING_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off"
      ? false
      : MM_LEARNING_SCHEDULE.enabled;
  const ms = Number(process.env.MM_LEARNING_MS || MM_LEARNING_SCHEDULE.intervalMs);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : MM_LEARNING_SCHEDULE.intervalMs,
  };
}

/**
 * Apply learned overrides to a strategy config entry.
 * @param {object} strategy
 * @param {Record<string, unknown>} overrides
 */
export function applyOverridesToStrategy(strategy, overrides) {
  const base = MM_STRATEGY_POPULATION.find((s) => s.id === strategy.id) ?? strategy;
  return {
    ...base,
    spreadBps: toNum(overrides.spreadBps, base.spreadBps),
    orderSizeUsd: toNum(overrides.orderSizeUsd, base.orderSizeUsd),
    gridLevels: Math.floor(toNum(overrides.gridLevels, base.gridLevels)),
  };
}
