/**
 * Daily evolutionary replacement for standard lab agents:
 * - Cull agents whose equity falls to –10% ($900) with no open positions
 * - Spawn 15 new random agents per day (up to 1000 per suite)
 *
 * Schedule defaults live in {@link TRADING_EXPERIMENT_EVOLUTION_SCHEDULE} (enabled in code, no env).
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import TradingExperimentLabAgentOverride from "../models/TradingExperimentLabAgentOverride.js";
import TradingExperimentAgentState from "../models/TradingExperimentAgentState.js";
import {
  TRADING_EXPERIMENT_STARTING_USD,
  TRADING_EXPERIMENT_CULL_EQUITY_USD,
  TRADING_EXPERIMENT_DAILY_SPAWN_COUNT,
  TRADING_EXPERIMENT_MAX_AGENTS,
  TRADING_EXPERIMENT_MAX_AGENT_ID,
  TRADING_EXPERIMENT_STATIC_AGENT_COUNT,
  computeAgentEquityUsd,
} from "../config/tradingExperimentSim.js";
import {
  TRADING_EXPERIMENT_STRATEGIES,
  TRADING_EXPERIMENT_STRATEGIES_SECONDARY,
  normalizeSuite,
  EXPERIMENT_SUITE_PRIMARY,
  EXPERIMENT_SUITE_SECONDARY,
  EXPERIMENT_SUITE_USER_CUSTOM,
  EXPERIMENT_SUITE_MULTI_RESOURCE,
} from "../config/tradingExperimentStrategies.js";
import { resolveStrategiesForSuite } from "./tradingExperimentStrategyResolve.js";
import { randomIndicatorFilter } from "./indicatorFilters.js";

/** @returns {string[]} */
function collectTokenUniverse() {
  const set = new Set();
  for (const s of TRADING_EXPERIMENT_STRATEGIES) {
    if (typeof s.token === "string" && s.token.trim()) set.add(s.token.trim().toLowerCase());
  }
  for (const s of TRADING_EXPERIMENT_STRATEGIES_SECONDARY) {
    if (typeof s.token === "string" && s.token.trim()) set.add(s.token.trim().toLowerCase());
  }
  return [...set];
}

const TOKEN_SLUGS = collectTokenUniverse();
const BARS = Object.freeze(["15m", "30m", "1h", "2h", "4h", "1d"]);
const SCALP_BARS = Object.freeze(["1m", "3m", "5m", "15m"]);
const GATE_LEVELS = Object.freeze([null, "LOW", "MEDIUM", "HIGH"]);
const SCALP_GATE_LEVELS = Object.freeze([null, "LOW", "LOW", "MEDIUM"]);

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
 * @param {string} bar
 * @returns {number}
 */
function randomLimitForScalpBar(bar) {
  const b = String(bar).toLowerCase();
  const ranges = {
    "1m": [300, 420],
    "3m": [240, 360],
    "5m": [220, 340],
    "15m": [200, 300],
  };
  const [lo, hi] = ranges[b] || [220, 360];
  const x = lo + Math.floor(Math.random() * (hi - lo + 1));
  return Math.round(x / 10) * 10;
}

/**
 * @param {string} bar
 * @returns {number}
 */
function randomLookAheadBarsScalp(bar) {
  const b = String(bar).toLowerCase();
  const center =
    b === "1m" ? 200 : b === "3m" ? 120 : b === "5m" ? 100 : b === "15m" ? 88 : 100;
  const jitter = Math.floor(Math.random() * 41) - 20;
  return Math.max(48, Math.min(320, center + jitter));
}

/**
 * @param {number} agentId
 * @returns {{
 *   name: string;
 *   token: string;
 *   bar: string;
 *   limit: number;
 *   lookAheadBars: number;
 *   experimentGate: { minConfidence: string } | null;
 *   indicatorFilter: Record<string, unknown> | null;
 * }}
 */
export function buildRandomLabStrategy(agentId) {
  const token = pick(TOKEN_SLUGS.length ? TOKEN_SLUGS : ["bitcoin"]);
  const bar = pick(BARS);
  const gate = pick(GATE_LEVELS);
  const limit = randomLimitForBar(bar);
  const lookAheadBars = randomLookAheadBars(bar);
  const indicatorFilter = randomIndicatorFilter({ min: 0, max: 3 });
  const name = `${String(token).toUpperCase()} ${bar} evo ${agentId}`;
  return {
    name,
    token,
    bar,
    limit,
    lookAheadBars,
    experimentGate: gate ? { minConfidence: gate } : null,
    indicatorFilter,
  };
}

/**
 * Random variant for scalper lane (secondary suite): short bars, faster horizons, lighter gates.
 * @param {number} agentId
 * @returns {{
 *   name: string;
 *   token: string;
 *   bar: string;
 *   limit: number;
 *   lookAheadBars: number;
 *   experimentGate: { minConfidence: string } | null;
 *   indicatorFilter: Record<string, unknown> | null;
 * }}
 */
