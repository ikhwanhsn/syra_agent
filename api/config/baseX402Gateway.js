/**
 * Base x402 gateway configuration — meet buyers where 93% of x402 volume settles.
 * Syra's product is Solana intelligence; Base is the primary payment rail for agent discovery.
 */
import { getPayaiPayToAddresses } from './payaiX402Networks.js';
import { AMPERSEND_MARKETPLACE_NETWORK } from './x402Bazaar.js';
import { getPublicApiUrl } from './runtime.js';
import { BASE_USDC } from './settlement.js';

const BASE_CAIP2 = 'eip155:8453';

/** Base gateway enabled when EVM payTo is configured. */
export function isBaseX402GatewayEnabled() {
  const { evmPayTo } = getPayaiPayToAddresses();
  return Boolean(evmPayTo);
}

/** Public Base gateway metadata for discovery manifests and registry scripts. */
export function getBaseX402GatewayConfig() {
  const { evmPayTo } = getPayaiPayToAddresses();
  const baseUrl = getPublicApiUrl();
  return {
    enabled: isBaseX402GatewayEnabled(),
    network: BASE_CAIP2,
    networkLabel: 'Base Mainnet',
    asset: BASE_USDC,
    assetLabel: 'USDC',
    payTo: evmPayTo || null,
    gatewayUrl: baseUrl.replace(/\/+$/, ''),
    discoveryUrl: `${baseUrl.replace(/\/+$/, '')}/.well-known/x402`,
    openapiUrl: `${baseUrl.replace(/\/+$/, '')}/openapi.json`,
    bazaarNetwork: AMPERSEND_MARKETPLACE_NETWORK,
    facilitators: ['coinbase-cdp', 'payai', 'thirdweb'],
    note: 'Same API surface as Solana — pay with Base USDC via x402 v2',
  };
}

/** Networks advertised in priority order for agent clients. */
export function getPreferredX402Networks() {
  const networks = [];
  if (isBaseX402GatewayEnabled()) {
    networks.push({ caip2: BASE_CAIP2, label: 'Base', asset: 'USDC', priority: 1 });
  }
  const solanaPayTo = getPayaiPayToAddresses().solanaPayTo;
  if (solanaPayTo) {
    networks.push({
      caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      label: 'Solana',
      asset: 'USDC',
      priority: 2,
    });
  }
  return networks.sort((a, b) => a.priority - b.priority);
}
