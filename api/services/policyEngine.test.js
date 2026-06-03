/**
 * Policy engine unit tests. Run with: node --test api/services/policyEngine.test.js
 *
 * Uses node:test (no extra dep). Every rule has a positive and negative case.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './policyEngine.js';

const baseWallet = {
  anonymousId: 'wallet:abc',
  status: 'active',
  dailySpendCapUsd: 250,
  perTxCapUsd: 50,
  hourlySpendCapUsd: 100,
  allowedTools: ['jupiter-swap-order', 'pumpfun-agents-swap', 'news'],
  destinationAllowlist: [],
  destinationDenylist: [],
  linkedUserWallet: 'UserWalletAddr',
};

const baseIntent = (overrides = {}) => ({
  type: 'tx_sign',
  chain: 'solana',
  toolId: 'jupiter-swap-order',
  estimatedUsd: 5,
  ...overrides,
});

test('frozen wallet -> deny', () => {
  const d = evaluate(baseIntent(), { ...baseWallet, status: 'frozen' }, []);
  assert.equal(d.outcome, 'deny');
  assert.ok(d.reasons.some((r) => r.startsWith('status_not_active')));
});

test('guest cannot sign tx -> deny', () => {
  const d = evaluate(baseIntent({ guest: true }), baseWallet, []);
  assert.equal(d.outcome, 'deny');
  assert.ok(d.reasons.includes('guest_signing'));
});

test('tool not in allowlist -> deny', () => {
  const d = evaluate(baseIntent({ toolId: 'binance-spot-order' }), baseWallet, []);
  assert.equal(d.outcome, 'deny');
  assert.ok(d.reasons.some((r) => r.startsWith('tool_not_allowed')));
});

test('destination in denylist -> deny', () => {
  const d = evaluate(
    baseIntent({ type: 'withdraw', toAddress: 'BadAddr', estimatedUsd: 10 }),
    { ...baseWallet, destinationDenylist: ['BadAddr'] },
    []
  );
  assert.equal(d.outcome, 'deny');
  assert.ok(d.reasons.some((r) => r.startsWith('destination_denylisted')));
});

test('withdraw to unknown address -> deny (allowlist enforced)', () => {
  const d = evaluate(
    baseIntent({ type: 'withdraw', toAddress: 'RandomAddr', estimatedUsd: 5 }),
    baseWallet,
    []
  );
  assert.equal(d.outcome, 'deny');
  assert.ok(d.reasons.some((r) => r.startsWith('destination_not_allowlisted')));
});

test('withdraw to linked wallet -> allow', () => {
  const d = evaluate(
    baseIntent({ type: 'withdraw', toAddress: 'UserWalletAddr', estimatedUsd: 5 }),
    baseWallet,
    []
  );
  assert.equal(d.outcome, 'allow');
});

test('withdraw over per-tx cap to linked wallet -> allow (no user limits)', () => {
  const d = evaluate(
    baseIntent({ type: 'withdraw', toAddress: 'UserWalletAddr', estimatedUsd: 1500 }),
    baseWallet,
    []
  );
  assert.equal(d.outcome, 'allow');
  assert.equal(d.reasons.length, 0);
});

test('linked withdraw ignores velocity limits', () => {
  const now = Date.now();
  const history = Array.from({ length: 11 }, (_, i) => ({
    ts: new Date(now - i * 1000),
    action: 'withdraw',
    amountUsd: 100,
    status: 'ok',
  }));
  const d = evaluate(
    baseIntent({ type: 'withdraw', toAddress: 'UserWalletAddr', estimatedUsd: 1500 }),
    baseWallet,
    history
  );
  assert.equal(d.outcome, 'allow');
});

test('over per-tx cap -> require_confirm', () => {
  const d = evaluate(baseIntent({ estimatedUsd: 80 }), baseWallet, []);
  assert.equal(d.outcome, 'require_confirm');
  assert.ok(d.reasons.some((r) => r.startsWith('over_per_tx_cap')));
});

test('over daily cap -> require_confirm', () => {
  // Spread the prior spend across older 24h to avoid stacking hourly + anomaly rules.
  const history = Array.from({ length: 10 }, (_, i) => ({
    ts: new Date(Date.now() - (2 + i) * 60 * 60 * 1000),
    action: 'tx_sign',
    amountUsd: 24,
    status: 'ok',
  }));
  const d = evaluate(baseIntent({ estimatedUsd: 20 }), baseWallet, history);
  assert.equal(d.outcome, 'require_confirm');
  assert.ok(d.reasons.some((r) => r.startsWith('over_daily_cap')));
});

test('velocity high -> deny', () => {
  const now = Date.now();
  const history = Array.from({ length: 11 }, (_, i) => ({
    ts: new Date(now - i * 1000),
    action: 'tx_sign',
    amountUsd: 1,
    status: 'ok',
  }));
  const d = evaluate(baseIntent(), baseWallet, history);
  assert.equal(d.outcome, 'deny');
  assert.ok(d.reasons.some((r) => r.startsWith('velocity_high')));
});

test('clean small swap -> allow', () => {
  const d = evaluate(baseIntent({ estimatedUsd: 5 }), baseWallet, []);
  assert.equal(d.outcome, 'allow');
  assert.equal(d.reasons.length, 0);
});

test('large amount triggers risk -> require_confirm or deny', () => {
  const d = evaluate(baseIntent({ estimatedUsd: 120 }), baseWallet, []);
  assert.notEqual(d.outcome, 'allow');
});

test('unknown solana program adds risk', () => {
  const d = evaluate(
    baseIntent({ programId: 'UnknownProgramId' }),
    baseWallet,
    []
  );
  assert.ok(d.reasons.some((r) => r.startsWith('unknown_program')));
});

test('message_sign is allowed for guest', () => {
  const d = evaluate(
    { type: 'message_sign', chain: 'solana', guest: true },
    baseWallet,
    []
  );
  assert.equal(d.outcome, 'allow');
});

test('anomaly spike (3x median) -> require_confirm', () => {
  const now = Date.now();
  const history = Array.from({ length: 20 }, (_, i) => ({
    ts: new Date(now - i * 24 * 60 * 60 * 100),
    action: 'tx_sign',
    amountUsd: 5,
    status: 'ok',
  }));
  const d = evaluate(baseIntent({ estimatedUsd: 30 }), baseWallet, history);
  assert.notEqual(d.outcome, 'allow');
});