export function buildRandomScalperStrategy(agentId) {
  const token = pick(TOKEN_SLUGS.length ? TOKEN_SLUGS : ["bitcoin"]);
  const bar = pick(SCALP_BARS);
  const gate = pick(SCALP_GATE_LEVELS);
  const limit = randomLimitForScalpBar(bar);
  const lookAheadBars = randomLookAheadBarsScalp(bar);
  const indicatorFilter = randomIndicatorFilter({ min: 0, max: 2 });
  const name = `${String(token).toUpperCase()} ${bar} scalp-evo ${agentId}`;
  return {
    name,
    token,
    bar,
    limit,
    lookAheadBars,
    experimentGate: gate ? { minConfidence: gate } : null,
    indicatorFilter,
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
    if (Number.isInteger(n) && n >= 0 && n <= TRADING_EXPERIMENT_MAX_AGENT_ID) set.add(n);
  }
  return set;
}

/** In-process evolution: on by default; 24h tick while the API is running (primary + secondary each). */
export const TRADING_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  /** Default suite when calling evolution without args (cron still runs both ledgers). */
  suite: "primary",
  cullEquityUsd: TRADING_EXPERIMENT_CULL_EQUITY_USD,
  dailySpawnCount: TRADING_EXPERIMENT_DAILY_SPAWN_COUNT,
  maxAgents: TRADING_EXPERIMENT_MAX_AGENTS,
  /** Agent ids never culled (empty = all lab slots eligible). */
  pinnedAgentIds: Object.freeze(/** @type {readonly number[]} */ ([])),
});

/**
 * @returns {{
 *   enabled: boolean;
 *   ms: number;
 *   suite: string;
 *   cullEquityUsd: number;
 *   dailySpawnCount: number;
 *   maxAgents: number;
 *   pinned: Set<number>;
 * }}
 */
