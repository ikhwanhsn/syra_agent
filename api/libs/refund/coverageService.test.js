/**
 * Run: node --test api/libs/refund/coverageService.test.js
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseSafeRelayTarget,
  wouldExceedCap,
  wouldBreachPoolMin,
  evaluateHostedEligibility,
  assertHostedPayoutAllowed,
  hostedIdempotencyKey,
} from "./coverageService.js";

describe("coverageService policy", () => {
  const keys = [
    "REFUND_HOSTED_ENABLED",
    "REFUND_HOSTED_ALLOWLIST",
    "REFUND_HOSTED_DAILY_USD",
    "REFUND_POOL_MIN_BALANCE_USD",
    "REFUND_HOSTED_PER_WALLET_DAILY_USD",
  ];
  const prev = {};
  for (const k of keys) prev[k] = process.env[k];

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("rejects non-https and private hosts", () => {
    assert.equal(parseSafeRelayTarget("http://api.nansen.ai/x").ok, false);
    assert.equal(parseSafeRelayTarget("https://127.0.0.1/x").ok, false);
    assert.equal(parseSafeRelayTarget("https://localhost/x").ok, false);
    assert.equal(parseSafeRelayTarget("https://10.0.0.5/x").ok, false);
    const ok = parseSafeRelayTarget("https://api.nansen.ai/v1");
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.host, "api.nansen.ai");
  });

  it("cap helpers", () => {
    assert.equal(wouldExceedCap(4.9, 0.2, 5), true);
    assert.equal(wouldExceedCap(4.8, 0.2, 5), false);
    assert.equal(wouldBreachPoolMin(11.5, 1, 10), false);
    assert.equal(wouldBreachPoolMin(10.4, 0.5, 10), true);
  });

  it("eligibility requires hosted allowlist, wallet, chain, amount, refundable class", () => {
    process.env.REFUND_HOSTED_ALLOWLIST = "nansen.ai";
    const base = {
      enabled: true,
      host: "api.nansen.ai",
      toWallet: "Wallet1111111111111111111111111111111111111",
      amountUsd: 0.01,
      classified: { refundable: true, reason: "upstream_5xx" },
      settleSuccess: true,
      chain: "solana",
    };
    assert.equal(evaluateHostedEligibility(base).ok, true);
    assert.equal(evaluateHostedEligibility({ ...base, enabled: false }).reason, "disabled");
    assert.equal(
      evaluateHostedEligibility({ ...base, host: "evil.example" }).reason,
      "host_not_allowlisted",
    );
    assert.equal(
      evaluateHostedEligibility({
        ...base,
        classified: { refundable: false, reason: "success" },
      }).reason,
      "success",
    );
    assert.equal(evaluateHostedEligibility({ ...base, toWallet: "" }).reason, "no_refund_wallet");
    assert.equal(evaluateHostedEligibility({ ...base, chain: null }).reason, "unsupported_chain");
    assert.equal(evaluateHostedEligibility({ ...base, amountUsd: 0 }).reason, "amount_unknown");
    assert.equal(
      evaluateHostedEligibility({ ...base, settleSuccess: false }).reason,
      "settle_not_success",
    );
  });

  it("per-wallet and pool daily caps", async () => {
    const fake = {
      aggregate: async (pipeline) => {
        const match = pipeline[0].$match;
        if (match.toWallet) return [{ total: 4.95 }];
        return [{ total: 49.6 }];
      },
    };
    const wallet = await assertHostedPayoutAllowed(
      { toWallet: "W", amountUsd: 0.1 },
      { RefundLedger: fake },
    );
    assert.equal(wallet.ok, false);
    assert.equal(wallet.reason, "wallet_daily_cap");

    const fakeGlobal = {
      aggregate: async (pipeline) => {
        const match = pipeline[0].$match;
        if (match.toWallet) return [{ total: 0 }];
        return [{ total: 49.95 }];
      },
    };
    const global = await assertHostedPayoutAllowed(
      { toWallet: "W", amountUsd: 0.1 },
      { RefundLedger: fakeGlobal },
    );
    assert.equal(global.ok, false);
    assert.equal(global.reason, "pool_daily_cap");
  });

  it("pool min balance blocks draining the remaining daily pool", async () => {
    process.env.REFUND_HOSTED_DAILY_USD = "50";
    process.env.REFUND_POOL_MIN_BALANCE_USD = "10";
    const fake = {
      aggregate: async (pipeline) => {
        const match = pipeline[0].$match;
        if (match.toWallet) return [{ total: 0 }];
        return [{ total: 40.5 }];
      },
    };
    const out = await assertHostedPayoutAllowed(
      { toWallet: "W", amountUsd: 0.6 },
      { RefundLedger: fake },
    );
    assert.equal(out.ok, false);
    assert.equal(out.reason, "pool_min_balance");
  });

  it("idempotency prefers premium tx then payment tx", () => {
    assert.equal(hostedIdempotencyKey({ premiumTx: "abc" }), "hosted:abc");
    assert.equal(hostedIdempotencyKey({ paymentTx: "xyz" }), "hosted:pay:xyz");
    assert.equal(
      hostedIdempotencyKey({ premiumTx: "abc", paymentTx: "xyz" }),
      "hosted:abc",
    );
  });
});
