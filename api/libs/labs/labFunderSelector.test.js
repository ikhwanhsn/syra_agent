/**
 * Run: node --test api/libs/labs/labFunderSelector.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickRichestFunder,
  pickAlgorandFunderPreferGasReady,
  pickEvmFunderPreferGasReady,
  lendableEvmNative,
  normalizeLabAddress,
  ALGORAND_FUNDER_MIN_FEE_ALGO,
  EVM_FUNDER_MIN_NATIVE,
} from './labFunderSelector.js';

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

describe('pickAlgorandFunderPreferGasReady', () => {
  test('prefers gas-ready $0.76 over ALGO-poor $1.64 PayTo (screenshot shape)', () => {
    const r = pickAlgorandFunderPreferGasReady(
      [
        {
          address: 'PAYTO_RICH_USDC',
          usdc: 1.64,
          native: 0,
          role: 'payto',
          optedInUsdc: true,
        },
        {
          address: 'PAYER_GAS_READY',
          usdc: 0.76,
          native: 0.036,
          role: 'payer',
          optedInUsdc: true,
        },
      ],
      { minUsdc: 0.01, minNative: 0, reserveUsdc: 0.01 },
    );
    assert.equal(r.address, 'PAYER_GAS_READY');
    assert.ok(r.native >= ALGORAND_FUNDER_MIN_FEE_ALGO);
  });

  test('falls back to USDC-rich ALGO-poor when no gas-ready funder exists', () => {
    const r = pickAlgorandFunderPreferGasReady(
      [
        {
          address: 'PAYTO_RICH_USDC',
          usdc: 1.64,
          native: 0,
          role: 'payto',
          optedInUsdc: true,
        },
        {
          address: 'PAYER_NO_USDC',
          usdc: 0,
          native: 0.036,
          role: 'payer',
          optedInUsdc: true,
        },
      ],
      { minUsdc: 0.01, minNative: 0, reserveUsdc: 0 },
    );
    assert.equal(r.address, 'PAYTO_RICH_USDC');
  });

  test('still picks PayTo when it is both richest and gas-ready', () => {
    const r = pickAlgorandFunderPreferGasReady(
      [
        {
          address: 'PAYTO_OK',
          usdc: 1.64,
          native: 0.05,
          role: 'payto',
          optedInUsdc: true,
        },
        {
          address: 'PAYER_OK',
          usdc: 0.76,
          native: 0.036,
          role: 'payer',
          optedInUsdc: true,
        },
      ],
      { minUsdc: 0.01, minNative: 0, reserveUsdc: 0 },
    );
    assert.equal(r.address, 'PAYTO_OK');
  });
});

describe('lendableEvmNative', () => {
  test('keeps one fee-floor spare', () => {
    assert.ok(
      Math.abs(lendableEvmNative(0.0002, EVM_FUNDER_MIN_NATIVE) - (0.0002 - EVM_FUNDER_MIN_NATIVE)) <
        1e-12,
    );
  });

  test('returns 0 when below spare', () => {
    assert.equal(lendableEvmNative(EVM_FUNDER_MIN_NATIVE / 2, EVM_FUNDER_MIN_NATIVE), 0);
  });
});

describe('pickEvmFunderPreferGasReady', () => {
  test('xlayer: prefers gas-ready USDT0 wallet over OKB-poor richer PayTo', () => {
    const r = pickEvmFunderPreferGasReady(
      [
        {
          address: '0xpaytorichusdt000000000000000000000001',
          usdc: 1.64,
          native: 0,
          role: 'payto',
        },
        {
          address: '0xpayergasready000000000000000000000002',
          usdc: 0.76,
          native: EVM_FUNDER_MIN_NATIVE,
          role: 'payer',
        },
      ],
      { chain: 'xlayer', minUsdc: 0.01, minNative: 0, reserveUsdc: 0.01 },
    );
    assert.equal(r.address, '0xpayergasready000000000000000000000002');
  });

  test('xlayer: falls back to USDT0-rich OKB-poor when no gas-ready funder exists', () => {
    const r = pickEvmFunderPreferGasReady(
      [
        {
          address: '0xpaytorichusdt000000000000000000000001',
          usdc: 1.64,
          native: 0,
          role: 'payto',
        },
        {
          address: '0xpayerokbonly000000000000000000000003',
          usdc: 0,
          native: 0.01,
          role: 'payer',
        },
      ],
      { chain: 'xlayer', minUsdc: 0.01, minNative: 0, reserveUsdc: 0 },
    );
    assert.equal(r.address, '0xpaytorichusdt000000000000000000000001');
  });

  test('base: still picks richest when it is gas-ready', () => {
    const r = pickEvmFunderPreferGasReady(
      [
        {
          address: '0xpaytook000000000000000000000000000001',
          usdc: 1.64,
          native: EVM_FUNDER_MIN_NATIVE,
          role: 'payto',
        },
        {
          address: '0xpayerok000000000000000000000000000002',
          usdc: 0.76,
          native: EVM_FUNDER_MIN_NATIVE,
          role: 'payer',
        },
      ],
      { chain: 'base', minUsdc: 0.01, minNative: 0, reserveUsdc: 0 },
    );
    assert.equal(r.address, '0xpaytook000000000000000000000000000001');
  });
});
