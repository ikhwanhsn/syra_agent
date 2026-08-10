/**
 * Unit-ish smoke for asset research param validation (no live Tokens key required).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAssetResearch } from './assetResearchService.js';

describe('buildAssetResearch', () => {
  it('requires assetId, ref, or mint', async () => {
    const out = await buildAssetResearch({});
    assert.equal(out.ok, false);
    assert.match(String(out.error), /assetId|ref|mint/i);
    assert.equal(out.status, 400);
  });
});
