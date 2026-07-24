import assert from 'node:assert/strict';
import { describe, it, beforeEach, mock } from 'node:test';
import {
  GOPLAUSIBLE_SOLANA_FEE_PAYER_DEFAULT,
  GOPLAUSIBLE_BASE_CAIP2,
  getGoplausibleSolanaFeePayerAddress,
  getGoplausibleSolanaFeePayerMinSol,
  getGoplausibleSupportedHealth,
  isGoplausibleHealthyForLabChain,
  resetGoplausibleFacilitatorHealthCache,
} from './goplausibleFacilitatorHealth.js';

describe('goplausibleFacilitatorHealth', () => {
  beforeEach(() => {
    resetGoplausibleFacilitatorHealthCache();
    delete process.env.GOPLAUSIBLE_SOLANA_FEE_PAYER;
    delete process.env.GOPLAUSIBLE_FEE_PAYER_MIN_SOL;
    delete process.env.GOPLAUSIBLE_FACILITATOR_URL;
  });

  it('defaults to the known GoPlausible mainnet fee payer', () => {
    assert.equal(getGoplausibleSolanaFeePayerAddress(), GOPLAUSIBLE_SOLANA_FEE_PAYER_DEFAULT);
  });

  it('allows overriding fee payer and min SOL via env', () => {
    process.env.GOPLAUSIBLE_SOLANA_FEE_PAYER = '11111111111111111111111111111111';
    process.env.GOPLAUSIBLE_FEE_PAYER_MIN_SOL = '0.02';
    assert.equal(getGoplausibleSolanaFeePayerAddress(), '11111111111111111111111111111111');
    assert.equal(getGoplausibleSolanaFeePayerMinSol(), 0.02);
  });

  it('ignores empty GOPLAUSIBLE_FEE_PAYER_MIN_SOL and keeps the default floor', () => {
    process.env.GOPLAUSIBLE_FEE_PAYER_MIN_SOL = '';
    assert.equal(getGoplausibleSolanaFeePayerMinSol(), 0.05);
  });
});

describe('goplausible Base /supported health', () => {
  beforeEach(() => {
    resetGoplausibleFacilitatorHealthCache();
    delete process.env.GOPLAUSIBLE_FACILITATOR_URL;
  });

  it('marks Base healthy when /supported includes eip155:8453 exact', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        kinds: [
          { scheme: 'exact', network: GOPLAUSIBLE_BASE_CAIP2 },
          { scheme: 'exact', network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' },
        ],
      }),
    }));
    try {
      const status = await getGoplausibleSupportedHealth(true);
      assert.equal(status.healthy, true);
      assert.equal(status.hasBaseExact, true);
      assert.equal(await isGoplausibleHealthyForLabChain('base', true), true);
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
      resetGoplausibleFacilitatorHealthCache();
      const status = await getGoplausibleSupportedHealth(true);
      assert.equal(status.healthy, false);
      assert.equal(status.reason, 'missing_base_exact');
      assert.equal(await isGoplausibleHealthyForLabChain('base', true), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
