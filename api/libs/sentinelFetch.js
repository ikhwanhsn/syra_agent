/**
 * Sentinel (sentinel.valeocash.com) integration for x402 audit & compliance.
 * Wraps fetch so every x402 payment is tracked; optional budget enforcement and per-agent audit.
 * Uses shared storage so SentinelDashboard can query audit data locally.
 * @see https://sentinel.valeocash.com/docs
 * @see https://sentinel.valeocash.com/docs/dashboard/overview
 */
import { wrapWithSentinel, standardPolicy, unlimitedPolicy, SentinelBudgetError } from '@x402sentinel/x402';
import { getSentinelStorage } from './sentinelStorage.js';

export { SentinelBudgetError };

const cache = new Map();

/**
 * Get a Sentinel-wrapped fetch for the given agent id.
 * Use this for all outbound x402 calls so payments are audited (and optionally budget-limited).
 * Audit records are written to the shared storage used by getSentinelDashboard().
 *
 * @param {string} [agentId] - Agent identifier (e.g. anonymousId for user agent, 'treasury' for treasury wallet). Defaults to SENTINEL_AGENT_ID env or 'syra-api'.
 * @param {{ budget?: boolean }} [opts] - If budget: true, use standardPolicy() for per-call/hour/day limits. Default: audit only (unlimitedPolicy).
 * @returns {typeof fetch}
 */
export function getSentinelFetch(agentId, opts = {}) {
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
 * Default Sentinel fetch for the API (single agent id from env).
 * Use getSentinelFetch(agentId) when you have a specific agent (e.g. anonymousId or 'treasury').
 */
export const sentinelFetch = getSentinelFetch(undefined, { budget: true });
