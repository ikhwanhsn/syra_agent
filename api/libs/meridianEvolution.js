/**
 * Meridian experiment desk — fast, smart autolearn (beyond runSimpleEvolution).
 *
 * Every tick (default 45 min) this:
 *   1. Ranks strategies by net PnL / leader score.
 *   2. Culls the worst *evolvable* (ids 12–97), decided strategies by deleting their override
 *      only (safer than nuking runs; static ids 0–11 keep their base row, mirror 98 is pinned).
 *   3. Spawns guided mutations from elite parents into free evo slots, biased by a Thompson
 *      (Beta-Bernoulli) sample so exploration keeps trying promising-but-unproven agents.
 *   4. Injects the desk's most recent lessons into new agents' notes so the roster "remembers".
 *
 * The bandit helpers (thompsonSampleStrategy / selectMeridianBanditLeader) are also consumed by
 * the real Meridian layer for explore-exploit capital allocation.
 */
import MeridianRun from "../models/MeridianRun.js";
import MeridianState from "../models/MeridianState.js";
import MeridianStrategyOverride from "../models/MeridianStrategyOverride.js";
import MeridianLesson from "../models/MeridianLesson.js";
import {
  MERIDIAN_DAILY_SPAWN_COUNT,
  MERIDIAN_DEFAULT_SIGNAL_WEIGHTS,
  MERIDIAN_EVOLVABLE_MAX_ID,
  MERIDIAN_EVOLVABLE_MIN_ID,
  MERIDIAN_MAX_STRATEGIES,
  MERIDIAN_REAL_MIRROR_STRATEGY_ID,
  MERIDIAN_SCREENING_BASE,
  MERIDIAN_STATIC_STRATEGY_COUNT,
} from "../config/meridianStrategies.js";
import { MERIDIAN_CRON } from "../config/onchainEarnExperiments.js";
import {
  invalidateMeridianStrategyCache,
  resolveMeridianStrategies,
} from "./meridianStrategyResolve.js";
import { getMeridianStats, rankMeridianStrategiesByNetPnl } from "./meridianService.js";
import { clamp } from "./earnExperimentKit.js";

