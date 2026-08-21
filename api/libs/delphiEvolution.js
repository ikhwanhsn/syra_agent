import DelphiRun from "../models/DelphiRun.js";
import DelphiState from "../models/DelphiState.js";
import DelphiStrategyOverride from "../models/DelphiStrategyOverride.js";
import {
  DELPHI_DAILY_SPAWN_COUNT,
  DELPHI_EVOLVABLE_MAX_ID,
  DELPHI_EVOLVABLE_MIN_ID,
  DELPHI_MAX_STRATEGIES,
  DELPHI_STATIC_STRATEGY_COUNT,
} from "../config/delphiStrategies.js";
import { DELPHI_CRON } from "../config/onchainEarnExperiments.js";
import {
  invalidateDelphiStrategyCache,
  resolveDelphiStrategies,
} from "./delphiStrategyResolve.js";
import { runSimpleEvolution, clamp, toNum } from "./earnExperimentKit.js";

function jitter(value, lo, hi, pct = 0.15) {
  const n = toNum(value, (lo + hi) / 2);
  return clamp(n * (1 - pct + Math.random() * pct * 2), lo, hi);
}

function mutateDelphi(parent, newId) {
  const exit = { ...(parent.exit || {}) };
  if (exit.stopLossPct != null) {
    exit.stopLossPct = clamp(exit.stopLossPct * (0.9 + Math.random() * 0.2), -12, -2);
  }
  if (exit.takeProfitPct != null) {
    exit.takeProfitPct = clamp(exit.takeProfitPct * (0.9 + Math.random() * 0.2), 3, 20);
  }
  if (exit.maxHoldMin != null) {
    exit.maxHoldMin = clamp(toNum(exit.maxHoldMin, 24 * 60) * (0.85 + Math.random() * 0.3), 6 * 60, 96 * 60);
  }
  const weights = { ...(parent.signalWeights || {}) };
  const keys = Object.keys(weights);
  if (keys.length) {
    const boost = keys[Math.floor(Math.random() * keys.length)];
    weights[boost] = clamp(toNum(weights[boost], 1) * (1.05 + Math.random() * 0.1), 0.4, 2.4);
  }
  return {
    strategyId: newId,
    name: `${parent.name} Mut#${newId}`,
    minTraderQuality: jitter(parent.minTraderQuality, 0.3, 0.8),
    minConsensus: jitter(parent.minConsensus, 0.45, 0.85),
    minSampleSize: Math.round(jitter(parent.minSampleSize, 2, 8)),
    biasThreshold: jitter(parent.biasThreshold, 0.12, 0.5),
    sizePctOfBank: jitter(parent.sizePctOfBank, 8, 30),
    maxHoldHours: clamp(toNum(parent.maxHoldHours, 36) * (0.85 + Math.random() * 0.3), 8, 96),
    universeFilter: parent.universeFilter,
    signalWeights: weights,
    exit,
    notes: `Evolved from ${parent.id}`,
  };
}

export function delphiEvolutionConfigFromEnv() {
  const evo = DELPHI_CRON.evolution;
  return {
    enabled: evo.enabled,
    ms: evo.intervalMs,
    removeCount: evo.removeCount,
    minDecided: evo.minDecided,
    dailySpawnCount: DELPHI_DAILY_SPAWN_COUNT,
    maxStrategies: DELPHI_MAX_STRATEGIES,
  };
}

export async function runDelphiExperimentEvolution() {
  const cfg = delphiEvolutionConfigFromEnv();
  if (!cfg.enabled) return { skipped: true, reason: "disabled" };
  return runSimpleEvolution({
    RunModel: DelphiRun,
    OverrideModel: DelphiStrategyOverride,
    StateModel: DelphiState,
    resolveStrategies: resolveDelphiStrategies,
    invalidateCache: invalidateDelphiStrategyCache,
    staticCount: DELPHI_STATIC_STRATEGY_COUNT,
    evolvableMin: DELPHI_EVOLVABLE_MIN_ID,
    evolvableMax: DELPHI_EVOLVABLE_MAX_ID,
    maxStrategies: cfg.maxStrategies,
    removeCount: cfg.removeCount,
    spawnCount: cfg.dailySpawnCount,
    minDecided: cfg.minDecided,
    mutateFn: mutateDelphi,
  });
}
