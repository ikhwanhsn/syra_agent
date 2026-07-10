/**
 * SYRA MM learning — tune spread/size/grid from closed round trips.
 * Reward = volume; hard constraint = realized PnL >= 0.
 */
import MmLearningState from "../../models/MmLearningState.js";
import MmRun from "../../models/MmRun.js";
import {
  MM_DEFAULTS,
  MM_STRATEGY_POPULATION,
  estimateMmRoundTripCostPct,
} from "../../config/mmAgentConfig.js";

const GLOBAL_ID = "singleton";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  const overrides = doc?.thresholdOverrides ?? {};

  return {
    ...baseCfg,
    spreadBps: toNum(overrides.spreadBps, baseCfg.spreadBps),
    orderSizeUsd: toNum(overrides.orderSizeUsd, baseCfg.orderSizeUsd),
    gridLevels: Math.floor(toNum(overrides.gridLevels, baseCfg.gridLevels)),
    maxInventoryUsd: toNum(overrides.maxInventoryUsd, baseCfg.maxInventoryUsd),
    minEdgeBufferPct: toNum(overrides.minEdgeBufferPct, baseCfg.minEdgeBufferPct),
    inventorySkewFactor: toNum(overrides.inventorySkewFactor, baseCfg.inventorySkewFactor),
    deploySlicePct: toNum(overrides.deploySlicePct, baseCfg.deploySlicePct),
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
 * @param {Record<string, unknown>} baseCfg
 */
export async function getMmLearningSnapshot(baseCfg) {
  const doc = await getLearningDoc();
  const effectiveConfig = await getEffectiveMmConfig(baseCfg);
  const now = Date.now();
  const activeCooldowns = (doc?.strategyCooldowns ?? []).filter(
    (c) => c.until && new Date(c.until).getTime() > now,
  );

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
      deploySlicePct: baseCfg.deploySlicePct,
    },
    effectiveConfig: {
      spreadBps: effectiveConfig.spreadBps,
      orderSizeUsd: effectiveConfig.orderSizeUsd,
      gridLevels: effectiveConfig.gridLevels,
      maxInventoryUsd: effectiveConfig.maxInventoryUsd,
      minEdgeBufferPct: effectiveConfig.minEdgeBufferPct,
      deploySlicePct: effectiveConfig.deploySlicePct,
    },
    creatorFeeBps: baseCfg.creatorFeeBps,
  };
}

/**
 * Analyze closed round trips and tune parameters.
 */
