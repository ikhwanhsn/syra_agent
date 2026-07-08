/**
 * Registry of x402 Labs paid insight endpoints — shared by scheduler and management API.
 */

/** @typedef {{ id: string; path: string; priceUsd: number; weight: number; description: string }} LabX402Endpoint */

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
  },
]);

/**
 * @returns {LabX402Endpoint[]}
 */
export function listLabX402Endpoints() {
  return [...LAB_X402_ENDPOINTS];
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
