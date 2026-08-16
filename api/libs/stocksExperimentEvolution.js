/**
 * Stocks lab evolution: daily cull of worst performers, elite-mutation spawns.
 * Prefers well-sampled, risk-adjusted elites over short lucky streaks.
 */
import StocksExperimentRun from "../models/StocksExperimentRun.js";
import StocksExperimentState from "../models/StocksExperimentState.js";
import StocksExperimentStrategyOverride from "../models/StocksExperimentStrategyOverride.js";
import {
  STOCKS_DAILY_SPAWN_COUNT,
  STOCKS_EVOLVABLE_MAX_ID,
  STOCKS_EVOLVABLE_MIN_ID,
  STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
  STOCKS_MAX_STRATEGIES,
  STOCKS_STATIC_STRATEGY_COUNT,
} from "../config/stocksExperimentStrategies.js";
import {
  computeStocksLeaderScore,
  ELITE_MIN_DECIDED,
  isStocksEliteParent,
  pickWeightedElite,
} from "./stocksExperimentScoring.js";
import {
  invalidateStocksStrategyCache,
  resolveStocksExperimentStrategies,
} from "./stocksStrategyResolve.js";

export const STOCKS_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 3,
  /** Align with smarter leader bar — do not cull/score on tiny samples. */
  minDecided: ELITE_MIN_DECIDED,
  dailySpawnCount: STOCKS_DAILY_SPAWN_COUNT,
  maxStrategies: STOCKS_MAX_STRATEGIES,
  /** Fraction of daily spawns that explore randomly instead of mutating elites. */
  exploreRate: 0.3,
  /** Protect this many top elites from cull. */
  protectTopElites: 3,
});

/** @template T @param {readonly T[]} arr @returns {T} */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function mutateNum(value, deltaPct, min, max) {
  const base = Number(value);
  if (!Number.isFinite(base)) return min;
  const delta = base * deltaPct * (Math.random() * 2 - 1);
  return clamp(Math.round((base + delta) * 1000) / 1000, min, max);
}

/**
 * @returns {{
 *   enabled: boolean;
 *   ms: number;
 *   removeCount: number;
 *   minDecided: number;
 *   dailySpawnCount: number;
 *   maxStrategies: number;
 * }}
 */
export function stocksEvolutionConfigFromEnv() {
  const sched = STOCKS_EXPERIMENT_EVOLUTION_SCHEDULE;
  const enabledRaw = (process.env.STOCKS_EXPERIMENT_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off" ? false : sched.enabled;
  const ms = Number(process.env.STOCKS_EXPERIMENT_EVOLUTION_MS || sched.intervalMs);
  const removeCount = Number(
    process.env.STOCKS_EXPERIMENT_EVOLUTION_REMOVE_COUNT || sched.removeCount,
  );
  const minDecided = Number(
    process.env.STOCKS_EXPERIMENT_EVOLUTION_MIN_DECIDED || sched.minDecided,
  );
  const dailySpawnCount = Number(
    process.env.STOCKS_DAILY_SPAWN_COUNT || sched.dailySpawnCount,
  );
  const maxStrategies = Number(process.env.STOCKS_MAX_STRATEGIES || sched.maxStrategies);
  const exploreRate = Number(process.env.STOCKS_EXPERIMENT_EVOLUTION_EXPLORE_RATE || sched.exploreRate);
  const protectTopElites = Number(
    process.env.STOCKS_EXPERIMENT_EVOLUTION_PROTECT_TOP || sched.protectTopElites,
  );

  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : sched.intervalMs,
    removeCount:
      Number.isFinite(removeCount) && removeCount >= 1
        ? Math.min(20, Math.floor(removeCount))
        : sched.removeCount,
    minDecided:
      Number.isFinite(minDecided) && minDecided >= 0 ? Math.floor(minDecided) : sched.minDecided,
    dailySpawnCount:
      Number.isFinite(dailySpawnCount) && dailySpawnCount >= 0
        ? Math.min(10, Math.floor(dailySpawnCount))
        : sched.dailySpawnCount,
    maxStrategies:
      Number.isFinite(maxStrategies) && maxStrategies >= STOCKS_STATIC_STRATEGY_COUNT
        ? Math.min(99, Math.floor(maxStrategies))
        : sched.maxStrategies,
    exploreRate:
      Number.isFinite(exploreRate) && exploreRate >= 0 && exploreRate <= 1
        ? exploreRate
        : sched.exploreRate,
    protectTopElites:
      Number.isFinite(protectTopElites) && protectTopElites >= 0
        ? Math.min(10, Math.floor(protectTopElites))
        : sched.protectTopElites,
  };
}