export async function runMmLearning() {
  const minRuns = Number(process.env.MM_LEARNING_MIN_RUNS || 8);

  const closed = await MmRun.find({
    status: "closed",
    resolution: "round_trip_complete",
    resolvedAt: { $ne: null },
  })
    .sort({ resolvedAt: -1 })
    .limit(300)
    .lean();

  if (closed.length < minRuns) {
    return {
      skipped: true,
      reason: "insufficient_runs",
      closedCount: closed.length,
      minRuns,
    };
  }

  const baseCfg = { ...MM_DEFAULTS };
  const lessons = [];
  const thresholdOverrides = {};
  /** @type {Record<string, { roundTrips: number; volumeUsd: number; pnlUsd: number; avgPnlPct: number; volumePerDollar: number }>} */
  const strategyStats = {};
  /** @type {Array<{ strategyId: string; reason: string; until: Date }>} */
  const strategyCooldowns = [];

  let totalVolume = 0;
  let totalPnl = 0;

  for (const run of closed) {
    totalVolume += toNum(run.volumeUsd);
    totalPnl += toNum(run.simPnlUsd);
    const sid = run.strategyId;
    if (!strategyStats[sid]) {
      strategyStats[sid] = { roundTrips: 0, volumeUsd: 0, pnlUsd: 0, avgPnlPct: 0, volumePerDollar: 0 };
    }
    strategyStats[sid].roundTrips += 1;
    strategyStats[sid].volumeUsd += toNum(run.volumeUsd);
    strategyStats[sid].pnlUsd += toNum(run.simPnlUsd);
  }

  for (const [sid, stats] of Object.entries(strategyStats)) {
    stats.avgPnlPct =
      stats.roundTrips > 0
        ? (stats.pnlUsd / Math.max(1, stats.volumeUsd / 2)) * 100
        : 0;
    stats.volumePerDollar =
      baseCfg.startingBankUsd > 0 ? stats.volumeUsd / baseCfg.startingBankUsd : 0;
  }

  const profitableStrategies = Object.entries(strategyStats).filter(([, s]) => s.pnlUsd >= 0);
  const losingStrategies = Object.entries(strategyStats).filter(([, s]) => s.pnlUsd < 0);

  let promotedStrategyId = "adaptive";
  if (profitableStrategies.length > 0) {
    profitableStrategies.sort((a, b) => b[1].volumeUsd - a[1].volumeUsd);
    promotedStrategyId = profitableStrategies[0][0];
    lessons.push(
      `Strategy "${promotedStrategyId}" leads volume ($${profitableStrategies[0][1].volumeUsd.toFixed(0)}) with non-negative PnL — promoted.`,
    );
  }

  if (totalPnl < 0) {
    lessons.push(
      `Overall PnL negative ($${totalPnl.toFixed(2)}) — widening spread and reducing size.`,
    );
    thresholdOverrides.spreadBps = Math.min(baseCfg.spreadBps + 15, 120);
    thresholdOverrides.orderSizeUsd = Math.max(baseCfg.orderSizeUsd * 0.75, 8);
    thresholdOverrides.minEdgeBufferPct = Math.min(
      (baseCfg.minEdgeBufferPct ?? 0.08) + 0.05,
      0.25,
    );
  } else if (totalPnl >= 0 && totalVolume > 0) {
    const efficiency = totalVolume / baseCfg.startingBankUsd;
    if (efficiency < 5) {
      lessons.push(
        `Volume efficiency low (${efficiency.toFixed(1)}x bank) — tightening spread for more fills.`,
      );
      thresholdOverrides.spreadBps = Math.max(baseCfg.spreadBps - 8, 15);
      thresholdOverrides.gridLevels = Math.min(baseCfg.gridLevels + 1, 5);
    } else {
      lessons.push(
        `Profitable with ${efficiency.toFixed(1)}x bank volume — slightly increasing deploy slice.`,
      );
      thresholdOverrides.deploySlicePct = Math.min(
        (baseCfg.deploySlicePct ?? 0.35) * 1.1,
        0.5,
      );
    }
  }

  const roundTripCost = estimateMmRoundTripCostPct(baseCfg.quoteSlippageBps);
  const avgSpreadCapture = closed
    .map((r) => toNum(r.spreadBps))
    .filter((v) => v > 0);
  if (avgSpreadCapture.length >= 5) {
    const meanSpread = avgSpreadCapture.reduce((a, b) => a + b, 0) / avgSpreadCapture.length;
    if (meanSpread / 100 < roundTripCost && totalPnl < 0) {
      lessons.push(
        `Captured spread (${(meanSpread / 100).toFixed(2)}%) below round-trip cost (${roundTripCost.toFixed(2)}%) — raising min edge buffer.`,
      );
      thresholdOverrides.minEdgeBufferPct = Math.min(
        (baseCfg.minEdgeBufferPct ?? 0.08) + 0.08,
        0.3,
      );
    }
  }

  const highInvLosses = closed.filter(
    (r) => toNum(r.inventoryUsdAfter) > baseCfg.maxInventoryUsd * 0.85 && toNum(r.simPnlUsd) < 0,
  );
  if (highInvLosses.length >= 3) {
    lessons.push(
      `${highInvLosses.length} losses near max inventory — increasing skew and lowering max inventory.`,
    );
    thresholdOverrides.inventorySkewFactor = Math.min(
      (baseCfg.inventorySkewFactor ?? 0.55) + 0.1,
      0.85,
    );
    thresholdOverrides.maxInventoryUsd = Math.max(baseCfg.maxInventoryUsd * 0.85, 60);
  }

  for (const [sid, stats] of losingStrategies) {
    if (stats.roundTrips >= 4 && stats.pnlUsd < -5) {
      lessons.push(
        `Strategy "${sid}" losing ($${stats.pnlUsd.toFixed(2)}) — 8h cooldown.`,
      );
      strategyCooldowns.push({
        strategyId: sid,
        reason: `negative_pnl:${stats.pnlUsd.toFixed(2)}`,
        until: new Date(Date.now() + 8 * 60 * 60_000),
      });
    }
  }

  const tightStats = strategyStats.tight;
  const wideStats = strategyStats.wide;
  if (tightStats && wideStats && tightStats.roundTrips >= 5 && wideStats.roundTrips >= 5) {
    if (tightStats.pnlUsd >= 0 && tightStats.volumeUsd > wideStats.volumeUsd * 1.2) {
      lessons.push("Tight spread outperforming on volume with positive PnL — favoring tighter quotes.");
      thresholdOverrides.spreadBps = Math.max(
        thresholdOverrides.spreadBps ?? baseCfg.spreadBps,
        tightStats.volumeUsd > 0 ? baseCfg.spreadBps - 5 : baseCfg.spreadBps,
      );
    }
  }

  const summary = `Analyzed ${closed.length} round trips — volume $${totalVolume.toFixed(0)}, PnL $${totalPnl.toFixed(2)}, promoted "${promotedStrategyId}", ${strategyCooldowns.length} cooldowns.`;

  await MmLearningState.updateOne(
    { _id: GLOBAL_ID },
    {
      $set: {
        lessons: lessons.slice(0, 30),
        thresholdOverrides,
        strategyStats,
        promotedStrategyId,
        strategyCooldowns,
        lastEvolutionAt: new Date(),
        lastEvolutionSummary: summary,
        runsAnalyzed: closed.length,
      },
    },
    { upsert: true },
  );

  return {
    skipped: false,
    closedCount: closed.length,
    totalVolume,
    totalPnl,
    lessons,
    thresholdOverrides,
    strategyStats,
    promotedStrategyId,
    strategyCooldowns: strategyCooldowns.length,
    summary,
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
