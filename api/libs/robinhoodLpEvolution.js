/**
 * Robinhood Chain LP lab evolution — daily cull + elite mutation spawns.
 * Elite bar matches stocks lab sample depth (no cloning lucky 3-trade streaks).
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
import {
  activeRobinhoodRunMatch,
  rankRobinhoodLpStrategiesByNetPnl,
} from "./robinhoodLpExperimentService.js";
import {
  invalidateRobinhoodLpStrategyCache,
  resolveRobinhoodLpExperimentStrategies,
} from "./robinhoodLpExperimentStrategyResolve.js";
import {
  buildAggressiveLpStrategy,
  buildRandomLpStrategy,
  mutateLpStrategyFromElite,
} from "./lpExperimentEvolution.js";
import { computeRiskAdjustedLeaderScore } from "./earnExperimentKit.js";
import { isRobinhoodDegenStrategy } from "./robinhoodLpExperimentService.js";

/** Prefer well-sampled parents — lucky short streaks must not dominate DNA. */
export const ROBINHOOD_LP_ELITE_MIN_DECIDED = 12;
export const ROBINHOOD_LP_ELITE_MIN_WIN_RATE = 0.52;

export const ROBINHOOD_LP_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 5,
  /** Cull only after enough settled sample (aligned with elite bar). */
  minDecided: 12,
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

function gateFingerprint(strategy) {
  const s = strategy?.screeningOverrides || {};
  const g = strategy?.signalGate || {};
  return JSON.stringify({
    shape: strategy?.lpShape,
    bins: [strategy?.binsBelow, strategy?.binsAbove],
    minFee: s.minFeeTvlRatio ?? null,
    minVol: s.minVolume24hUsd ?? null,
    maxTvl: s.maxTvlUsd ?? null,
    minOrg: s.minOrganic ?? null,
    gateAll: g.all ?? null,
  });
}

function computeLeaderScore(row, opts = {}) {
  return computeRiskAdjustedLeaderScore({
    sumPnl: row.sumNetPnlUsd,
    winRate: row.winRate,
    decided: row.decided,
    wins: row.wins,
    losses: row.losses,
    expired: row.expired,
    diversityBonus: opts.diversityBonus ?? 0,
    clonePenalty: opts.clonePenalty ?? 0,
  });
}

export function isRobinhoodLpEliteParent(row) {
  const decided = Number(row?.decided) || 0;
  const winRate = Number(row?.winRate);
  const sumNetPnlUsd = Number(row?.sumNetPnlUsd) || 0;
  return (
    decided >= ROBINHOOD_LP_ELITE_MIN_DECIDED &&
    sumNetPnlUsd > 0 &&
    Number.isFinite(winRate) &&
    winRate >= ROBINHOOD_LP_ELITE_MIN_WIN_RATE
  );
}

async function pickEliteParent(experimentId, strategyList) {
  const ranked = await rankRobinhoodLpStrategiesByNetPnl(experimentId);
  const elites = ranked.filter((row) => isRobinhoodLpEliteParent(row));
  if (elites.length === 0) return null;
  elites.sort((a, b) => computeLeaderScore(b) - computeLeaderScore(a));
  const pickIdx = Math.min(elites.length - 1, Math.floor(Math.random() * Math.random() * elites.length));
  const stats = elites[pickIdx];
  const strategy = strategyList.find((s) => s.id === stats.strategyId) ?? null;
  if (!strategy) return null;
  return { strategy, stats };
}

