import RobinhoodLpExperimentStrategyOverride from "../models/RobinhoodLpExperimentStrategyOverride.js";
import { ROBINHOOD_LP_STRATEGIES } from "../config/robinhoodLpStrategies.js";

function mergeBaseWithOverride(base, o) {
  if (!o) return { ...base };
  return {
    ...base,
    name: typeof o.name === "string" ? o.name : base.name,
    lpShape: typeof o.lpShape === "string" ? o.lpShape : base.lpShape,
    binsBelow: typeof o.binsBelow === "number" ? o.binsBelow : base.binsBelow,
    binsAbove: typeof o.binsAbove === "number" ? o.binsAbove : base.binsAbove,
    screeningOverrides:
      o.screeningOverrides != null && typeof o.screeningOverrides === "object"
        ? { ...JSON.parse(JSON.stringify(o.screeningOverrides)) }
        : base.screeningOverrides,
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

function overrideRowToStrategy(o) {
  return {
    id: o.strategyId,
    name: o.name,
    lpShape: o.lpShape,
    binsBelow: o.binsBelow,
    binsAbove: o.binsAbove,
    screeningOverrides: o.screeningOverrides ?? {},
    signalGate: o.signalGate ?? { minPasses: 0 },
    signalWeights: o.signalWeights ?? {},
    exit: o.exit ?? {},
    notes: o.notes ?? "",
  };
}

const STRATEGY_CACHE_TTL_MS = 60_000;
/** @type {{ at: number; list: object[] } | null} */
let strategyCache = null;

export async function resolveRobinhoodLpExperimentStrategies() {
  const now = Date.now();
  if (strategyCache && now - strategyCache.at < STRATEGY_CACHE_TTL_MS) {
    return strategyCache.list;
  }

  let overrides = [];
  try {
    overrides = await RobinhoodLpExperimentStrategyOverride.find({}).lean();
  } catch {
    const fallback = ROBINHOOD_LP_STRATEGIES.map((b) => ({ ...b }));
    strategyCache = { at: now, list: fallback };
    return fallback;
  }
  const map = new Map(overrides.map((row) => [row.strategyId, row]));
  const staticIds = new Set(ROBINHOOD_LP_STRATEGIES.map((b) => b.id));
  const staticMerged = ROBINHOOD_LP_STRATEGIES.map((b) =>
    mergeBaseWithOverride({ ...b }, map.get(b.id)),
  );
  const dynamicOnly = overrides
    .filter((row) => !staticIds.has(row.strategyId))
    .map(overrideRowToStrategy);
  const list = [...staticMerged, ...dynamicOnly].sort((a, b) => a.id - b.id);
  strategyCache = { at: now, list };
  return list;
}

export function invalidateRobinhoodLpStrategyCache() {
  strategyCache = null;
}

export async function resolveRobinhoodLpStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const list = await resolveRobinhoodLpExperimentStrategies();
  return list.find((s) => s.id === id) ?? null;
}
