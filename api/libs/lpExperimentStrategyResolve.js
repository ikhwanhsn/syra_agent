import LpExperimentStrategyOverride from "../models/LpExperimentStrategyOverride.js";
import { LP_AGENT_EXPERIMENT_STRATEGIES } from "../config/lpAgentExperimentStrategies.js";

/**
 * @param {Record<string, unknown>} base
 * @param {import("mongoose").LeanDocument<unknown> | null | undefined} o
 */
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

/** @param {import("mongoose").LeanDocument<any>} o */
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

/** @returns {Promise<object[]>} */
export async function resolveLpExperimentStrategies() {
  const now = Date.now();
  if (strategyCache && now - strategyCache.at < STRATEGY_CACHE_TTL_MS) {
    return strategyCache.list;
  }

  /** @type {import("mongoose").LeanDocument<any>[]} */
  let overrides = [];
  try {
    overrides = await LpExperimentStrategyOverride.find({}).lean();
  } catch {
    const fallback = LP_AGENT_EXPERIMENT_STRATEGIES.map((b) => ({ ...b }));
    strategyCache = { at: now, list: fallback };
    return fallback;
  }
  const map = new Map(overrides.map((row) => [row.strategyId, row]));
  const staticIds = new Set(LP_AGENT_EXPERIMENT_STRATEGIES.map((b) => b.id));
  const staticMerged = LP_AGENT_EXPERIMENT_STRATEGIES.map((b) =>
    mergeBaseWithOverride({ ...b }, map.get(b.id)),
  );
  const dynamicOnly = overrides
    .filter((row) => !staticIds.has(row.strategyId))
    .map(overrideRowToStrategy);
  const list = [...staticMerged, ...dynamicOnly].sort((a, b) => a.id - b.id);
  strategyCache = { at: now, list };
  return list;
}

/** Invalidate in-process strategy cache (call after evolution writes). */
export function invalidateLpStrategyCache() {
  strategyCache = null;
}

/** @param {number} strategyId */
export async function resolveLpStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const list = await resolveLpExperimentStrategies();
  return list.find((s) => s.id === id) ?? null;
}
