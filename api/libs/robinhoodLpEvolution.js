/**
 * Robinhood Chain LP lab evolution — daily cull + elite mutation spawns.
 */
import RobinhoodLpExperimentRun from "../models/RobinhoodLpExperimentRun.js";
import RobinhoodLpExperimentState from "../models/RobinhoodLpExperimentState.js";
import RobinhoodLpExperimentStrategyOverride from "../models/RobinhoodLpExperimentStrategyOverride.js";
import {
  LP_AGENT_DAILY_SPAWN_COUNT,
  LP_AGENT_EVOLVABLE_MAX_ID,
  LP_AGENT_EVOLVABLE_MIN_ID,
  LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
  LP_AGENT_MAX_STRATEGIES,
  LP_AGENT_STATIC_STRATEGY_COUNT,
} from "../config/robinhoodLpStrategies.js";
import { rankRobinhoodLpStrategiesByNetPnl } from "./robinhoodLpExperimentService.js";
import {
  invalidateRobinhoodLpStrategyCache,
  resolveRobinhoodLpExperimentStrategies,
} from "./robinhoodLpExperimentStrategyResolve.js";
import {
  buildAggressiveLpStrategy,
  buildRandomLpStrategy,
  mutateLpStrategyFromElite,
} from "./lpExperimentEvolution.js";

export const ROBINHOOD_LP_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 5,
  minDecided: 5,
  dailySpawnCount: LP_AGENT_DAILY_SPAWN_COUNT,
  maxStrategies: LP_AGENT_MAX_STRATEGIES,
  pinnedStrategyIds: Object.freeze([]),
});

export function robinhoodLpEvolutionConfigFromEnv() {
  const sched = ROBINHOOD_LP_EVOLUTION_SCHEDULE;
  const enabledRaw = (process.env.ROBINHOOD_LP_EXPERIMENT_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off" ? false : sched.enabled;
  const ms = Number(process.env.ROBINHOOD_LP_EXPERIMENT_EVOLUTION_MS || sched.intervalMs);
  const removeCount = Number(
    process.env.ROBINHOOD_LP_EXPERIMENT_EVOLUTION_REMOVE_COUNT || sched.removeCount,
  );
  const minDecided = Number(
    process.env.ROBINHOOD_LP_EXPERIMENT_EVOLUTION_MIN_DECIDED || sched.minDecided,
  );
  const dailySpawnCount = Number(process.env.ROBINHOOD_LP_DAILY_SPAWN_COUNT || sched.dailySpawnCount);
  const maxStrategies = Number(process.env.ROBINHOOD_LP_MAX_STRATEGIES || sched.maxStrategies);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : sched.intervalMs,
    removeCount:
      Number.isFinite(removeCount) && removeCount >= 1
        ? Math.min(50, Math.floor(removeCount))
        : sched.removeCount,
    minDecided:
      Number.isFinite(minDecided) && minDecided >= 0 ? Math.floor(minDecided) : sched.minDecided,
    dailySpawnCount:
      Number.isFinite(dailySpawnCount) && dailySpawnCount >= 0
        ? Math.min(20, Math.floor(dailySpawnCount))
        : sched.dailySpawnCount,
    maxStrategies:
      Number.isFinite(maxStrategies) && maxStrategies >= LP_AGENT_STATIC_STRATEGY_COUNT
        ? Math.min(99, Math.floor(maxStrategies))
        : sched.maxStrategies,
    pinned: new Set(sched.pinnedStrategyIds),
  };
}

function computeLeaderScore(row) {
  const decided = Number(row.decided) || 0;
  const winRate = row.winRate ?? 0;
  const sumPnl = Number(row.sumNetPnlUsd) || 0;
  if (sumPnl <= 0 || decided <= 0) return -999;
  const sampleFactor = Math.min(1, decided / 12);
  const winFactor = Math.max(0, Math.min(1, (winRate - 0.4) / 0.55));
  const pnlFactor = Math.log1p(Math.max(0, sumPnl) * 0.012);
  return pnlFactor * (0.5 + winFactor * 0.5) * (0.3 + sampleFactor * 0.7);
}

async function pickEliteParent(experimentId, strategyList) {
  const ranked = await rankRobinhoodLpStrategiesByNetPnl(experimentId);
  const elites = ranked.filter(
    (row) => row.decided >= 3 && row.sumNetPnlUsd > 0 && (row.winRate ?? 0) >= 0.48,
  );
  if (elites.length === 0) return null;
  elites.sort((a, b) => computeLeaderScore(b) - computeLeaderScore(a));
  const pickIdx = Math.min(elites.length - 1, Math.floor(Math.random() * Math.random() * elites.length));
  const stats = elites[pickIdx];
  const strategy = strategyList.find((s) => s.id === stats.strategyId) ?? null;
  if (!strategy) return null;
  return { strategy, stats };
}

async function upsertRobinhoodStrategyOverride(strat) {
  await RobinhoodLpExperimentStrategyOverride.findOneAndUpdate(
    { strategyId: strat.strategyId },
    {
      $set: {
        strategyId: strat.strategyId,
        name: strat.name,
        lpShape: strat.lpShape,
        binsBelow: strat.binsBelow,
        binsAbove: strat.binsAbove,
        screeningOverrides: strat.screeningOverrides ?? null,
        signalGate: strat.signalGate ?? null,
        signalWeights: strat.signalWeights ?? null,
        exit: strat.exit ?? null,
        notes: strat.notes ?? "",
      },
    },
    { upsert: true, new: true },
  );
  invalidateRobinhoodLpStrategyCache();
}