const UNIVERSE_PRESETS = Object.freeze([
  ["TSLAx", "SPCXx"],
  ["TSLAx", "NVDAx", "SPCXx"],
  ["TSLAx", "AAPLx", "SPYx"],
  ["TSLAx", "NVDAx", "AAPLx", "SPYx", "SPCXx"],
]);

const GATE_PRESETS = Object.freeze([
  {
    all: [{ field: "momentum_score", op: "gte", value: 0.56 }],
    minPasses: 1,
  },
  {
    all: [{ field: "trend_score", op: "gte", value: 0.54 }],
    minPasses: 1,
  },
  {
    all: [
      { field: "momentum_score", op: "gte", value: 0.55 },
      { field: "freshness_score", op: "gte", value: 0.3 },
    ],
    minPasses: 1,
  },
]);

/**
 * @param {number} strategyId
 */
export function buildRandomStocksStrategy(strategyId) {
  const defaults = STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS;
  const signalWeights = { ...defaults };
  const keys = Object.keys(signalWeights);
  for (let i = 0; i < 3; i += 1) {
    const k = pick(keys);
    signalWeights[k] = clamp(
      Number(signalWeights[k]) + Math.random() * 0.4 - 0.2,
      0.3,
      2.5,
    );
  }

  const tag = Math.floor(1000 + Math.random() * 9000);
  return {
    strategyId,
    name: `News lab #${strategyId} · ${tag}`,
    minSentiment: mutateNum(-0.2, 0.5, -1, 0.1),
    eventWeight: mutateNum(1, 0.5, 0.3, 2.5),
    momentumConfirm: Math.random() < 0.75,
    allowShort: Math.random() < 0.2,
    shortOnly: false,
    maxHoldHours: randInt(12, 72),
    universeFilter: { symbols: pick(UNIVERSE_PRESETS) },
    signalGate: pick(GATE_PRESETS),
    signalWeights,
    exit: {
      stopLossPct: -randInt(3, 6),
      takeProfitPct: randInt(5, 10),
      atrScale: true,
    },
    notes: "Evolution spawn — randomized stocks news agent",
  };
}

/**
 * @param {object} parent
 * @param {number} strategyId
 * @param {{ expireRate?: number; winRate?: number | null; avgPnlUsd?: number | null }} [stats]
 */
export function mutateStocksStrategyFromElite(parent, strategyId, stats = {}) {
  const signalWeights = { ...(parent.signalWeights || STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS) };
  const keys = Object.keys(signalWeights);
  for (let i = 0; i < 2; i += 1) {
    const k = pick(keys);
    signalWeights[k] = clamp(mutateNum(signalWeights[k], 0.15, 0.3, 2.5), 0.3, 2.5);
  }

  const expireRate = Number(stats.expireRate) || 0;
  const winRate = stats.winRate == null ? null : Number(stats.winRate);
  const avgPnl = stats.avgPnlUsd == null ? null : Number(stats.avgPnlUsd);

  // High expire rate → shorter holds + tighter TP so paper doesn't bleed on timeouts.
  let holdLo = Math.max(12, (parent.maxHoldHours ?? 48) - 12);
  let holdHi = (parent.maxHoldHours ?? 48) + 24;
  if (expireRate >= 0.35) {
    holdLo = 12;
    holdHi = Math.max(18, Math.min(36, parent.maxHoldHours ?? 24));
  }

  let minSentiment = mutateNum(parent.minSentiment ?? -1, 0.2, -1, 0.2);
  let signalGate = parent.signalGate ?? pick(GATE_PRESETS);
  let allowShort = Boolean(parent.allowShort);
  let shortOnly = Boolean(parent.shortOnly);
  if (winRate != null && winRate < 0.5) {
    signalGate = {
      all: [
        { field: "momentum_score", op: "gte", value: 0.58 },
        { field: "trend_score", op: "gte", value: 0.54 },
      ],
      minPasses: 1,
    };
    signalWeights.momentum_score = clamp(
      Number(signalWeights.momentum_score || 1) + 0.2,
      0.3,
      2.5,
    );
    allowShort = false;
    shortOnly = false;
  }

  let takeProfitPct = mutateNum(parent.exit?.takeProfitPct ?? 8, 0.15, 4, 20);
  let stopLossPct = mutateNum(parent.exit?.stopLossPct ?? -5, 0.15, -12, -2);
  if (avgPnl != null && avgPnl < 5 && expireRate < 0.35) {
    takeProfitPct = clamp(takeProfitPct * 0.9, 4, 20);
    stopLossPct = clamp(stopLossPct * 0.95, -12, -2);
  }

  // Occasional universe diversify so elites don't overfit one symbol set.
  const universeFilter =
    Math.random() < 0.25
      ? { symbols: pick(UNIVERSE_PRESETS) }
      : (parent.universeFilter ?? { symbols: pick(UNIVERSE_PRESETS) });

  const tag = Math.floor(1000 + Math.random() * 9000);
  return {
    strategyId,
    name: `${parent.name?.slice(0, 24) ?? "Elite"} · evo ${tag}`,
    minSentiment,
    eventWeight: mutateNum(parent.eventWeight ?? 1, 0.2, 0.3, 2.5),
    momentumConfirm: true,
    allowShort,
    shortOnly,
    sideMode: parent.sideMode === "fade" ? "fade" : "follow",
    maxHoldHours: randInt(holdLo, Math.max(holdLo, holdHi)),
    universeFilter,
    signalGate,
    signalWeights,
    exit: {
      stopLossPct,
      takeProfitPct,
      atrScale: parent.exit?.atrScale !== false,
    },
    notes: `Evolved from agent #${parent.id} (${parent.name}); expire=${expireRate.toFixed(2)}`,
  };
}

