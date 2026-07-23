import MomentumRotatorRun from '../models/MomentumRotatorRun.js';
import MomentumRotatorState from '../models/MomentumRotatorState.js';
import MomentumRotatorStrategyOverride from '../models/MomentumRotatorStrategyOverride.js';
import {
  MOMENTUM_DAILY_SPAWN_COUNT,
  MOMENTUM_EVOLVABLE_MAX_ID,
  MOMENTUM_EVOLVABLE_MIN_ID,
  MOMENTUM_MAX_STRATEGIES,
  MOMENTUM_STATIC_STRATEGY_COUNT,
} from '../config/momentumRotatorStrategies.js';
import { MOMENTUM_CRON } from '../config/onchainEarnExperiments.js';
import {
  invalidateMomentumStrategyCache,
  resolveMomentumStrategies,
} from './momentumRotatorStrategyResolve.js';
import { runSimpleEvolution, clamp } from './earnExperimentKit.js';

function mutateMomentum(parent, newId) {
  const exit = { ...(parent.exit || {}) };
  if (exit.stopLossPct != null) {
    exit.stopLossPct = clamp(exit.stopLossPct * (0.9 + Math.random() * 0.2), -12, -2);
  }
  if (exit.takeProfitPct != null) {
    exit.takeProfitPct = clamp(exit.takeProfitPct * (0.9 + Math.random() * 0.2), 3, 25);
  }
  return {
    strategyId: newId,
    name: `${parent.name} Mut#${newId}`,
    maxHoldHours: clamp(toNum(parent.maxHoldHours, 48) * (0.85 + Math.random() * 0.3), 12, 120),
    universeFilter: parent.universeFilter,
    signalGate: parent.signalGate,
    signalWeights: parent.signalWeights,
    exit,
    notes: `Evolved from ${parent.id}`,
  };
}

function toNum(v, f) {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}

export function momentumEvolutionConfigFromEnv() {
  const evo = MOMENTUM_CRON.evolution;
  return {
    enabled: evo.enabled,
    ms: evo.intervalMs,
    removeCount: evo.removeCount,
    minDecided: evo.minDecided,
    dailySpawnCount: MOMENTUM_DAILY_SPAWN_COUNT,
    maxStrategies: MOMENTUM_MAX_STRATEGIES,
  };
}

export async function runMomentumExperimentEvolution() {
  const cfg = momentumEvolutionConfigFromEnv();
  if (!cfg.enabled) return { skipped: true, reason: 'disabled' };
  return runSimpleEvolution({
    RunModel: MomentumRotatorRun,
    OverrideModel: MomentumRotatorStrategyOverride,
    StateModel: MomentumRotatorState,
    resolveStrategies: resolveMomentumStrategies,
    invalidateCache: invalidateMomentumStrategyCache,
    staticCount: MOMENTUM_STATIC_STRATEGY_COUNT,
    evolvableMin: MOMENTUM_EVOLVABLE_MIN_ID,
    evolvableMax: MOMENTUM_EVOLVABLE_MAX_ID,
    maxStrategies: cfg.maxStrategies,
    removeCount: cfg.removeCount,
    spawnCount: cfg.dailySpawnCount,
    minDecided: cfg.minDecided,
    mutateFn: mutateMomentum,
  });
}
