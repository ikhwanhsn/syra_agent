/**
 * Bitcoin x402 query parsing.
 * Run: node --test api/libs/bitcoinX402Service.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBitcoinX402Request } from './bitcoinX402Service.js';

test('parseBitcoinX402Request defaults', () => {
  const p = parseBitcoinX402Request({ method: 'GET', query: {} });
  assert.equal(p.exchange, 'binance');
  assert.equal(p.interval, '1h');
  assert.equal(p.limit, 200);
});

test('parseBitcoinX402Request coinbase and limit', () => {
  const p = parseBitcoinX402Request({
    method: 'GET',
    query: { exchange: 'coinbase', interval: '4h', limit: '50' },
  });
  assert.equal(p.exchange, 'coinbase');
  assert.equal(p.interval, '4h');
  assert.equal(p.limit, 50);
});

test('parseBitcoinX402Request clamps invalid exchange', () => {
  const p = parseBitcoinX402Request({ method: 'GET', query: { exchange: 'kraken' } });
  assert.equal(p.exchange, 'binance');
});