const SHAPES = Object.freeze(["spot", "bid_ask", "curve"]);

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Box–Muller standard normal. */
function gaussian() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Marsaglia–Tsang Gamma sampler (valid for shape >= 1; our Beta shapes are always >= 1). */
function sampleGamma(shape) {
  const s = Math.max(1, toNum(shape, 1));
  const d = s - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x;
    let v;
    do {
      x = gaussian();
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Draw from Beta(a, b) via two Gamma draws. */
function sampleBeta(a, b) {
  const x = sampleGamma(a);
  const y = sampleGamma(b);
  const sum = x + y;
  return sum > 0 ? x / sum : 0.5;
}

/**
 * Thompson sampling (Beta-Bernoulli bandit) over the Meridian roster for explore-exploit.
 * Losses and expiries both count as failures. Brand-new (undecided) strategies get a high
 * optimistic prior so the bandit keeps probing untested agents.
 *
 * @param {Array<{ strategyId: number; wins?: number; losses?: number; expired?: number; decided?: number }>} agents
 * @returns {{ strategyId: number; sample: number; wins: number; losses: number; decided: number } | null}
 */
export function thompsonSampleStrategy(agents) {
  const rows = (agents || []).filter(
    (a) => a && Number(a.strategyId) !== MERIDIAN_REAL_MIRROR_STRATEGY_ID,
  );
  if (rows.length === 0) return null;
  let best = null;
  let bestSample = -Infinity;
  for (const a of rows) {
    const wins = toNum(a.wins);
    const losses = toNum(a.losses) + toNum(a.expired);
    const decided = wins + losses;
    const sample = decided < 1 ? 0.85 + Math.random() * 0.15 : sampleBeta(wins + 1, losses + 1);
    if (sample > bestSample) {
      bestSample = sample;
      best = { strategyId: Number(a.strategyId), sample, wins, losses, decided };
    }
  }
  return best;
}

/**
 * Bandit leader for real/signal capital allocation: Thompson sample tilted by realized net PnL
 * so underwater strategies rarely win live capital, while still exploring promising new agents.
 *
 * @param {Array<object>} agents  Rows from getMeridianStats().agents
 * @param {{ minDecided?: number }} [opts]
 * @returns {{ strategyId: number; score: number; stats: object } | null}
 */
export function selectMeridianBanditLeader(agents, { minDecided = 3 } = {}) {
  const rows = (agents || []).filter(
    (a) => a && Number(a.strategyId) !== MERIDIAN_REAL_MIRROR_STRATEGY_ID,
  );
  if (rows.length === 0) return null;
  const eligible = rows.filter((a) => toNum(a.decided) >= minDecided);
  const pool = eligible.length > 0 ? eligible : rows;
  let best = null;
  let bestScore = -Infinity;
  for (const a of pool) {
    const wins = toNum(a.wins);
    const losses = toNum(a.losses) + toNum(a.expired);
    const decided = wins + losses;
    const base = decided < 1 ? 0.6 + Math.random() * 0.4 : sampleBeta(wins + 1, losses + 1);
    // Tilt: reward positive net PnL, heavily discount losers so they seldom take capital.
    const pnlTilt = toNum(a.sumNetPnlSol) > 0 ? 1 : toNum(a.sumNetPnlSol) === 0 ? 0.7 : 0.35;
    const score = base * pnlTilt;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best ? { strategyId: Number(best.strategyId), score: bestScore, stats: best } : null;
}

/**
 * Guided mutation of a winning parent into a new agent — smarter than random drift.
 * Jitters bins ±15%, nudges exit SL/TP toward the elite mean, boosts a couple of winning signal
 * weights by ~5–15%, and keeps the parent's LP shape 90% of the time.
 *
 * @param {object} parent  Resolved strategy row (base + override merged)
 * @param {number} newId
 * @param {{
 *   parentStrategyId?: number;
 *   parentNetPnlSol?: number;
 *   parentWinRate?: number | null;
 *   eliteExitMean?: { stopLossPct?: number | null; takeProfitPct?: number | null };
 *   lessons?: string[];
 * }} [meta]
 */
export function mutateMeridianFromElite(parent, newId, meta = {}) {
  const p = parent && typeof parent === "object" ? parent : {};
  const lpShape =
    Math.random() < 0.9 && p.lpShape ? p.lpShape : SHAPES[Math.floor(Math.random() * SHAPES.length)];

  const jitterBin = (value, min, max) => {
    const base = toNum(value, min);
    const factor = 1 + (Math.random() * 0.3 - 0.15); // ±15%
    return clamp(Math.round(base * factor), min, max);
  };
  let binsBelow = jitterBin(p.binsBelow, 0, 92);
  let binsAbove = jitterBin(p.binsAbove, 0, 60);
  if (lpShape === "bid_ask" && Math.random() < 0.25) {
    binsAbove = 0;
    binsBelow = Math.max(45, binsBelow);
  }
  if (binsBelow + binsAbove < 10) binsBelow = Math.max(binsBelow, 20);

  // Exit: nudge halfway toward the elite mean (fallback to parent), then jitter ±8%.
  const parentExit = p.exit && typeof p.exit === "object" ? p.exit : {};
  const eliteExit =
    meta.eliteExitMean && typeof meta.eliteExitMean === "object" ? meta.eliteExitMean : {};
  const towardMean = (parentVal, meanVal, fallback) => {
    const pv = toNum(parentVal, fallback);
    const mv = Number.isFinite(Number(meanVal)) ? Number(meanVal) : pv;
    return pv + (mv - pv) * 0.5;
  };
  const stopLossPct = clamp(
    Math.round(
      towardMean(parentExit.stopLossPct, eliteExit.stopLossPct, -13) * (0.92 + Math.random() * 0.16),
    ),
    -25,
    -6,
  );
  const takeProfitPct = clamp(
    Math.round(
      towardMean(parentExit.takeProfitPct, eliteExit.takeProfitPct, 6) * (0.92 + Math.random() * 0.16),
    ),
    3,
    22,
  );
  const exit = {
    ...parentExit,
    stopLossPct,
    takeProfitPct,
    oorWaitMin: clamp(Math.round(toNum(parentExit.oorWaitMin, 30) + (Math.random() * 10 - 5)), 15, 60),
    trailingTriggerPct:
      Math.round(toNum(parentExit.trailingTriggerPct, 3) * (0.9 + Math.random() * 0.2) * 10) / 10,
    trailingDropPct:
      Math.round(toNum(parentExit.trailingDropPct, 1.5) * (0.9 + Math.random() * 0.2) * 10) / 10,
    minHoldMin: clamp(Math.round(toNum(parentExit.minHoldMin, 30) + (Math.random() * 10 - 5)), 10, 60),
  };

  // Signal weights: inherit parent, then boost two winning signals by +5–15%.
  const parentWeights =
    p.signalWeights && typeof p.signalWeights === "object"
      ? { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, ...p.signalWeights }
      : { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS };
  const signalWeights = { ...parentWeights };
  const keys = Object.keys(signalWeights);
  for (let i = 0; i < 2 && keys.length; i += 1) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    const boost = 1 + (0.05 + Math.random() * 0.1); // +5–15%
    signalWeights[k] = Math.round(clamp(toNum(signalWeights[k], 1) * boost, 0.3, 2.8) * 1000) / 1000;
  }

  const screeningOverrides =
    p.screeningOverrides && typeof p.screeningOverrides === "object"
      ? { ...p.screeningOverrides }
      : { ...MERIDIAN_SCREENING_BASE };
  const signalGate =
    p.signalGate && typeof p.signalGate === "object"
      ? JSON.parse(JSON.stringify(p.signalGate))
      : { any: [{ field: "fee_tvl_ratio", op: "gte", value: 0.5 }], minPasses: 1 };

  const parentTag = String(p.name || `agent ${meta.parentStrategyId ?? "?"}`).slice(0, 26);
  const genTag = Math.floor(100 + Math.random() * 900);
  const lessons = Array.isArray(meta.lessons) ? meta.lessons.filter(Boolean).slice(0, 3) : [];
  const lessonNote = lessons.length ? ` | Recent lessons: ${lessons.join(" ")}` : "";

  return {
    strategyId: newId,
    name: `Meridian evo #${newId} · ${parentTag} · ${genTag}`,
    lpShape,
    binsBelow,
    binsAbove,
    screeningOverrides,
    signalGate,
    signalWeights,
    exit,
    notes: (
      `Elite mutation from #${meta.parentStrategyId ?? "?"} ` +
      `(${toNum(meta.parentNetPnlSol).toFixed(3)} SOL net).${lessonNote}`
    ).slice(0, 480),
  };
}

/**
 * Read the evolution schedule from MERIDIAN_CRON.evolution with MERIDIAN_EVOLUTION_* env overrides.
 */
export function meridianEvolutionConfigFromEnv() {
  const evo = MERIDIAN_CRON.evolution;
  const num = (key, fallback) => {
    const n = Number(process.env[key]);
    return Number.isFinite(n) ? n : fallback;
  };
  const enabledRaw = String(process.env.MERIDIAN_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off"
      ? false
      : enabledRaw === "1" || enabledRaw === "true" || enabledRaw === "on"
        ? true
        : evo.enabled;
  const ms = num("MERIDIAN_EVOLUTION_MS", evo.intervalMs);
  const removeCount = num("MERIDIAN_EVOLUTION_REMOVE_COUNT", evo.removeCount);
  const minDecided = num("MERIDIAN_EVOLUTION_MIN_DECIDED", evo.minDecided);
  const spawnCount = num("MERIDIAN_EVOLUTION_SPAWN_COUNT", MERIDIAN_DAILY_SPAWN_COUNT);
  const maxStrategies = num("MERIDIAN_EVOLUTION_MAX_STRATEGIES", MERIDIAN_MAX_STRATEGIES);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : evo.intervalMs,
    removeCount: clamp(Math.floor(removeCount), 0, 50),
    minDecided: Math.max(0, Math.floor(minDecided)),
    spawnCount: clamp(Math.floor(spawnCount), 0, 20),
    maxStrategies: clamp(Math.floor(maxStrategies), MERIDIAN_STATIC_STRATEGY_COUNT, 99),
    pinned: new Set([MERIDIAN_REAL_MIRROR_STRATEGY_ID]),
  };
}

/** Mean of the elite parents' exit SL/TP — guides where mutations converge. */
function computeEliteExitMean(elites, byId) {
  const sl = [];
  const tp = [];
  for (const e of elites) {
    const exit = byId.get(Number(e.strategyId))?.exit;
    if (exit && typeof exit === "object") {
      if (Number.isFinite(Number(exit.stopLossPct))) sl.push(Number(exit.stopLossPct));
      if (Number.isFinite(Number(exit.takeProfitPct))) tp.push(Number(exit.takeProfitPct));
    }
  }
  const mean = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
  return { stopLossPct: mean(sl), takeProfitPct: mean(tp) };
}

/**
 * Run one Meridian evolution tick: cull worst evolvable strategies, spawn guided elite mutations.
 *
 * @param {{
 *   removeCount?: number;
 *   minDecided?: number;
 *   spawnCount?: number;
 *   maxStrategies?: number;
 *   pinned?: Set<number>;
 *   force?: boolean;
 * }} [opts]
 */
export async function runMeridianExperimentEvolution(opts = {}) {
  const cfg = meridianEvolutionConfigFromEnv();
  if (!cfg.enabled && !opts.force) {
    return { skipped: true, reason: "disabled", culled: [], spawned: [] };
  }
  const removeCount = opts.removeCount ?? cfg.removeCount;
  const minDecided = opts.minDecided ?? cfg.minDecided;
  const spawnCount = opts.spawnCount ?? cfg.spawnCount;
  const maxStrategies = opts.maxStrategies ?? cfg.maxStrategies;
  const pinned = opts.pinned ?? cfg.pinned;

  const state = await MeridianState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { skipped: true, reason: "no_experiment_state", culled: [], spawned: [] };
  }

  const [ranked, statsResult] = await Promise.all([
    rankMeridianStrategiesByNetPnl(experimentId),
    getMeridianStats(),
  ]);
  const statsAgents = statsResult?.agents || [];
  const statsById = new Map(statsAgents.map((a) => [Number(a.strategyId), a]));
  const strategies = await resolveMeridianStrategies();
  const byId = new Map(strategies.map((s) => [s.id, s]));

  // ---- Cull: worst evolvable (12–97), decided, idle strategies. Delete override only. ----
  const cullable = ranked
    .filter((r) => {
      const id = Number(r.strategyId);
      if (pinned.has(id)) return false;
      // Only evo slots can be removed; static base ids 0–11 keep their base row.
      if (id < MERIDIAN_EVOLVABLE_MIN_ID || id > MERIDIAN_EVOLVABLE_MAX_ID) return false;
      if (toNum(r.decided) < minDecided) return false;
      if (toNum(statsById.get(id)?.openPositions) > 0) return false;
      return true;
    })
    .sort(
      (a, b) => toNum(a.rankScore) - toNum(b.rankScore) || toNum(a.sumNetPnlSol) - toNum(b.sumNetPnlSol),
    );

  const culled = [];
  for (const v of cullable.slice(0, removeCount)) {
    const del = await MeridianStrategyOverride.deleteOne({ strategyId: Number(v.strategyId) });
    culled.push({
      strategyId: Number(v.strategyId),
      removed: del.deletedCount > 0,
      previousNetPnlSol: toNum(v.sumNetPnlSol),
      previousWinRate: v.winRate ?? null,
      decided: toNum(v.decided),
    });
  }
  if (culled.length) invalidateMeridianStrategyCache();

  // ---- Elites: profitable + decided; bootstrap from best-ranked if none are yet green. ----
  const decidedFloor = Math.max(1, Math.min(minDecided, 3));
  let elites = ranked
    .filter(
      (r) =>
        Number(r.strategyId) !== MERIDIAN_REAL_MIRROR_STRATEGY_ID &&
        toNum(r.decided) >= decidedFloor &&
        toNum(r.sumNetPnlSol) > 0,
    )
    .sort((a, b) => toNum(b.rankScore) - toNum(a.rankScore))
    .slice(0, 5);
  if (elites.length === 0) {
    elites = ranked
      .filter((r) => Number(r.strategyId) !== MERIDIAN_REAL_MIRROR_STRATEGY_ID)
      .sort((a, b) => toNum(b.rankScore) - toNum(a.rankScore))
      .slice(0, 3);
  }

  const eliteExitMean = computeEliteExitMean(elites, byId);

  // Inject the desk's freshest lessons into new agents so the roster "remembers" what lost.
  const recentLessons = await MeridianLesson.find({ experimentId })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  const lessonTexts = recentLessons.map((l) => String(l.lesson || "").trim()).filter(Boolean);

  // Thompson pick biases which elite parent reproduces first (explore-exploit).
  const thompson = thompsonSampleStrategy(statsAgents);

  // ---- Spawn: guided mutations into free evo ids 12–97. ----
  const postCull = await resolveMeridianStrategies();
  const usedIds = new Set(postCull.map((s) => s.id));
  const spawned = [];
  for (let i = 0; i < spawnCount; i += 1) {
    if (elites.length === 0 || usedIds.size >= maxStrategies) break;
    let newId = null;
    for (let id = MERIDIAN_EVOLVABLE_MIN_ID; id <= MERIDIAN_EVOLVABLE_MAX_ID; id += 1) {
      if (!usedIds.has(id)) {
        newId = id;
        break;
      }
    }
    if (newId == null) break;

    let eliteStat = elites[i % elites.length];
    if (i === 0 && thompson) {
      const t = elites.find((e) => Number(e.strategyId) === Number(thompson.strategyId));
      if (t) eliteStat = t;
    }
    const parent = byId.get(Number(eliteStat.strategyId));
    if (!parent) continue;

    const mutated = mutateMeridianFromElite(parent, newId, {
      parentStrategyId: Number(eliteStat.strategyId),
      parentNetPnlSol: toNum(eliteStat.sumNetPnlSol),
      parentWinRate: eliteStat.winRate ?? null,
      eliteExitMean,
      lessons: lessonTexts,
    });
    await MeridianStrategyOverride.findOneAndUpdate(
      { strategyId: newId },
      { $set: { ...mutated } },
      { upsert: true },
    );
    usedIds.add(newId);
    spawned.push({ strategyId: newId, parentStrategyId: Number(eliteStat.strategyId), name: mutated.name });
  }
  if (spawned.length) invalidateMeridianStrategyCache();

  return {
    ok: true,
    experimentId,
    culled,
    spawned,
    thompson: thompson
      ? { strategyId: thompson.strategyId, sample: Math.round(thompson.sample * 1000) / 1000 }
      : null,
    eliteExitMean,
    lessonsInjected: lessonTexts.length,
  };
}
