import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  resolveLabsFacilitatorProfile,
  resetLabsFacilitatorFailoverLogFlags,
} from './labsFacilitatorFailover.js';

function fakeReq(chain) {
  return {
    get(name) {
      if (String(name).toLowerCase() === 'x-lab-x402-chain') return chain;
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
