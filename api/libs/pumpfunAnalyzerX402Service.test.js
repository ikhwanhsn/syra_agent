/**
 * pump.fun analyzer x402 mint parsing.
 * Run: node --test api/libs/pumpfunAnalyzerX402Service.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePumpfunAnalyzerX402Request } from './pumpfunAnalyzerX402Service.js';

const SAMPLE_MINT = '8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump';

test('parsePumpfunAnalyzerX402Request mint param', () => {
  const p = parsePumpfunAnalyzerX402Request({ method: 'GET', query: { mint: SAMPLE_MINT } });
  assert.equal(p.mint, SAMPLE_MINT);
});

test('parsePumpfunAnalyzerX402Request mint from q', () => {
  const p = parsePumpfunAnalyzerX402Request({ method: 'GET', query: { q: SAMPLE_MINT } });
  assert.equal(p.mint, SAMPLE_MINT);
});

test('parsePumpfunAnalyzerX402Request requires valid mint', () => {
  assert.throws(
    () => parsePumpfunAnalyzerX402Request({ method: 'GET', query: {} }),
    /valid Solana mint/,
  );
  assert.throws(
    () => parsePumpfunAnalyzerX402Request({ method: 'GET', query: { mint: 'not-a-mint' } }),
    /valid Solana mint/,
  );
});
