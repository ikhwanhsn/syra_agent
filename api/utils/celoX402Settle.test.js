/**
 * Run: node --test api/utils/celoX402Settle.test.js
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import { privateKeyToAccount } from 'viem/accounts';
import { hexToSignature } from 'viem';
import {
  canUseCeloSelfSettleForRequest,
  isCeloSelfSettleFallbackEnabled,
  settleCeloX402Payment,
} from './celoX402Settle.js';
import { CELO_MAINNET_CAIP2, CELO_USDC_MAINNET } from '../config/celoX402Networks.js';

const VALID_SETTLER_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/** Deterministic payer key for EIP-712 local verify (middleware already verified in prod). */
const PAYER_PRIVATE_KEY =
  '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const payerAccount = privateKeyToAccount(PAYER_PRIVATE_KEY);
const PAY_TO = '0x2222222222222222222222222222222222222222';

async function samplePayload() {
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const validAfter = 0n;
  const value = 1000000n;
  const nonce = `0x${'ab'.repeat(32)}`;
  const domain = {
    name: 'USDC',
    version: '2',
    chainId: 42220,
    verifyingContract: CELO_USDC_MAINNET,
  };
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };
  const message = {
    from: payerAccount.address,
    to: PAY_TO,
    value,
    validAfter,
    validBefore,
    nonce,
  };
  const signatureHex = await payerAccount.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  });
  const parsed = hexToSignature(signatureHex);
  return {
    x402Version: 2,
    payload: {
      authorization: {
        from: payerAccount.address,
        to: PAY_TO,
        value: String(value),
        validAfter: String(validAfter),
        validBefore: String(validBefore),
        nonce,
      },
      signature: {
        v: Number(parsed.v),
        r: parsed.r,
        s: parsed.s,
      },
    },
  };
}

function sampleAccepted() {
  return {
    network: CELO_MAINNET_CAIP2,
    asset: CELO_USDC_MAINNET,
    extra: { name: 'USDC', version: '2' },
  };
}

describe('Celo self-settle gates', () => {
  beforeEach(() => {
    delete process.env.CELO_SELF_SETTLE_FALLBACK;
    delete process.env.CELO_ALLOW_SELF_SETTLE;
    delete process.env.CELO_SETTLER_PRIVATE_KEY;
  });

  it('defaults CELO_SELF_SETTLE_FALLBACK to off when unset', () => {
    assert.equal(isCeloSelfSettleFallbackEnabled(), false);
  });

  it('enables fallback only when CELO_SELF_SETTLE_FALLBACK is truthy', () => {
    process.env.CELO_SELF_SETTLE_FALLBACK = 'true';
    assert.equal(isCeloSelfSettleFallbackEnabled(), true);
    process.env.CELO_SELF_SETTLE_FALLBACK = 'false';
    assert.equal(isCeloSelfSettleFallbackEnabled(), false);
  });

  it('forceFacilitatorOnly blocks self-settle even with fallback + settler key', () => {
    process.env.CELO_SELF_SETTLE_FALLBACK = 'true';
    process.env.CELO_SETTLER_PRIVATE_KEY = VALID_SETTLER_KEY;
    assert.equal(canUseCeloSelfSettleForRequest({ forceFacilitatorOnly: true }), false);
  });

  it('allows self-settle when fallback + settler key and not forceFacilitatorOnly', () => {
    process.env.CELO_SELF_SETTLE_FALLBACK = 'true';
    process.env.CELO_SETTLER_PRIVATE_KEY = VALID_SETTLER_KEY;
    assert.equal(canUseCeloSelfSettleForRequest({}), true);
    assert.equal(canUseCeloSelfSettleForRequest({ forceFacilitatorOnly: false }), true);
  });
});

describe('settleCeloX402Payment facilitator-only', () => {
  /** @type {typeof globalThis.fetch} */
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    delete process.env.CELO_SELF_SETTLE_FALLBACK;
    delete process.env.CELO_ALLOW_SELF_SETTLE;
    delete process.env.CELO_SETTLE_VIA_FACILITATOR;
    process.env.CELO_FACILITATOR_API_KEY = 'x402_test_key';
    process.env.CELO_SETTLER_PRIVATE_KEY = VALID_SETTLER_KEY;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.CELO_FACILITATOR_API_KEY;
    delete process.env.CELO_SETTLER_PRIVATE_KEY;
    delete process.env.CELO_SELF_SETTLE_FALLBACK;
  });

  it('returns settledVia facilitator when /settle succeeds', async () => {
    globalThis.fetch = mock.fn(async (url) => {
      const path = String(url);
      // Settle path skips remote /verify (already verified in middleware); only /settle is called.
      if (path.includes('/settle')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            transaction: '0xfacilitatortxhash',
            network: CELO_MAINNET_CAIP2,
            payer: payerAccount.address,
          }),
        };
      }
      throw new Error(`unexpected fetch ${path}`);
    });

    const result = await settleCeloX402Payment(await samplePayload(), sampleAccepted(), {
      forceFacilitatorOnly: true,
    });
    assert.equal(result.success, true);
    assert.equal(result.settledVia, 'facilitator');
    assert.equal(result.transaction, '0xfacilitatortxhash');
  });

  it('does not self-settle when facilitator fails and forceFacilitatorOnly is set', async () => {
    globalThis.fetch = mock.fn(async (url) => {
      const path = String(url);
      if (path.includes('/settle')) {
        return {
          ok: false,
          status: 502,
          json: async () => ({ error: 'relayer out of gas' }),
        };
      }
      throw new Error(`unexpected fetch ${path}`);
    });

    // Even with fallback env on, Labs forceFacilitatorOnly must win.
    process.env.CELO_SELF_SETTLE_FALLBACK = 'true';

    const result = await settleCeloX402Payment(await samplePayload(), sampleAccepted(), {
      forceFacilitatorOnly: true,
    });
    assert.equal(result.success, false);
    assert.notEqual(result.settledVia, 'self');
    assert.match(String(result.errorReason || result.error), /facilitator-only|Labs Celo/i);
  });

  it('reports self-settle unavailable when facilitator fails and fallback stays at default off', async () => {
    globalThis.fetch = mock.fn(async (url) => {
      const path = String(url);
      if (path.includes('/settle')) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'settle failed' }),
        };
      }
      throw new Error(`unexpected fetch ${path}`);
    });

    const result = await settleCeloX402Payment(await samplePayload(), sampleAccepted(), {});
    assert.equal(result.success, false);
    assert.notEqual(result.settledVia, 'self');
    assert.match(String(result.error || ''), /self-settle fallback disabled/i);
  });
});
