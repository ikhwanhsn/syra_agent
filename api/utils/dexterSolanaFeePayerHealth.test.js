import assert from 'node:assert/strict';
import { describe, it, beforeEach, mock } from 'node:test';
import {
  DEXTER_SOLANA_FEE_PAYER_DEFAULT,
  DEXTER_BASE_CAIP2,
  getDexterSolanaFeePayerAddress,
  getDexterSolanaFeePayerMinSol,
  getDexterSupportedHealth,
  getDexterNetworkFloorUsd,
  isDexterHealthyForLabChain,
  resetDexterSolanaFeePayerHealthCache,
} from './dexterSolanaFeePayerHealth.js';
import { X402_DEXTER_MIN_PAYMENT_USD } from '../config/x402Pricing.js';

describe('dexterSolanaFeePayerHealth', () => {
  beforeEach(() => {
    resetDexterSolanaFeePayerHealthCache();
    delete process.env.DEXTER_SOLANA_FEE_PAYER;
    delete process.env.DEXTER_FEE_PAYER_MIN_SOL;
    delete process.env.DEXTER_FACILITATOR_URL;
  });

  it('defaults to the known Dexter mainnet fee payer', () => {
    assert.equal(getDexterSolanaFeePayerAddress(), DEXTER_SOLANA_FEE_PAYER_DEFAULT);
  });

  it('allows overriding fee payer and min SOL via env', () => {
    process.env.DEXTER_SOLANA_FEE_PAYER = '11111111111111111111111111111111';
    process.env.DEXTER_FEE_PAYER_MIN_SOL = '0.02';
    assert.equal(getDexterSolanaFeePayerAddress(), '11111111111111111111111111111111');
    assert.equal(getDexterSolanaFeePayerMinSol(), 0.02);
  });

  it('ignores empty DEXTER_FEE_PAYER_MIN_SOL and keeps the default floor', () => {
    process.env.DEXTER_FEE_PAYER_MIN_SOL = '';
    assert.equal(getDexterSolanaFeePayerMinSol(), 0.05);
  });
});

describe('dexter Base /supported health', () => {
  beforeEach(() => {
    resetDexterSolanaFeePayerHealthCache();
    delete process.env.DEXTER_FACILITATOR_URL;
  });

  it('marks Base healthy when /supported includes eip155:8453 exact', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        kinds: [
          { scheme: 'exact', network: DEXTER_BASE_CAIP2 },
          { scheme: 'exact', network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' },
        ],
      }),
    }));
    try {
      const status = await getDexterSupportedHealth(true);
      assert.equal(status.healthy, true);
      assert.equal(status.hasBaseExact, true);
      assert.equal(await isDexterHealthyForLabChain('base', true), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('marks Base unhealthy when /supported omits Base exact', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        kinds: [{ scheme: 'exact', network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' }],
      }),
    }));
    try {
      resetDexterSolanaFeePayerHealthCache();
      const status = await getDexterSupportedHealth(true);
      assert.equal(status.healthy, false);
      assert.equal(status.reason, 'missing_base_exact');
      assert.equal(await isDexterHealthyForLabChain('base', true), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('caches per-network minPaymentAmountUsd floors from /supported', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        kinds: [
          {
            scheme: 'exact',
            network: DEXTER_BASE_CAIP2,
            extra: { minPaymentAmountUsd: 0.00111 },
          },
          {
            scheme: 'exact',
            network: 'eip155:42161',
            extra: { minPaymentAmountUsd: 0.00447 },
          },
          {
            scheme: 'exact',
            network: 'eip155:4663',
            extra: { minPaymentAmountUsd: 0.00878 },
          },
        ],
      }),
    }));
    try {
      resetDexterSolanaFeePayerHealthCache();
      const status = await getDexterSupportedHealth(true);
      assert.equal(status.floorsByCaip2?.[DEXTER_BASE_CAIP2], 0.00111);
      assert.equal(getDexterNetworkFloorUsd('eip155:42161'), 0.00447);
      assert.equal(getDexterNetworkFloorUsd('eip155:4663'), 0.00878);
      // Unknown network still falls back to static floor
      assert.equal(getDexterNetworkFloorUsd('eip155:99999'), X402_DEXTER_MIN_PAYMENT_USD);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
