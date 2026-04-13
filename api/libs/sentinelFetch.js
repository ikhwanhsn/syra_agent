/**
 * Sentinel (sentinel.valeocash.com) integration for x402 audit & compliance.
 * When enabled (SENTINEL_ENABLED=true), wraps fetch for audit/budget. Otherwise plain fetch.
 * @see https://sentinel.valeocash.com/docs
 */
import { wrapWithSentinel, standardPolicy, unlimitedPolicy, SentinelBudgetError } from '@x402sentinel/x402';
import { getSentinelStorage } from './sentinelStorage.js';
import { isSentinelEnabled } from './sentinelConfig.js';

export { SentinelBudgetError };

const cache = new Map();

/**
 * Get a Sentinel-wrapped fetch for the given agent id, or plain `fetch` when Sentinel is off.
 *
 * @param {string} [agentId] - Agent identifier (e.g. anonymousId for user agent, 'treasury' for treasury wallet). Defaults to SENTINEL_AGENT_ID env or 'syra-api'.
 * @param {{ budget?: boolean }} [opts] - If budget: true, use standardPolicy() for per-call/hour/day limits. Default: audit only (unlimitedPolicy).
 * @returns {typeof fetch}
 */
export function getSentinelFetch(agentId, opts = {}) {
  if (!isSentinelEnabled()) {
    return globalThis.fetch;
  }
  const id = agentId || process.env.SENTINEL_AGENT_ID || 'syra-api';
  const useBudget = opts.budget !== false;
  const cacheKey = `${id}:${useBudget}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const baseFetch = globalThis.fetch;
  const wrapped = wrapWithSentinel(baseFetch, {
    agentId: id,
    budget: useBudget ? standardPolicy() : unlimitedPolicy(),
    audit: { enabled: true, storage: getSentinelStorage() },
  });
  cache.set(cacheKey, wrapped);
  return wrapped;
}

/**
 * Default fetch for the API when Sentinel is on; otherwise same as global fetch.
 */
export const sentinelFetch = getSentinelFetch(undefined, { budget: true });
