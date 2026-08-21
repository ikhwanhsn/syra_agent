import DelphiStrategyOverride from "../models/DelphiStrategyOverride.js";
import { DELPHI_STRATEGIES } from "../config/delphiStrategies.js";

let cache = null;
let cacheAt = 0;
const TTL = 30_000;

export function invalidateDelphiStrategyCache() {
  cache = null;
  cacheAt = 0;
}

export async function resolveDelphiStrategies() {
  if (cache && Date.now() - cacheAt < TTL) return cache;
  const overrides = await DelphiStrategyOverride.find({}).lean();
  const byId = new Map(overrides.map((o) => [o.strategyId, o]));
  const merged = DELPHI_STRATEGIES.map((s) => {
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

export async function resolveDelphiStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  const strategies = await resolveDelphiStrategies();
  return strategies.find((s) => s.id === id) ?? null;
}