/** Archive (do not delete) runs so lineage survives cull/replace. */
async function archiveStrategyRuns(experimentId, strategyId, reason) {
  await RobinhoodLpExperimentRun.updateMany(
    activeRobinhoodRunMatch({ experimentId, strategyId }),
    {
      $set: {
        archivedAt: new Date(),
        archiveReason: reason || "cull_replace",
      },
    },
  );
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
  const degenCount = strategyList.filter((s) => isRobinhoodDegenStrategy(s)).length;
  const degenShare = strategyList.length > 0 ? degenCount / strategyList.length : 0;
  // When cohort is dominated by degen clones, force diversified (non-aggressive) spawns.
  const forceDiversify = degenShare >= 0.35;
  let strat;
  if (elite && !forceDiversify) {
    strat = mutateLpStrategyFromElite(elite.strategy, strategyId, {
      parentStrategyId: elite.stats.strategyId,
      parentWinRate: elite.stats.winRate,
      parentNetPnlSol: elite.stats.sumNetPnlUsd,
    });
    strat.notes = `${strat.notes} · Robinhood Chain`;
  } else if (!forceDiversify && (reason === "daily_spawn" || Math.random() < 0.25)) {
    strat = buildAggressiveLpStrategy(strategyId);
    strat.notes = `${strat.notes} · Robinhood Chain`;
  } else {
    strat = buildRandomLpStrategy(strategyId);
    strat.notes = `${strat.notes} · Robinhood Chain · diversity spawn`;
  }
  // Reject near-clone fingerprints — mutate once more toward random if needed.
  const fps = new Set(strategyList.map((s) => gateFingerprint(s)));
  if (fps.has(gateFingerprint(strat))) {
    strat = buildRandomLpStrategy(strategyId);
    strat.notes = `${strat.notes} · Robinhood Chain · anti-clone`;
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
    const settled = await RobinhoodLpExperimentRun.find(
      activeRobinhoodRunMatch({
        experimentId,
        strategyId: s.id,
        status: { $in: ["win", "loss", "expired"] },
      }),
    ).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const expired = settled.filter((r) => r.status === "expired").length;
    const decided = wins + losses + expired;
    const winRate = decided > 0 ? wins / decided : null;
    const sumNetPnlUsd = settled.reduce((acc, r) => acc + Number(r.simNetPnlUsd || 0), 0);
    const openPositions = await RobinhoodLpExperimentRun.countDocuments(
      activeRobinhoodRunMatch({
        experimentId,
        strategyId: s.id,
        status: "open",
      }),
    );
    rows.push({ strategyId: s.id, wins, losses, expired, decided, winRate, openPositions, sumNetPnlUsd });
  }

  // Diversity: fingerprint strategies; clones of losing parents get extra cull pressure.
  const fpCounts = new Map();
  for (const s of strategies) {
    const fp = gateFingerprint(s);
    fpCounts.set(fp, (fpCounts.get(fp) || 0) + 1);
  }
  const byStrategyId = new Map(strategies.map((s) => [s.id, s]));
  const scoreOpts = (row) => {
    const strat = byStrategyId.get(row.strategyId);
    const fp = gateFingerprint(strat);
    const clones = fpCounts.get(fp) || 1;
    const isDegen = strat ? isRobinhoodDegenStrategy(strat) : false;
    return {
      diversityBonus: clones === 1 ? 0.08 : 0,
      clonePenalty: clones > 1 ? Math.min(0.45, (clones - 1) * 0.12) : 0,
      // Extra cull weight for underwater degen herd.
      clonePenaltyExtra: isDegen && row.sumNetPnlUsd < 0 ? 0.25 : 0,
    };
  };

  const experienced = rows.filter((r) => r.decided >= minDecided && r.openPositions === 0);
  const fresh = rows.filter((r) => r.decided < minDecided && r.openPositions === 0);
  experienced.sort((a, b) => {
    const oa = scoreOpts(a);
    const ob = scoreOpts(b);
    const scoreA = computeLeaderScore(a, {
      diversityBonus: oa.diversityBonus,
      clonePenalty: oa.clonePenalty + oa.clonePenaltyExtra,
    });
    const scoreB = computeLeaderScore(b, {
      diversityBonus: ob.diversityBonus,
      clonePenalty: ob.clonePenalty + ob.clonePenaltyExtra,
    });
    if (scoreA !== scoreB) return scoreA - scoreB;
    return (a.sumNetPnlUsd ?? 0) - (b.sumNetPnlUsd ?? 0);
  });
  // Prefer culling underwater degens among fresh strategies too.
  fresh.sort((a, b) => {
    const aDegen = isRobinhoodDegenStrategy(byStrategyId.get(a.strategyId));
    const bDegen = isRobinhoodDegenStrategy(byStrategyId.get(b.strategyId));
    if (aDegen !== bDegen) return aDegen ? -1 : 1;
    return (a.sumNetPnlUsd ?? 0) - (b.sumNetPnlUsd ?? 0) || a.decided - b.decided;
  });
  const ordered = [...experienced, ...fresh];
  const victims = ordered.slice(0, removeCount);

  const culled = [];
  const spawned = [];
  for (const v of victims) {
    // Preserve run history for lineage; exclude from active ranking via archivedAt.
    await archiveStrategyRuns(experimentId, v.strategyId, "cull_replace");
    const entry = await spawnSmarterStrategy(experimentId, strategies, v.strategyId, "cull_replace");
    culled.push({
      strategyId: v.strategyId,
      previousWinRate: v.winRate,
      previousDecided: v.decided,
      previousNetPnlUsd: v.sumNetPnlUsd,
      archived: true,
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
