/**
 * agenteconomy service — cache + summary shaping (mocked fetch).
 * Run: node --test api/libs/agentEconomyService.test.js
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  _clearAgentEconomyCacheForTests,
  fetchOnChainFeed,
  getFreshness,
  getSummary,
  AGENT_ECONOMY_ON_CHAIN_URL,
  AGENT_ECONOMY_OFF_CHAIN_URL,
} from './agentEconomyService.js';

const ON_CHAIN = {
  updatedAt: '2026-08-18T00:00:00.000Z',
  x402: {
    totalTxs: 150_000_000,
    totalVolume: 40_700_000,
    facilitatorsTracked: 12,
    chainsTracked: 8,
  },
  erc8004Registry: {
    totalAgents: 42_000,
    chainsTracked: 5,
  },
};

const OFF_CHAIN = {
  updatedAt: '2026-08-18T01:00:00.000Z',
  schema: 2,
  x402Services: {
    asOf: '2026-08-17T12:00:00.000Z',
    uniqueProviders: 904,
    totalListings: 12_000,
  },
  agentSupply: {
    asOf: '2026-08-17T13:00:00.000Z',
    officialMcpServers: 11_644,
  },
  devAdoption: {
    asOf: '2026-08-17T14:00:00.000Z',
    totalWeeklyAvg4w: 418_549,
  },
};

describe('agentEconomyService', () => {
  /** @type {typeof globalThis.fetch} */
  let originalFetch;
  /** @type {string[]} */
  let urls;

  beforeEach(() => {
    _clearAgentEconomyCacheForTests();
    originalFetch = globalThis.fetch;
    urls = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      if (url === AGENT_ECONOMY_ON_CHAIN_URL) {
        return new Response(JSON.stringify(ON_CHAIN), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url === AGENT_ECONOMY_OFF_CHAIN_URL) {
        return new Response(JSON.stringify(OFF_CHAIN), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('not found', { status: 404 });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    _clearAgentEconomyCacheForTests();
  });

  it('fetchOnChainFeed wraps attribution and caches', async () => {
    const first = await fetchOnChainFeed();
    assert.equal(first.source, 'agenteconomy.to');
    assert.equal(first.upstreamUrl, AGENT_ECONOMY_ON_CHAIN_URL);
    assert.equal(first.feed.x402.totalTxs, 150_000_000);
    assert.ok(typeof first.fetchedAt === 'string');

    const second = await fetchOnChainFeed();
    assert.equal(second.feed.x402.totalTxs, 150_000_000);
    assert.equal(urls.filter((u) => u === AGENT_ECONOMY_ON_CHAIN_URL).length, 1);
  });

  it('getSummary shapes Syra-relevant headlines', async () => {
    const summary = await getSummary();
    assert.equal(summary.success, true);
    assert.equal(summary.source, 'agenteconomy.to');
    assert.equal(summary.x402.totalTxs, 150_000_000);
    assert.equal(summary.x402.totalVolumeUsd, 40_700_000);
    assert.equal(summary.erc8004.totalAgents, 42_000);
    assert.equal(summary.x402Services.uniqueProviders, 904);
    assert.equal(summary.agentSupply.officialMcpServers, 11_644);
    assert.equal(summary.devAdoption.totalWeeklyAvg4w, 418_549);
    assert.match(summary.note, /Not Syra first-party/);
  });

  it('getFreshness returns dual-feed ages and section asOf', async () => {
    const freshness = await getFreshness();
    assert.equal(freshness.onChain.updatedAt, ON_CHAIN.updatedAt);
    assert.equal(freshness.offChain.updatedAt, OFF_CHAIN.updatedAt);
    assert.equal(freshness.offChain.sectionAsOf.x402Services, OFF_CHAIN.x402Services.asOf);
    assert.equal(freshness.offChain.schema, 2);
  });
});
