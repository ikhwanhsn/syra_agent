import TradingExperimentLabAgentOverride from "../models/TradingExperimentLabAgentOverride.js";
import {
  getStrategiesForSuite,
  normalizeSuite,
  EXPERIMENT_SUITE_MULTI_RESOURCE,
} from "../config/tradingExperimentStrategies.js";

/**
 * @param {import("mongoose").LeanDocument<any>} o
 * @param {string} suiteNorm
 * @returns {Record<string, unknown>}
 */
function overrideToStrategy(o, suiteNorm) {
  /** @type {Record<string, unknown>} */
  const strategy = {
    id: o.agentId,
    name: o.name,
    token: o.token,
    bar: o.bar,
    limit: o.limit,
    lookAheadBars: o.lookAheadBars,
  };
  if (o.experimentGate?.minConfidence) {
    strategy.experimentGate = { minConfidence: o.experimentGate.minConfidence };
  }
  if (o.indicatorFilter != null && typeof o.indicatorFilter === "object") {
    const keys = Object.keys(o.indicatorFilter);
    if (keys.length > 0) {
      strategy.indicatorFilter = JSON.parse(JSON.stringify(o.indicatorFilter));
    }
  }
  if (suiteNorm === EXPERIMENT_SUITE_MULTI_RESOURCE && typeof o.source === "string" && o.source.trim()) {
    strategy.source = o.source.trim();
  }
  return strategy;
}

/**
 * @param {Record<string, unknown>} base
 * @param {import("mongoose").LeanDocument<any> | undefined} o
 * @param {string} suiteNorm
 * @returns {Record<string, unknown>}
 */
function mergeOverrideOntoBase(base, o, suiteNorm) {
  if (!o) return { ...base };
  const merged = {
    ...base,
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
  if (o.indicatorFilter != null && typeof o.indicatorFilter === "object") {
    const keys = Object.keys(o.indicatorFilter);
    if (keys.length > 0) {
      merged.indicatorFilter = JSON.parse(JSON.stringify(o.indicatorFilter));
    } else {
      delete merged.indicatorFilter;
    }
  }
  if (suiteNorm === EXPERIMENT_SUITE_MULTI_RESOURCE && typeof o.source === "string" && o.source.trim()) {
    merged.source = o.source.trim();
  }
  return merged;
}

/**
 * Merges Mongo overrides onto static lab strategies and appends dynamic-only agents (id >= 15).
 * User custom suite is not used here.
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
  const baseIds = new Set(base.map((b) => b.id));
  const merged = base.map((b) => mergeOverrideOntoBase(b, map.get(b.id), suiteNorm));

  for (const o of overrides) {
    if (baseIds.has(o.agentId)) continue;
    merged.push(overrideToStrategy(o, suiteNorm));
  }

  merged.sort((a, b) => a.id - b.id);
  return merged;
}
