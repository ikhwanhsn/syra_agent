import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGatewayOpenApi } from './gatewayOpenApi.js';

test('buildGatewayOpenApi advertises x402-only payment protocols (no empty MPP stubs)', () => {
  const doc = buildGatewayOpenApi();
  assert.equal(doc.openapi, '3.1.0');
  assert.equal(doc.info?.contact?.email, 'support@syraa.fun');
  assert.ok(doc.info?.['x-guidance']);

  let paidOps = 0;
  let postOps = 0;
  for (const methods of Object.values(doc.paths || {})) {
    for (const [method, op] of Object.entries(methods || {})) {
      if (!op || typeof op !== 'object') continue;
      if (method === 'post') postOps += 1;
      const xi = op['x-payment-info'];
      if (!xi) continue;
      paidOps += 1;
      assert.ok(Array.isArray(xi.protocols), 'protocols array required');
      assert.deepEqual(xi.protocols, [{ x402: {} }]);
      assert.equal(xi.price?.mode, 'fixed');
      assert.equal(xi.price?.currency, 'USD');
      assert.ok(typeof xi.price?.amount === 'string' && xi.price.amount.length > 0);
      assert.ok(op.responses?.['402'], 'paid ops need 402 response');
      if (method === 'get') {
        assert.ok(Array.isArray(op.parameters), 'GET ops always emit parameters array');
      }
    }
  }
  assert.ok(paidOps > 0);
  assert.equal(postOps, 0, 'gateway catalog prefers GET-only to stay under AgentCash route budget');

  const routeCount = Object.values(doc.paths || {}).reduce(
    (n, methods) => n + Object.keys(methods || {}).length,
    0,
  );
  assert.ok(routeCount <= 40, `route count ${routeCount} must be ≤40 for AgentCash L2_ROUTE_COUNT_HIGH`);
});

test('buildGatewayOpenApi health + insights declare empty parameters', () => {
  const doc = buildGatewayOpenApi();
  for (const p of [
    '/health',
    '/insights/network-health',
    '/insights/gas-oracle',
    '/insights/market-pulse',
    '/insights/token-metrics',
    '/insights/defi-tvl',
    '/insights/volatility-index',
  ]) {
    const get = doc.paths?.[p]?.get;
    assert.ok(get, `missing GET ${p}`);
    assert.deepEqual(get.parameters, []);
  }
});
