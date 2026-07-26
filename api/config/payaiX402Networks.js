/**
 * PayAI facilitator (https://facilitator.payai.network) supported x402 v2 networks.
 * @see https://docs.payai.network/x402/supported-networks
 *
 * USDC + payTo addresses come from settlement.js (not env).
 */

import { sortX402AcceptNetworks } from "./x402NetworkOrder.js";
import { isProduction } from "./runtime.js";
import {
  SOLANA_DEVNET_USDC,
  SOLANA_USDC_MINT,
  BASE_USDC,
  BASE_SEPOLIA_USDC,
  POLYGON_USDC,
  POLYGON_AMOY_USDC,
  ARBITRUM_USDC,
  ARBITRUM_SEPOLIA_USDC,
  getPayToAddresses,
} from "./settlement.js";

/** @typedef {'solana'|'evm'} PayaiNetworkKind */

/**
 * @typedef {object} PayaiX402Network
 * @property {string} id
 * @property {string} v1Network
 * @property {string} label
 * @property {string} caip2
 * @property {PayaiNetworkKind} kind
 * @property {boolean} testnet
 * @property {string} usdc
 */

/** @type {readonly PayaiX402Network[]} */
export const PAYAI_X402_NETWORKS = [
  {
    id: "solana-devnet",
    v1Network: "solana-devnet",
    label: "Solana Devnet",
    caip2: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    kind: "solana",
    testnet: true,
    usdc: SOLANA_DEVNET_USDC,
  },
  {
    id: "solana-mainnet",
    v1Network: "solana",
    label: "Solana",
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    kind: "solana",
    testnet: false,
    usdc: SOLANA_USDC_MINT,
  },
  {
    id: "base",
    v1Network: "base",
    label: "Base",
    caip2: "eip155:8453",
    kind: "evm",
    testnet: false,
    usdc: BASE_USDC,
  },
  {
    id: "base-sepolia",
    v1Network: "base-sepolia",
    label: "Base Sepolia",
    caip2: "eip155:84532",
    kind: "evm",
    testnet: true,
    usdc: BASE_SEPOLIA_USDC,
  },
  {
    id: "polygon",
    v1Network: "polygon",
    label: "Polygon",
    caip2: "eip155:137",
    kind: "evm",
    testnet: false,
    usdc: POLYGON_USDC,
  },
  {
    id: "polygon-amoy",
    v1Network: "polygon-amoy",
    label: "Polygon Amoy",
    caip2: "eip155:80002",
    kind: "evm",
    testnet: true,
    usdc: POLYGON_AMOY_USDC,
  },
  {
    id: "arbitrum",
    v1Network: "arbitrum",
    label: "Arbitrum One",
    caip2: "eip155:42161",
    kind: "evm",
    testnet: false,
    usdc: ARBITRUM_USDC,
  },
  {
    id: "arbitrum-sepolia",
    v1Network: "arbitrum-sepolia",
    label: "Arbitrum Sepolia",
    caip2: "eip155:421614",
    kind: "evm",
    testnet: true,
    usdc: ARBITRUM_SEPOLIA_USDC,
  },
  {
    id: "avalanche",
    v1Network: "avalanche",
    label: "Avalanche",
    caip2: "eip155:43114",
    kind: "evm",
    testnet: false,
    usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  {
    id: "avalanche-fuji",
    v1Network: "avalanche-fuji",
    label: "Avalanche Fuji",
    caip2: "eip155:43113",
    kind: "evm",
    testnet: true,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
  },
  {
    id: "sei",
    v1Network: "sei",
    label: "Sei",
    caip2: "eip155:1329",
    kind: "evm",
    testnet: false,
    usdc: "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1",
  },
  {
    id: "sei-testnet",
    v1Network: "sei-testnet",
    label: "Sei Testnet",
    caip2: "eip155:713715",
    kind: "evm",
    testnet: true,
    usdc: "0x4E4a29f76cD0dFf2A4e5E56d7a065E0aF33f32e2",
  },
  {
    id: "skale-base",
    v1Network: "skale-base",
    label: "SKALE Base",
    caip2: "eip155:1187947933",
    kind: "evm",
    testnet: false,
    usdc: "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",
  },
  {
    id: "skale-base-sepolia",
    v1Network: "skale-base-sepolia",
    label: "SKALE Base Sepolia",
    caip2: "eip155:324705682",
    kind: "evm",
    testnet: true,
    usdc: "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD",
  },
  {
    id: "xlayer",
    v1Network: "xlayer",
    label: "X Layer",
    caip2: "eip155:196",
    kind: "evm",
    testnet: false,
    usdc: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
  },
  {
    id: "xlayer-testnet",
    v1Network: "xlayer-testnet",
    label: "X Layer Testnet",
    caip2: "eip155:1952",
    kind: "evm",
    testnet: true,
    usdc: "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d",
  },
];

const PAYAI_CAIP2_SET = new Set(PAYAI_X402_NETWORKS.map((n) => n.caip2));

/**
 * @param {string} caip2
 * @returns {PayaiX402Network | undefined}
 */
export function getPayaiNetworkByCaip2(caip2) {
  return PAYAI_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

/**
 * @param {string} network
 */
export function isPayaiSupportedCaip2(network) {
  return PAYAI_CAIP2_SET.has(String(network || "").trim());
}

/**
 * Enabled networks for 402 accepts.
 * Production drops testnets; non-prod includes them.
 * @returns {PayaiX402Network[]}
 */
export function getEnabledPayaiNetworks() {
  let list = PAYAI_X402_NETWORKS.filter((n) => Boolean(n.usdc));
  if (isProduction()) {
    list = list.filter((n) => !n.testnet);
  }
  return sortX402AcceptNetworks(list);
}

/**
 * Resolve payTo addresses for PayAI multi-network 402 offers.
 * @returns {{ solanaPayTo: string, evmPayTo: string }}
 */
export function getPayaiPayToAddresses() {
  return getPayToAddresses();
}

/**
 * @param {string} caip2
 * @returns {string | null}
 */
export function getPayaiEvmUsdcAsset(caip2) {
  const net = getPayaiNetworkByCaip2(caip2);
  return net?.kind === "evm" && net.usdc ? net.usdc : null;
}