async function allocateNewStrategyIds(count, currentTotal, maxStrategies) {
  const room = maxStrategies - currentTotal;
  if (room <= 0 || count <= 0) return [];
  const overrides = await RobinhoodLpExperimentStrategyOverride.find({
    strategyId: { $gte: LP_AGENT_EVOLVABLE_MIN_ID, $lte: LP_AGENT_EVOLVABLE_MAX_ID },
  })
    .select("strategyId")
    .lean();
  const used = new Set(overrides.map((o) => o.strategyId));
  for (let i = 0; i < LP_AGENT_STATIC_STRATEGY_COUNT; i += 1) used.add(i);
  const ids = [];
  for (let id = LP_AGENT_EVOLVABLE_MIN_ID; id <= LP_AGENT_EVOLVABLE_MAX_ID; id += 1) {
    if (ids.length >= Math.min(count, room)) break;
    if (!used.has(id)) {
      ids.push(id);
      used.add(id);
    }
  }
  return ids;
}

async function spawnSmarterStrategy(experimentId, strategyList, strategyId, reason) {
  const elite = await pickEliteParent(experimentId, strategyList);
  let strat;
  if (elite) {
    strat = mutateLpStrategyFromElite(elite.strategy, strategyId, {
      parentStrategyId: elite.stats.strategyId,
      parentWinRate: elite.stats.winRate,
      parentNetPnlSol: elite.stats.sumNetPnlUsd,
    });
    strat.notes = `${strat.notes} · Robinhood Chain`;
  } else if (reason === "daily_spawn" || Math.random() < 0.45) {
    strat = buildAggressiveLpStrategy(strategyId);
    strat.notes = `${strat.notes} · Robinhood Chain`;
  } else {
    strat = buildRandomLpStrategy(strategyId);
    strat.notes = `${strat.notes} · Robinhood Chain`;
  }
  await upsertRobinhoodStrategyOverride(strat);
  return { strategyId, reason, strategy: strat, parentStrategyId: elite?.stats.strategyId ?? null };
}

export async function runRobinhoodLpEvolution(opts = {}) {
  const envCfg = robinhoodLpEvolutionConfigFromEnv();
  const removeCount = opts.removeCount ?? envCfg.removeCount;
  const minDecided = opts.minDecided ?? envCfg.minDecided;
  const dailySpawnCount = opts.dailySpawnCount ?? envCfg.dailySpawnCount;
  const maxStrategies = opts.maxStrategies ?? envCfg.maxStrategies;
  const pinned = opts.pinned ?? envCfg.pinned;

  const state = await RobinhoodLpExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { ok: false, culled: [], spawned: [], dailySpawned: [], skipped: "cohort not initialized" };
  }

  const strategies = await resolveRobinhoodLpExperimentStrategies();
  const rows = [];

  for (const s of strategies) {
    if (pinned.has(s.id)) continue;
    const settled = await RobinhoodLpExperimentRun.find({
      experimentId,
      strategyId: s.id,
      status: { $in: ["win", "loss", "expired"] },
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const expired = settled.filter((r) => r.status === "expired").length;
    const decided = wins + losses + expired;
    const winRate = decided > 0 ? wins / decided : null;
    const sumNetPnlUsd = settled.reduce((acc, r) => acc + Number(r.simNetPnlUsd || 0), 0);
    const openPositions = await RobinhoodLpExperimentRun.countDocuments({
      experimentId,
      strategyId: s.id,
      status: "open",
    });
    rows.push({ strategyId: s.id, wins, losses, expired, decided, winRate, openPositions, sumNetPnlUsd });
  }

  const experienced = rows.filter((r) => r.decided >= minDecided && r.openPositions === 0);
  const fresh = rows.filter((r) => r.decided < minDecided && r.openPositions === 0);
  experienced.sort((a, b) => {
    const scoreA = computeLeaderScore(a);
    const scoreB = computeLeaderScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return (a.winRate ?? 0) - (b.winRate ?? 0);
  });
  fresh.sort((a, b) => a.decided - b.decided);
  const ordered = [...experienced, ...fresh];
  const victims = ordered.slice(0, removeCount);

  const culled = [];
  const spawned = [];
  for (const v of victims) {
    await RobinhoodLpExperimentRun.deleteMany({ experimentId, strategyId: v.strategyId });
    const entry = await spawnSmarterStrategy(experimentId, strategies, v.strategyId, "cull_replace");
    culled.push({
      strategyId: v.strategyId,
      previousWinRate: v.winRate,
      previousDecided: v.decided,
      previousNetPnlUsd: v.sumNetPnlUsd,
    });
    spawned.push(entry);
  }

  const postCullStrategies = await resolveRobinhoodLpExperimentStrategies();
  const newIds = await allocateNewStrategyIds(
    dailySpawnCount,
    postCullStrategies.length,
    maxStrategies,
  );
  const dailySpawned = [];
  for (const strategyId of newIds) {
    const entry = await spawnSmarterStrategy(experimentId, postCullStrategies, strategyId, "daily_spawn");
    dailySpawned.push(entry);
    spawned.push(entry);
  }

  if (culled.length === 0 && dailySpawned.length === 0) {
    return {
      ok: true,
      culled,
      spawned,
      dailySpawned,
      skipped: postCullStrategies.length >= maxStrategies ? "At max strategy cap" : "No eligible cull/spawn",
    };
  }

  return { ok: true, culled, spawned, dailySpawned, skipped: null };
}

// Re-export builders for tests
export { LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS };
