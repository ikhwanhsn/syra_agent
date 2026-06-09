/**
 * Meteora pool normalization unit tests.
 * Run: node --test api/libs/meteoraDlmmClient.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePoolFeeTvlRatio } from "./meteoraDlmmClient.js";
import { computeFeeYieldPct } from "./lpEconomicsModel.js";

test("resolvePoolFeeTvlRatio prefers fees_24h / TVL over Meteora percent field", () => {
  const raw = {
    fees: { "24h": 14124.759691724794 },
    liquidity: 3153411.972298672,
    fee_tvl_ratio: { "24h": 0.44791989805977 },
  };
  const ratio = resolvePoolFeeTvlRatio(raw, raw.fees["24h"], raw.liquidity);
  assert.ok(Math.abs(ratio - 0.0044791989805977) < 1e-9);
  assert.ok(Math.abs(ratio * 100 - raw.fee_tvl_ratio["24h"]) < 1e-6);
});

test("resolvePoolFeeTvlRatio falls back to API percent / 100", () => {
  const ratio = resolvePoolFeeTvlRatio({ fee_tvl_ratio: { "24h": 0.44791989805977 } }, 0, 0);
  assert.ok(Math.abs(ratio - 0.0044791989805977) < 1e-9);
});

test("computeFeeYieldPct is realistic for SOL-USDC over a few hours", () => {
  const feeTvlDecimal = 0.0044791989805977;
  const fourHourYield = computeFeeYieldPct(feeTvlDecimal, 4);
  assert.ok(fourHourYield > 0.07 && fourHourYield < 0.08, `expected ~0.075%, got ${fourHourYield}%`);
  const oneHourYield = computeFeeYieldPct(feeTvlDecimal, 1);
  assert.ok(oneHourYield < 0.02, `1h yield should be well under take-profit; got ${oneHourYield}%`);
});
