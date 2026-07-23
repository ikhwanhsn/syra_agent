import LstLoopRun from '../models/LstLoopRun.js';
import LstLoopState from '../models/LstLoopState.js';
import LstLoopStrategyOverride from '../models/LstLoopStrategyOverride.js';
import {
  LST_LOOP_DAILY_SPAWN_COUNT,
  LST_LOOP_EVOLVABLE_MAX_ID,
  LST_LOOP_EVOLVABLE_MIN_ID,
  LST_LOOP_MAX_STRATEGIES,
  LST_LOOP_STATIC_STRATEGY_COUNT,
} from '../config/lstLoopStrategies.js';
import { LST_LOOP_CRON } from '../config/onchainEarnExperiments.js';
import {
  invalidateLstLoopStrategyCache,
  resolveLstLoopStrategies,
} from './lstLoopStrategyResolve.js';
import { runSimpleEvolution, clamp } from './earnExperimentKit.js';

function mutateLst(parent, newId) {
  return {
    strategyId: newId,
    name: `${parent.name} Mut#${newId}`,
    lstSymbol: parent.lstSymbol,
    targetLeverage: clamp(Number(parent.targetLeverage || 2) * (0.9 + Math.random() * 0.2), 1.2, 2.8),
    targetLtv: clamp(Number(parent.targetLtv || 0.5) * (0.9 + Math.random() * 0.2), 0.3, 0.6),
    minHealthFactor: clamp(Number(parent.minHealthFactor || 1.4), 1.25, 1.8),
    maxBorrowRateApr: clamp(Number(parent.maxBorrowRateApr || 0.14), 0.08, 0.2),
    rebalanceBand: clamp(Number(parent.rebalanceBand || 0.05), 0.03, 0.1),
    notes: `Evolved from ${parent.id}`,
  };
}

export function lstLoopEvolutionConfigFromEnv() {
  const evo = LST_LOOP_CRON.evolution;
  return {
    enabled: evo.enabled,
    ms: evo.intervalMs,
    removeCount: evo.removeCount,
    minDecided: evo.minDecided,
    dailySpawnCount: LST_LOOP_DAILY_SPAWN_COUNT,
    maxStrategies: LST_LOOP_MAX_STRATEGIES,
  };
}

export async function runLstLoopExperimentEvolution() {
  const cfg = lstLoopEvolutionConfigFromEnv();
  if (!cfg.enabled) return { skipped: true, reason: 'disabled' };
  return runSimpleEvolution({
    RunModel: LstLoopRun,
    OverrideModel: LstLoopStrategyOverride,
    StateModel: LstLoopState,
    resolveStrategies: resolveLstLoopStrategies,
    invalidateCache: invalidateLstLoopStrategyCache,
    staticCount: LST_LOOP_STATIC_STRATEGY_COUNT,
    evolvableMin: LST_LOOP_EVOLVABLE_MIN_ID,
    evolvableMax: LST_LOOP_EVOLVABLE_MAX_ID,
    maxStrategies: cfg.maxStrategies,
    removeCount: cfg.removeCount,
    spawnCount: cfg.dailySpawnCount,
    minDecided: cfg.minDecided,
    mutateFn: mutateLst,
  });
}
