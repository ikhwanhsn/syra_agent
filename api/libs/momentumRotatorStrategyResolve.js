import MomentumRotatorStrategyOverride from '../models/MomentumRotatorStrategyOverride.js';
import { MOMENTUM_STRATEGIES } from '../config/momentumRotatorStrategies.js';

let cache = null;
let cacheAt = 0;
const TTL = 30_000;

export function invalidateMomentumStrategyCache() {
  cache = null;
  cacheAt = 0;
}

export async function resolveMomentumStrategies() {
  if (cache && Date.now() - cacheAt < TTL) return cache;
  const overrides = await MomentumRotatorStrategyOverride.find({}).lean();
  const byId = new Map(overrides.map((o) => [o.strategyId, o]));
  const merged = MOMENTUM_STRATEGIES.map((s) => {
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
