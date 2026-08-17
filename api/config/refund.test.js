/**
 * Run: node --test api/config/refund.test.js
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isRefundEnabled,
  isInboundRefundEnabled,
  isOutboundRefundEnabled,
  isHostedRefundEnabled,
  getMaxRefundUsd,
  getRefundProviderAllowlist,
  getHostedRefundAllowlist,
  isHostnameRefundEligible,
  isHostedHostnameEligible,
  getPerWalletDailyRefundCapUsd,
  getHostedDailyCapUsd,
  getPoolMinBalanceUsd,
  clampRefundAmountUsd,
  networkToRefundChain,
  microUsdcToUsd,
  getRefundResolvedConfig,
} from "./refund.js";

describe("refund.js config", () => {
  const keys = [
    "REFUND_ENABLED",
    "REFUND_COVER_INBOUND",
    "REFUND_COVER_OUTBOUND",
    "REFUND_HOSTED_ENABLED",
    "REFUND_MAX_USD",
    "REFUND_PROVIDER_ALLOWLIST",
    "REFUND_HOSTED_ALLOWLIST",
    "REFUND_HOSTED_PER_WALLET_DAILY_USD",
    "REFUND_HOSTED_DAILY_USD",
    "REFUND_POOL_MIN_BALANCE_USD",
  ];
  const prev = {};
  for (const k of keys) prev[k] = process.env[k];

  afterEach(() => {
    for (const k of keys) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it("defaults to enabled with both directions and $1 cap", () => {
    for (const k of keys) delete process.env[k];
    assert.equal(isRefundEnabled(), true);
    assert.equal(isInboundRefundEnabled(), true);
    assert.equal(isOutboundRefundEnabled(), true);
    assert.equal(getMaxRefundUsd(), 1);
    assert.deepEqual(getRefundProviderAllowlist(), []);
    const cfg = getRefundResolvedConfig();
    assert.equal(cfg.enabled, true);
    assert.equal(cfg.hosted, false);
    assert.equal(cfg.source, "syra-refund");
    assert.equal(isHostedRefundEnabled(), false);
    assert.deepEqual(getHostedRefundAllowlist(), []);
    assert.equal(getPerWalletDailyRefundCapUsd(), 5);
    assert.equal(getHostedDailyCapUsd(), 50);
    assert.equal(getPoolMinBalanceUsd(), 10);
  });

  it("REFUND_ENABLED=false kills both directions", () => {
    process.env.REFUND_ENABLED = "false";
    assert.equal(isRefundEnabled(), false);
    assert.equal(isInboundRefundEnabled(), false);
    assert.equal(isOutboundRefundEnabled(), false);
    assert.equal(isHostedRefundEnabled(), false);
  });

  it("direction toggles work independently when master is on", () => {
    process.env.REFUND_ENABLED = "true";
    process.env.REFUND_COVER_INBOUND = "false";
    process.env.REFUND_COVER_OUTBOUND = "true";
    assert.equal(isInboundRefundEnabled(), false);
    assert.equal(isOutboundRefundEnabled(), true);
  });

  it("clamps amount to maxRefundUsd", () => {
    process.env.REFUND_MAX_USD = "0.05";
    assert.equal(getMaxRefundUsd(), 0.05);
    assert.equal(clampRefundAmountUsd(0.2), 0.05);
    assert.equal(clampRefundAmountUsd(0.01), 0.01);
    assert.equal(clampRefundAmountUsd(0), 0);
    assert.equal(clampRefundAmountUsd(-1), 0);
  });

  it("maps CAIP-2 networks to refund chains", () => {
    assert.equal(networkToRefundChain("solana:mainnet"), "solana");
    assert.equal(networkToRefundChain("solana"), "solana");
    assert.equal(networkToRefundChain("eip155:8453"), "base");
    assert.equal(networkToRefundChain("base"), "base");
    assert.equal(networkToRefundChain("eip155:196"), "xlayer");
    assert.equal(networkToRefundChain("algorand:mainnet"), "algorand");
    assert.equal(networkToRefundChain("eip155:56"), null);
    assert.equal(networkToRefundChain(""), null);
  });

  it("allowlist matches host and suffix", () => {
    process.env.REFUND_PROVIDER_ALLOWLIST = "nansen.ai, birdeye.so";
    assert.equal(isHostnameRefundEligible("api.nansen.ai"), true);
    assert.equal(isHostnameRefundEligible("public-api.birdeye.so"), true);
    assert.equal(isHostnameRefundEligible("api.zerion.io"), false);
  });

  it("empty allowlist allows all hosts", () => {
    delete process.env.REFUND_PROVIDER_ALLOWLIST;
    assert.equal(isHostnameRefundEligible("api.nansen.ai"), true);
  });

  it("hosted defaults off and empty hosted allowlist denies", () => {
    delete process.env.REFUND_HOSTED_ENABLED;
    delete process.env.REFUND_HOSTED_ALLOWLIST;
    assert.equal(isHostedRefundEnabled(), false);
    assert.equal(isHostedHostnameEligible("api.nansen.ai"), false);
  });

  it("hosted allowlist matches host and suffix when enabled", () => {
    process.env.REFUND_HOSTED_ENABLED = "true";
    process.env.REFUND_HOSTED_ALLOWLIST = "nansen.ai, birdeye.so";
    assert.equal(isHostedRefundEnabled(), true);
    assert.equal(isHostedHostnameEligible("api.nansen.ai"), true);
    assert.equal(isHostedHostnameEligible("public-api.birdeye.so"), true);
    assert.equal(isHostedHostnameEligible("api.zerion.io"), false);
    const cfg = getRefundResolvedConfig();
    assert.equal(cfg.hosted, true);
    assert.deepEqual(cfg.hostedAllowlist, ["nansen.ai", "birdeye.so"]);
  });

  it("converts micro USDC to USD", () => {
    assert.equal(microUsdcToUsd(1000), 0.001);
    assert.equal(microUsdcToUsd("50000"), 0.05);
    assert.equal(microUsdcToUsd(null), null);
  });
});
