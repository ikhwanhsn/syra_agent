/**
 * LP lab evolution: daily cull of worst performers, elite-mutation spawns, and new agent slots.
 * Spawns inherit traits from top sim agents (high win rate + net PnL) so each generation is smarter.
 */
import LpExperimentRun from "../models/LpExperimentRun.js";
import LpExperimentState from "../models/LpExperimentState.js";
import LpExperimentStrategyOverride from "../models/LpExperimentStrategyOverride.js";
import {
  LP_AGENT_DAILY_SPAWN_COUNT,
  LP_AGENT_EVOLVABLE_MAX_ID,
  LP_AGENT_EVOLVABLE_MIN_ID,
  LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
  LP_AGENT_MAX_STRATEGIES,
  LP_AGENT_STATIC_STRATEGY_COUNT,
  LP_REAL_MIRROR_STRATEGY_ID,
} from "../config/lpAgentExperimentStrategies.js";
import {
  computeRealLeaderScore,
  rankLpExperimentStrategiesByNetPnl,
} from "./lpExperimentService.js";
import { invalidateLpStrategyCache } from "./lpExperimentStrategyResolve.js";
import { resolveLpExperimentStrategies } from "./lpExperimentStrategyResolve.js";

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

/** In-process LP evolution: enabled by default; 24h tick. */
export const LP_AGENT_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 5,
  minDecided: 5,
  dailySpawnCount: LP_AGENT_DAILY_SPAWN_COUNT,
  maxStrategies: LP_AGENT_MAX_STRATEGIES,
  pinnedStrategyIds: Object.freeze([LP_REAL_MIRROR_STRATEGY_ID]),
});

/**
 * @param {string | undefined | null} raw
 * @returns {Set<number>}
 */
export function parsePinnedLpStrategyIds(raw) {
  const set = new Set();
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return set;
  for (const part of s.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 0 && n <= 99) set.add(n);
  }
  return set;
}

/**
 * @returns {{
 *   enabled: boolean;
 *   ms: number;
 *   removeCount: number;
 *   minDecided: number;
 *   dailySpawnCount: number;
 *   maxStrategies: number;
 *   pinned: Set<number>;
 * }}
 */
export function lpEvolutionConfigFromEnv() {
  const sched = LP_AGENT_EXPERIMENT_EVOLUTION_SCHEDULE;
  const enabledRaw = (process.env.LP_AGENT_EXPERIMENT_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off"
      ? false
      : sched.enabled;
  const ms = Number(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_MS || sched.intervalMs);
  const removeCount = Number(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_REMOVE_COUNT || sched.removeCount);
  const minDecided = Number(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_MIN_DECIDED || sched.minDecided);
  const dailySpawnCount = Number(
    process.env.LP_AGENT_DAILY_SPAWN_COUNT || sched.dailySpawnCount,
  );
  const maxStrategies = Number(process.env.LP_AGENT_MAX_STRATEGIES || sched.maxStrategies);
  const pinned =
    parsePinnedLpStrategyIds(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_PINNED).size > 0
      ? parsePinnedLpStrategyIds(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_PINNED)
      : new Set(sched.pinnedStrategyIds);
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
    pinned,
  };
}

const SHAPES = Object.freeze(["spot", "bid_ask", "curve", "mixed"]);

const AGGRESSIVE_GATE_PRESETS = Object.freeze([
  {
    any: [
      { field: "freshness_score", op: "gte", value: 0.55 },
      { field: "volume", op: "gte", value: 0.58 },
    ],
    minPasses: 1,
  },
  {
    any: [
      { field: "volatility", op: "gte", value: 0.5 },
      { field: "fee_tvl_ratio", op: "gte", value: 0.42 },
    ],
    minPasses: 1,
  },
]);

/**
 * Random baseline agent (fallback when no elite parent exists).
 * @param {number} strategyId
 */
