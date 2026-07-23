import SniperRun from '../models/SniperRun.js';
import SniperState from '../models/SniperState.js';
import SniperStrategyOverride from '../models/SniperStrategyOverride.js';
import {
  SNIPER_DAILY_SPAWN_COUNT,
  SNIPER_EVOLVABLE_MAX_ID,
  SNIPER_EVOLVABLE_MIN_ID,
  SNIPER_MAX_STRATEGIES,
  SNIPER_STATIC_STRATEGY_COUNT,
} from '../config/sniperStrategies.js';
import { SNIPER_CRON } from '../config/onchainEarnExperiments.js';
import {
  invalidateSniperStrategyCache,
  resolveSniperStrategies,
} from './sniperStrategyResolve.js';
import { runSimpleEvolution, clamp } from './earnExperimentKit.js';

function mutateSniper(parent, newId) {
  const exit = { ...(parent.exit || {}) };
  if (exit.stopLossPct != null) {
    exit.stopLossPct = clamp(exit.stopLossPct * (0.9 + Math.random() * 0.2), -30, -8);
  }
  if (exit.takeProfitPct != null) {
    exit.takeProfitPct = clamp(exit.takeProfitPct * (0.9 + Math.random() * 0.2), 12, 60);
  }
  return {
    strategyId: newId,
    name: `${parent.name} Mut#${newId}`,
    minAlphaScore: clamp(Number(parent.minAlphaScore || 70) + Math.floor(Math.random() * 7) - 3, 60, 90),
    requireRugcheckPass: true,
    requireGraduated: parent.requireGraduated,
    requireSmartMoney: parent.requireSmartMoney,
    maxMcapUsd: parent.maxMcapUsd,
    minLiqUsd: parent.minLiqUsd,
    maxHoldMinutes: clamp(Number(parent.maxHoldMinutes || 90) * (0.85 + Math.random() * 0.3), 30, 240),
    exit,
    notes: `Evolved from ${parent.id}`,
  };
}

export function sniperEvolutionConfigFromEnv() {
  const evo = SNIPER_CRON.evolution;
  return {
    enabled: evo.enabled,
    ms: evo.intervalMs,
    removeCount: evo.removeCount,
    minDecided: evo.minDecided,
    dailySpawnCount: SNIPER_DAILY_SPAWN_COUNT,
    maxStrategies: SNIPER_MAX_STRATEGIES,
  };
}

export async function runSniperExperimentEvolution() {
  const cfg = sniperEvolutionConfigFromEnv();
  if (!cfg.enabled) return { skipped: true, reason: 'disabled' };
  return runSimpleEvolution({
    RunModel: SniperRun,
    OverrideModel: SniperStrategyOverride,
    StateModel: SniperState,
    resolveStrategies: resolveSniperStrategies,
    invalidateCache: invalidateSniperStrategyCache,
    staticCount: SNIPER_STATIC_STRATEGY_COUNT,
    evolvableMin: SNIPER_EVOLVABLE_MIN_ID,
    evolvableMax: SNIPER_EVOLVABLE_MAX_ID,
    maxStrategies: cfg.maxStrategies,
    removeCount: cfg.removeCount,
    spawnCount: cfg.dailySpawnCount,
    minDecided: cfg.minDecided,
    mutateFn: mutateSniper,
  });
}
