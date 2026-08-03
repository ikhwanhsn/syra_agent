/**
 * Run: node --test api/libs/labs/labFundingBackoff.test.js
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldSkipFundingAttempt,
  recordFundingFailure,
  recordFundingSuccess,
  resetFundingBackoffState,
  getFundingBackoffEntry,
  computeFundingCooldownMs,
  FUNDING_BACKOFF_BASE_MS,
  FUNDING_BACKOFF_MAX_MS,
} from './labFundingBackoff.js';

const CHAIN = 'xlayer';
const ADDR = '0xdf1234567890abcdef1234567890abcdef00c63C';

beforeEach(() => {
  resetFundingBackoffState();
});

describe('computeFundingCooldownMs', () => {
  test('first failure uses base cooldown', () => {
    assert.equal(computeFundingCooldownMs(1), FUNDING_BACKOFF_BASE_MS);
  });

  test('exponential growth capped at max', () => {
    assert.equal(computeFundingCooldownMs(2), FUNDING_BACKOFF_BASE_MS * 2);
    assert.equal(computeFundingCooldownMs(3), FUNDING_BACKOFF_BASE_MS * 4);
    assert.equal(computeFundingCooldownMs(10), FUNDING_BACKOFF_MAX_MS);
  });
});

describe('funding backoff', () => {
  test('no skip before any failure', () => {
    assert.equal(shouldSkipFundingAttempt(CHAIN, ADDR, 1_000), false);
  });

  test('first failure is a transition and enables skip during cooldown', () => {
    const t0 = 1_000_000;
    const result = recordFundingFailure(CHAIN, ADDR, 'payto_underfunded', t0);
    assert.equal(result.isTransition, true);
    assert.equal(result.failCount, 1);
    assert.equal(result.cooldownMs, FUNDING_BACKOFF_BASE_MS);
    assert.equal(shouldSkipFundingAttempt(CHAIN, ADDR, t0 + 1), true);
    assert.equal(shouldSkipFundingAttempt(CHAIN, ADDR, t0 + FUNDING_BACKOFF_BASE_MS - 1), true);
    assert.equal(shouldSkipFundingAttempt(CHAIN, ADDR, t0 + FUNDING_BACKOFF_BASE_MS), false);
  });

  test('same reason inside cooldown is not a transition (no re-log)', () => {
    const t0 = 2_000_000;
    recordFundingFailure(CHAIN, ADDR, 'payto_underfunded', t0);
    const again = recordFundingFailure(CHAIN, ADDR, 'payto_underfunded', t0 + 60_000);
    assert.equal(again.isTransition, false);
    assert.equal(again.failCount, 1);
  });

  test('changed reason is a transition even inside cooldown', () => {
    const t0 = 3_000_000;
    recordFundingFailure(CHAIN, ADDR, 'payto_underfunded', t0);
    const changed = recordFundingFailure(CHAIN, ADDR, 'topup_failed', t0 + 1_000);
    assert.equal(changed.isTransition, true);
    assert.equal(changed.failCount, 1);
    assert.equal(getFundingBackoffEntry(CHAIN, ADDR)?.reason, 'topup_failed');
  });

  test('after cooldown expires, same reason increments failCount and extends cooldown', () => {
    const t0 = 4_000_000;
    recordFundingFailure(CHAIN, ADDR, 'payto_underfunded', t0);
    const next = recordFundingFailure(
      CHAIN,
      ADDR,
      'payto_underfunded',
      t0 + FUNDING_BACKOFF_BASE_MS,
    );
    assert.equal(next.isTransition, true);
    assert.equal(next.failCount, 2);
    assert.equal(next.cooldownMs, FUNDING_BACKOFF_BASE_MS * 2);
  });

  test('success clears backoff', () => {
    const t0 = 5_000_000;
    recordFundingFailure(CHAIN, ADDR, 'payto_underfunded', t0);
    assert.equal(shouldSkipFundingAttempt(CHAIN, ADDR, t0 + 1), true);
    recordFundingSuccess(CHAIN, ADDR);
    assert.equal(shouldSkipFundingAttempt(CHAIN, ADDR, t0 + 1), false);
    assert.equal(getFundingBackoffEntry(CHAIN, ADDR), null);
  });

  test('keys are case-insensitive for address and chain', () => {
    const t0 = 6_000_000;
    recordFundingFailure('XLayer', ADDR.toUpperCase(), 'payto_underfunded', t0);
    assert.equal(shouldSkipFundingAttempt('xlayer', ADDR.toLowerCase(), t0 + 1), true);
  });
});
