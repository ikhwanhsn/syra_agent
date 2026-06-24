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
  getResourceDescriptionFromUrl,
  getResourceMeta,
  getResourceName,
  getResourceSummary,
  humanizeResourcePathDescription,
  isPlaceholderResourceDescription,
  listCatalogCoverageGaps,
  resolveResourceDescription,
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
  assert.match(desc, /Syra x402 paid API at \/not-a-real-endpoint/);
  assert.equal(getResourceMeta('not-a-real-endpoint'), null);
});

test('humanizeResourcePathDescription formats partner paths', () => {
  const desc = humanizeResourcePathDescription('binance/spot/ticker/24hr');
  assert.match(desc, /Binance/);
  assert.match(desc, /\/binance\/spot\/ticker\/24hr/);
  assert.doesNotMatch(desc, /^https?:\/\//);
});

test('isPlaceholderResourceDescription detects URL-only copy', () => {
  const url = 'http://api.syraa.fun/health';
  assert.equal(isPlaceholderResourceDescription('', url), true);
  assert.equal(isPlaceholderResourceDescription(url, url), true);
  assert.equal(
    isPlaceholderResourceDescription('https://api.syraa.fun/health', 'http://api.syraa.fun/health'),
    true,
  );
  assert.equal(
    isPlaceholderResourceDescription('Minimal paid health check confirming Syra API', url),
    false,
  );
});

test('resolveResourceDescription prefers catalog over URL placeholder', () => {
  const url = 'http://api.syraa.fun/health';
  const resolved = resolveResourceDescription({ description: url, url });
  assert.equal(resolved, X402_RESOURCE_CATALOG.health.description);
  assert.equal(
    resolveResourceDescription({ resourcePath: '/health', url }),
    X402_RESOURCE_CATALOG.health.description,
  );
  assert.equal(getResourceDescriptionFromUrl(url), X402_RESOURCE_CATALOG.health.description);
});
