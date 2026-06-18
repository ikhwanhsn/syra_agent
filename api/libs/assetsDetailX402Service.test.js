/**
 * Assets detail x402 lookup parsing.
 * Run: node --test api/libs/assetsDetailX402Service.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAssetsDetailX402Request } from './assetsDetailX402Service.js';

test('parseAssetsDetailX402Request ref', () => {
  const p = parseAssetsDetailX402Request({ method: 'GET', query: { ref: 'btc' } });
  assert.deepEqual(p, { ref: 'btc' });
});

test('parseAssetsDetailX402Request mint from q', () => {
  const mint = 'So11111111111111111111111111111111111111112';
  const p = parseAssetsDetailX402Request({ method: 'GET', query: { q: mint } });
  assert.deepEqual(p, { mint });
});

test('parseAssetsDetailX402Request requires lookup', () => {
  assert.throws(
    () => parseAssetsDetailX402Request({ method: 'GET', query: {} }),
    /Provide ref, mint, assetId, or q/,
  );
});
