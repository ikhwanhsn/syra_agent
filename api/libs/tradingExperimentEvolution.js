/**
 * Daily evolutionary replacement for standard lab agents: drop worst win rates,
 * spawn random variants in the same agent slots. Never touches suite `user_custom` / wallet strategies.
 *
 * Schedule defaults live in {@link TRADING_EXPERIMENT_EVOLUTION_SCHEDULE} (enabled in code, no env).
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import TradingExperimentLabAgentOverride from "../models/TradingExperimentLabAgentOverride.js";
import {
  TRADING_EXPERIMENT_STRATEGIES,
  normalizeSuite,
  EXPERIMENT_SUITE_PRIMARY,
  EXPERIMENT_SUITE_USER_CUSTOM,
  EXPERIMENT_SUITE_MULTI_RESOURCE,
} from "../config/tradingExperimentStrategies.js";
import { resolveStrategiesForSuite } from "./tradingExperimentStrategyResolve.js";

/** @returns {string[]} */
function collectTokenUniverse() {
  const set = new Set();
  for (const s of TRADING_EXPERIMENT_STRATEGIES) {
    if (typeof s.token === "string" && s.token.trim()) set.add(s.token.trim().toLowerCase());
  }
  return [...set];
}

const TOKEN_SLUGS = collectTokenUniverse();
const BARS = Object.freeze(["15m", "30m", "1h", "2h", "4h", "1d"]);
const GATE_LEVELS = Object.freeze([null, "LOW", "MEDIUM", "HIGH"]);

/** @template T @param {readonly T[]} arr @returns {T} */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * @param {string} bar
 * @returns {number}
 */
function randomLookAheadBars(bar) {
  const b = String(bar).toLowerCase();
  const center =
    b === "15m"
      ? 140
      : b === "30m"
        ? 90
        : b === "1h"
          ? 52
          : b === "2h"
            ? 48
            : b === "4h"
              ? 40
              : b === "1d"
                ? 36
                : 48;
  const jitter = Math.floor(Math.random() * 41) - 20;
  return Math.max(24, Math.min(260, center + jitter));
}

/**
 * @param {string} bar
 * @returns {number}
 */
function randomLimitForBar(bar) {
  const b = String(bar).toLowerCase();
  const ranges = {
    "15m": [200, 320],
    "30m": [180, 300],
    "1h": [140, 320],
    "2h": [160, 280],
    "4h": [160, 280],
    "1d": [120, 220],
  };
  const [lo, hi] = ranges[b] || [160, 300];
  const x = lo + Math.floor(Math.random() * (hi - lo + 1));
  return Math.round(x / 10) * 10;
}

/**
 * @param {number} agentId
 * @returns {{ name: string; token: string; bar: string; limit: number; lookAheadBars: number; experimentGate: { minConfidence: string } | null }}
 */
export function buildRandomLabStrategy(agentId) {
  const token = pick(TOKEN_SLUGS.length ? TOKEN_SLUGS : ["bitcoin"]);
  const bar = pick(BARS);
  const gate = pick(GATE_LEVELS);
  const limit = randomLimitForBar(bar);
  const lookAheadBars = randomLookAheadBars(bar);
  const name = `${String(token).toUpperCase()} ${bar} evo ${agentId}`;
  return {
    name,
    token,
    bar,
    limit,
    lookAheadBars,
    experimentGate: gate ? { minConfidence: gate } : null,
  };
}

/**
 * @param {string} raw
 * @returns {Set<number>}
 */
export function parsePinnedAgentIds(raw) {
  const set = new Set();
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return set;
  for (const part of s.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 0 && n <= 99) set.add(n);
  }
  return set;
}

/** In-process evolution: on by default; 24h tick while the API is running. */
export const TRADING_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  suite: "primary",
  removeCount: 5,
  minDecided: 5,
  /** Agent ids never culled (empty = all lab slots eligible). */
  pinnedAgentIds: Object.freeze(/** @type {readonly number[]} */ ([])),
});

