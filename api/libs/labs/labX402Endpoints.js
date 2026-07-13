/**
 * Registry of x402 Labs paid insight endpoints — shared by scheduler and management API.
 */
import { checkPayaiEndpointDailyBudget } from './labPayaiEndpointDailyLimit.js';

/** @typedef {'dexter' | 'payai'} LabX402Facilitator */

/**
 * @typedef {{
 *   id: string;
 *   path: string;
 *   priceUsd: number;
 *   weight: number;
 *   description: string;
 *   facilitator?: LabX402Facilitator;
 *   dailyLimitMin?: number;
 *   dailyLimitMax?: number;
 * }} LabX402Endpoint
 */

/** @type {readonly LabX402Endpoint[]} */
export const LAB_X402_ENDPOINTS = Object.freeze([
  {
    id: 'network-health',
    path: '/insights/network-health',
    priceUsd: 0.01,
    weight: 2,
    description: 'Solana network health metrics — slot, epoch, TPS, priority fees',
  },
  {
    id: 'gas-oracle',
    path: '/insights/gas-oracle',
    priceUsd: 0.01,
    weight: 2,
    description: 'Solana priority fee oracle — percentile estimates for transaction inclusion',
  },
  {
    id: 'market-pulse',
    path: '/insights/market-pulse',
    priceUsd: 0.02,
    weight: 2,
    description: 'Cross-asset market pulse — SOL, BTC, ETH oracle prices via Pyth',
  },
  {
    id: 'token-metrics',
    path: '/insights/token-metrics',
    priceUsd: 0.03,
    weight: 1,
    description: 'Token liquidity metrics — volume, price change, pair data via DexScreener',
  },
  {
    id: 'defi-tvl',
    path: '/insights/defi-tvl',
    priceUsd: 0.05,
    weight: 1,
    description: 'Solana DeFi TVL overview — protocol and chain aggregate from DefiLlama',
  },
  {
    id: 'volatility-index',
    path: '/insights/volatility-index',
    priceUsd: 0.1,
    weight: 1,
    description: 'Volatility index — computed from major asset price feeds',
    facilitator: 'dexter',
  },
  {
    id: 'ecosystem-brief',
    path: '/insights/ecosystem-brief',
    priceUsd: 0.05,
    weight: 1,
    description: 'Premium Solana ecosystem brief — network, market pulse, and DeFi TVL (PayAI, 5–10 calls/day)',
    facilitator: 'payai',
    dailyLimitMin: 5,
    dailyLimitMax: 10,
  },
]);

/**
 * @returns {LabX402Endpoint[]}
 */
export function listLabX402Endpoints() {
  return [...LAB_X402_ENDPOINTS];
}

/**
 * Endpoints enriched with PayAI daily quota status for the Labs UI.
 * @returns {Promise<(LabX402Endpoint & { dailyQuota?: { count: number; max: number; allowed: boolean; day: string } })[]>}
 */
export async function listLabX402EndpointsWithQuota() {
  return Promise.all(
    LAB_X402_ENDPOINTS.map(async (ep) => {
      if (ep.facilitator !== 'payai') return { ...ep };
      const budget = await checkPayaiEndpointDailyBudget(
        ep.id,
        ep.dailyLimitMin ?? 5,
        ep.dailyLimitMax ?? 10,
      );
      return {
        ...ep,
        dailyQuota: {
          count: budget.count,
          max: budget.max,
          allowed: budget.allowed,
          day: budget.day,
        },
      };
    }),
  );
}

/**
 * Pick a random endpoint weighted by `weight`.
 * @returns {LabX402Endpoint}
 */
export function pickRandomLabX402Endpoint() {
  const total = LAB_X402_ENDPOINTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const ep of LAB_X402_ENDPOINTS) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return LAB_X402_ENDPOINTS[LAB_X402_ENDPOINTS.length - 1];
}

/**
 * Filter PayAI endpoints that have exhausted their daily quota.
 * @param {LabX402Endpoint[]} endpoints
 * @returns {Promise<LabX402Endpoint[]>}
 */
async function filterAvailableEndpoints(endpoints) {
  const checks = await Promise.all(
    endpoints.map(async (ep) => {
      if (ep.facilitator !== 'payai') return { ep, allowed: true };
      const budget = await checkPayaiEndpointDailyBudget(
        ep.id,
        ep.dailyLimitMin ?? 5,
        ep.dailyLimitMax ?? 10,
      );
      return { ep, allowed: budget.allowed };
    }),
  );
  return checks.filter((c) => c.allowed).map((c) => c.ep);
}

/**
 * Pick a random endpoint weighted by `weight`, excluding PayAI routes at daily quota.
 * On Base/Celo, PayAI-facilitated routes are skipped.
 * @param {{ chain?: 'solana' | 'base' | 'celo' }} [opts]
 * @returns {Promise<LabX402Endpoint>}
 */
export async function pickRandomAvailableLabX402Endpoint(opts = {}) {
  const chain =
    opts.chain === 'base' ? 'base' : opts.chain === 'celo' ? 'celo' : 'solana';
  const candidates =
    chain === 'base' || chain === 'celo'
      ? LAB_X402_ENDPOINTS.filter((e) => e.facilitator !== 'payai')
      : [...LAB_X402_ENDPOINTS];
  const available = await filterAvailableEndpoints(candidates);
  const pool = available.length > 0 ? available : candidates.length > 0 ? candidates : [...LAB_X402_ENDPOINTS];
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const ep of pool) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return pool[pool.length - 1];
}

/**
 * @param {string} pathOrId
 * @returns {LabX402Endpoint | null}
 */
export function findLabX402Endpoint(pathOrId) {
  const key = String(pathOrId || '').trim();
  return (
    LAB_X402_ENDPOINTS.find((e) => e.id === key || e.path === key || e.path.endsWith(`/${key}`)) ??
    null
  );
}

/**
 * @returns {number}
 */
export function getMaxLabX402PriceUsd() {
  if (LAB_X402_ENDPOINTS.length === 0) return 0.1;
  return Math.max(...LAB_X402_ENDPOINTS.map((e) => e.priceUsd));
}

/**
 * Cheapest endpoint price — the minimum USDC a payer needs to make any call.
 * @returns {number}
 */
export function getMinLabX402PriceUsd() {
  if (LAB_X402_ENDPOINTS.length === 0) return 0.01;
  return Math.min(...LAB_X402_ENDPOINTS.map((e) => e.priceUsd));
}

/**
 * @returns {number}
 */
export function getWeightedAvgLabX402PriceUsd() {
  const totalWeight = LAB_X402_ENDPOINTS.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0) return 0.029;
  const sum = LAB_X402_ENDPOINTS.reduce((s, e) => s + e.priceUsd * e.weight, 0);
  return sum / totalWeight;
}
