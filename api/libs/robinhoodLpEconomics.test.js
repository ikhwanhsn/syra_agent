/**
 * Robinhood LP sim economics — Uniswap tick geometry vs Meteora bin ids.
 * Run: node --test api/libs/robinhoodLpEconomics.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getRobinhoodLpSimFeeCalibrationMult,
  getRobinhoodSimTickSpacing,
  isRobinhoodSimPositionInRange,
  shouldCloseRobinhoodSimByOor,
} from "./robinhoodLpEconomics.js";
import { binsToTickRange } from "../config/robinhoodChain.js";

test("getRobinhoodSimTickSpacing defaults to 60", () => {
  assert.equal(getRobinhoodSimTickSpacing({}), 60);
  assert.equal(getRobinhoodSimTickSpacing({ binStep: 10 }), 10);
});

test("isRobinhoodSimPositionInRange tolerates one tick-spacing move", () => {
  const openTick = 100_000;
  const spacing = 60;
  const binsBelow = 45;
  const binsAbove = 45;
  const run = {
    activeBinAtOpen: openTick,
    binsBelow,
    binsAbove,
    binStep: spacing,
  };
  // Legacy Meteora-style check would mark |Δtick|=60 as OOR when bins=45.
  // Uniswap range is bins × spacing = ±2700 ticks.
  assert.equal(
    isRobinhoodSimPositionInRange(run, { activeBinId: openTick + spacing }),
    true,
  );
  assert.equal(
    isRobinhoodSimPositionInRange(run, { activeBinId: openTick + binsBelow }),
    true,
  );
  const range = binsToTickRange({
    currentTick: openTick,
    tickSpacing: spacing,
    binsBelow,
    binsAbove,
  });
  assert.equal(
    isRobinhoodSimPositionInRange(run, { activeBinId: range.tickUpper }),
    false,
  );
  assert.equal(
    isRobinhoodSimPositionInRange(run, { activeBinId: range.tickLower - 1 }),
    false,
  );
});

test("shouldCloseRobinhoodSimByOor respects hold floors and tick range", () => {
  const run = {
    activeBinAtOpen: 50_000,
    binsBelow: 45,
    binsAbove: 45,
    binStep: 60,
  };
  const exit = { minHoldMin: 45, oorWaitMin: 12 };
  assert.equal(shouldCloseRobinhoodSimByOor(run, { activeBinId: 50_060 }, exit, 2), false);
  // Far OOR but under min hold
  assert.equal(shouldCloseRobinhoodSimByOor(run, { activeBinId: 80_000 }, exit, 0.5), false);
  // Far OOR after hold + oor wait
  assert.equal(shouldCloseRobinhoodSimByOor(run, { activeBinId: 80_000 }, exit, 2), true);
});

test("getRobinhoodLpSimFeeCalibrationMult defaults above Solana 0.22 haircut", () => {
  const prev = process.env.ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT;
  delete process.env.ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT;
  assert.equal(getRobinhoodLpSimFeeCalibrationMult(), 0.9);
  process.env.ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT = "1.1";
  assert.equal(getRobinhoodLpSimFeeCalibrationMult(), 1.1);
  if (prev == null) delete process.env.ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT;
  else process.env.ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT = prev;
});