export function evolutionConfigFromEnv() {
  const { enabled, intervalMs, suite, cullEquityUsd, dailySpawnCount, maxAgents, pinnedAgentIds } =
    TRADING_EXPERIMENT_EVOLUTION_SCHEDULE;
  return {
    enabled,
    ms: intervalMs,
    suite: normalizeSuite(suite),
    cullEquityUsd,
    dailySpawnCount,
    maxAgents,
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
 * @param {string} suiteNorm
 * @returns {(agentId: number) => ReturnType<typeof buildRandomLabStrategy>}
 */
function strategyBuilderForSuite(suiteNorm) {
  return suiteNorm === EXPERIMENT_SUITE_SECONDARY ? buildRandomScalperStrategy : buildRandomLabStrategy;
}

/**
 * @param {ReturnType<typeof buildRandomLabStrategy>} strat
 * @returns {Record<string, unknown>}
 */
function overridePayloadFromStrategy(strat) {
  return {
    name: strat.name,
    token: strat.token,
    bar: strat.bar,
    limit: strat.limit,
    lookAheadBars: strat.lookAheadBars,
    experimentGate: strat.experimentGate,
    indicatorFilter: strat.indicatorFilter ?? null,
    source: null,
  };
}

/**
 * @param {string} suiteNorm
 * @param {number} agentId
 * @param {ReturnType<typeof buildRandomLabStrategy>} strat
 */
async function upsertSpawnedAgent(suiteNorm, agentId, strat) {
  await TradingExperimentAgentState.findOneAndUpdate(
    { suite: suiteNorm, agentId },
    {
      $set: {
        cashUsd: TRADING_EXPERIMENT_STARTING_USD,
        startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
      },
    },
    { upsert: true },
  );
  await TradingExperimentLabAgentOverride.findOneAndUpdate(
    { suite: suiteNorm, agentId },
    {
      $set: {
        suite: suiteNorm,
        agentId,
        ...overridePayloadFromStrategy(strat),
      },
    },
    { upsert: true, new: true },
  );
}

/**
 * @param {string} suiteNorm
 * @param {number} count
 * @param {number} currentTotal
 * @param {number} maxAgents
 * @returns {Promise<number[]>}
 */
async function allocateNewAgentIds(suiteNorm, count, currentTotal, maxAgents) {
  const room = maxAgents - currentTotal;
  if (room <= 0 || count <= 0) return [];

  const toCreate = Math.min(count, room);
  const overrides = await TradingExperimentLabAgentOverride.find({ suite: suiteNorm })
    .select("agentId")
    .lean();
  const used = new Set(overrides.map((o) => o.agentId));
  for (let i = 0; i < TRADING_EXPERIMENT_STATIC_AGENT_COUNT; i++) used.add(i);

  /** @type {number[]} */
  const ids = [];
  for (let id = TRADING_EXPERIMENT_STATIC_AGENT_COUNT; id <= TRADING_EXPERIMENT_MAX_AGENT_ID; id++) {
    if (ids.length >= toCreate) break;
    if (!used.has(id)) {
      ids.push(id);
      used.add(id);
    }
  }
  return ids;
}

/**
 * @param {{
 *   suiteNorm: string;
 *   agentId: number;
 *   suiteMatch: Record<string, unknown>;
 *   buildStrategy: (agentId: number) => ReturnType<typeof buildRandomLabStrategy>;
 *   previousEquityUsd: number;
 * }} opts
 */
async function cullAndReplaceAgent(opts) {
  const { suiteNorm, agentId, suiteMatch, buildStrategy, previousEquityUsd } = opts;
  await TradingExperimentRun.deleteMany({ agentId, ...suiteMatch });
  const strat = buildStrategy(agentId);
  await upsertSpawnedAgent(suiteNorm, agentId, strat);
  return {
    agentId,
    previousEquityUsd,
    action: "replaced",
    strategy: strat,
  };
}

/**
 * @param {{ suite?: string; cullEquityUsd?: number; dailySpawnCount?: number; maxAgents?: number; pinned?: Set<number> }} [opts]
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
      dailySpawned: [],
      skipped: "Evolution runs only on primary or secondary suite",
    };
  }

  const cullEquityUsd = opts.cullEquityUsd ?? envCfg.cullEquityUsd;
  const dailySpawnCount = opts.dailySpawnCount ?? envCfg.dailySpawnCount;
  const maxAgents = opts.maxAgents ?? envCfg.maxAgents;
  const pinned = opts.pinned ?? envCfg.pinned;
  const buildStrategy = strategyBuilderForSuite(suiteNorm);
  const suiteMatch = matchRunsForEvolutionSuite(suiteNorm);

  const strategies = await resolveStrategiesForSuite(suiteNorm);
  const states = await TradingExperimentAgentState.find({ suite: suiteNorm }).lean();
  const stateByAgent = new Map(states.map((x) => [x.agentId, x]));

  /** @type {{ agentId: number; equityUsd: number }[]} */
  const victims = [];

  for (const s of strategies) {
    if (pinned.has(s.id)) continue;

    const openPositions = await TradingExperimentRun.countDocuments({
      agentId: s.id,
      status: "open",
      ...suiteMatch,
    });
    if (openPositions > 0) continue;

    const st = stateByAgent.get(s.id);
    const cashUsd = st?.cashUsd ?? TRADING_EXPERIMENT_STARTING_USD;
    const equityUsd = computeAgentEquityUsd(cashUsd, openPositions);
    if (equityUsd <= cullEquityUsd) {
      victims.push({ agentId: s.id, equityUsd });
    }
  }

  victims.sort((a, b) => a.equityUsd - b.equityUsd);

  /** @type {{ agentId: number; previousEquityUsd: number; action: string; strategy: ReturnType<typeof buildRandomLabStrategy> | null }[]} */
  const culled = [];
  /** @type {{ agentId: number; reason: string; strategy: ReturnType<typeof buildRandomLabStrategy> }[]} */
  const spawned = [];

  for (const v of victims) {
    const out = await cullAndReplaceAgent({
      suiteNorm,
      agentId: v.agentId,
      suiteMatch,
      buildStrategy,
      previousEquityUsd: v.equityUsd,
    });
    culled.push(out);
    if (out.strategy) {
      spawned.push({ agentId: out.agentId, reason: "equity_cull", strategy: out.strategy });
    }
  }

  const postCullStrategies = await resolveStrategiesForSuite(suiteNorm);
  const newIds = await allocateNewAgentIds(
    suiteNorm,
    dailySpawnCount,
    postCullStrategies.length,
    maxAgents,
  );

  /** @type {{ agentId: number; reason: string; strategy: ReturnType<typeof buildRandomLabStrategy> }[]} */
  const dailySpawned = [];
  for (const agentId of newIds) {
    const strat = buildStrategy(agentId);
    await upsertSpawnedAgent(suiteNorm, agentId, strat);
    const entry = { agentId, reason: "daily_spawn", strategy: strat };
    dailySpawned.push(entry);
    spawned.push(entry);
  }

  if (culled.length === 0 && dailySpawned.length === 0) {
    const atCap = postCullStrategies.length >= maxAgents;
    return {
      ok: true,
      suite: suiteNorm,
      culled,
      spawned,
      dailySpawned,
      skipped: atCap ? "At max agent cap" : "No agents eligible for cull or spawn",
    };
  }

  return {
    ok: true,
    suite: suiteNorm,
    culled,
    spawned,
    dailySpawned,
    skipped: null,
  };
}