/**
 * @returns {{ enabled: boolean; ms: number; suite: string; removeCount: number; minDecided: number; pinned: Set<number> }}
 */
export function evolutionConfigFromEnv() {
  const { enabled, intervalMs, suite, removeCount, minDecided, pinnedAgentIds } =
    TRADING_EXPERIMENT_EVOLUTION_SCHEDULE;
  return {
    enabled,
    ms: intervalMs,
    suite: normalizeSuite(suite),
    removeCount,
    minDecided,
    pinned: new Set(pinnedAgentIds),
  };
}

/**
 * @param {string} suiteNorm
 * @returns {Record<string, unknown>}
 */
function matchRunsForEvolutionSuite(suiteNorm) {
  if (suiteNorm === EXPERIMENT_SUITE_PRIMARY) {
    return {
      $or: [
        { suite: EXPERIMENT_SUITE_PRIMARY },
        { suite: { $exists: false } },
        { suite: null },
        { suite: "" },
      ],
    };
  }
  return { suite: suiteNorm };
}

/**
 * @param {{ suite?: string; removeCount?: number; minDecided?: number; pinned?: Set<number> }} [opts]
 */
export async function runTradingExperimentEvolution(opts = {}) {
  const envCfg = evolutionConfigFromEnv();
  const suiteNorm = normalizeSuite(opts.suite ?? envCfg.suite);
  if (suiteNorm === EXPERIMENT_SUITE_USER_CUSTOM || suiteNorm === EXPERIMENT_SUITE_MULTI_RESOURCE) {
    return {
      ok: true,
      suite: suiteNorm,
      culled: [],
      spawned: [],
      skipped: "Evolution runs only on primary or secondary suite",
    };
  }

  const removeCount = opts.removeCount ?? envCfg.removeCount;
  const minDecided = opts.minDecided ?? envCfg.minDecided;
  const pinned = opts.pinned ?? envCfg.pinned;

  const strategies = await resolveStrategiesForSuite(suiteNorm);
  /** @type {{ agentId: number; wins: number; losses: number; decided: number; winRate: number | null; openPositions: number }[]} */
  const rows = [];

  const suiteMatch = matchRunsForEvolutionSuite(suiteNorm);

  for (const s of strategies) {
    if (pinned.has(s.id)) continue;

    const settled = await TradingExperimentRun.find({
      agentId: s.id,
      status: { $in: ["win", "loss"] },
      ...suiteMatch,
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const decided = wins + losses;
    const winRate = decided > 0 ? wins / decided : null;

    const openPositions = await TradingExperimentRun.countDocuments({
      agentId: s.id,
      status: "open",
      ...suiteMatch,
    });

    rows.push({ agentId: s.id, wins, losses, decided, winRate, openPositions });
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
    return { ok: true, suite: suiteNorm, culled: [], spawned: [], skipped: "No eligible agents" };
  }

  /** @type {{ agentId: number; previousWinRate: number | null; previousDecided: number }[]} */
  const culled = [];
  /** @type {{ agentId: number; strategy: ReturnType<typeof buildRandomLabStrategy> }[]} */
  const spawned = [];

  for (const v of victims) {
    await TradingExperimentRun.deleteMany({ agentId: v.agentId, ...suiteMatch });
    const strat = buildRandomLabStrategy(v.agentId);
    await TradingExperimentLabAgentOverride.findOneAndUpdate(
      { suite: suiteNorm, agentId: v.agentId },
      {
        $set: {
          suite: suiteNorm,
          agentId: v.agentId,
          name: strat.name,
          token: strat.token,
          bar: strat.bar,
          limit: strat.limit,
          lookAheadBars: strat.lookAheadBars,
          experimentGate: strat.experimentGate,
          source: null,
        },
      },
      { upsert: true, new: true },
    );
    culled.push({
      agentId: v.agentId,
      previousWinRate: v.winRate,
      previousDecided: v.decided,
    });
    spawned.push({ agentId: v.agentId, strategy: strat });
  }

  return { ok: true, suite: suiteNorm, culled, spawned, skipped: null };
}
