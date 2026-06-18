/**
 * Assets x402 query parsing and row helpers.
 * Run: node --test api/libs/assetsX402Service.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAssetBoardRows,
  parseAssetsX402Request,
  sortAssetBoardRows,
} from './assetsX402Service.js';

test('parseAssetsX402Request defaults', () => {
  const p = parseAssetsX402Request({ method: 'GET', query: {} });
  assert.equal(p.list, 'all');
  assert.equal(p.groupBy, 'asset');
  assert.equal(p.assetClass, 'all');
  assert.equal(p.sort, 'marketCap');
  assert.equal(p.order, 'desc');
  assert.equal(p.limit, 20);
  assert.equal(p.offset, 0);
});

test('parseAssetsX402Request stocks list with equity filter', () => {
  const p = parseAssetsX402Request({
    method: 'GET',
    query: { list: 'stocks', assetClass: 'equity', q: 'apple', limit: '5', order: 'asc' },
  });
  assert.equal(p.list, 'stocks');
  assert.equal(p.assetClass, 'equity');
  assert.equal(p.q, 'apple');
  assert.equal(p.limit, 5);
  assert.equal(p.order, 'asc');
});

test('filter and sort asset rows', () => {
  const rows = [
    {
      key: 'btc',
      ref: 'btc',
      assetId: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      assetClass: 'crypto',
      marketCap: 1_000_000,
    },
    {
      key: 'aapl',
      ref: 'aapl',
      assetId: 'apple',
      name: 'Apple',
      symbol: 'AAPL',
      assetClass: 'equity',
      marketCap: 500_000,
    },
  ];

  const equityOnly = filterAssetBoardRows(rows, { assetClass: 'equity', q: '' });
  assert.equal(equityOnly.length, 1);
  assert.equal(equityOnly[0].symbol, 'AAPL');

  const sorted = sortAssetBoardRows(rows, 'marketCap', 'desc');
  assert.equal(sorted[0].symbol, 'BTC');
});