export function buildRandomLpStrategy(strategyId) {
  const lpShape = pick(SHAPES);
  let binsBelow = 28 + Math.floor(Math.random() * 52);
  let binsAbove = 8 + Math.floor(Math.random() * 36);
  if (lpShape === "bid_ask" && Math.random() < 0.38) {
    binsAbove = 0;
    binsBelow = Math.max(45, binsBelow);
  }

  const minOrganic = 56 + Math.floor(Math.random() * 14);
  const minFeeTvlRatio = 0.045 + Math.random() * 0.038;
  const minVolume24hUsd = 65_000 + Math.floor(Math.random() * 120_000);

  const defaults = LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS;
  const signalWeights = { ...defaults };
  const keys = Object.keys(signalWeights);
  for (let i = 0; i < 4; i += 1) {
    const k = pick(keys);
    const v = Number(signalWeights[k]);
    signalWeights[k] = Math.round((v + Math.random() * 0.5 - 0.25) * 1000) / 1000;
    signalWeights[k] = Math.max(0.3, Math.min(2.8, Number(signalWeights[k])));
  }

  const stopLossPct = -18 + Math.floor(Math.random() * 11);
  const takeProfitPct = 7 + Math.floor(Math.random() * 9);
  const oorWaitMin = 14 + Math.floor(Math.random() * 32);

  const tag = Math.floor(1000 + Math.random() * 9000);
  const name = `${lpShape} lab #${strategyId} · ${tag}`;

  return {
    strategyId,
    name,
    lpShape,
    binsBelow,
    binsAbove,
    screeningOverrides: { minOrganic, minFeeTvlRatio, minVolume24hUsd },
    signalGate: { any: [{ field: "volume", op: "gte", value: 0.45 }], minPasses: 1 },
    signalWeights,
    exit: { stopLossPct, takeProfitPct, oorWaitMin },
    notes: "Evolution spawn — randomized LP lab agent",
  };
}

/**
 * High-risk template for daily spawns when lab is still warming up.
 * @param {number} strategyId
 */
export function buildAggressiveLpStrategy(strategyId) {
  const lpShape = Math.random() < 0.55 ? "bid_ask" : pick(SHAPES);
  let binsBelow = randInt(55, 88);
  let binsAbove = lpShape === "bid_ask" && Math.random() < 0.45 ? 0 : randInt(6, 22);

  const minOrganic = randInt(44, 54);
  const minFeeTvlRatio = Math.round((0.032 + Math.random() * 0.045) * 1000) / 1000;
  const minVolume24hUsd = randInt(160_000, 320_000);
  const maxTvlUsd = randInt(220_000, 520_000);
  const minVolTvlRatio = Math.round((1.2 + Math.random() * 2.5) * 100) / 100;

  const signalWeights = {
    ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
    freshness_score: 1.35 + Math.random() * 0.35,
    volume: 1.28 + Math.random() * 0.3,
    volatility: 1.15 + Math.random() * 0.25,
    organic_score: 0.65 + Math.random() * 0.2,
    study_win_rate: 0.85,
  };

  const tag = Math.floor(100 + Math.random() * 900);
  return {
    strategyId,
    name: `degen evo #${strategyId} · ${tag}`,
    lpShape,
    binsBelow,
    binsAbove,
    screeningOverrides: {
      minOrganic,
      minFeeTvlRatio,
      minVolume24hUsd,
      maxTvlUsd,
      minVolTvlRatio,
    },
    signalGate: JSON.parse(JSON.stringify(pick(AGGRESSIVE_GATE_PRESETS))),
    signalWeights,
    exit: {
      stopLossPct: -22 + randInt(0, 4),
      takeProfitPct: 12 + randInt(0, 8),
      oorWaitMin: randInt(10, 18),
      minHoldMin: randInt(8, 14),
      trailingTriggerPct: 6 + Math.random() * 4,
    },
    notes: "Evolution spawn — aggressive high-volume / fresh-pool hunter",
  };
}

/**
 * Mutate a winning parent strategy into a new agent (smarter than random).
 * @param {object} parent
 * @param {number} strategyId
 * @param {{ parentStrategyId?: number; parentWinRate?: number | null; parentNetPnlSol?: number }} [meta]
 */
