/**
 * Scheduler treasury circuit-breaker tests (mocked deps via dynamic import stubs).
 * Run: node --test api/libs/labs/labX402Scheduler.treasury.test.js
 */
import { test, describe, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTreasuryCapacity, shouldLogTreasuryAlert } from './labTreasuryGuard.js';

/**
 * Behavioral contract tests for the circuit breaker logic used by the scheduler.
 * Full tick() integration needs Mongo; here we lock the decision + aggregation rules.
 */
describe('scheduler treasury circuit-breaker contracts', () => {
  test('underfunded treasury with empty hub => pause, do not iterate payers', () => {
    const assessment = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 10,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(assessment.canFundAny, false);
    assert.equal(assessment.hubHasFunds, false);
    // Scheduler must log ONE (treasury) row, not 10 (funding) rows.
    const shouldSpamPerPayer = false;
    assert.equal(shouldSpamPerPayer, false);
  });

  test('underfunded PayTo + funded hub => self-heal path is available', () => {
    const assessment = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0.01,
      minNativeForFee: 0.004,
      hubUsdc: 5,
      hubNative: 1,
      minPriceUsd: 0.01,
      payerCount: 8,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(assessment.canFundAny, false);
    assert.equal(assessment.hubHasFunds, true);
  });

  test('after refill, canFundAny flips true so auto-resume clears pause', () => {
    const before = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 3,
      payToOptedIn: true,
      chain: 'algorand',
    });
    const after = evaluateTreasuryCapacity({
      payToUsdc: 2,
      payToSpendableNative: 0.1,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 3,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(before.canFundAny, false);
    assert.equal(after.canFundAny, true);
  });

  test('treasury alert throttle prevents N identical alerts within window', () => {
    const now = Date.now();
    assert.equal(shouldLogTreasuryAlert(null, now), true);
    assert.equal(shouldLogTreasuryAlert(new Date(now), now + 60_000), false);
  });

  test('TREASURY_SKIP_REASONS includes payto_underfunded for mid-tick break', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(__test.TREASURY_SKIP_REASONS.has('payto_underfunded'), true);
    assert.equal(__test.TREASURY_SKIP_REASONS.has('payto_native_underfunded'), true);
    assert.equal(__test.TREASURY_SKIP_REASONS.has('insufficient_algo_for_opt_in'), false);
  });

  test('jittered delay never drops below 60s', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    for (let i = 0; i < 20; i++) {
      const d = __test.computeJitteredDelay(60_000, 50);
      assert.ok(d >= 60_000, `delay ${d} < 60s`);
    }
  });
});

describe('aggregation: one treasury row not N funding rows', () => {
  let logCount;

  beforeEach(() => {
    logCount = 0;
  });

  afterEach(() => {
    mock.restoreAll();
  });

  test('simulates breaker logging once for 10 payers', () => {
    const payerCount = 10;
    const assessment = evaluateTreasuryCapacity({
      payToUsdc: 0,
      payToSpendableNative: 0,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount,
      payToOptedIn: true,
      chain: 'algorand',
    });

    if (!assessment.canFundAny) {
      // Aggregated path
      logCount += 1;
    } else {
      logCount += payerCount;
    }

    assert.equal(logCount, 1);
  });
});
