/**
 * Balance cache unit tests.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCachedBalances,
  setCachedBalances,
  invalidateBalanceCache,
  resetBalanceCacheForTests,
} from './balanceCache.js';

test('balance cache hit within TTL', () => {
  resetBalanceCacheForTests();
  setCachedBalances('tg:1', {
    agentAddress: 'Addr1',
    solBalance: 1,
    usdcBalance: 2,
  });
  const hit = getCachedBalances('tg:1');
  assert.equal(hit?.usdcBalance, 2);
  assert.equal(hit?.agentAddress, 'Addr1');
});

test('invalidate clears anonymousId and address', () => {
  resetBalanceCacheForTests();
  setCachedBalances('tg:2', {
    agentAddress: 'Addr2',
    solBalance: 0,
    usdcBalance: 5,
  });
  setCachedBalances('Addr2', {
    agentAddress: 'Addr2',
    solBalance: 0,
    usdcBalance: 5,
  });
  invalidateBalanceCache('tg:2', 'Addr2');
  assert.equal(getCachedBalances('tg:2'), null);
  assert.equal(getCachedBalances('Addr2'), null);
});
