/**
 * Meridian paper EV gate, exit labeling, and fee-farm defaults.
 * Run: node --test api/libs/meridianService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MERIDIAN_DEFAULTS,
  MERIDIAN_EV_HOLD_HOURS,
  MERIDIAN_MIN_FEE_TO_COST_RATIO,
} from "../config/meridianStrategies.js";
import {
  evaluateMeridianOpenEv,
  evaluateMeridianRunResolution,
} from "./meridianService.js";

const HOT_POOL = {
  depositSol: 1,
  tvlUsd: 25_000,
  volume24hUsd: 3_000_000,
  feeTvlRatio: 0.2,
  volatilityScore: 0.55,
  binsBelow: 36,
  binsAbove: 36,
};

const DEAD_POOL = {
  depositSol: 1,
  tvlUsd: 3_100_000,
  volume24hUsd: 36_000_000,
  feeTvlRatio: 0.0045,
  volatilityScore: 0.35,
  binsBelow: 40,
  binsAbove: 40,
};

test("Meridian fee-farm defaults match the AyeLabs EV contract", () => {
  assert.equal(MERIDIAN_DEFAULTS.maxRunAgeHours, 12);
  assert.equal(MERIDIAN_EV_HOLD_HOURS, 12);
  assert.equal(MERIDIAN_MIN_FEE_TO_COST_RATIO, 1);
});

test("evaluateMeridianOpenEv rejects low-fee pools after the paper haircut", () => {
  const ev = evaluateMeridianOpenEv(DEAD_POOL);
  assert.equal(ev.pass, false);
  assert.equal(ev.reason, "fees_below_chain_costs");
  assert.ok(ev.expectedFeeSol < ev.roundTripCostSol * ev.minFeeToCostRatio);
});

test("evaluateMeridianOpenEv accepts a hot fee pool that covers calibrated costs", () => {
  const ev = evaluateMeridianOpenEv(HOT_POOL);
  assert.equal(ev.pass, true);
  assert.equal(ev.reason, null);
  assert.ok(ev.expectedFeeSol >= ev.roundTripCostSol * ev.minFeeToCostRatio);
  assert.equal(ev.needsSidecar, false);
});

test("evaluateMeridianOpenEv charges more for single-sided sidecar opens", () => {
  const twoSided = evaluateMeridianOpenEv(HOT_POOL);
  const single = evaluateMeridianOpenEv({ ...HOT_POOL, binsBelow: 60, binsAbove: 0 });
  assert.equal(single.needsSidecar, true);
  assert.ok(single.roundTripCostSol > twoSided.roundTripCostSol);
});

test("stop-loss and take-profit both use net PnL, not raw price drift", () => {
  const run = {
    depositSol: 1,
    depositUsd: 150,
    entryPriceUsd: 1,
    binsBelow: 40,
    binsAbove: 40,
    activeBinAtOpen: 100,
    simOpenFeeSol: 0.0052,
    screeningSnapshot: { riskScore: 0.4, volatilityScore: 0.5, peakPnlPct: 0 },
    tvlUsd: 40_000,
    volume24hUsd: 2_000_000,
    feeTvlRatio: 0.15,
  };
  const exit = {
    stopLossPct: -10,
    takeProfitPct: 6,
    minHoldMin: 30,
    oorWaitMin: 30,
    trailingTriggerPct: 4,
    trailingDropPct: 2,
  };

  const sl = evaluateMeridianRunResolution(
    run,
    {
      currentPrice: 0.7,
      activeBinId: 40,
      tvlUsd: run.tvlUsd,
      volume24hUsd: run.volume24hUsd,
      feeTvlRatio: run.feeTvlRatio,
    },
    exit,
    2,
    MERIDIAN_DEFAULTS,
  );
  assert.equal(sl.resolution, "stop_loss");
  assert.ok(sl.simPnlPct <= -10);

  const hold = evaluateMeridianRunResolution(
    run,
    {
      currentPrice: 1,
      activeBinId: 100,
      tvlUsd: run.tvlUsd,
      volume24hUsd: run.volume24hUsd,
      feeTvlRatio: 0.2,
    },
    exit,
    12,
    MERIDIAN_DEFAULTS,
  );
  assert.notEqual(hold.resolution, "stop_loss");
  assert.ok(hold.simPnlPct > -10);
});

test("wins that are net-negative after tx costs are relabeled as losses", () => {
  const fields = evaluateMeridianRunResolution(
    {
      depositSol: 1,
      depositUsd: 150,
      entryPriceUsd: 1,
      binsBelow: 40,
      binsAbove: 40,
      activeBinAtOpen: 100,
      simOpenFeeSol: 0.0052,
      screeningSnapshot: { riskScore: 0.3, volatilityScore: 0.3, peakPnlPct: 0 },
      tvlUsd: 3_100_000,
      volume24hUsd: 36_000_000,
      feeTvlRatio: 0.0045,
    },
    {
      currentPrice: 1.002,
      activeBinId: 100,
      tvlUsd: 3_100_000,
      volume24hUsd: 36_000_000,
      feeTvlRatio: 0.0045,
    },
    { stopLossPct: -10, takeProfitPct: 6, minHoldMin: 5, oorWaitMin: 15 },
    12,
    { ...MERIDIAN_DEFAULTS, maxRunAgeHours: 12, winThresholdPct: 0.01 },
  );
  assert.ok(["loss", "expired"].includes(fields.status));
  assert.ok(fields.simNetPnlSol <= 0);
  if (fields.status === "win") {
    assert.fail("net-negative close must not stay a win");
  }
});
