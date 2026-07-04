import StocksExperimentStrategyOverride from "../models/StocksExperimentStrategyOverride.js";
import { STOCKS_EXPERIMENT_STRATEGIES } from "../config/stocksExperimentStrategies.js";

/**
 * @param {Record<string, unknown>} base
 * @param {import("mongoose").LeanDocument<unknown> | null | undefined} o
 */
function mergeBaseWithOverride(base, o) {
  if (!o) return { ...base };
  return {
    ...base,
    name: typeof o.name === "string" ? o.name : base.name,
    minSentiment: typeof o.minSentiment === "number" ? o.minSentiment : base.minSentiment,
    eventWeight: typeof o.eventWeight === "number" ? o.eventWeight : base.eventWeight,
    momentumConfirm: typeof o.momentumConfirm === "boolean" ? o.momentumConfirm : base.momentumConfirm,
    maxHoldHours: typeof o.maxHoldHours === "number" ? o.maxHoldHours : base.maxHoldHours,
    universeFilter:
      o.universeFilter != null && typeof o.universeFilter === "object"
        ? JSON.parse(JSON.stringify(o.universeFilter))
        : base.universeFilter,
    signalGate:
      o.signalGate != null && typeof o.signalGate === "object"
        ? JSON.parse(JSON.stringify(o.signalGate))
        : base.signalGate,
    signalWeights:
      o.signalWeights != null && typeof o.signalWeights === "object"
        ? { ...JSON.parse(JSON.stringify(o.signalWeights)) }
        : base.signalWeights,
    exit:
      o.exit != null && typeof o.exit === "object"
        ? JSON.parse(JSON.stringify(o.exit))
        : base.exit,
    notes: typeof o.notes === "string" ? o.notes : base.notes,
  };
}

/** @param {import("mongoose").LeanDocument<any>} o */
function overrideRowToStrategy(o) {
  return {
    id: o.strategyId,
    name: o.name,
    minSentiment: o.minSentiment ?? 0,
    eventWeight: o.eventWeight ?? 1,
    momentumConfirm: Boolean(o.momentumConfirm),
    maxHoldHours: o.maxHoldHours ?? 48,
    universeFilter: o.universeFilter ?? {},
    signalGate: o.signalGate ?? { minPasses: 0 },
    signalWeights: o.signalWeights ?? {},
    exit: o.exit ?? {},
    notes: o.notes ?? "",
  };
}

const STRATEGY_CACHE_TTL_MS = 60_000;
/** @type {{ at: number; list: object[] } | null} */
let strategyCache = null;

/** @returns {Promise<object[]>} */
export async function resolveStocksExperimentStrategies() {
  const now = Date.now();
  if (strategyCache && now - strategyCache.at < STRATEGY_CACHE_TTL_MS) {
    return strategyCache.list;
  }

  /** @type {import("mongoose").LeanDocument<any>[]} */
  let overrides = [];
  try {
    overrides = await StocksExperimentStrategyOverride.find({}).lean();
  } catch {
    const fallback = STOCKS_EXPERIMENT_STRATEGIES.map((b) => ({ ...b }));
    strategyCache = { at: now, list: fallback };
    return fallback;
  }
  const map = new Map(overrides.map((row) => [row.strategyId, row]));
  const staticIds = new Set(STOCKS_EXPERIMENT_STRATEGIES.map((b) => b.id));
  const staticMerged = STOCKS_EXPERIMENT_STRATEGIES.map((b) =>
    mergeBaseWithOverride({ ...b }, map.get(b.id)),
  );
  const dynamicOnly = overrides
    .filter((row) => !staticIds.has(row.strategyId))
    .map(overrideRowToStrategy);
  const list = [...staticMerged, ...dynamicOnly].sort((a, b) => a.id - b.id);
  strategyCache = { at: now, list };
  return list;
}

export function invalidateStocksStrategyCache() {
  strategyCache = null;
}

/** @param {number} strategyId */
export async function resolveStocksStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const list = await resolveStocksExperimentStrategies();
  return list.find((s) => s.id === id) ?? null;
}
