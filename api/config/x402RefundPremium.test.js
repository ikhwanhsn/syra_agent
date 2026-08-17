/**
 * Run: node --test api/config/x402RefundPremium.test.js
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  computeHostedRefundPremiumUsd,
  X402_REFUND_PREMIUM_FLAT_USD,
  X402_REFUND_PREMIUM_BPS,
  X402_REFUND_PREMIUM_CAP_USD,
  X402_DEXTER_MIN_PAYMENT_USD,
} from "./x402Pricing.js";

describe("computeHostedRefundPremiumUsd", () => {
  const keys = [
    "X402_REFUND_PREMIUM_FLAT_USD",
    "X402_REFUND_PREMIUM_BPS",
    "X402_REFUND_PREMIUM_CAP_USD",
  ];
  const prev = {};
  for (const k of keys) prev[k] = process.env[k];

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("uses flat when covered value is missing", () => {
    const usd = computeHostedRefundPremiumUsd(null);
    assert.equal(usd, Math.max(X402_REFUND_PREMIUM_FLAT_USD, X402_DEXTER_MIN_PAYMENT_USD));
  });

  it("takes the greater of flat and bps of covered value", () => {
    const covered = 1;
    const variable = (covered * X402_REFUND_PREMIUM_BPS) / 10_000;
    const usd = computeHostedRefundPremiumUsd(covered);
    assert.ok(variable > X402_REFUND_PREMIUM_FLAT_USD);
    assert.equal(usd, Math.min(variable, X402_REFUND_PREMIUM_CAP_USD));
  });

  it("clamps to cap", () => {
    process.env.X402_REFUND_PREMIUM_CAP_USD = "0.01";
    process.env.X402_REFUND_PREMIUM_FLAT_USD = "0.002";
    process.env.X402_REFUND_PREMIUM_BPS = "5000";
    const usd = computeHostedRefundPremiumUsd(10);
    assert.equal(usd, 0.01);
  });
});
