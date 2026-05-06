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

/** @returns {Promise<object[]>} */
export async function resolveLpExperimentStrategies() {
  /** @type {import("mongoose").LeanDocument<any>[]} */
  let overrides = [];
  try {
    overrides = await LpExperimentStrategyOverride.find({}).lean();
  } catch {
    return LP_AGENT_EXPERIMENT_STRATEGIES.map((b) => ({ ...b }));
  }
  const map = new Map(overrides.map((row) => [row.strategyId, row]));
  return LP_AGENT_EXPERIMENT_STRATEGIES.map((b) => mergeBaseWithOverride({ ...b }, map.get(b.id)));
}

/** @param {number} strategyId */
export async function resolveLpStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const list = await resolveLpExperimentStrategies();
  return list.find((s) => s.id === id) ?? null;
}
