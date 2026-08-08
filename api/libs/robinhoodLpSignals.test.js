/**
 * Robinhood LP real-observable scoring.
 * Run: node --test api/libs/robinhoodLpSignals.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveRobinhoodPoolSignals,
  ROBINHOOD_PAPER_METRICS_UNTRUSTED,
  ROBINHOOD_REAL_SIGNAL_WEIGHTS,
  sanitizeRobinhoodStrategyForScoring,
  scoreRobinhoodPool,
} from "./robinhoodLpSignals.js";
import { derivePoolSignals } from "./lpPoolSignalsSynthetic.js";

const samplePool = {
  poolAddress: "0xabc123def456",
  tvlUsd: 120_000,
  volume24hUsd: 80_000,
  feeTvlRatio: 0.002,
  fee24hUsd: 240,
  feeTier: 0.003,
};

test("deriveRobinhoodPoolSignals does not invent holders/organic/hive", () => {
  const sig = deriveRobinhoodPoolSignals(samplePool);
  assert.equal(sig.organicScore, null);
  assert.equal(sig.holderCount, null);
  assert.equal(sig.studyWinRate, null);
  assert.equal(sig.hiveConsensus, null);
  assert.equal(sig.smartWalletsPresent, false);
  assert.equal(sig.signalsMode, "uniswap_observables");
  assert.ok(sig.volatilityScore >= 0 && sig.volatilityScore <= 1);
  assert.ok(sig.liquidityDepthUsd === 120_000);
});

test("deriveRobinhoodPoolSignals is address-fingerprint free (same observables → same signals)", () => {
  const a = deriveRobinhoodPoolSignals({ ...samplePool, poolAddress: "0xaaa" });
  const b = deriveRobinhoodPoolSignals({ ...samplePool, poolAddress: "0xbbb" });
  assert.equal(a.volatilityScore, b.volatilityScore);
  assert.equal(a.freshnessScore, b.freshnessScore);
  // Synthetic path intentionally varies by address fingerprint.
  const synA = derivePoolSignals({ ...samplePool, poolAddress: "0xaaa" });
  const synB = derivePoolSignals({ ...samplePool, poolAddress: "0xbbb" });
  assert.notEqual(synA.organicScore, synB.organicScore);
});

test("sanitizeRobinhoodStrategyForScoring strips synthetic gates and zeros fake weights", () => {
  const strategy = {
    id: 9,
    screeningOverrides: {
      minOrganic: 67,
      minFeeTvlRatio: 0.055,
      minHolderCount: 850,
      minVolume24hUsd: 90_000,
    },
    signalGate: {
      any: [
        { field: "smart_wallets_present", op: "eq", value: true },
        { field: "fee_tvl_ratio", op: "gte", value: 0.4 },
      ],
      minPasses: 2,
    },
    signalWeights: { organic_score: 1.3, fee_tvl_ratio: 1.2 },
  };
  const sanitized = sanitizeRobinhoodStrategyForScoring(strategy);
  assert.equal(sanitized.screeningOverrides.minOrganic, undefined);
  assert.equal(sanitized.screeningOverrides.minHolderCount, undefined);
  assert.equal(sanitized.screeningOverrides.minFeeTvlRatio, 0.055);
  assert.deepEqual(sanitized.signalGate.any, [{ field: "fee_tvl_ratio", op: "gte", value: 0.4 }]);
  assert.equal(sanitized.signalGate.minPasses, 1);
  assert.equal(sanitized.signalWeights.organic_score, 0);
  assert.equal(sanitized.signalWeights.fee_tvl_ratio, ROBINHOOD_REAL_SIGNAL_WEIGHTS.fee_tvl_ratio);
});

test("scoreRobinhoodPool can pass without fabricated organic/holders", () => {
  const strategy = {
    id: 0,
    screeningOverrides: { minOrganic: 90, minHolderCount: 50_000, minFeeTvlRatio: 0.0005 },
    signalGate: {
      all: [{ field: "organic_score", op: "gte", value: 0.9 }],
    },
    signalWeights: { organic_score: 2, fee_tvl_ratio: 1 },
  };
  const scored = scoreRobinhoodPool(strategy, samplePool, { riskRewardRatio: 1.8, riskScore: 0.3 });
  assert.equal(scored.gatePassed, true);
  assert.ok(scored.score > 0);
  assert.equal(scored.signalsMode, "uniswap_observables");
});

test("paper metrics are marked untrusted", () => {
  assert.equal(ROBINHOOD_PAPER_METRICS_UNTRUSTED, true);
});
