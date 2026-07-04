/**
 * BTC quant lab evolution: cull worst sim performers, mutate from elite parents,
 * and learn from closed real positions (lessons + strategy cooldowns).
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import BtcQuantExperimentState from "../models/BtcQuantExperimentState.js";
import BtcQuantStrategyOverride from "../models/BtcQuantStrategyOverride.js";
import BtcQuantEvolutionState from "../models/BtcQuantEvolutionState.js";
import BtcQuantRealPosition from "../models/BtcQuantRealPosition.js";
import {
  EXPERIMENT_SUITE_BTC_ONCHAIN,
  BTC_QUANT_STATIC_STRATEGY_COUNT,
} from "../config/tradingExperimentStrategies.js";
import { getBtcQuantLaneDef } from "../config/btcQuantLanes.js";
import {
  invalidateBtcQuantStrategyCache,
  resolveBtcQuantStrategies,
} from "./btcQuantStrategyResolve.js";

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

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const BTC_QUANT_MIN_DECIDED_FOR_LEADER = (() => {
  const n = Number(process.env.BTC_QUANT_MIN_DECIDED);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 8;
})();

export const BTC_QUANT_MIN_WIN_RATE = (() => {
  const n = Number(process.env.BTC_QUANT_MIN_WIN_RATE);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.52;
})();

/**
 * @param {{ decided?: number; winRate?: number | null; sumPnlUsd?: number }} row
 */
export function computeBtcLeaderScore(row) {
  const decided = toNum(row.decided);
  const winRate = row.winRate ?? 0;
  const sumPnl = toNum(row.sumPnlUsd);
  if (sumPnl <= 0 || decided <= 0) return -999;

  const sampleFactor = Math.min(1, decided / BTC_QUANT_MIN_DECIDED_FOR_LEADER);
  const winFactor = Math.max(0, Math.min(1, (winRate - 0.4) / 0.55));
  const pnlFactor = Math.log1p(Math.max(0, sumPnl) * 8);
  return pnlFactor * (0.5 + winFactor * 0.5) * (0.3 + sampleFactor * 0.7);
}

/**
 * @param {string} experimentId
 */
export async function rankBtcQuantStrategiesByPnl(experimentId) {
  if (!experimentId) return [];

  const rows = await TradingExperimentRun.aggregate([
    {
      $match: {
        suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
        "summary.experimentId": experimentId,
        status: { $in: ["win", "loss", "expired", "open"] },
      },
    },
    {
      $group: {
        _id: "$agentId",
        sumPnlUsd: { $sum: { $ifNull: ["$simPnlUsd", 0] } },
        runCount: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
        decided: {
          $sum: { $cond: [{ $in: ["$status", ["win", "loss", "expired"]] }, 1, 0] },
        },
        sumDecidedPnlUsd: {
          $sum: {
            $cond: [
              { $in: ["$status", ["win", "loss", "expired"]] },
              { $ifNull: ["$simPnlUsd", 0] },
              0,
            ],
          },
        },
        openPositions: {
          $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
        },
      },
    },
  ]);

  return rows
    .map((row) => {
      const decided = toNum(row.decided);
      const wins = toNum(row.wins);
      const winRate = decided > 0 ? wins / decided : null;
      const sumPnlUsd = toNum(row.sumPnlUsd);
      const leaderScore = computeBtcLeaderScore({ decided, winRate, sumPnlUsd });
      return {
        strategyId: row._id,
        decided,
        wins,
        winRate,
        sumPnlUsd,
        openPositions: toNum(row.openPositions),
        leaderScore,
      };
    })
    .sort((a, b) => b.leaderScore - a.leaderScore);
}

/**
 * Mutate gate threshold values within a gate object.
 * @param {object} gate
 */
