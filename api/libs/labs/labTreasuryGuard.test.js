/**
 * Run: node --test api/libs/labs/labTreasuryGuard.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTreasuryCapacity,
  shouldChronicDisableAutoCall,
  shouldLogTreasuryAlert,
  shouldLogTreasuryEpisodeAlert,
  TREASURY_ALERT_THROTTLE_MS,
  TREASURY_CHRONIC_DISABLE_MS,
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
    // USDC is fine — do not recommend a USDC top-up for a fee-ALGO gap.
    assert.equal(r.recommendedTopUpUsdc, 0);
    assert.ok(r.recommendedTopUpNative > 0);
  });

  test('screenshot shape: USDC-rich + sibling lendable ALGO after min spare is fundable', () => {
    // PayTo ALGO ~0, sibling spendable 0.036, min-fee spare ~0.001 → lendable ~0.035 >= fee floor.
    const siblingSpendable = 0.036;
    const minFeeSpare = 0.001;
    const lendable = Math.max(0, siblingSpendable - minFeeSpare);
    const r = evaluateTreasuryCapacity({
      payToUsdc: 1.64,
      payToSpendableNative: 0,
      borrowableNative: lendable,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 1,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, true);
    assert.equal(r.reason, null);
  });

  test('borrowableNative below fee floor after spare does not falsely pass', () => {
    // If only 0.002 spendable exists after spare accounting, capacity must fail native.
    const r = evaluateTreasuryCapacity({
      payToUsdc: 1.64,
      payToSpendableNative: 0,
      borrowableNative: ALGO_FEE_FLOOR / 2,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 1,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, false);
    assert.equal(r.reason, 'payto_native_underfunded');
  });

  test('canFundAny when funder ALGO is low but borrowableNative meets fee floor', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 10,
      payToSpendableNative: 0,
      borrowableNative: ALGO_FEE_FLOOR,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 3,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, true);
    assert.equal(r.reason, null);
    assert.equal(r.fundableCalls, 1000);
    // Shortfall messaging still reflects the funder's own native (not pool gas).
    assert.equal(r.shortfallNative, 0);
  });

  test('payto_native_underfunded when funder and borrowableNative are both below fee floor', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 10,
      payToSpendableNative: ALGO_FEE_FLOOR / 2,
      borrowableNative: ALGO_FEE_FLOOR / 2,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 2,
      payToOptedIn: true,
      chain: 'algorand',
    });
    // Gate uses Math.max(own, borrowable) — half + half still fails if each alone is below floor.
    assert.equal(r.canFundAny, false);
    assert.equal(r.reason, 'payto_native_underfunded');
    assert.ok(r.shortfallNative > 0);
  });

  test('borrowableNative does not waive payto_not_opted_in_usdc', () => {
    const r = evaluateTreasuryCapacity({
      payToUsdc: 10,
      payToSpendableNative: 0,
      borrowableNative: 1,
      minNativeForFee: ALGO_FEE_FLOOR,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 1,
      payToOptedIn: false,
      chain: 'algorand',
    });
    assert.equal(r.canFundAny, false);
    assert.equal(r.reason, 'payto_not_opted_in_usdc');
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

describe('shouldLogTreasuryEpisodeAlert', () => {
  test('allows first alert when not paused', () => {
    assert.equal(
      shouldLogTreasuryEpisodeAlert({
        autoCallPausedReason: null,
        newReason: 'payto_underfunded',
      }),
      true,
    );
  });

  test('suppresses re-log while paused with the same reason', () => {
    assert.equal(
      shouldLogTreasuryEpisodeAlert({
        autoCallPausedReason: 'payto_underfunded',
        newReason: 'payto_underfunded',
      }),
      false,
    );
  });

  test('allows alert when pause reason changes', () => {
    assert.equal(
      shouldLogTreasuryEpisodeAlert({
        autoCallPausedReason: 'payto_underfunded',
        newReason: 'payto_native_underfunded',
      }),
      true,
    );
  });
});

describe('shouldChronicDisableAutoCall', () => {
  test('false when never paused', () => {
    assert.equal(shouldChronicDisableAutoCall(null), false);
  });

  test('false before TREASURY_CHRONIC_DISABLE_MS', () => {
    const now = Date.now();
    assert.equal(
      shouldChronicDisableAutoCall(new Date(now - TREASURY_CHRONIC_DISABLE_MS + 60_000), now),
      false,
    );
  });

  test('true after TREASURY_CHRONIC_DISABLE_MS', () => {
    const now = Date.now();
    assert.equal(
      shouldChronicDisableAutoCall(new Date(now - TREASURY_CHRONIC_DISABLE_MS - 1), now),
      true,
    );
  });
});
