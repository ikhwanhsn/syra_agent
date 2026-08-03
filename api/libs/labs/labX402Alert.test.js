/**
 * Run: node --test api/libs/labs/labX402Alert.test.js
 */
import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  alertPayToUnderfunded,
  canAlertPayToUnderfunded,
  resetPayToUnderfundedAlertState,
  markPayToUnderfundedAlerted,
  PAYTO_UNDERFUNDED_ALERT_THROTTLE_MS,
} from './labX402Alert.js';

beforeEach(() => {
  resetPayToUnderfundedAlertState();
});

describe('canAlertPayToUnderfunded', () => {
  test('allows first alert', () => {
    assert.equal(canAlertPayToUnderfunded('xlayer', 1_000), true);
  });

  test('throttles within window', () => {
    markPayToUnderfundedAlerted('xlayer', 1_000);
    assert.equal(canAlertPayToUnderfunded('xlayer', 1_000 + 1), false);
    assert.equal(
      canAlertPayToUnderfunded('xlayer', 1_000 + PAYTO_UNDERFUNDED_ALERT_THROTTLE_MS - 1),
      false,
    );
    assert.equal(
      canAlertPayToUnderfunded('xlayer', 1_000 + PAYTO_UNDERFUNDED_ALERT_THROTTLE_MS),
      true,
    );
  });

  test('throttle is per-chain', () => {
    markPayToUnderfundedAlerted('xlayer', 1_000);
    assert.equal(canAlertPayToUnderfunded('base', 1_001), true);
  });
});

describe('alertPayToUnderfunded', () => {
  test('sends once then throttles', async () => {
    const sent = [];
    const send = mock.fn(async (text) => {
      sent.push(text);
      return true;
    });

    const t0 = 10_000_000;
    const first = await alertPayToUnderfunded({
      chain: 'xlayer',
      payToAddress: '0xPayTo',
      failedCount: 4,
      reason: 'payto_underfunded',
      sampleError: 'PAYTO_INSUFFICIENT_FUNDS: payTo USDT0 0.0000 < needed 0.0100',
      now: t0,
      send,
    });
    assert.equal(first.sent, true);
    assert.equal(first.skipped, null);
    assert.equal(send.mock.callCount(), 1);
    assert.match(sent[0], /xlayer/);
    assert.match(sent[0], /0xPayTo/);
    assert.match(sent[0], /Failed payers this tick: 4/);

    const second = await alertPayToUnderfunded({
      chain: 'xlayer',
      payToAddress: '0xPayTo',
      failedCount: 4,
      reason: 'payto_underfunded',
      now: t0 + 60_000,
      send,
    });
    assert.equal(second.sent, false);
    assert.equal(second.skipped, 'throttled');
    assert.equal(send.mock.callCount(), 1);
  });

  test('allows another send after throttle window', async () => {
    const send = mock.fn(async () => true);
    const t0 = 20_000_000;

    await alertPayToUnderfunded({
      chain: 'xlayer',
      failedCount: 1,
      now: t0,
      send,
    });
    const again = await alertPayToUnderfunded({
      chain: 'xlayer',
      failedCount: 1,
      now: t0 + PAYTO_UNDERFUNDED_ALERT_THROTTLE_MS,
      send,
    });
    assert.equal(again.sent, true);
    assert.equal(send.mock.callCount(), 2);
  });

  test('noop when send returns false (unconfigured path)', async () => {
    const send = mock.fn(async () => false);
    const result = await alertPayToUnderfunded({
      chain: 'xlayer',
      failedCount: 1,
      now: 30_000_000,
      send,
    });
    assert.equal(result.sent, false);
    assert.equal(result.skipped, 'unconfigured');
    // Failed send must not mark throttle (so a later configured send can retry).
    assert.equal(canAlertPayToUnderfunded('xlayer', 30_000_001), true);
  });
});
