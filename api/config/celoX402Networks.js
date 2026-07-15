/**
 * Celo mainnet x402 network config.
 * Hackathon x402_* leaderboard metrics only count settlements submitted by
 * api.x402.celo.org (attributed via registered payTo / agentWalletAddress).
 * Tagged Schema 2 calldata is for Track 1 revenue volume on direct transfers.
 * @see https://docs.celo.org/build-on-celo/build-with-ai/x402
 * @see https://x402.celo.org/
 */

import { sortX402AcceptNetworks } from './x402NetworkOrder.js';

function env(name) {
  return String(process.env[name] || '').trim();
}

/**
 * API key from https://x402.celo.org (X-API-Key). Required for /settle credits.
 * @returns {string}
 */
export function getCeloFacilitatorApiKey() {
  return env('CELO_FACILITATOR_API_KEY') || env('X402_CELO_API_KEY');
}

/** @typedef {'evm'} CeloNetworkKind */

/**
 * @typedef {object} CeloX402Network
 * @property {string} id
 * @property {string} label
 * @property {string} caip2
 * @property {CeloNetworkKind} kind
 * @property {boolean} testnet
 * @property {string} usdc
 * @property {number} decimals
 * @property {{ name: string; version: string }} eip712
 */

export const CELO_MAINNET_CAIP2 = 'eip155:42220';
export const CELO_MAINNET_CHAIN_ID = 42220;
export const CELO_USDC_MAINNET =
  env('CELO_USDC') || '0xcebA9300f2b948710d2653dD7B07f33A8B32118C';
export const CELO_FACILITATOR_URL = env('CELO_FACILITATOR_URL') || 'https://api.x402.celo.org';
export const CELO_EXPLORER_TX = 'https://celoscan.io/tx';

/** @type {readonly CeloX402Network[]} */
export const CELO_X402_NETWORKS = [
  {
    id: 'celo',
    label: 'Celo Mainnet',
    caip2: CELO_MAINNET_CAIP2,
    kind: 'evm',
    testnet: false,
    usdc: CELO_USDC_MAINNET,
    decimals: 6,
    eip712: { name: 'USDC', version: '2' },
  },
];

/**
 * @returns {string}
 */
export function getCeloRpcUrl() {
  return env('CELO_RPC_URL') || 'https://forno.celo.org';
}

/**
 * @param {string} caip2
 * @returns {CeloX402Network | undefined}
 */
export function getCeloNetworkByCaip2(caip2) {
  return CELO_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

/**
 * @param {string} caip2
 * @returns {string | null}
 */
export function getCeloEvmUsdcAsset(caip2) {
  const net = getCeloNetworkByCaip2(caip2);
  return net?.kind === 'evm' ? net.usdc : null;
}

/**
 * @returns {CeloX402Network[]}
 */
export function getEnabledCeloNetworks() {
  return sortX402AcceptNetworks([...CELO_X402_NETWORKS]);
}

/**
 * @returns {{ solanaPayTo: string; evmPayTo: string }}
 */
export function getCeloPayToAddresses() {
  const evmPayTo =
    env('CELO_PAYTO') || env('EVM_PAYTO') || env('BASE_PAYTO') || env('EVM_ADDRESS');
  return { solanaPayTo: '', evmPayTo };
}

/**
 * @returns {string}
 */
export function getCeloAttributionTag() {
  return env('CELO_ATTRIBUTION_TAG');
}
