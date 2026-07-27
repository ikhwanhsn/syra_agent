/**
 * Base x402 gateway configuration — meet buyers where 93% of x402 volume settles.
 * Syra's product is Solana intelligence; Base is the primary payment rail for agent discovery.
 *
 * Default facilitator failover: Dexter → GoPlausible → PayAI (see labsFacilitatorFailover.js).
 * Prefer Dexter multi-chain accepts when healthy; Base remains the discovery priority.
 */
import { getPayaiPayToAddresses } from './payaiX402Networks.js';
import { getEnabledDexterNetworks } from './dexterX402Networks.js';
import { AMPERSEND_MARKETPLACE_NETWORK } from './x402Bazaar.js';
import { getPublicApiUrl } from './runtime.js';
import { BASE_USDC } from './settlement.js';
import { isB402Network } from './b402Networks.js';
import { isOkxX402Enabled, isOkxX402Network } from './okxX402Networks.js';

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
    facilitators: ['dexter', 'goplausible', 'payai', 'coinbase-cdp', 'thirdweb'],
    defaultFacilitatorFailover: ['dexter', 'goplausible', 'payai'],
    note: 'Same API surface as Solana — pay via Dexter (primary) with GoPlausible/PayAI failover',
  };
}

/**
 * Asset label for discovery (USDG on Robinhood, USDC elsewhere).
 * @param {{ id?: string, assetName?: string }} net
 */
function assetLabelForDexterNet(net) {
  if (net?.id === 'robinhood' || net?.assetName === 'Global Dollar') return 'USDG';
  return 'USDC';
}

/** Networks advertised in priority order for agent clients (Dexter-enabled mainnets + Base/Solana). */
export function getPreferredX402Networks() {
  const networks = [];
  let priority = 1;

  if (isBaseX402GatewayEnabled()) {
    networks.push({ caip2: BASE_CAIP2, label: 'Base', asset: 'USDC', priority: priority++ });
  }
  const solanaPayTo = getPayaiPayToAddresses().solanaPayTo;
  if (solanaPayTo) {
    networks.push({
      caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      label: 'Solana',
      asset: 'USDC',
      priority: priority++,
    });
  }

  // Advertise Dexter mainnets (skip Base/Solana duplicates, B402 BSC, OKX X Layer).
  const seen = new Set(networks.map((n) => n.caip2));
  for (const net of getEnabledDexterNetworks()) {
    if (net.testnet) continue;
    if (seen.has(net.caip2)) continue;
    if (isB402Network(net.caip2)) continue;
    if (isOkxX402Enabled() && isOkxX402Network(net.caip2)) continue;
    seen.add(net.caip2);
    networks.push({
      caip2: net.caip2,
      label: net.label,
      asset: assetLabelForDexterNet(net),
      priority: priority++,
      facilitator: 'dexter',
    });
  }

  return networks.sort((a, b) => a.priority - b.priority);
}
