import MeridianStrategyOverride from "../models/MeridianStrategyOverride.js";
import { MERIDIAN_STRATEGIES } from "../config/meridianStrategies.js";

let cache = null;
let cacheAt = 0;
const TTL = 30_000;

export function invalidateMeridianStrategyCache() {
  cache = null;
  cacheAt = 0;
}

/**
 * Merge base config strategies with runtime overrides (evolution upserts).
 * Cached for 30s to keep signal/resolve ticks cheap.
 */
export async function resolveMeridianStrategies() {
  if (cache && Date.now() - cacheAt < TTL) return cache;
  const overrides = await MeridianStrategyOverride.find({}).lean();
  const byId = new Map(overrides.map((o) => [o.strategyId, o]));
  const merged = MERIDIAN_STRATEGIES.map((s) => {
    const o = byId.get(s.id);
    return o ? { ...s, ...o, id: s.id } : { ...s };
  });
  for (const o of overrides) {
    if (!merged.find((s) => s.id === o.strategyId)) {
      merged.push({ ...o, id: o.strategyId });
    }
  }
  merged.sort((a, b) => a.id - b.id);
  cache = merged;
  cacheAt = Date.now();
  return merged;
}

export async function resolveMeridianStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const strategies = await resolveMeridianStrategies();
  return strategies.find((s) => s.id === id) ?? null;
}