function mutateSignalGate(gate) {
  const cloned = JSON.parse(JSON.stringify(gate || { minPasses: 0 }));
  const mutateCond = (cond) => {
    if (!cond || typeof cond !== "object") return cond;
    const field = String(cond.field || "");
    const op = String(cond.op || "");
    const val = cond.value;
    if (typeof val === "number" && ["gte", "lte", "gt", "lt"].includes(op)) {
      const delta = op.includes("gte") || op.includes("gt") ? randInt(-3, 3) : randInt(-3, 3);
      if (field === "rsi") {
        cond.value = clamp(Math.round(val + delta), 20, 75);
      } else if (field === "adxValue") {
        cond.value = clamp(Math.round(val + delta), 15, 40);
      } else if (field === "bbPositionPct" || field === "bbWidthPct") {
        cond.value = clamp(Math.round((val + delta * 0.5) * 10) / 10, 2, 60);
      } else if (field === "mfiValue") {
        cond.value = clamp(Math.round(val + delta), 40, 70);
      } else if (field === "priceChange24hPct") {
        cond.value = clamp(Math.round((val + delta * 0.2) * 10) / 10, 0.5, 5);
      } else {
        cond.value = Math.round((val + delta * 0.1) * 100) / 100;
      }
    }
    return cond;
  };

  if (Array.isArray(cloned.all)) cloned.all = cloned.all.map(mutateCond);
  if (Array.isArray(cloned.any)) cloned.any = cloned.any.map(mutateCond);
  if (Number.isFinite(Number(cloned.minPasses))) {
    cloned.minPasses = clamp(Math.round(Number(cloned.minPasses) + randInt(-1, 1)), 0, 3);
  }
  return cloned;
}

/**
 * Deterministic strategy variant for a lane (reproducible, not random per boot).
 * @param {object} base
 * @param {string} lane
 */
function mutateBtcStrategyForLane(base, lane) {
  const laneKey = String(lane || "btc1");
  const id = Number(base.id) || 0;
  const laneBias = laneKey === "btc2" ? 1 : 0;

  const parentGate =
    base.signalGate && typeof base.signalGate === "object"
      ? JSON.parse(JSON.stringify(base.signalGate))
      : { all: [{ field: "clearSignal", op: "eq", value: "BUY" }], minPasses: 0 };

  const shiftCond = (cond, idx) => {
    if (!cond || typeof cond !== "object") return cond;
    const field = String(cond.field || "");
    const op = String(cond.op || "");
    const val = cond.value;
    if (typeof val !== "number" || !["gte", "lte", "gt", "lt"].includes(op)) return cond;
    const sign = op.includes("gte") || op.includes("gt") ? 1 : -1;
    const delta = sign * (2 + ((id + idx + laneBias * 3) % 4));
    if (field === "rsi") {
      cond.value = clamp(Math.round(val + delta), 20, 75);
    } else if (field === "adxValue") {
      cond.value = clamp(Math.round(val + delta), 15, 40);
    } else if (field === "bbPositionPct" || field === "bbWidthPct") {
      cond.value = clamp(Math.round((val + delta * 0.5) * 10) / 10, 2, 60);
    } else if (field === "mfiValue") {
      cond.value = clamp(Math.round(val + delta), 40, 70);
    } else {
      cond.value = Math.round((val + delta * 0.15) * 100) / 100;
    }
    return cond;
  };

  const signalGate = JSON.parse(JSON.stringify(parentGate));
  if (Array.isArray(signalGate.all)) signalGate.all = signalGate.all.map(shiftCond);
  if (Array.isArray(signalGate.any)) signalGate.any = signalGate.any.map(shiftCond);
  if (Number.isFinite(Number(signalGate.minPasses))) {
    signalGate.minPasses = clamp(
      Math.round(Number(signalGate.minPasses) + (laneKey === "btc2" ? 1 : 0)),
      0,
      3,
    );
  }

  const parentExit = base.exit && typeof base.exit === "object" ? base.exit : {};
  const exit = {
    tpFromSignal: parentExit.tpFromSignal !== false,
    slFromSignal: parentExit.slFromSignal !== false,
    maxBars: clamp(Math.round(toNum(parentExit.maxBars, 48) + (laneKey === "btc2" ? 4 : 0)), 12, 96),
    trailingTriggerPct:
      Math.round((toNum(parentExit.trailingTriggerPct, 2) + (laneKey === "btc2" ? 0.3 : 0)) * 10) / 10,
  };

  return {
    lane: laneKey,
    strategyId: id,
    name: laneKey === "btc2" ? `${base.name} (desk)` : base.name,
    signalGate,
    exit,
    notes:
      typeof base.notes === "string"
        ? `${base.notes} · ${laneKey} lane variant`
        : `${laneKey} lane variant`,
  };
}

