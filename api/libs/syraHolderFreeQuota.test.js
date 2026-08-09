/**
 * Holder free benefits unit tests.
 * Run: node --test api/libs/syraHolderFreeQuota.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickFreeBucket } from './syraHolderFreeQuota.js';
import {
  classifyHolderFreeTool,
  isExpensivePassthroughTool,
  resolveRewardMultiplier,
} from './syraHolderBenefits.js';

test('classifies curated and expensive tools', () => {
  assert.equal(classifyHolderFreeTool('news'), 't2');
  assert.equal(classifyHolderFreeTool('analytics-summary'), 't3');
  assert.equal(classifyHolderFreeTool('health'), 'starter');
  assert.equal(classifyHolderFreeTool('nansen-smart-money-netflow'), null);
  assert.equal(isExpensivePassthroughTool('nansen-foo'), true);
  assert.equal(isExpensivePassthroughTool('news'), false);
});

test('resolves reward multipliers', () => {
  assert.equal(resolveRewardMultiplier(0), 1);
  assert.equal(resolveRewardMultiplier(100_000), 1.1);
  assert.equal(resolveRewardMultiplier(1_000_000), 1.25);
});

const emptyBuckets = {
  starter: { limit: 25, used: 0, remaining: 25 },
  stakeT2: { limit: 10, used: 0, remaining: 10 },
  stakeT3: { limit: 3, used: 0, remaining: 3 },
  stakeBrain: { limit: 1, used: 0, remaining: 1 },
};

test('prefers stake T2 over starter for news when staked', () => {
  const pick = pickFreeBucket(
    { holderEligible: true, stakeT2Eligible: true, stakeT3Eligible: false },
    emptyBuckets,
    'news',
  );
  assert.equal(pick?.bucket, 'stake_t2');
});

test('falls back to starter for news when not staked', () => {
  const pick = pickFreeBucket(
    { holderEligible: true, stakeT2Eligible: false, stakeT3Eligible: false },
    emptyBuckets,
    'news',
  );
  assert.equal(pick?.bucket, 'starter');
});

test('does not treasury-pay expensive tools', () => {
  const pick = pickFreeBucket(
    { holderEligible: true, stakeT2Eligible: true, stakeT3Eligible: true },
    emptyBuckets,
    'nansen-smart-money-netflow',
  );
  assert.equal(pick, null);
});

test('unlocks brain only for 1M stakers', () => {
  assert.equal(
    pickFreeBucket(
      { holderEligible: true, stakeT2Eligible: true, stakeT3Eligible: false },
      emptyBuckets,
      'brain',
    ),
    null,
  );
  assert.equal(
    pickFreeBucket(
      { holderEligible: true, stakeT2Eligible: true, stakeT3Eligible: true },
      emptyBuckets,
      'brain',
    )?.bucket,
    'stake_brain',
  );
});
