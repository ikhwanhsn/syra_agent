/**
 * Catalog coverage for x402 discovery endpoints.
 * Run: node --test api/config/x402ResourceCatalog.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { X402_DISCOVERY_RESOURCE_PATHS } from './x402DiscoveryResourcePaths.js';
import {
  X402_RESOURCE_CATALOG,
  getResourceDescription,
  getResourceMeta,
  getResourceName,
  getResourceSummary,
  listCatalogCoverageGaps,
} from './x402ResourceCatalog.js';

test('every discovery segment has a catalog entry', () => {
  const gaps = listCatalogCoverageGaps();
  assert.deepEqual(
    gaps,
    [],
    `Missing catalog entries for: ${gaps.join(', ') || '(none)'}`,
  );
  assert.equal(
    Object.keys(X402_RESOURCE_CATALOG).length,
    X402_DISCOVERY_RESOURCE_PATHS.length,
  );
});

test('catalog entries have required agent metadata', () => {
  for (const segment of X402_DISCOVERY_RESOURCE_PATHS) {
    const meta = getResourceMeta(segment);
    assert.ok(meta, `expected meta for ${segment}`);
    assert.ok(meta.name?.trim(), `${segment}: name required`);
    assert.ok(meta.summary?.trim(), `${segment}: summary required`);
    assert.ok(meta.description?.trim(), `${segment}: description required`);
    assert.ok(meta.description.length >= 80, `${segment}: description too short`);
    assert.ok(
      /use when/i.test(meta.description),
      `${segment}: description should include "Use when" guidance`,
    );
    assert.ok(Array.isArray(meta.methods) && meta.methods.length > 0, `${segment}: methods required`);
    assert.ok(
      typeof meta.suggestedPriceStx === 'number' && meta.suggestedPriceStx > 0,
      `${segment}: suggestedPriceStx required`,
    );
  }
});

test('helpers resolve discovery segments', () => {
  for (const segment of X402_DISCOVERY_RESOURCE_PATHS) {
    assert.equal(getResourceName(segment), X402_RESOURCE_CATALOG[segment].name);
    assert.equal(getResourceSummary(segment), X402_RESOURCE_CATALOG[segment].summary);
    assert.equal(getResourceDescription(segment), X402_RESOURCE_CATALOG[segment].description);
  }
});

test('unknown segment falls back gracefully', () => {
  const desc = getResourceDescription('not-a-real-endpoint');
  assert.match(desc, /Syra x402 resource/);
  assert.equal(getResourceMeta('not-a-real-endpoint'), null);
});