/**
 * Seed per-lane strategy overrides so parallel lanes do not mirror identical trades.
 * @param {unknown} lane
 */
export async function ensureBtcQuantLaneStrategyVariants(lane = "btc2") {
  const laneDef = getBtcQuantLaneDef(lane);
  if (!laneDef.seedMutatedStrategies) return { lane: laneDef.lane, seeded: 0, skipped: "not_configured" };

  const existing = await BtcQuantStrategyOverride.countDocuments({ lane: laneDef.lane });
  if (existing > 0) return { lane: laneDef.lane, seeded: 0, skipped: "already_seeded" };

  const { BTC_QUANT_STRATEGIES } = await import("../config/tradingExperimentStrategies.js");
  let seeded = 0;
  for (const base of BTC_QUANT_STRATEGIES) {
    const variant = mutateBtcStrategyForLane(base, laneDef.lane);
    await upsertBtcStrategyOverride(variant);
    seeded += 1;
  }
  return { lane: laneDef.lane, seeded, skipped: null };
}

/**
 * @param {object} parent
 * @param {number} strategyId
 * @param {{ parentStrategyId?: number; parentWinRate?: number | null; parentPnlUsd?: number }} [meta]
 */
export function mutateBtcStrategyFromElite(parent, strategyId, meta = {}) {
  const parentGate =
    parent.signalGate && typeof parent.signalGate === "object"
      ? JSON.parse(JSON.stringify(parent.signalGate))
      : { all: [{ field: "clearSignal", op: "eq", value: "BUY" }], minPasses: 0 };

  const parentExit = parent.exit && typeof parent.exit === "object" ? parent.exit : {};
  const exit = {
    tpFromSignal: parentExit.tpFromSignal !== false,
    slFromSignal: parentExit.slFromSignal !== false,
    maxBars: clamp(Math.round(toNum(parentExit.maxBars, 48) + randInt(-8, 8)), 12, 96),
    trailingTriggerPct:
      Math.round((toNum(parentExit.trailingTriggerPct, 2) + Math.random() * 0.8 - 0.3) * 10) / 10,
  };
  if (parentExit.stopLossPct != null || Math.random() < 0.3) {
    exit.stopLossPct = clamp(
      Math.round((toNum(parentExit.stopLossPct, 3) + randInt(-1, 1)) * 10) / 10,
      1.5,
      8,
    );
  }
  if (parentExit.takeProfitPct != null || Math.random() < 0.3) {
    exit.takeProfitPct = clamp(
      Math.round((toNum(parentExit.takeProfitPct, 5) + randInt(-1, 2)) * 10) / 10,
      2,
      12,
    );
  }

  const parentWinPct =
    meta.parentWinRate != null && Number.isFinite(meta.parentWinRate)
      ? `${Math.round(meta.parentWinRate * 100)}% WR`
      : "elite";
  const shortParent = String(parent.name || `agent ${meta.parentStrategyId ?? "?"}`).slice(0, 28);
  const genTag = Math.floor(100 + Math.random() * 900);

  return {
    lane: parent.lane,
    strategyId,
    name: `evo #${strategyId} · ${shortParent} · ${genTag}`,
    signalGate: mutateSignalGate(parentGate),
    exit,
    notes:
      `Elite mutation from #${meta.parentStrategyId ?? "?"} (${parentWinPct}, ` +
      `$${(meta.parentPnlUsd ?? 0).toFixed(2)} net)`,
  };
}

/**
 * @param {string} experimentId
 * @param {object[]} strategyList
 * @param {string} lane
 */
