/**
 * Run: node --test api/libs/labs/labFunderSelector.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pickRichestFunder, normalizeLabAddress } from './labFunderSelector.js';

describe('normalizeLabAddress', () => {
  test('lowercases EVM addresses', () => {
    assert.equal(
      normalizeLabAddress('0xABCDEF0123456789abcdef0123456789ABCDEF01', 'base'),
      '0xabcdef0123456789abcdef0123456789abcdef01',
    );
  });

  test('preserves Solana caseness', () => {
    assert.equal(normalizeLabAddress('AbCd123'), 'AbCd123');
  });
});

describe('pickRichestFunder', () => {
  const wallets = [
    { address: 'payto1', usdc: 0.01, native: 0.1, role: 'payto' },
    { address: 'payerA', usdc: 5.0, native: 0.05, role: 'payer' },
    { address: 'payerB', usdc: 2.0, native: 0.05, role: 'payer' },
  ];

  test('picks highest USDC wallet', () => {
    const r = pickRichestFunder(wallets, { minUsdc: 0.01, minNative: 0.001, reserveUsdc: 0.01 });
    assert.equal(r.address, 'payerA');
    assert.equal(r.usdc, 5.0);
    assert.ok(r.lendableUsdc >= 4.99);
  });

  test('excludes recipient address', () => {
    const r = pickRichestFunder(wallets, {
      excludeAddress: 'payerA',
      minUsdc: 0.01,
      minNative: 0.001,
      reserveUsdc: 0.01,
    });
    assert.equal(r.address, 'payerB');
  });

  test('excludes wallets below min native gas', () => {
    const r = pickRichestFunder(
      [
        { address: 'richButNoGas', usdc: 100, native: 0, role: 'payer' },
        { address: 'ok', usdc: 1, native: 0.05, role: 'payer' },
      ],
      { minUsdc: 0.01, minNative: 0.01, reserveUsdc: 0 },
    );
    assert.equal(r.address, 'ok');
  });

  test('payto has zero reserve when zeroReserveForPayTo', () => {
    const r = pickRichestFunder(
      [
        { address: 'payto1', usdc: 0.015, native: 0.1, role: 'payto' },
        { address: 'payerLow', usdc: 0.02, native: 0.1, role: 'payer' },
      ],
      {
        minUsdc: 0.01,
        minNative: 0.001,
        reserveUsdc: 0.01,
        zeroReserveForPayTo: true,
      },
    );
    // payto lendable = 0.015 (no reserve), payer lendable = 0.01
    // highest usdc is payerLow at 0.02
    assert.equal(r.address, 'payerLow');
    assert.equal(r.lendableUsdc, 0.01);
  });

  test('returns payto when it has more USDC', () => {
    const r = pickRichestFunder(
      [
        { address: 'payto1', usdc: 10, native: 0.1, role: 'payto' },
        { address: 'payerA', usdc: 1, native: 0.05, role: 'payer' },
      ],
      { minUsdc: 0.01, minNative: 0.001, reserveUsdc: 0.01 },
    );
    assert.equal(r.address, 'payto1');
    assert.equal(r.lendableUsdc, 10); // payto reserve 0
  });

  test('returns null when no wallet can fund minUsdc after reserve', () => {
    const r = pickRichestFunder(
      [{ address: 'payerA', usdc: 0.015, native: 0.1, role: 'payer' }],
      { minUsdc: 0.01, minNative: 0.001, reserveUsdc: 0.01 },
    );
    // lendable = 0.005 < 0.01
    assert.equal(r, null);
  });

  test('tie on USDC prefers payto role', () => {
    const r = pickRichestFunder(
      [
        { address: 'payerA', usdc: 1, native: 0.1, role: 'payer' },
        { address: 'payto1', usdc: 1, native: 0.05, role: 'payto' },
      ],
      { minUsdc: 0.01, minNative: 0.001, reserveUsdc: 0 },
    );
    assert.equal(r.address, 'payto1');
  });

  test('requireOptedIn filters Algorand non-opted wallets', () => {
    const r = pickRichestFunder(
      [
        { address: 'notOpted', usdc: 10, native: 1, role: 'payer', optedInUsdc: false },
        { address: 'opted', usdc: 1, native: 1, role: 'payer', optedInUsdc: true },
      ],
      {
        minUsdc: 0.01,
        minNative: 0.001,
        reserveUsdc: 0,
        requireOptedIn: true,
        chain: 'algorand',
      },
    );
    assert.equal(r.address, 'opted');
  });
});