export function mutateLpStrategyFromElite(parent, strategyId, meta = {}) {
  const lpShape =
    Math.random() < 0.82 && parent.lpShape ? parent.lpShape : pick(SHAPES);
  let binsBelow = clamp(
    Math.round((parent.binsBelow ?? 30) + randInt(-10, 10)),
    8,
    92,
  );
  let binsAbove = clamp(
    Math.round((parent.binsAbove ?? 20) + randInt(-8, 8)),
    0,
    60,
  );
  if (lpShape === "bid_ask" && Math.random() < 0.28) {
    binsAbove = 0;
    binsBelow = Math.max(45, binsBelow);
  }

  const parentScreen = parent.screeningOverrides && typeof parent.screeningOverrides === "object"
    ? { ...parent.screeningOverrides }
    : {};
  const screeningOverrides = {
    minOrganic: clamp(
      Math.round(mutateNum(parentScreen.minOrganic ?? 60, 0.12, 42, 72)),
      42,
      72,
    ),
    minFeeTvlRatio: mutateNum(parentScreen.minFeeTvlRatio ?? 0.05, 0.15, 0.028, 0.12),
    minVolume24hUsd: clamp(
      Math.round(mutateNum(parentScreen.minVolume24hUsd ?? 100_000, 0.18, 50_000, 400_000)),
      50_000,
      400_000,
    ),
  };
  if (parentScreen.maxTvlUsd != null || Math.random() < 0.35) {
    screeningOverrides.maxTvlUsd = clamp(
      Math.round(mutateNum(parentScreen.maxTvlUsd ?? 450_000, 0.2, 150_000, 800_000)),
      150_000,
      800_000,
    );
  }
  if (parentScreen.minVolTvlRatio != null || Math.random() < 0.4) {
    screeningOverrides.minVolTvlRatio = mutateNum(parentScreen.minVolTvlRatio ?? 1.5, 0.2, 0.8, 4);
  }

  const defaults = LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS;
  const parentWeights =
    parent.signalWeights && typeof parent.signalWeights === "object"
      ? { ...defaults, ...parent.signalWeights }
      : { ...defaults };
  const signalWeights = { ...parentWeights };
  const weightKeys = Object.keys(signalWeights);
  for (let i = 0; i < 3; i += 1) {
    const k = pick(weightKeys);
    signalWeights[k] = clamp(
      Math.round((Number(signalWeights[k]) + (Math.random() * 0.4 - 0.15)) * 1000) / 1000,
      0.3,
      2.8,
    );
  }

  const parentExit = parent.exit && typeof parent.exit === "object" ? parent.exit : {};
  const exit = {
    stopLossPct: clamp(
      Math.round((parentExit.stopLossPct ?? -12) + randInt(-3, 2)),
      -25,
      -6,
    ),
    takeProfitPct: clamp(
      Math.round((parentExit.takeProfitPct ?? 10) + randInt(-2, 3)),
      6,
      22,
    ),
    oorWaitMin: clamp(Math.round((parentExit.oorWaitMin ?? 25) + randInt(-8, 8)), 8, 45),
  };
  if (parentExit.minHoldMin != null || Math.random() < 0.3) {
    exit.minHoldMin = clamp(Math.round((parentExit.minHoldMin ?? 20) + randInt(-6, 6)), 5, 45);
  }
  if (parentExit.trailingTriggerPct != null || Math.random() < 0.25) {
    exit.trailingTriggerPct =
      Math.round(((parentExit.trailingTriggerPct ?? 5) + Math.random() * 2 - 0.5) * 10) / 10;
  }

  const parentGate =
    parent.signalGate && typeof parent.signalGate === "object"
      ? JSON.parse(JSON.stringify(parent.signalGate))
      : { any: [{ field: "volume", op: "gte", value: 0.5 }], minPasses: 1 };

  const parentWinPct =
    meta.parentWinRate != null && Number.isFinite(meta.parentWinRate)
      ? `${Math.round(meta.parentWinRate * 100)}% WR`
      : "elite";
  const shortParent = String(parent.name || `agent ${meta.parentStrategyId ?? "?"}`).slice(0, 28);
  const genTag = Math.floor(100 + Math.random() * 900);

  return {
    strategyId,
    name: `evo #${strategyId} · ${shortParent} · ${genTag}`,
    lpShape,
    binsBelow,
    binsAbove,
    screeningOverrides,
    signalGate: parentGate,
    signalWeights,
    exit,
    notes:
      `Elite mutation from #${meta.parentStrategyId ?? "?"} (${parentWinPct}, ` +
      `${(meta.parentNetPnlSol ?? 0).toFixed(3)} SOL net)`,
  };
}