async function pickEliteParent(experimentId, strategyList, lane) {
  const ranked = await rankBtcQuantStrategiesByPnl(experimentId);
  const elites = ranked.filter(
    (row) =>
      row.decided >= 3 &&
      row.sumPnlUsd > 0 &&
      (row.winRate ?? 0) >= 0.48 &&
      row.leaderScore > 0,
  );
  if (elites.length === 0) return null;

  elites.sort((a, b) => b.leaderScore - a.leaderScore);
  const pickIdx = Math.min(elites.length - 1, Math.floor(Math.random() * Math.random() * elites.length));
  const stats = elites[pickIdx];
  const strategy = strategyList.find((s) => s.id === stats.strategyId) ?? null;
  if (!strategy) return null;
  return { strategy: { ...strategy, lane }, stats };
}

/**
 * @param {ReturnType<typeof mutateBtcStrategyFromElite>} strat
 */
async function upsertBtcStrategyOverride(strat) {
  await BtcQuantStrategyOverride.findOneAndUpdate(
    { lane: strat.lane, strategyId: strat.strategyId },
    {
      $set: {
        lane: strat.lane,
        strategyId: strat.strategyId,
        name: strat.name,
        signalGate: strat.signalGate ?? null,
        exit: strat.exit ?? null,
        notes: strat.notes ?? "",
      },
    },
    { upsert: true, new: true },
  );
  invalidateBtcQuantStrategyCache(strat.lane);
}

/**
 * @param {string} lane
 */
async function getEvolutionDoc(lane) {
  const laneDef = getBtcQuantLaneDef(lane);
  let doc = await BtcQuantEvolutionState.findById(laneDef.lane).lean();
  if (!doc) {
    await BtcQuantEvolutionState.create({
      _id: laneDef.lane,
      lessons: [],
      strategyCooldowns: [],
      thresholdOverrides: {},
    });
    doc = await BtcQuantEvolutionState.findById(laneDef.lane).lean();
  }
  return doc;
}

/**
 * @param {string} lane
 * @param {number} strategyId
 */
export async function isStrategyOnEvolutionCooldown(lane, strategyId) {
  const cooldownIds = await getEvolutionCooldownStrategyIds(lane);
  return cooldownIds.has(strategyId);
}

/**
 * Load active evolution cooldowns once per signal cycle (avoids N reads).
 * @param {string} lane
 * @returns {Promise<Set<number>>}
 */
export async function getEvolutionCooldownStrategyIds(lane) {
  const doc = await getEvolutionDoc(lane);
  const now = Date.now();
  const ids = new Set();
  for (const row of doc?.strategyCooldowns || []) {
    if (row?.strategyId == null) continue;
    if (new Date(row.until).getTime() > now) ids.add(Number(row.strategyId));
  }
  return ids;
}

/**
 * @param {string} lane
 */
export async function getBtcQuantEvolutionSnapshot(lane = "btc1") {
  const laneDef = getBtcQuantLaneDef(lane);
  const doc = await getEvolutionDoc(laneDef.lane);
  const overrides = await BtcQuantStrategyOverride.find({ lane: laneDef.lane }).lean();
  return {
    lane: laneDef.lane,
    lessons: doc?.lessons ?? [],
    strategyCooldowns: doc?.strategyCooldowns ?? [],
    thresholdOverrides: doc?.thresholdOverrides ?? {},
    lastEvolutionAt: doc?.lastEvolutionAt ?? null,
    lastEvolutionSummary: doc?.lastEvolutionSummary ?? null,
    decidedRunsAnalyzed: doc?.decidedRunsAnalyzed ?? 0,
    closedPositionsAnalyzed: doc?.closedPositionsAnalyzed ?? 0,
    overrideCount: overrides.length,
  };
}

/** In-process BTC quant evolution: enabled by default; 24h tick. */
export const BTC_QUANT_EXPERIMENT_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
  removeCount: 3,
  minDecided: 4,
  pinnedStrategyIds: Object.freeze([14]),
});

