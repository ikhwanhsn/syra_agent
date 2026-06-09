/**
 * LP economics / risk-reward unit tests.
 * Run: node --test api/libs/lpEconomicsModel.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeLpNetPnlPct,
  computeLpRiskRewardProfile,
  computePoolRiskScore,
  LP_MIN_SIM_RISK_REWARD_RATIO,
  resolveAdaptiveExitRules,
} from "./lpEconomicsModel.js";

test("computePoolRiskScore ranks thin high-churn pools above mega pools", () => {
  const degen = computePoolRiskScore({
    tvlUsd: 85_000,
    volume24hUsd: 950_000,
    feeTvlRatio: 0.08,
    volatilityScore: 0.75,
    binsBelow: 55,
    binsAbove: 8,
  });
  const blueChip = computePoolRiskScore({
    tvlUsd: 3_100_000,
    volume24hUsd: 36_000_000,
    feeTvlRatio: 0.0045,
    volatilityScore: 0.35,
    binsBelow: 30,
    binsAbove: 30,
  });
  assert.ok(degen > blueChip);
});

test("computeLpRiskRewardProfile rejects low-reward mega pools", () => {
  const mega = computeLpRiskRewardProfile({
    tvlUsd: 3_100_000,
    volume24hUsd: 36_000_000,
    feeTvlRatio: 0.0045,
    volatilityScore: 0.35,
  });
  const hot = computeLpRiskRewardProfile({
    tvlUsd: 110_000,
    volume24hUsd: 10_500_000,
    feeTvlRatio: 0.026,
    volatilityScore: 0.62,
    binsBelow: 38,
    binsAbove: 38,
  });
  assert.ok(hot.ratio > mega.ratio);
  assert.ok(hot.ratio >= LP_MIN_SIM_RISK_REWARD_RATIO);
});

test("resolveAdaptiveExitRules enforces minimum reward:risk on exits", () => {
  const exit = resolveAdaptiveExitRules(
    { stopLossPct: -20, takeProfitPct: 18 },
    { tvlUsd: 90_000, volume24hUsd: 800_000, feeTvlRatio: 0.12, volatilityScore: 0.8 },
    60,
    10,
  );
  assert.ok(exit.stopLossPct > -20);
  assert.ok(exit.takeProfitPct >= Math.abs(exit.stopLossPct) * 1.45);
  assert.ok(exit.trailingTriggerPct > 0);
});

test("computeLpNetPnlPct scales IL with pool risk when out of range", () => {
  const lowRiskIl = computeLpNetPnlPct(-8, 0.5, false, 0.2);
  const highRiskIl = computeLpNetPnlPct(-8, 0.5, false, 0.8);
  assert.ok(highRiskIl < lowRiskIl);
});
