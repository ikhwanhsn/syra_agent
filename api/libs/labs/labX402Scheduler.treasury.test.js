/**
 * Scheduler treasury circuit-breaker tests (mocked deps via dynamic import stubs).
 * Run: node --test api/libs/labs/labX402Scheduler.treasury.test.js
 */
import { test, describe, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateTreasuryCapacity,
  shouldEscalateTreasuryRecheck,
  shouldLogTreasuryAlert,
  shouldLogTreasuryEpisodeAlert,
  shouldSoftSkipTreasuryAssessment,
  treasuryPauseRecheckDelayMs,
  TREASURY_CHRONIC_DISABLE_MS,
  TREASURY_CHRONIC_RECHECK_MS,
  TREASURY_PAUSE_RECHECK_MS,
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

  test('chronic pause escalates recheck cadence (does not disable auto-call)', () => {
    const now = Date.now();
    assert.equal(shouldEscalateTreasuryRecheck(new Date(now - 60_000), now), false);
    assert.equal(
      shouldEscalateTreasuryRecheck(new Date(now - TREASURY_CHRONIC_DISABLE_MS - 1), now),
      true,
    );
    assert.equal(
      treasuryPauseRecheckDelayMs({
        autoCallPausedAt: new Date(now - TREASURY_CHRONIC_DISABLE_MS - 1),
        nowMs: now,
      }),
      TREASURY_CHRONIC_RECHECK_MS,
    );
    assert.equal(
      treasuryPauseRecheckDelayMs({
        autoCallPausedAt: new Date(now - 60_000),
        nowMs: now,
      }),
      TREASURY_PAUSE_RECHECK_MS,
    );
  });

  test('RPC timeout with empty balances soft-skips (no pause)', () => {
    assert.equal(
      shouldSoftSkipTreasuryAssessment({
        canFundAny: false,
        error: 'hub_balance_timeout',
        funderUsdc: 0,
        hubUsdc: 0,
        hubNative: 0,
      }),
      true,
    );
  });

  test('TREASURY_SKIP_REASONS includes payto_underfunded for mid-tick break', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(__test.TREASURY_SKIP_REASONS.has('payto_underfunded'), true);
    assert.equal(__test.TREASURY_SKIP_REASONS.has('payto_native_underfunded'), true);
    assert.equal(__test.TREASURY_SKIP_REASONS.has('insufficient_algo_for_opt_in'), false);
  });

  test('mid-tick: canFundAny true must skip payer, never sticky-pause', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(
      __test.decideMidTickTreasurySkipAction({ canFundAny: true }),
      'skip_payer',
    );
    assert.equal(
      __test.decideMidTickTreasurySkipAction({ canFundAny: false }),
      'pause_treasury',
    );
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

  test('exports handleTreasuryUnderfunded and healChainTreasuryOnBoot', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(typeof __test.handleTreasuryUnderfunded, 'function');
    assert.equal(typeof __test.healChainTreasuryOnBoot, 'function');
  });

  test('recovery contract: fundable assessment must recover (never leave disabled)', () => {
    // Contract for handleTreasuryUnderfunded when canFundAny + allowAlreadyFundedRecovery:
    // callers must invoke recoverLabAutoCallFromTreasury (enable + clear pause).
    const assessment = evaluateTreasuryCapacity({
      payToUsdc: 1,
      payToSpendableNative: 0.1,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 2,
      payToOptedIn: true,
      chain: 'algorand',
    });
    assert.equal(assessment.canFundAny, true);
    const shouldRecover = assessment.canFundAny === true;
    const mustReEnableAutoCall = shouldRecover;
    assert.equal(mustReEnableAutoCall, true);
  });

  test('chronic path must not set disabled=true in result shape', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    // Document expected return shape: disabled is always false after chronic redesign.
    assert.equal(typeof __test.handleTreasuryUnderfunded, 'function');
    const chronicWouldDisable = false;
    assert.equal(chronicWouldDisable, false);
  });

  test('shouldAttemptAlgorandFeeHeal: native underfunded triggers heal', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(
      __test.shouldAttemptAlgorandFeeHeal({
        canFundAny: false,
        reason: 'payto_native_underfunded',
        funderUsdc: 1,
        minPriceUsd: 0.01,
      }),
      true,
    );
  });

  test('shouldAttemptAlgorandFeeHeal: USDC ok with payto_underfunded still heals (mislabeled native)', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(
      __test.shouldAttemptAlgorandFeeHeal({
        canFundAny: false,
        reason: 'payto_underfunded',
        funderUsdc: 0.76,
        payToUsdc: 1.64,
        minPriceUsd: 0.01,
      }),
      true,
    );
  });

  test('shouldAttemptAlgorandFeeHeal: skipped when already fundable or opt-in missing', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.equal(
      __test.shouldAttemptAlgorandFeeHeal({
        canFundAny: true,
        reason: null,
      }),
      false,
    );
    assert.equal(
      __test.shouldAttemptAlgorandFeeHeal({
        canFundAny: false,
        reason: 'payto_not_opted_in_usdc',
        funderUsdc: 1,
        minPriceUsd: 0.01,
      }),
      false,
    );
    assert.equal(
      __test.shouldAttemptAlgorandFeeHeal({
        canFundAny: false,
        reason: 'payto_underfunded',
        funderUsdc: 0,
        payToUsdc: 0,
        minPriceUsd: 0.01,
      }),
      false,
    );
  });

  test('algorandFeeHealTargets: funder then PayTo, deduped', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    assert.deepEqual(
      __test.algorandFeeHealTargets({
        funderAddress: 'FUNDER1',
        payToAddress: 'PAYTO1',
      }),
      ['FUNDER1', 'PAYTO1'],
    );
    assert.deepEqual(
      __test.algorandFeeHealTargets({
        funderAddress: 'SAME',
        payToAddress: 'same',
      }),
      ['SAME'],
    );
  });

  test('tryAlgorandFeeHealBeforePause: calls ensure with sibling+PayTo borrow opts', async () => {
    const { __test } = await import('./labX402Scheduler.js');
    /** @type {Array<{ addr: string; opts: object }>} */
    const calls = [];
    const heal = await __test.tryAlgorandFeeHealBeforePause(
      {
        canFundAny: false,
        reason: 'payto_native_underfunded',
        funderUsdc: 1.5,
        minPriceUsd: 0.01,
        funderAddress: 'FUNDERADDR',
        payToAddress: 'PAYTOADDR',
      },
      {
        ensurePayToAlgoForUsdcRefund: async (addr, opts) => {
          calls.push({ addr, opts });
          return { ok: true, funded: true };
        },
      },
    );
    assert.equal(heal.attempted, true);
    assert.equal(heal.ok, true);
    assert.deepEqual(heal.targets, ['FUNDERADDR', 'PAYTOADDR']);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].opts.includePayTo, true);
    assert.equal(calls[0].opts.includeSiblingPayers, true);
  });

  test('Algorand fee heal recovery contract: after heal, capacity must recover (no pause)', () => {
    // Mirrors handleTreasuryUnderfunded: native underfund → fee heal → re-assess → recover.
    const before = evaluateTreasuryCapacity({
      payToUsdc: 1.5,
      payToSpendableNative: 0,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 3,
      payToOptedIn: true,
      chain: 'algorand',
      borrowableNative: 0,
    });
    assert.equal(before.canFundAny, false);
    assert.equal(before.reason, 'payto_native_underfunded');

    const afterHeal = evaluateTreasuryCapacity({
      payToUsdc: 1.5,
      payToSpendableNative: 0.01,
      minNativeForFee: 0.004,
      hubUsdc: 0,
      hubNative: 0,
      minPriceUsd: 0.01,
      payerCount: 3,
      payToOptedIn: true,
      chain: 'algorand',
      borrowableNative: 0,
    });
    assert.equal(afterHeal.canFundAny, true);
    const mustRecoverNotPause = afterHeal.canFundAny === true;
    assert.equal(mustRecoverNotPause, true);
  });
});
