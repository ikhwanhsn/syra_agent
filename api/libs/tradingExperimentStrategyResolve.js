import TradingExperimentLabAgentOverride from "../models/TradingExperimentLabAgentOverride.js";
import {
  getStrategiesForSuite,
  normalizeSuite,
  EXPERIMENT_SUITE_MULTI_RESOURCE,
} from "../config/tradingExperimentStrategies.js";

/**
 * Merges Mongo overrides onto static lab strategies. User custom suite is not used here.
 * @param {string | null | undefined} suite
 * @returns {Promise<object[]>}
 */
export async function resolveStrategiesForSuite(suite) {
  const suiteNorm = normalizeSuite(suite);
  const base = getStrategiesForSuite(suiteNorm);
  /** @type {import("mongoose").LeanDocument<any>[]} */
  let overrides = [];
  try {
    overrides = await TradingExperimentLabAgentOverride.find({ suite: suiteNorm }).lean();
  } catch {
    return [...base];
  }
  const map = new Map(overrides.map((o) => [o.agentId, o]));
  return base.map((b) => {
    const o = map.get(b.id);
    if (!o) return b;
    const merged = {
      ...b,
      name: o.name,
      token: o.token,
      bar: o.bar,
      limit: o.limit,
      lookAheadBars: o.lookAheadBars,
    };
    if (o.experimentGate?.minConfidence) {
      merged.experimentGate = { minConfidence: o.experimentGate.minConfidence };
    } else {
      delete merged.experimentGate;
    }
    if (suiteNorm === EXPERIMENT_SUITE_MULTI_RESOURCE && typeof o.source === "string" && o.source.trim()) {
      merged.source = o.source.trim();
    }
    return merged;
  });
}
