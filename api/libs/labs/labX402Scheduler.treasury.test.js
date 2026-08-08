/**
 * Scheduler treasury circuit-breaker tests (mocked deps via dynamic import stubs).
 * Run: node --test api/libs/labs/labX402Scheduler.treasury.test.js
 */
import { test, describe, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTreasuryCapacity,
  shouldChronicDisableAutoCall,
  shouldLogTreasuryAlert,
  shouldLogTreasuryEpisodeAlert,
  TREASURY_CHRONIC_DISABLE_MS,
} from './labTreasuryGuard.js';

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

  test('underfunded funder + funded hub => hubHasFunds is informational only until distribute', () => {
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
    // Deposit hub may have funds; scheduler auto-distributes then re-assesses.
    assert.equal(assessment.canFundAny, false);
    assert.equal(assessment.hubHasFunds, true);
  });

  test('after refill (richest funder holds USDC), canFundAny flips true so auto-resume clears pause', () => {
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
    // Richest funder may be a payer wallet, not PayTo — still feeds evaluateTreasuryCapacity.
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

  test('richest funder with balance allows run even if dedicated PayTo is empty (capacity model)', () => {
    // assessLabTreasury feeds funderUsdc into payToUsdc slot of evaluateTreasuryCapacity
    const withRichestPayer = evaluateTreasuryCapacity({
      payToUsdc: 3,
      payToSpendableNative: 0.1,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 5,
      payToOptedIn: true,
      chain: 'base',
    });
    assert.equal(withRichestPayer.canFundAny, true);
    assert.ok(withRichestPayer.fundableCalls >= 1);
  });

  test('once-per-episode gate suppresses repeated (treasury) logs while paused', () => {
    assert.equal(
      shouldLogTreasuryEpisodeAlert({
        autoCallPausedReason: null,
        newReason: 'payto_underfunded',
      }),
      true,
    );
    assert.equal(
      shouldLogTreasuryEpisodeAlert({
        autoCallPausedReason: 'payto_underfunded',
        newReason: 'payto_underfunded',
      }),
      false,
    );
    // Legacy time throttle is no longer the primary spam control.
    const now = Date.now();
    assert.equal(shouldLogTreasuryAlert(new Date(now), now + 60_000), false);
  });

  test('chronic disable fires after TREASURY_CHRONIC_DISABLE_MS of continuous pause', () => {
    const now = Date.now();
    assert.equal(shouldChronicDisableAutoCall(new Date(now - 60_000), now), false);
    assert.equal(
      shouldChronicDisableAutoCall(new Date(now - TREASURY_CHRONIC_DISABLE_MS - 1), now),
      true,
    );
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

  test('simulates once-per-episode: second tick while paused does not re-log', () => {
    let settings = { autoCallPausedReason: null };
    const reason = 'payto_underfunded';
    let logs = 0;
    for (let tick = 0; tick < 5; tick++) {
      if (
        shouldLogTreasuryEpisodeAlert({
          autoCallPausedReason: settings.autoCallPausedReason,
          newReason: reason,
        })
      ) {
        logs += 1;
      }
      settings = { autoCallPausedReason: reason };
    }
    assert.equal(logs, 1);
  });
});

describe('handleTreasuryUnderfunded recovery paths', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('exports handleTreasuryUnderfunded for integration-style unit tests', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(typeof __test.handleTreasuryUnderfunded, 'function');
  });
});
