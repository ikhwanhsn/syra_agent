import { getDefaultSignalWeights } from "../config/lpAgentExperimentStrategies.js";
import {
  LP_MIN_SIM_RISK_REWARD_RATIO,
} from "./lpEconomicsModel.js";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function normalizeLinear(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return 0;
  return clamp01((value - min) / (max - min));
}

function normalizeInverse(value, min, max) {
  return 1 - normalizeLinear(value, min, max);
}

function buildComparisonValue(field, signals) {
  const value = signals[field];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : value;
}

function checkCondition(condition, signals) {
  const v = buildComparisonValue(condition.field, signals);
  const op = condition.op;
  const target = condition.value;
  switch (op) {
    case "eq":
      return v === target;
    case "gte":
      return Number(v) >= Number(target);
    case "lte":
      return Number(v) <= Number(target);
    case "gt":
      return Number(v) > Number(target);
    case "lt":
      return Number(v) < Number(target);
    default:
      return false;
  }
}

function applySignalGate(strategy, signals) {
  const gate = strategy.signalGate || {};
  const reasons = [];
  const all = Array.isArray(gate.all) ? gate.all : [];
  const any = Array.isArray(gate.any) ? gate.any : [];

  for (const cond of all) {
    const ok = checkCondition(cond, signals);
    if (!ok) reasons.push(`all:${cond.field}:${cond.op}:${String(cond.value)}`);
  }

  if (any.length > 0) {
    let passCount = 0;
    for (const cond of any) {
      if (checkCondition(cond, signals)) passCount += 1;
    }
    const required = Number.isFinite(Number(gate.minPasses)) ? Number(gate.minPasses) : 1;
    if (passCount < required) reasons.push(`any:minPasses:${passCount}/${required}`);
  }

  return { pass: reasons.length === 0, reasons };
}

/** Screening thresholds are authored as Meteora percent points (0.05 = 0.05%/day). */
function toFeeTvlDecimalThreshold(threshold) {
  const t = Number(threshold);
  if (!Number.isFinite(t)) return 0;
  return t >= 0.01 ? t / 100 : t;
}

function passesScreeningOverrides(strategy, pool) {
  const s = strategy.screeningOverrides || {};
  if (s.minOrganic != null && toNum(pool.organicScore) < Number(s.minOrganic)) {
    return { pass: false, reason: "organic" };
  }
  if (s.minFeeTvlRatio != null && toNum(pool.feeTvlRatio) < toFeeTvlDecimalThreshold(s.minFeeTvlRatio)) {
    return { pass: false, reason: "fee_tvl_ratio" };
  }
  if (s.minVolume24hUsd != null && toNum(pool.volume24hUsd) < Number(s.minVolume24hUsd)) {
    return { pass: false, reason: "volume24hUsd" };
  }
  if (s.minHolderCount != null && toNum(pool.holderCount) < Number(s.minHolderCount)) {
    return { pass: false, reason: "holderCount" };
  }
  if (s.maxPriceVsAthPct != null && toNum(pool.priceVsAthPct, 100) > Number(s.maxPriceVsAthPct)) {
    return { pass: false, reason: "priceVsAthPct" };
  }
  if (s.minStudyWinRate != null && toNum(pool.studyWinRate) < Number(s.minStudyWinRate)) {
    return { pass: false, reason: "studyWinRate" };
  }
  if (s.maxTvlUsd != null && toNum(pool.tvlUsd) > Number(s.maxTvlUsd)) {
    return { pass: false, reason: "maxTvlUsd" };
  }
  if (s.minVolTvlRatio != null) {
    const tvl = toNum(pool.tvlUsd);
    const vol = toNum(pool.volume24hUsd);
    const ratio = tvl > 0 ? vol / tvl : 0;
    if (ratio < Number(s.minVolTvlRatio)) {
      return { pass: false, reason: "minVolTvlRatio" };
    }
  }
  if (s.minVolatilityScore != null && toNum(pool.volatilityScore) < Number(s.minVolatilityScore)) {
    return { pass: false, reason: "minVolatilityScore" };
  }
  if (s.minRiskRewardRatio != null && toNum(pool.riskRewardRatio) < Number(s.minRiskRewardRatio)) {
    return { pass: false, reason: "minRiskRewardRatio" };
  }
  if (s.maxRiskScore != null && toNum(pool.riskScore) > Number(s.maxRiskScore)) {
    return { pass: false, reason: "maxRiskScore" };
  }
  return { pass: true, reason: null };
}

