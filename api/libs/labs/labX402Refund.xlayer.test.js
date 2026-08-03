/**
 * Run: node --test api/libs/labs/labX402Refund.xlayer.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { clampXlayerPayToUsdt0RefundAmount } from './labX402Refund.js';

describe('clampXlayerPayToUsdt0RefundAmount', () => {
  test('sends full amount when PayTo has enough USDT0', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0.2,
      payToUsdt0Balance: 0.71,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, false);
    assert.equal(clamp.amountUsd, 0.2);
    assert.equal(clamp.reason, 'full');
  });

  test('partial top-up when PayTo USDT0 is below request but above min call', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0.2,
      payToUsdt0Balance: 0.05,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, true);
    assert.equal(clamp.amountUsd, 0.05);
    assert.equal(clamp.reason, 'partial');
  });

  test('underfunded only when PayTo USDT0 is below min call price', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0.2,
      payToUsdt0Balance: 0.005,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, false);
    assert.equal(clamp.amountUsd, 0);
    assert.equal(clamp.reason, 'payto_underfunded');
  });

  test('rejects invalid inputs', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0,
      payToUsdt0Balance: 1,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, false);
    assert.equal(clamp.reason, 'invalid');
  });

  test('rounds partial amount to 6 decimal places', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0.2,
      payToUsdt0Balance: 0.123456789,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, true);
    assert.equal(clamp.amountUsd, 0.123457);
  });

  test('exact min-call balance is ok (partial)', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0.2,
      payToUsdt0Balance: 0.01,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, true);
    assert.equal(clamp.partial, true);
    assert.equal(clamp.amountUsd, 0.01);
  });

  test('zero PayTo balance is underfunded', () => {
    const clamp = clampXlayerPayToUsdt0RefundAmount({
      requestedUsd: 0.2,
      payToUsdt0Balance: 0,
      minPriceUsd: 0.01,
    });
    assert.equal(clamp.ok, false);
    assert.equal(clamp.reason, 'payto_underfunded');
  });
});