/**
 * @param {string | null | undefined} experimentId
 */
export async function rankStocksStrategiesByPnl(experimentId) {
  const expId =
    experimentId ??
    (await StocksExperimentState.findById("singleton").lean())?.activeExperimentId;

  const agg = await StocksExperimentRun.aggregate([
    { $match: { experimentId: expId, status: { $in: ["win", "loss", "expired"] } } },
    {
      $group: {
        _id: "$strategyId",
        strategyName: { $last: "$strategyName" },
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ["$status", "loss"] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
        sumPnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
        avgPnlUsd: { $avg: { $ifNull: ["$simPnlUsd", 0] } },
        grossWinUsd: {
          $sum: {
            $cond: [{ $gt: [{ $ifNull: ["$simPnlUsd", 0] }, 0] }, { $ifNull: ["$simPnlUsd", 0] }, 0],
          },
        },
        grossLossUsd: {
          $sum: {
            $cond: [
              { $lt: [{ $ifNull: ["$simPnlUsd", 0] }, 0] },
              { $abs: { $ifNull: ["$simPnlUsd", 0] } },
              0,
            ],
          },
        },
      },
    },
  ]);

  const recentByStrategy = await StocksExperimentRun.aggregate([
    { $match: { experimentId: expId, status: { $in: ["win", "loss", "expired"] } } },
    { $sort: { resolvedAt: 1, createdAt: 1 } },
    {
      $group: {
        _id: "$strategyId",
        pnls: { $push: { $ifNull: ["$simPnlUsd", 0] } },
      },
    },
  ]);
  const oosMap = new Map();
  for (const row of recentByStrategy) {
    const pnls = Array.isArray(row.pnls) ? row.pnls : [];
    const n = pnls.length;
    const split = Math.max(1, Math.floor(n * 0.6));
    const holdout = pnls.slice(0, split);
    const recent = pnls.slice(split);
    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + Number(b || 0), 0) / arr.length : 0;
    oosMap.set(row._id, {
      holdoutAvgPnlUsd: avg(holdout),
      recentAvgPnlUsd: recent.length ? avg(recent) : avg(holdout),
    });
  }

  const openCounts = await StocksExperimentRun.aggregate([
    { $match: { experimentId: expId, status: "open" } },
    { $group: { _id: "$strategyId", openPositions: { $sum: 1 } } },
  ]);
  const openMap = new Map(openCounts.map((r) => [r._id, r.openPositions]));

  const strategies = await resolveStocksExperimentStrategies();

  const rows = strategies.map((s) => {
    const row = agg.find((a) => a._id === s.id);
    const wins = row?.wins ?? 0;
    const losses = row?.losses ?? 0;
    const expired = row?.expired ?? 0;
    const decided = wins + losses;
    const closed = decided + expired;
    const winRate = decided > 0 ? wins / decided : null;
    const oos = oosMap.get(s.id) || { holdoutAvgPnlUsd: 0, recentAvgPnlUsd: row?.avgPnlUsd ?? 0 };
    const base = {
      strategyId: s.id,
      strategyName: s.name,
      wins,
      losses,
      expired,
      decided,
      closed,
      expireRate: closed > 0 ? expired / closed : 0,
      winRate,
      sumPnlUsd: row?.sumPnlUsd ?? 0,
      avgPnlUsd: row?.avgPnlUsd ?? 0,
      recentAvgPnlUsd: oos.recentAvgPnlUsd,
      holdoutAvgPnlUsd: oos.holdoutAvgPnlUsd,
      grossWinUsd: row?.grossWinUsd ?? 0,
      grossLossUsd: row?.grossLossUsd ?? 0,
      openPositions: openMap.get(s.id) ?? 0,
    };
    return { ...base, leaderScore: computeStocksLeaderScore(base) };
  });

  rows.sort((a, b) => {
    const scoreDiff = (b.leaderScore ?? -999) - (a.leaderScore ?? -999);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.sumPnlUsd ?? 0) - (a.sumPnlUsd ?? 0);
  });

  return rows;
}

