/**
 * Robinhood Chain LP scoring — Uniswap observables only.
 * Do not reuse Meteora synthetic holders/organic/hive (those teach noise on RH).
 */
import { getDefaultSignalWeights } from "../config/lpAgentExperimentStrategies.js";
import { scorePool } from "./lpExperimentScoring.js";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Screening keys that only make sense with fabricated Meteora-style pool metadata. */
const SYNTHETIC_SCREENING_KEYS = Object.freeze([
  "minOrganic",
  "minHolderCount",
  "minStudyWinRate",
  "maxPriceVsAthPct",
]);

/** Signal-gate fields that were tuned on synthetic derivePoolSignals. */
const SYNTHETIC_GATE_FIELDS = Object.freeze([
  "organic_score",
  "holder_count",
  "smart_wallets_present",
  "narrative_quality",
  "study_win_rate",
  "hive_consensus",
]);

/** Weight keys that must not influence Robinhood ranking. */
const SYNTHETIC_WEIGHT_KEYS = Object.freeze([
  "organic_score",
  "holder_count",
  "smart_wallets_present",
  "narrative_quality",
  "study_win_rate",
  "hive_consensus",
]);

/**
 * Real-observable weight defaults for Robinhood Uniswap LP.
 * Synthetic slots are zeroed so evolution cannot re-learn fake features.
 */
export const ROBINHOOD_REAL_SIGNAL_WEIGHTS = Object.freeze({
  organic_score: 0,
  fee_tvl_ratio: 1.7,
  volume: 1.25,
  holder_count: 0,
  smart_wallets_present: 0,
  narrative_quality: 0,
  study_win_rate: 0,
  hive_consensus: 0,
  volatility: 0.95,
  freshness_score: 1.35,
  fee_velocity: 1.55,
  risk_reward: 2.1,
  safety_score: 1.7,
  directional_penalty: 0,
});

/** Paper PnL uses a DLMM-style fee share model — not live Uniswap fee accounting. */
export const ROBINHOOD_PAPER_METRICS_UNTRUSTED = true;

export const ROBINHOOD_PAPER_METRICS_DISCLAIMER =
  "Paper PnL is simulated (fee share model), not live Uniswap fee capture. Do not treat lab APY as Earn unlock evidence.";

/**
 * Derive pool features from Uniswap observables only (no address fingerprint).
 * @param {object} pool
 */
export function deriveRobinhoodPoolSignals(pool) {
  const tvl = toNum(pool.tvlUsd);
  const vol = toNum(pool.volume24hUsd);
  const feeTvl = toNum(pool.feeTvlRatio);
  const fee24hUsd = toNum(pool.fee24hUsd, vol * toNum(pool.feeTier, 0.003));
  const volTvlRatio = tvl > 0 ? vol / tvl : vol > 0 ? 8 : 0;
  // vol/TVL + fee intensity — no deterministic address boost.
  const volatilityScore = Math.max(0, Math.min(1, feeTvl * 60 + volTvlRatio * 0.1));
  const freshnessScore = Math.max(
    0,
    Math.min(1, Math.min(1, volTvlRatio / 6) * 0.7 + Math.max(0, 1 - tvl / 550_000) * 0.3),
  );
  const liquidityDepthUsd = tvl;

  return {
    /** Explicit nulls: do not invent holders / organic / hive. */
    organicScore: null,
    holderCount: null,
    mcapUsd: null,
    smartWalletsPresent: false,
    narrativeScore: null,
    studyWinRate: null,
    hiveConsensus: null,
    /** Neutral ATH proxy so directional_penalty stays flat when weight is 0. */
    priceVsAthPct: 50,
    volatilityScore,
    freshnessScore,
    volTvlRatio,
    fee24hUsd,
    liquidityDepthUsd,
    signalsMode: "uniswap_observables",
  };
}

function stripSyntheticScreening(screeningOverrides) {
  if (!screeningOverrides || typeof screeningOverrides !== "object") return null;
  const next = { ...screeningOverrides };
  for (const key of SYNTHETIC_SCREENING_KEYS) {
    delete next[key];
  }
  return next;
}

function stripSyntheticGateConditions(gate) {
  if (!gate || typeof gate !== "object") return null;
  const filterConds = (arr) =>
    (Array.isArray(arr) ? arr : []).filter((c) => !SYNTHETIC_GATE_FIELDS.includes(c?.field));
  const all = filterConds(gate.all);
  const any = filterConds(gate.any);
  if (all.length === 0 && any.length === 0) return null;
  return {
    ...gate,
    all,
    any,
    ...(any.length > 0
      ? {
          minPasses: Math.min(
            Number.isFinite(Number(gate.minPasses)) ? Number(gate.minPasses) : 1,
            any.length,
          ),
        }
      : {}),
  };
}

/**
 * Strategy clone that cannot gate or weight on fabricated Meteora signals.
 * @param {object} strategy
 */
export function sanitizeRobinhoodStrategyForScoring(strategy) {
  const baseWeights = getDefaultSignalWeights();
  const strategyWeights = strategy?.signalWeights || {};
  const merged = { ...baseWeights, ...strategyWeights, ...ROBINHOOD_REAL_SIGNAL_WEIGHTS };
  for (const key of SYNTHETIC_WEIGHT_KEYS) {
    merged[key] = 0;
  }
  return {
    ...strategy,
    screeningOverrides: stripSyntheticScreening(strategy?.screeningOverrides),
    signalGate: stripSyntheticGateConditions(strategy?.signalGate),
    signalWeights: merged,
  };
}

/**
 * Enrich pool + score with real Uniswap observables only.
 * @param {object} strategy
 * @param {object} pool
 * @param {object} [extra] riskScore / riskRewardRatio / etc.
 */
export function scoreRobinhoodPool(strategy, pool, extra = {}) {
  const observables = deriveRobinhoodPoolSignals(pool);
  const enriched = {
    ...pool,
    ...observables,
    ...extra,
    // scorePool softNormalize needs numbers — keep synthetic slots at zero.
    organicScore: 0,
    holderCount: 0,
    studyWinRate: 0,
    hiveConsensus: 0,
    narrativeScore: 0,
    smartWalletsPresent: false,
    priceVsAthPct: 50,
  };
  const sanitized = sanitizeRobinhoodStrategyForScoring(strategy);
  const scored = scorePool(sanitized, enriched);
  return {
    ...scored,
    observables,
    enriched,
    signalsMode: "uniswap_observables",
  };
}
