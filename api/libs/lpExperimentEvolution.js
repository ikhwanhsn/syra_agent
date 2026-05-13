/**
 * LP lab evolution: every interval, cull worst win-rate agents (closed runs only),
 * delete their runs, and spawn random new configs into the same strategyId slots via Mongo overrides.
 */
import LpExperimentRun from "../models/LpExperimentRun.js";
import LpExperimentState from "../models/LpExperimentState.js";
import LpExperimentStrategyOverride from "../models/LpExperimentStrategyOverride.js";
import { LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS } from "../config/lpAgentExperimentStrategies.js";
import { resolveLpExperimentStrategies } from "./lpExperimentStrategyResolve.js";

/** @template T @param {readonly T[]} arr @returns {T} */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** In-process LP evolution: enabled by default; 24h tick. */
export const LP_AGENT_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 5,
  minDecided: 5,
  /** Strategy ids never culled (comma-separated env override). */
  pinnedStrategyIds: Object.freeze([]),
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
 * @returns {{ enabled: boolean; ms: number; removeCount: number; minDecided: number; pinned: Set<number> }}
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
  const pinned =
    parsePinnedLpStrategyIds(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_PINNED).size > 0
      ? parsePinnedLpStrategyIds(process.env.LP_AGENT_EXPERIMENT_EVOLUTION_PINNED)
      : new Set(sched.pinnedStrategyIds);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : sched.intervalMs,
    removeCount: Number.isFinite(removeCount) && removeCount >= 1 ? Math.min(50, Math.floor(removeCount)) : sched.removeCount,
    minDecided: Number.isFinite(minDecided) && minDecided >= 0 ? Math.floor(minDecided) : sched.minDecided,
    pinned,
  };
}

const SHAPES = Object.freeze(["spot", "bid_ask", "curve", "mixed"]);

const GATE_PRESETS = Object.freeze([
  { any: [{ field: "volume", op: "gte", value: 0.45 }], minPasses: 1 },
  { any: [{ field: "fee_tvl_ratio", op: "gte", value: 0.35 }], minPasses: 1 },
  { any: [{ field: "organic_score", op: "gte", value: 0.42 }], minPasses: 1 },
  {
    any: [
      { field: "study_win_rate", op: "gte", value: 0.48 },
      { field: "narrative_quality", op: "gte", value: 6 },
    ],
    minPasses: 1,
  },
]);

/**
 * @param {number} strategyId
 * @returns {Record<string, unknown>}
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
    signalGate: JSON.parse(JSON.stringify(pick(GATE_PRESETS))),
    signalWeights,
    exit: { stopLossPct, takeProfitPct, oorWaitMin },
    notes: "Evolution spawn — randomized LP lab agent",
  };
}

/**
 * @param {{
 *   removeCount?: number;
 *   minDecided?: number;
 *   pinned?: Set<number>;
 * }} [opts]
 */
export async function runLpExperimentEvolution(opts = {}) {
  const envCfg = lpEvolutionConfigFromEnv();
  const removeCount = opts.removeCount ?? envCfg.removeCount;
  const minDecided = opts.minDecided ?? envCfg.minDecided;
  const pinned = opts.pinned ?? envCfg.pinned;

  const state = await LpExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { ok: false, culled: [], spawned: [], skipped: "LP experiment cohort not initialized" };
  }

  const strategies = await resolveLpExperimentStrategies();
  /** @type {{ strategyId: number; wins: number; losses: number; expired: number; decided: number; winRate: number | null; openPositions: number }[]} */
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

    const openPositions = await LpExperimentRun.countDocuments({
      experimentId,
      strategyId: s.id,
      status: "open",
    });

    rows.push({ strategyId: s.id, wins, losses, expired, decided, winRate, openPositions });
  }

  const experienced = rows.filter((r) => r.decided >= minDecided && r.openPositions === 0);
  const fresh = rows.filter((r) => r.decided < minDecided && r.openPositions === 0);

  experienced.sort((a, b) => {
    const ra = a.winRate ?? 0;
    const rb = b.winRate ?? 0;
    if (ra !== rb) return ra - rb;
    return b.decided - a.decided;
  });

  fresh.sort((a, b) => {
    if (a.decided !== b.decided) return a.decided - b.decided;
    const ra = a.winRate ?? 0;
    const rb = b.winRate ?? 0;
    return ra - rb;
  });

  const ordered = [...experienced, ...fresh];
  const victims = ordered.slice(0, removeCount);
  if (victims.length === 0) {
    return { ok: true, culled: [], spawned: [], skipped: "No eligible LP strategies" };
  }

  /** @type {{ strategyId: number; previousWinRate: number | null; previousDecided: number }[]} */
  const culled = [];
  /** @type {{ strategyId: number; strategy: ReturnType<typeof buildRandomLpStrategy> }[]} */
  const spawned = [];

  for (const v of victims) {
    await LpExperimentRun.deleteMany({ experimentId, strategyId: v.strategyId });
    const strat = buildRandomLpStrategy(v.strategyId);
    await LpExperimentStrategyOverride.findOneAndUpdate(
      { strategyId: v.strategyId },
      {
        $set: {
          strategyId: v.strategyId,
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
    culled.push({
      strategyId: v.strategyId,
      previousWinRate: v.winRate,
      previousDecided: v.decided,
    });
    spawned.push({ strategyId: v.strategyId, strategy: strat });
  }

  return { ok: true, culled, spawned, skipped: null };
}
