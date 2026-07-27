import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  resolveLabsFacilitatorProfile,
  resolveDefaultFacilitatorProfile,
  isDefaultFacilitatorFailoverEnabled,
  resolveFacilitatorHealthChain,
  resetLabsFacilitatorFailoverLogFlags,
} from './labsFacilitatorFailover.js';

function fakeReq(chain, extraHeaders = {}) {
  return {
    get(name) {
      const key = String(name).toLowerCase();
      if (key === 'x-lab-x402-chain') return chain;
      if (Object.prototype.hasOwnProperty.call(extraHeaders, key)) return extraHeaders[key];
      return undefined;
    },
  };
}

describe('resolveLabsFacilitatorProfile', () => {
  beforeEach(() => {
    resetLabsFacilitatorFailoverLogFlags();
  });

  it('returns dexter for algorand regardless of health', async () => {
    const profile = await resolveLabsFacilitatorProfile(fakeReq('algorand'), {
      isDexterHealthyForLabChain: async () => false,
      isGoplausibleHealthyForLabChain: async () => false,
    });
    assert.equal(profile, 'dexter');
  });

  it('returns dexter when Dexter is healthy for solana', async () => {
    const profile = await resolveLabsFacilitatorProfile(fakeReq('solana'), {
      isDexterHealthyForLabChain: async () => true,
      isGoplausibleHealthyForLabChain: async () => false,
    });
    assert.equal(profile, 'dexter');
  });

  it('returns goplausible when Dexter is down and GoPlausible is healthy', async () => {
    const profile = await resolveLabsFacilitatorProfile(fakeReq('solana'), {
      isDexterHealthyForLabChain: async () => false,
      isGoplausibleHealthyForLabChain: async () => true,
    });
    assert.equal(profile, 'goplausible');
  });

  it('returns payai when both Dexter and GoPlausible are unhealthy', async () => {
    const profile = await resolveLabsFacilitatorProfile(fakeReq('base'), {
      isDexterHealthyForLabChain: async () => false,
      isGoplausibleHealthyForLabChain: async () => false,
    });
    assert.equal(profile, 'payai');
  });

  it('defaults health chain to solana when header is missing', async () => {
    let seenChain = null;
    const profile = await resolveLabsFacilitatorProfile(fakeReq(''), {
      isDexterHealthyForLabChain: async (chain) => {
        seenChain = chain;
        return true;
      },
      isGoplausibleHealthyForLabChain: async () => false,
    });
    assert.equal(seenChain, 'solana');
    assert.equal(profile, 'dexter');
  });

  it('probes base health when x-lab-x402-chain=base', async () => {
    let seenChain = null;
    const profile = await resolveLabsFacilitatorProfile(fakeReq('base'), {
      isDexterHealthyForLabChain: async (chain) => {
        seenChain = chain;
        return false;
      },
      isGoplausibleHealthyForLabChain: async (chain) => {
        assert.equal(chain, 'base');
        return true;
      },
    });
    assert.equal(seenChain, 'base');
    assert.equal(profile, 'goplausible');
  });
});

describe('resolveDefaultFacilitatorProfile', () => {
  beforeEach(() => {
    resetLabsFacilitatorFailoverLogFlags();
  });

  it('returns dexter when Dexter is healthy', async () => {
    const profile = await resolveDefaultFacilitatorProfile(fakeReq(''), {
      isDexterHealthyForLabChain: async () => true,
      isGoplausibleHealthyForLabChain: async () => false,
    });
    assert.equal(profile, 'dexter');
  });

  it('returns goplausible when Dexter is down and GoPlausible is healthy', async () => {
    const profile = await resolveDefaultFacilitatorProfile(fakeReq(''), {
      isDexterHealthyForLabChain: async () => false,
      isGoplausibleHealthyForLabChain: async () => true,
    });
    assert.equal(profile, 'goplausible');
  });

  it('returns payai when both are unhealthy', async () => {
    const profile = await resolveDefaultFacilitatorProfile(fakeReq(''), {
      isDexterHealthyForLabChain: async () => false,
      isGoplausibleHealthyForLabChain: async () => false,
    });
    assert.equal(profile, 'payai');
  });

  it('respects x-x402-health-chain=base hint', async () => {
    let seen = null;
    await resolveDefaultFacilitatorProfile(
      fakeReq('', { 'x-x402-health-chain': 'base' }),
      {
        isDexterHealthyForLabChain: async (chain) => {
          seen = chain;
          return true;
        },
      },
    );
    assert.equal(seen, 'base');
  });
});

describe('isDefaultFacilitatorFailoverEnabled', () => {
  it('defaults to enabled', () => {
    const prev = process.env.X402_DEFAULT_FACILITATOR_FAILOVER;
    delete process.env.X402_DEFAULT_FACILITATOR_FAILOVER;
    try {
      assert.equal(isDefaultFacilitatorFailoverEnabled(), true);
    } finally {
      if (prev === undefined) delete process.env.X402_DEFAULT_FACILITATOR_FAILOVER;
      else process.env.X402_DEFAULT_FACILITATOR_FAILOVER = prev;
    }
  });

  it('can be disabled via env', () => {
    const prev = process.env.X402_DEFAULT_FACILITATOR_FAILOVER;
    process.env.X402_DEFAULT_FACILITATOR_FAILOVER = 'false';
    try {
      assert.equal(isDefaultFacilitatorFailoverEnabled(), false);
    } finally {
      if (prev === undefined) delete process.env.X402_DEFAULT_FACILITATOR_FAILOVER;
      else process.env.X402_DEFAULT_FACILITATOR_FAILOVER = prev;
    }
  });
});

describe('resolveFacilitatorHealthChain', () => {
  it('defaults to solana', () => {
    assert.equal(resolveFacilitatorHealthChain(fakeReq('')), 'solana');
  });

  it('returns base from lab header', () => {
    assert.equal(resolveFacilitatorHealthChain(fakeReq('base')), 'base');
  });
});
