/**
 * Run: node --test api/libs/labs/labsPayToOverride.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLabsPayToOverride } from './labsPayToOverride.js';

const SOL = 'So11111111111111111111111111111111111111112';
const BASE = '0xBasePayTo000000000000000000000000000001';
const CELO = '0xCeloPayTo000000000000000000000000000001';
const ALGO = 'ALGORANDPAYTOADDRESS00000000000000000000000000000000000';

describe('resolveLabsPayToOverride', () => {
  test('base tab with Base PayTo isolates EVM and never passes Solana PayTo', () => {
    const out = resolveLabsPayToOverride('base', {
      solanaPayTo: SOL,
      basePayTo: BASE,
      evmPayTo: BASE,
      celoPayTo: CELO,
      algorandPayTo: ALGO,
    });
    assert.deepEqual(out, {
      solanaPayTo: null,
      evmPayTo: BASE,
      algorandPayTo: null,
    });
  });

  test('base tab without Base PayTo returns null so env BASE_PAYTO can apply (no solanaOnlyOverride)', () => {
    const out = resolveLabsPayToOverride('base', {
      solanaPayTo: SOL,
      basePayTo: null,
      evmPayTo: null,
      celoPayTo: null,
      algorandPayTo: null,
    });
    assert.equal(out, null);
  });

  test('base tab uses evmPayTo alias when basePayTo omitted', () => {
    const out = resolveLabsPayToOverride('base', {
      solanaPayTo: SOL,
      evmPayTo: BASE,
    });
    assert.equal(out?.evmPayTo, BASE);
    assert.equal(out?.solanaPayTo, null);
  });

  test('solana tab isolates Solana PayTo (enables intentional solana-only accepts)', () => {
    const out = resolveLabsPayToOverride('solana', {
      solanaPayTo: SOL,
      basePayTo: BASE,
      evmPayTo: BASE,
    });
    assert.deepEqual(out, {
      solanaPayTo: SOL,
      evmPayTo: null,
      algorandPayTo: null,
    });
  });

  test('celo tab isolates Celo PayTo onto evmPayTo', () => {
    const out = resolveLabsPayToOverride('celo', {
      solanaPayTo: SOL,
      basePayTo: BASE,
      celoPayTo: CELO,
    });
    assert.deepEqual(out, {
      solanaPayTo: null,
      evmPayTo: CELO,
      algorandPayTo: null,
    });
  });

  test('algorand tab isolates AVM PayTo', () => {
    const out = resolveLabsPayToOverride('algorand', {
      solanaPayTo: SOL,
      basePayTo: BASE,
      algorandPayTo: ALGO,
    });
    assert.deepEqual(out, {
      solanaPayTo: null,
      evmPayTo: null,
      algorandPayTo: ALGO,
    });
  });

  test('no chain header offers all configured PayTos for discovery', () => {
    const out = resolveLabsPayToOverride('', {
      solanaPayTo: SOL,
      basePayTo: BASE,
      algorandPayTo: ALGO,
    });
    assert.deepEqual(out, {
      solanaPayTo: SOL,
      evmPayTo: BASE,
      algorandPayTo: ALGO,
    });
  });

  test('regression: Solana-only wallets must not produce base override with solanaPayTo set', () => {
    // Old bug: returned { solanaPayTo, evmPayTo: null } for Base tab → solanaOnlyOverride
    // stripped all eip155:8453 accepts and Base ExactEvmScheme could not pay.
    const out = resolveLabsPayToOverride('base', {
      solanaPayTo: SOL,
      evmPayTo: null,
      basePayTo: null,
    });
    assert.equal(out, null);
    assert.notEqual(out?.solanaPayTo, SOL);
  });
});