export function btcQuantEvolutionConfigFromEnv() {
  const sched = BTC_QUANT_EXPERIMENT_EVOLUTION_SCHEDULE;
  const enabledRaw = (process.env.BTC_QUANT_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off" ? false : sched.enabled;
  const ms = Number(process.env.BTC_QUANT_EVOLUTION_MS || sched.intervalMs);
  const removeCount = Number(process.env.BTC_QUANT_EVOLUTION_REMOVE_COUNT || sched.removeCount);
  const minDecided = Number(process.env.BTC_QUANT_EVOLUTION_MIN_DECIDED || sched.minDecided);
  const pinnedRaw = (process.env.BTC_QUANT_EVOLUTION_PINNED || "").trim();
  const pinned = new Set(sched.pinnedStrategyIds);
  if (pinnedRaw) {
    for (const part of pinnedRaw.split(",")) {
      const n = Number(part.trim());
      if (Number.isInteger(n) && n >= 0 && n < BTC_QUANT_STATIC_STRATEGY_COUNT) pinned.add(n);
    }
  }
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : sched.intervalMs,
    removeCount:
      Number.isFinite(removeCount) && removeCount >= 1
        ? Math.min(10, Math.floor(removeCount))
        : sched.removeCount,
    minDecided:
      Number.isFinite(minDecided) && minDecided >= 0 ? Math.floor(minDecided) : sched.minDecided,
    pinned,
  };
}

/**
 * @param {string} experimentId
 * @param {object[]} strategyList
 * @param {number} strategyId
 * @param {string} lane
 */
async function spawnSmarterBtcStrategy(experimentId, strategyList, strategyId, lane) {
  const elite = await pickEliteParent(experimentId, strategyList, lane);
  let strat;
  if (elite) {
    strat = mutateBtcStrategyFromElite(elite.strategy, strategyId, {
      parentStrategyId: elite.stats.strategyId,
      parentWinRate: elite.stats.winRate,
      parentPnlUsd: elite.stats.sumPnlUsd,
    });
    strat.lane = lane;
  } else {
    const base = strategyList.find((s) => s.id === strategyId) ?? strategyList[0];
    strat = mutateBtcStrategyFromElite(base, strategyId, { parentStrategyId: base?.id });
    strat.lane = lane;
    strat.name = `evo #${strategyId} · reset · ${Math.floor(100 + Math.random() * 900)}`;
    strat.notes = "Evolution spawn — randomized from baseline (no elite yet)";
  }
  await upsertBtcStrategyOverride(strat);
  return { strategyId, strategy: strat, parentStrategyId: elite?.stats.strategyId ?? null };
}

/**
 * @param {unknown} [lane]
 * @param {{ removeCount?: number; minDecided?: number; pinned?: Set<number> }} [opts]
 */
