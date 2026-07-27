/**
 * Outcome pricing unit tests.
 * Run: node --test api/config/outcomePricing.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOutcomeFee, OUTCOME_PRODUCT_PRICING } from "./outcomePricing.js";

test("performance fee on positive PnL", () => {
  const fee = computeOutcomeFee("lp_autopilot_solana", { realizedPnlUsd: 100 });
  assert.equal(fee.billingModel, "performance");
  assert.ok(fee.breakdown.performanceFeeUsd > 0);
  assert.ok(fee.totalUsd >= 15); // 15% of 100
});

test("zero PnL still charges flat for hybrid", () => {
  const fee = computeOutcomeFee("robinhood_lp_autopilot", {
    realizedPnlUsd: 0,
    managedCapitalUsd: 0,
  });
  assert.equal(fee.billingModel, "hybrid");
  assert.ok(fee.breakdown.flatCycleFeeUsd > 0);
  assert.ok(fee.totalUsd > 0);
});

test("aum fee scales with capital and period", () => {
  const fee = computeOutcomeFee("treasury_autopilot", {
    managedCapitalUsd: 10_000,
    billingPeriodDays: 30,
  });
  assert.equal(fee.billingModel, "aum");
  assert.ok(fee.breakdown.aumFeeUsd > 0);
});

test("all products have pricing", () => {
  for (const id of Object.keys(OUTCOME_PRODUCT_PRICING)) {
    const fee = computeOutcomeFee(id, { realizedPnlUsd: 50, managedCapitalUsd: 500 });
    assert.ok(fee.totalUsd >= 0);
    assert.ok(fee.billingModel);
  }
});
