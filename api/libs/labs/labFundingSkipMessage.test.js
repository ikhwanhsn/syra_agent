/**
 * Run: node --test api/libs/labs/labFundingSkipMessage.test.js
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatFundingSkipError } from './labFundingSkipMessage.js';

describe('formatFundingSkipError', () => {
  test('includes reason and actionable top-up copy when no detail', () => {
    const msg = formatFundingSkipError({ reason: 'payto_underfunded' });
    assert.match(msg, /payto_underfunded/);
    assert.match(msg, /Top up/);
  });

  test('includes opt-in failure detail', () => {
    const msg = formatFundingSkipError({
      reason: 'insufficient_algo_for_opt_in',
      error: 'insufficient_algo_for_opt_in (need ~0.11 ALGO first)',
    });
    assert.match(msg, /insufficient_algo_for_opt_in/);
    assert.match(msg, /0\.11 ALGO/);
  });

  test('scheduler variant omits top-up hint when requested', () => {
    const msg = formatFundingSkipError({
      reason: 'payto_underfunded',
      includeTopUpHint: false,
    });
    assert.match(msg, /payto_underfunded/);
    assert.doesNotMatch(msg, /Top up/);
  });

  test('truncates to 500 chars', () => {
    const msg = formatFundingSkipError({
      reason: 'topup_failed',
      error: 'x'.repeat(600),
    });
    assert.equal(msg.length, 500);
  });
});