export async function runBtcQuantEvolution(lane = "btc1", opts = {}) {
  const laneDef = getBtcQuantLaneDef(lane);
  const envCfg = btcQuantEvolutionConfigFromEnv();
  const removeCount = opts.removeCount ?? envCfg.removeCount;
  const minDecided = opts.minDecided ?? envCfg.minDecided;
  const pinned = opts.pinned ?? envCfg.pinned;

  const state = await BtcQuantExperimentState.findById(laneDef.stateId).lean();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { ok: false, lane: laneDef.lane, culled: [], spawned: [], skipped: "BTC quant cohort not initialized" };
  }

  const strategies = await resolveBtcQuantStrategies(laneDef.lane);
  /** @type {{ strategyId: number; wins: number; losses: number; expired: number; decided: number; winRate: number | null; openPositions: number; sumPnlUsd: number }[]} */
  const rows = [];

  for (const s of strategies) {
    if (pinned.has(s.id)) continue;

    const settled = await TradingExperimentRun.find({
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": experimentId,
      agentId: s.id,
      status: { $in: ["win", "loss", "expired"] },
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const expired = settled.filter((r) => r.status === "expired").length;
    const decided = wins + losses + expired;
    const winRate = decided > 0 ? wins / decided : null;
    const sumPnlUsd = settled.reduce((acc, r) => acc + toNum(r.simPnlUsd, 0), 0);

    const openPositions = await TradingExperimentRun.countDocuments({
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": experimentId,
      agentId: s.id,
      status: "open",
    });

    rows.push({ strategyId: s.id, wins, losses, expired, decided, winRate, openPositions, sumPnlUsd });
  }

  const experienced = rows.filter((r) => r.decided >= minDecided && r.openPositions === 0);
  const fresh = rows.filter((r) => r.decided < minDecided && r.openPositions === 0);

  experienced.sort((a, b) => {
    const scoreA = computeBtcLeaderScore({
      decided: a.decided,
      winRate: a.winRate,
      sumPnlUsd: a.sumPnlUsd,
    });
    const scoreB = computeBtcLeaderScore({
      decided: b.decided,
      winRate: b.winRate,
      sumPnlUsd: b.sumPnlUsd,
    });
    if (scoreA !== scoreB) return scoreA - scoreB;
    const ra = a.winRate ?? 0;
    const rb = b.winRate ?? 0;
    if (ra !== rb) return ra - rb;
    return a.sumPnlUsd - b.sumPnlUsd;
  });

  fresh.sort((a, b) => {
    if (a.decided !== b.decided) return a.decided - b.decided;
    const ra = a.winRate ?? 0;
    const rb = b.winRate ?? 0;
    return ra - rb;
  });

  const ordered = [...experienced, ...fresh];
  const victims = ordered.slice(0, removeCount);

  /** @type {Awaited<ReturnType<typeof spawnSmarterBtcStrategy>>[]} */
  const spawned = [];
  /** @type {{ strategyId: number; previousWinRate: number | null; previousDecided: number; previousPnlUsd: number }[]} */
  const culled = [];

  for (const v of victims) {
    await TradingExperimentRun.deleteMany({
      suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
      "summary.experimentId": experimentId,
      agentId: v.strategyId,
    });
    const entry = await spawnSmarterBtcStrategy(experimentId, strategies, v.strategyId, laneDef.lane);
    culled.push({
      strategyId: v.strategyId,
      previousWinRate: v.winRate,
      previousDecided: v.decided,
      previousPnlUsd: v.sumPnlUsd,
    });
    spawned.push(entry);
  }

  const lessons = [];
  if (culled.length > 0) {
    lessons.push(
      `Evolution culled ${culled.length} strategies on ${laneDef.lane} — worst performer was #${culled[0]?.strategyId} with $${culled[0]?.previousPnlUsd.toFixed(2)} net.`,
    );
  }

  const existing = await getEvolutionDoc(laneDef.lane);
  await BtcQuantEvolutionState.updateOne(
    { _id: laneDef.lane },
    {
      $set: {
        lessons: [...lessons, ...(existing?.lessons ?? [])].slice(0, 30),
        lastEvolutionAt: new Date(),
        lastEvolutionSummary: `Culled ${culled.length}, spawned ${spawned.length} mutations`,
        decidedRunsAnalyzed: rows.reduce((s, r) => s + r.decided, 0),
      },
    },
    { upsert: true },
  );

  if (culled.length === 0) {
    return { ok: true, lane: laneDef.lane, culled, spawned, skipped: "No eligible strategies for cull" };
  }

  return { ok: true, lane: laneDef.lane, culled, spawned, skipped: null };
}

export async function runAllBtcQuantEvolutions(opts = {}) {
  const { BTC_QUANT_LANE_IDS } = await import("../config/btcQuantLanes.js");
  /** @type {Record<string, Awaited<ReturnType<typeof runBtcQuantEvolution>>>} */
  const lanes = {};
  for (const lane of BTC_QUANT_LANE_IDS) {
    lanes[lane] = await runBtcQuantEvolution(lane, opts);
  }
  return { lanes };
}

/**
 * Analyze closed real BTC positions and derive lessons + strategy cooldowns.
 */
export async function runBtcQuantRealEvolution() {
  const minClosed = Number(process.env.BTC_QUANT_REAL_EVOLUTION_MIN_CLOSED || 5);
  const closed = await BtcQuantRealPosition.find({
    status: { $in: ["closed_win", "closed_loss", "expired"] },
    realNetPnlUsd: { $ne: null },
  })
    .sort({ resolvedAt: -1 })
    .limit(200)
    .lean();

  if (closed.length < minClosed) {
    return {
      skipped: true,
      reason: "insufficient_closed_positions",
      closedCount: closed.length,
      minClosed,
    };
  }

  const wins = closed.filter((p) => toNum(p.realNetPnlUsd) > 0);
  const losses = closed.filter((p) => toNum(p.realNetPnlUsd) <= 0);
  const winRate = wins.length / closed.length;
  const avgWin = wins.length
    ? wins.reduce((s, p) => s + toNum(p.realNetPnlUsd), 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? losses.reduce((s, p) => s + toNum(p.realNetPnlUsd), 0) / losses.length
    : 0;

  const lessons = [];
  const thresholdOverrides = {};

  if (winRate < 0.45) {
    lessons.push(
      `Real win rate ${(winRate * 100).toFixed(0)}% is below target — tighten signal gates and reduce max notional.`,
    );
    thresholdOverrides.minConfidence = "HIGH";
    thresholdOverrides.maxNotionalMultiplier = 0.85;
  } else if (winRate > 0.55 && avgWin > Math.abs(avgLoss)) {
    lessons.push(
      `Real win rate ${(winRate * 100).toFixed(0)}% with positive avg win — current strategy selection is working.`,
    );
  }

  const losingStrategies = new Map();
  for (const row of losses.slice(0, 40)) {
    const key = row.strategyId;
    if (key == null) continue;
    losingStrategies.set(key, (losingStrategies.get(key) || 0) + 1);
  }

  const strategyCooldowns = [];
  const cooldownUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  for (const [strategyId, count] of losingStrategies) {
    if (count >= 2) {
      strategyCooldowns.push({
        strategyId,
        reason: `repeated_real_losses:${count}`,
        until: cooldownUntil,
      });
      lessons.push(`Strategy #${strategyId} demoted after ${count} real losses.`);
    }
  }

  const summary = `Analyzed ${closed.length} closed real positions — win rate ${(winRate * 100).toFixed(1)}%, avg win $${avgWin.toFixed(2)}, avg loss $${avgLoss.toFixed(2)}.`;

  const { BTC_QUANT_LANE_IDS } = await import("../config/btcQuantLanes.js");
  for (const lane of BTC_QUANT_LANE_IDS) {
    const existing = await getEvolutionDoc(lane);
    await BtcQuantEvolutionState.updateOne(
      { _id: lane },
      {
        $set: {
          lessons: [...lessons, ...(existing?.lessons ?? [])].slice(0, 30),
          strategyCooldowns,
          thresholdOverrides,
          lastEvolutionAt: new Date(),
          lastEvolutionSummary: summary,
          closedPositionsAnalyzed: closed.length,
        },
      },
      { upsert: true },
    );
  }

  return {
    skipped: false,
    closedCount: closed.length,
    winRate,
    avgWin,
    avgLoss,
    lessons,
    thresholdOverrides,
    strategyCooldowns,
    summary,
  };
}

export const BTC_QUANT_REAL_EVOLUTION_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
});

export function btcQuantRealEvolutionConfigFromEnv() {
  const enabledRaw = (process.env.BTC_QUANT_REAL_EVOLUTION_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off"
      ? false
      : BTC_QUANT_REAL_EVOLUTION_SCHEDULE.enabled;
  const ms = Number(process.env.BTC_QUANT_REAL_EVOLUTION_MS || BTC_QUANT_REAL_EVOLUTION_SCHEDULE.intervalMs);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : BTC_QUANT_REAL_EVOLUTION_SCHEDULE.intervalMs,
  };
}

/**
 * Pick best sim strategy for real leader selection.
 * @param {string} experimentId
 */
export async function pickBestBtcQuantStrategy(experimentId) {
  const ranked = await rankBtcQuantStrategiesByPnl(experimentId);
  const qualified = ranked.filter(
    (row) =>
      row.decided >= BTC_QUANT_MIN_DECIDED_FOR_LEADER &&
      row.sumPnlUsd > 0 &&
      (row.winRate ?? 0) >= BTC_QUANT_MIN_WIN_RATE,
  );
  if (qualified.length > 0) return qualified[0];
  return ranked.find((row) => row.sumPnlUsd >= 0 && row.decided > 0) ?? ranked[0] ?? null;
}