export function buildLpSignals(pool) {
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  const volTvlRatio = tvl > 0 ? vol / tvl : vol > 0 ? 8 : 0;
  const organic = normalizeLinear(toNum(pool.organicScore), 0, 100);
  const feeTvl = normalizeLinear(toNum(pool.feeTvlRatio), 0, 0.15);
  const feeVelocity = normalizeLinear(toNum(pool.feeTvlRatio) * volTvlRatio, 0, 0.35);
  const volume = normalizeLinear(vol, 0, 300_000);
  const holders = normalizeLinear(toNum(pool.holderCount), 0, 10_000);
  const studyWinRate = normalizeLinear(toNum(pool.studyWinRate), 0, 1);
  const narrative = normalizeLinear(toNum(pool.narrativeScore), 0, 10);
  const volatility = normalizeLinear(toNum(pool.volatilityScore), 0, 1);
  const hiveConsensus = normalizeLinear(toNum(pool.hiveConsensus), 0, 1);
  const smartMoney = Boolean(pool.smartWalletsPresent);
  const freshnessScore = clamp01(
    normalizeLinear(volTvlRatio, 0.8, 6) * 0.65 + normalizeInverse(tvl, 60_000, 550_000) * 0.35,
  );
  const riskReward = normalizeLinear(toNum(pool.riskRewardRatio), LP_MIN_SIM_RISK_REWARD_RATIO, 2.4);
  const safetyScore = 1 - clamp01(toNum(pool.riskScore));
  return {
    organic_score: organic,
    fee_tvl_ratio: feeTvl,
    volume,
    holder_count: holders,
    smart_wallets_present: smartMoney,
    narrative_quality: narrative,
    study_win_rate: studyWinRate,
    hive_consensus: hiveConsensus,
    volatility,
    freshness_score: freshnessScore,
    fee_velocity: feeVelocity,
    risk_reward: riskReward,
    safety_score: safetyScore,
    // Raw helpers for rule gates
    narrative_quality_raw: toNum(pool.narrativeScore),
    study_win_rate_raw: toNum(pool.studyWinRate),
  };
}

export function scorePool(strategy, pool, externalSignals = {}) {
  const mergedPool = { ...pool, ...externalSignals };
  const screening = passesScreeningOverrides(strategy, mergedPool);
  if (!screening.pass) {
    return {
      score: 0,
      gatePassed: false,
      gateReasons: [`screening:${screening.reason}`],
      signalSnapshot: buildLpSignals(mergedPool),
    };
  }

  const signalSnapshot = buildLpSignals(mergedPool);
  const signalForGate = {
    ...signalSnapshot,
    narrative_quality: signalSnapshot.narrative_quality_raw,
    study_win_rate: signalSnapshot.study_win_rate_raw,
  };
  const gate = applySignalGate(strategy, signalForGate);
  if (!gate.pass) {
    return {
      score: 0,
      gatePassed: false,
      gateReasons: gate.reasons,
      signalSnapshot,
    };
  }

  const defaultWeights = getDefaultSignalWeights();
  const strategyWeights = strategy.signalWeights || {};
  const weights = { ...defaultWeights, ...strategyWeights };

  const directionalPenalty = normalizeInverse(toNum(mergedPool.priceVsAthPct, 50), 0, 100);
  const components = {
    organic_score: toNum(signalSnapshot.organic_score),
    fee_tvl_ratio: toNum(signalSnapshot.fee_tvl_ratio),
    volume: toNum(signalSnapshot.volume),
    holder_count: toNum(signalSnapshot.holder_count),
    smart_wallets_present: signalSnapshot.smart_wallets_present ? 1 : 0,
    narrative_quality: toNum(signalSnapshot.narrative_quality),
    study_win_rate: toNum(signalSnapshot.study_win_rate),
    hive_consensus: toNum(signalSnapshot.hive_consensus),
    volatility: toNum(signalSnapshot.volatility),
    freshness_score: toNum(signalSnapshot.freshness_score),
    fee_velocity: toNum(signalSnapshot.fee_velocity),
    risk_reward: toNum(signalSnapshot.risk_reward),
    safety_score: toNum(signalSnapshot.safety_score),
    directional_penalty: directionalPenalty,
  };

  let weightSum = 0;
  let scoreSum = 0;
  Object.entries(components).forEach(([k, v]) => {
    const w = toNum(weights[k], 1);
    scoreSum += v * w;
    weightSum += w;
  });
  const score = weightSum > 0 ? scoreSum / weightSum : 0;

  return {
    score,
    gatePassed: true,
    gateReasons: [],
    signalSnapshot,
  };
}