/**
 * @param {string} experimentId
 * @param {object[]} strategyList
 * @returns {Promise<{ strategy: object; stats: object } | null>}
 */
async function pickEliteParent(experimentId, strategyList) {
  const ranked = await rankLpExperimentStrategiesByNetPnl(experimentId);
  const elites = ranked.filter(
    (row) =>
      row.decided >= 3 &&
      row.sumNetPnlSol > 0 &&
      (row.winRate ?? 0) >= 0.48 &&
      computeRealLeaderScore(row) > 0,
  );
  if (elites.length === 0) return null;

  elites.sort((a, b) => b.realLeaderScore - a.realLeaderScore);
  const pickIdx = Math.min(elites.length - 1, Math.floor(Math.random() * Math.random() * elites.length));
  const stats = elites[pickIdx];
  const strategy = strategyList.find((s) => s.id === stats.strategyId) ?? null;
  if (!strategy) return null;
  return { strategy, stats };
}

/**
 * @param {ReturnType<typeof buildRandomLpStrategy>} strat
 */
async function upsertLpStrategyOverride(strat) {
  await LpExperimentStrategyOverride.findOneAndUpdate(
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
  invalidateLpStrategyCache();
}

/**
 * @param {number} count
 * @param {number} currentTotal
 * @param {number} maxStrategies
 * @returns {Promise<number[]>}
 */
async function allocateNewStrategyIds(count, currentTotal, maxStrategies) {
  const room = maxStrategies - currentTotal;
  if (room <= 0 || count <= 0) return [];

  const overrides = await LpExperimentStrategyOverride.find({
    strategyId: { $gte: LP_AGENT_EVOLVABLE_MIN_ID, $lte: LP_AGENT_EVOLVABLE_MAX_ID },
  })
    .select("strategyId")
    .lean();
  const used = new Set(overrides.map((o) => o.strategyId));
  for (let i = 0; i < LP_AGENT_STATIC_STRATEGY_COUNT; i += 1) used.add(i);
  used.add(LP_REAL_MIRROR_STRATEGY_ID);

  /** @type {number[]} */
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

/**
 * @param {string} experimentId
 * @param {object[]} strategyList
 * @param {number} strategyId
 * @param {"cull_replace" | "daily_spawn"} reason
 */
async function spawnSmarterStrategy(experimentId, strategyList, strategyId, reason) {
  const elite = await pickEliteParent(experimentId, strategyList);
  let strat;
  if (elite) {
    strat = mutateLpStrategyFromElite(elite.strategy, strategyId, {
      parentStrategyId: elite.stats.strategyId,
      parentWinRate: elite.stats.winRate,
      parentNetPnlSol: elite.stats.sumNetPnlSol,
    });
  } else if (reason === "daily_spawn" || Math.random() < 0.45) {
    strat = buildAggressiveLpStrategy(strategyId);
  } else {
    strat = buildRandomLpStrategy(strategyId);
  }
  await upsertLpStrategyOverride(strat);
  return { strategyId, reason, strategy: strat, parentStrategyId: elite?.stats.strategyId ?? null };
}

/**
 * @param {{
 *   removeCount?: number;
 *   minDecided?: number;
 *   dailySpawnCount?: number;
 *   maxStrategies?: number;
 *   pinned?: Set<number>;
 * }} [opts]
 */
export async function runLpExperimentEvolution(opts = {}) {
  const envCfg = lpEvolutionConfigFromEnv();
  const removeCount = opts.removeCount ?? envCfg.removeCount;
  const minDecided = opts.minDecided ?? envCfg.minDecided;
  const dailySpawnCount = opts.dailySpawnCount ?? envCfg.dailySpawnCount;
  const maxStrategies = opts.maxStrategies ?? envCfg.maxStrategies;
  const pinned = opts.pinned ?? envCfg.pinned;

  const state = await LpExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { ok: false, culled: [], spawned: [], dailySpawned: [], skipped: "LP experiment cohort not initialized" };
  }

  const strategies = await resolveLpExperimentStrategies();
  /** @type {{ strategyId: number; wins: number; losses: number; expired: number; decided: number; winRate: number | null; openPositions: number; sumNetPnlSol: number }[]} */
  const rows = [];

  for (const s of strategies) {
    if (pinned.has(s.id)) continue;

    const settled = await LpExperimentRun.find({
      experimentId,
      strategyId: s.id,
      status: { $in: ["win", "loss", "expired"] },
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const expired = settled.filter((r) => r.status === "expired").length;
    const decided = wins + losses + expired;
    const winRate = decided > 0 ? wins / decided : null;
    const sumNetPnlSol = settled.reduce((acc, r) => acc + Number(r.simNetPnlSol || 0), 0);

    const openPositions = await LpExperimentRun.countDocuments({
      experimentId,
      strategyId: s.id,
      status: "open",
    });

    rows.push({ strategyId: s.id, wins, losses, expired, decided, winRate, openPositions, sumNetPnlSol });
  }

  const experienced = rows.filter((r) => r.decided >= minDecided && r.openPositions === 0);
  const fresh = rows.filter((r) => r.decided < minDecided && r.openPositions === 0);

  experienced.sort((a, b) => {
    const scoreA = computeRealLeaderScore({
      decided: a.decided,
      winRate: a.winRate,
      sumNetPnlSol: a.sumNetPnlSol,
    });
    const scoreB = computeRealLeaderScore({
      decided: b.decided,
      winRate: b.winRate,
      sumNetPnlSol: b.sumNetPnlSol,
    });
    if (scoreA !== scoreB) return scoreA - scoreB;
    const ra = a.winRate ?? 0;
    const rb = b.winRate ?? 0;
    if (ra !== rb) return ra - rb;
    return a.sumNetPnlSol - b.sumNetPnlSol;
  });

  fresh.sort((a, b) => {
    if (a.decided !== b.decided) return a.decided - b.decided;
    const ra = a.winRate ?? 0;
    const rb = b.winRate ?? 0;
    return ra - rb;
  });

  const ordered = [...experienced, ...fresh];
  const victims = ordered.slice(0, removeCount);

  /** @type {{ strategyId: number; previousWinRate: number | null; previousDecided: number; previousNetPnlSol: number }[]} */
  const culled = [];
  /** @type {Awaited<ReturnType<typeof spawnSmarterStrategy>>[]} */
  const spawned = [];

  for (const v of victims) {
    await LpExperimentRun.deleteMany({ experimentId, strategyId: v.strategyId });
    const entry = await spawnSmarterStrategy(experimentId, strategies, v.strategyId, "cull_replace");
    culled.push({
      strategyId: v.strategyId,
      previousWinRate: v.winRate,
      previousDecided: v.decided,
      previousNetPnlSol: v.sumNetPnlSol,
    });
    spawned.push(entry);
  }

  const postCullStrategies = await resolveLpExperimentStrategies();
  const newIds = await allocateNewStrategyIds(
    dailySpawnCount,
    postCullStrategies.length,
    maxStrategies,
  );

  /** @type {Awaited<ReturnType<typeof spawnSmarterStrategy>>[]} */
  const dailySpawned = [];
  for (const strategyId of newIds) {
    const entry = await spawnSmarterStrategy(experimentId, postCullStrategies, strategyId, "daily_spawn");
    dailySpawned.push(entry);
    spawned.push(entry);
  }

  if (culled.length === 0 && dailySpawned.length === 0) {
    const atCap = postCullStrategies.length >= maxStrategies;
    return {
      ok: true,
      culled,
      spawned,
      dailySpawned,
      skipped: atCap ? "At max strategy cap" : "No eligible strategies for cull or spawn",
    };
  }

  return { ok: true, culled, spawned, dailySpawned, skipped: null };
}
