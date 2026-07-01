/**
 * Stocks lab evolution: daily cull of worst performers, elite-mutation spawns.
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
import { computeStocksLeaderScore } from "./stocksExperimentScoring.js";
import { resolveStocksExperimentStrategies } from "./stocksStrategyResolve.js";

export const STOCKS_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 3,
  minDecided: 5,
  dailySpawnCount: STOCKS_DAILY_SPAWN_COUNT,
  maxStrategies: STOCKS_MAX_STRATEGIES,
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
  };
}

const UNIVERSE_PRESETS = Object.freeze([
  ["TSLAx", "NVDAx", "AAPLx"],
  ["TSLAx", "AAPLx", "SPYx", "SPCXx"],
  ["NVDAx", "TSLAx", "SPCXx"],
  ["SPYx", "AAPLx"],
  ["TSLAx", "NVDAx", "AAPLx", "SPYx", "SPCXx"],
]);

const GATE_PRESETS = Object.freeze([
  {
    any: [{ field: "sentiment_score", op: "gte", value: 0.1 }],
    minPasses: 1,
  },
  {
    any: [{ field: "event_score", op: "gte", value: 0.4 }],
    minPasses: 1,
  },
  {
    all: [{ field: "freshness_score", op: "gte", value: 0.5 }],
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
    minSentiment: mutateNum(0.05, 2, -0.3, 0.5),
    eventWeight: mutateNum(1, 0.5, 0.3, 2.5),
    momentumConfirm: Math.random() < 0.5,
    maxHoldHours: randInt(12, 96),
    universeFilter: { symbols: pick(UNIVERSE_PRESETS) },
    signalGate: pick(GATE_PRESETS),
    signalWeights,
    exit: {
      stopLossPct: -randInt(3, 8),
      takeProfitPct: randInt(5, 15),
    },
    notes: "Evolution spawn — randomized stocks news agent",
  };
}

/**
 * @param {object} parent
 * @param {number} strategyId
 */
export function mutateStocksStrategyFromElite(parent, strategyId) {
  const signalWeights = { ...(parent.signalWeights || STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS) };
  const keys = Object.keys(signalWeights);
  for (let i = 0; i < 2; i += 1) {
    const k = pick(keys);
    signalWeights[k] = clamp(mutateNum(signalWeights[k], 0.15, 0.3, 2.5), 0.3, 2.5);
  }

  const tag = Math.floor(1000 + Math.random() * 9000);
  return {
    strategyId,
    name: `${parent.name?.slice(0, 24) ?? "Elite"} · evo ${tag}`,
    minSentiment: mutateNum(parent.minSentiment ?? 0.1, 0.2, -0.3, 0.5),
    eventWeight: mutateNum(parent.eventWeight ?? 1, 0.2, 0.3, 2.5),
    momentumConfirm: parent.momentumConfirm ?? false,
    maxHoldHours: randInt(
      Math.max(12, (parent.maxHoldHours ?? 48) - 12),
      (parent.maxHoldHours ?? 48) + 24,
    ),
    universeFilter: parent.universeFilter ?? { symbols: pick(UNIVERSE_PRESETS) },
    signalGate: parent.signalGate ?? pick(GATE_PRESETS),
    signalWeights,
    exit: {
      stopLossPct: mutateNum(parent.exit?.stopLossPct ?? -5, 0.15, -12, -2),
      takeProfitPct: mutateNum(parent.exit?.takeProfitPct ?? 8, 0.15, 4, 20),
    },
    notes: `Evolved from agent #${parent.id} (${parent.name})`,
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
      },
    },
  ]);

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
    const decided = wins + losses;
    const winRate = decided > 0 ? wins / decided : null;
    const base = {
      strategyId: s.id,
      strategyName: s.name,
      wins,
      losses,
      expired: row?.expired ?? 0,
      decided,
      winRate,
      sumPnlUsd: row?.sumPnlUsd ?? 0,
      avgPnlUsd: row?.avgPnlUsd ?? 0,
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
 */
async function pickEliteParent(experimentId) {
  const ranked = await rankStocksStrategiesByPnl(experimentId);
  const elites = ranked.filter(
    (row) =>
      row.decided >= 3 &&
      row.sumPnlUsd > 0 &&
      (row.winRate ?? 0) >= 0.48 &&
      computeStocksLeaderScore(row) > 0,
  );
  elites.sort((a, b) => (b.leaderScore ?? 0) - (a.leaderScore ?? 0));
  if (elites.length === 0) return null;
  const elite = elites[0];
  const strategies = await resolveStocksExperimentStrategies();
  return strategies.find((s) => s.id === elite.strategyId) ?? null;
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

  const cullCandidates = ranked
    .filter((r) => r.decided >= cfg.minDecided && r.openPositions === 0)
    .sort((a, b) => (a.sumPnlUsd ?? 0) - (b.sumPnlUsd ?? 0));

  const culled = [];
  for (let i = 0; i < cfg.removeCount && i < cullCandidates.length; i += 1) {
    const victim = cullCandidates[i];
    if (victim.strategyId < STOCKS_EVOLVABLE_MIN_ID) continue;
    await StocksExperimentRun.deleteMany({
      experimentId,
      strategyId: victim.strategyId,
    });
    await StocksExperimentStrategyOverride.deleteOne({ strategyId: victim.strategyId });
    usedIds.delete(victim.strategyId);
    culled.push(victim.strategyId);
  }

  const spawned = [];
  const eliteParent = await pickEliteParent(experimentId);

  for (let i = 0; i < cfg.dailySpawnCount; i += 1) {
    if (usedIds.size >= cfg.maxStrategies) break;
    const newId = nextFreeStrategyId(STOCKS_EVOLVABLE_MIN_ID, STOCKS_EVOLVABLE_MAX_ID, usedIds);
    if (newId == null) break;

    const row = eliteParent
      ? mutateStocksStrategyFromElite(eliteParent, newId)
      : buildRandomStocksStrategy(newId);

    await StocksExperimentStrategyOverride.findOneAndUpdate(
      { strategyId: newId },
      { $set: row },
      { upsert: true, new: true },
    );
    usedIds.add(newId);
    spawned.push(newId);
  }

  return {
    experimentId,
    culled,
    spawned,
    eliteParentId: eliteParent?.id ?? null,
    strategyCount: usedIds.size,
  };
}
