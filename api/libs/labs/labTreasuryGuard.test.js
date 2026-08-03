/**
 * Run: node --test api/libs/labs/labTreasuryGuard.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTreasuryCapacity,
  shouldLogTreasuryAlert,
  TREASURY_ALERT_THROTTLE_MS,
} from './labTreasuryGuard.js';
import { PAYTO_USDC_REFUND_MIN_FEE_MICRO, MICRO_ALGO } from './labAlgorandFeeBuffer.js';

const ALGO_FEE_FLOOR = Number(PAYTO_USDC_REFUND_MIN_FEE_MICRO) / Number(MICRO_ALGO);

describe('evaluateTreasuryCapacity', () => {
  test('healthy PayTo with USDC + native funds at least one call', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 0.5,
      payToSpendableNative: 0.05,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 10,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, true);
    assert.equal(r.fundableCalls, 50);
    assert.equal(r.reason, null);
    assert.equal(r.hubHasFunds, false);
  });

  test('payto_underfunded when USDC below min price', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 0.005,
      payToSpendableNative: 0.05,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 5,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, false);
    assert.equal(r.fundableCalls, 0);
    assert.equal(r.reason, 'payto_underfunded');
    assert.ok(r.shortfallUsdc > 0);
    assert.ok(r.recommendedTopUpUsdc >= 1);
  });

  test('payto_native_underfunded when spendable ALGO below fee floor', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 10,
      payToSpendableNative: 0,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 3,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, false);
    assert.equal(r.reason, 'payto_native_underfunded');
    assert.ok(r.shortfallNative > 0);
  });

  test('payto_not_opted_in_usdc blocks Algorand even with balances', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 10,
      payToSpendableNative: 1,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 2,
      payToOptedIn: false,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, false);
    assert.equal(r.reason, 'payto_not_opted_in_usdc');
  });

  test('hubHasFunds true when hub holds at least one call of USDC', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 2,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 4,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, false);
    assert.equal(r.hubHasFunds, true);
  });

  test('hubHasFunds true on Algorand when hub has opt-in ALGO even without USDC', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0.5,
      minPriceUsd: 0.01,
      payerCount: 2,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.hubHasFunds, true);
  });

  test('fundableCalls floors to whole calls from PayTo USDC', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 0.025,
      payToSpendableNative: 0.1,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 1,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.fundableCalls, 2);
    assert.equal(r.canFundAny, true);
  });
});

describe('shouldLogTreasuryAlert', () => {
  test('allows first alert when never logged', () => {
    assert.equal(shouldLogTreasuryAlert(null), true);
    assert.equal(shouldLogTreasuryAlert(undefined), true);
  });

  test('throttles within TREASURY_ALERT_THROTTLE_MS', () => {
    const now = Date.now();
    assert.equal(shouldLogTreasuryAlert(new Date(now - 1000), now), false);
    assert.equal(
      shouldLogTreasuryAlert(new Date(now - TREASURY_ALERT_THROTTLE_MS - 1), now),
      true,
    );
  });
});