/**
 * @param {string} experimentId
 * @returns {Promise<{ strategy: object; stats: object } | null>}
 */
async function pickEliteParent(experimentId) {
  const ranked = await rankStocksStrategiesByPnl(experimentId);
  const elites = ranked.filter((row) => isStocksEliteParent(row));
  elites.sort((a, b) => (b.leaderScore ?? 0) - (a.leaderScore ?? 0));
  const picked = pickWeightedElite(elites, (r) => r.leaderScore ?? 0, 3);
  if (!picked) return null;
  const strategies = await resolveStocksExperimentStrategies();
  const strategy = strategies.find((s) => s.id === picked.strategyId) ?? null;
  if (!strategy) return null;
  return { strategy, stats: picked };
}

/**
 * @param {number} minId
 * @param {number} maxId
 * @param {Set<number>} usedIds
 */
function nextFreeStrategyId(minId, maxId, usedIds) {
  for (let id = minId; id <= maxId; id += 1) {
    if (!usedIds.has(id)) return id;
  }
  return null;
}

export async function runStocksExperimentEvolution() {
  const cfg = stocksEvolutionConfigFromEnv();
  if (!cfg.enabled) return { skipped: true, reason: "disabled" };

  const state = await StocksExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) return { skipped: true, reason: "no_cohort" };

  const ranked = await rankStocksStrategiesByPnl(experimentId);
  const strategies = await resolveStocksExperimentStrategies();
  const usedIds = new Set(strategies.map((s) => s.id));

  const protectedIds = new Set(
    ranked
      .filter((r) => isStocksEliteParent(r))
      .slice(0, cfg.protectTopElites)
      .map((r) => r.strategyId),
  );

  // Cull worst risk-adjusted scores (not just raw sum PnL), never touch protected elites / statics.
  const cullCandidates = ranked
    .filter(
      (r) =>
        r.decided >= cfg.minDecided &&
        r.openPositions === 0 &&
        r.strategyId >= STOCKS_EVOLVABLE_MIN_ID &&
        !protectedIds.has(r.strategyId),
    )
    .sort((a, b) => {
      const scoreDiff = (a.leaderScore ?? -999) - (b.leaderScore ?? -999);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.sumPnlUsd ?? 0) - (b.sumPnlUsd ?? 0);
    });

  const culled = [];
  for (let i = 0; i < cfg.removeCount && i < cullCandidates.length; i += 1) {
    const victim = cullCandidates[i];
    await StocksExperimentRun.deleteMany({
      experimentId,
      strategyId: victim.strategyId,
    });
    await StocksExperimentStrategyOverride.deleteOne({ strategyId: victim.strategyId });
    usedIds.delete(victim.strategyId);
    culled.push(victim.strategyId);
  }

  const spawned = [];
  const eliteParentsUsed = [];

  for (let i = 0; i < cfg.dailySpawnCount; i += 1) {
    if (usedIds.size >= cfg.maxStrategies) break;
    const newId = nextFreeStrategyId(STOCKS_EVOLVABLE_MIN_ID, STOCKS_EVOLVABLE_MAX_ID, usedIds);
    if (newId == null) break;

    const explore = Math.random() < cfg.exploreRate;
    const elitePick = explore ? null : await pickEliteParent(experimentId);

    const row = elitePick
      ? mutateStocksStrategyFromElite(elitePick.strategy, newId, {
          expireRate: elitePick.stats.expireRate,
          winRate: elitePick.stats.winRate,
          avgPnlUsd: elitePick.stats.avgPnlUsd,
        })
      : buildRandomStocksStrategy(newId);

    if (elitePick?.strategy?.id != null) eliteParentsUsed.push(elitePick.strategy.id);

    await StocksExperimentStrategyOverride.findOneAndUpdate(
      { strategyId: newId },
      { $set: row },
      { upsert: true, new: true },
    );
    invalidateStocksStrategyCache();
    usedIds.add(newId);
    spawned.push(newId);
  }

  return {
    experimentId,
    culled,
    spawned,
    eliteParentId: eliteParentsUsed[0] ?? null,
    eliteParentIds: eliteParentsUsed,
    protectedEliteIds: [...protectedIds],
    strategyCount: usedIds.size,
  };
}
