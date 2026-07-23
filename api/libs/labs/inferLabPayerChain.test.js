/**
 * Run: node --test api/libs/labs/inferLabPayerChain.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { inferLabPayerChain, looksLikeAlgorandAddress } from './inferLabPayerChain.js';

const ALGO = 'PQA4KZZL6SF2HDFRLJM2GBT527R5YX3EGYA5HS5VN5RPSWZSTD3W6CTLBA';
const SOL = 'So11111111111111111111111111111111111111112';
const EVM = '0xBasePayTo000000000000000000000000000001';

describe('looksLikeAlgorandAddress', () => {
  test('accepts 58-char base32 Algorand addresses', () => {
    assert.equal(looksLikeAlgorandAddress(ALGO), true);
  });

  test('rejects Solana and EVM addresses', () => {
    assert.equal(looksLikeAlgorandAddress(SOL), false);
    assert.equal(looksLikeAlgorandAddress(EVM), false);
    assert.equal(looksLikeAlgorandAddress(''), false);
  });
});

describe('inferLabPayerChain', () => {
  test('prefers x-lab-x402-chain header', () => {
    assert.equal(inferLabPayerChain(SOL, 'algorand'), 'algorand');
    assert.equal(inferLabPayerChain(ALGO, 'solana'), 'solana');
    assert.equal(inferLabPayerChain(EVM, 'base'), 'base');
  });

  test('infers algorand from address shape when header missing', () => {
    assert.equal(inferLabPayerChain(ALGO, ''), 'algorand');
    assert.equal(inferLabPayerChain(ALGO, null), 'algorand');
  });

  test('infers base from 0x address when header missing', () => {
    assert.equal(inferLabPayerChain(EVM, ''), 'base');
  });

  test('defaults non-0x non-algorand to solana', () => {
    assert.equal(inferLabPayerChain(SOL, ''), 'solana');
  });
});
