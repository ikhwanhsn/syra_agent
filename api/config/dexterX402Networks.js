/**
 * Dexter facilitator (https://x402.dexter.cash) supported x402 v2 networks.
 * @see https://dexter.cash/facilitator
 * @see https://github.com/Dexter-DAO
 *
 * Networks align with Dexter GET /supported (v2 exact scheme). Override USDC per chain via env
 * e.g. POLYGON_USDC, OPTIMISM_USDC, AVALANCHE_USDC.
 */

import { sortX402AcceptNetworks } from "./x402NetworkOrder.js";

function env(name) {
  return String(process.env[name] || "").trim();
}

/** @typedef {'solana'|'evm'} DexterNetworkKind */

/**
 * @typedef {object} DexterX402Network
 * @property {string} id - Short id for X402_DEXTER_NETWORKS filter
 * @property {string} label
 * @property {string} caip2 - CAIP-2 network id (x402 v2)
 * @property {DexterNetworkKind} kind
 * @property {boolean} testnet
 * @property {string} usdc - USDC mint (Solana) or contract (EVM, 6 decimals)
 */

/** @type {readonly DexterX402Network[]} */
export const DEXTER_X402_NETWORKS = [
  {
    id: "solana-devnet",
    label: "Solana Devnet",
    caip2: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    kind: "solana",
    testnet: true,
    usdc: env("SOLANA_DEVNET_USDC") || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
  {
    id: "solana-mainnet",
    label: "Solana Mainnet",
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    kind: "solana",
    testnet: false,
    usdc: env("SOLANA_USDC_MINT") || env("USDC_MAINNET") || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  {
    id: "base",
    label: "Base",
    caip2: "eip155:8453",
    kind: "evm",
    testnet: false,
    usdc: env("BASE_USDC") || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  },
  {
    id: "base-sepolia",
    label: "Base Sepolia",
    caip2: "eip155:84532",
    kind: "evm",
    testnet: true,
    usdc: env("BASE_SEPOLIA_USDC") || "0x036CbD51842C2bd328CeDb96E7855982714B2771",
  },
  {
    id: "polygon",
    label: "Polygon",
    caip2: "eip155:137",
    kind: "evm",
    testnet: false,
    usdc: env("POLYGON_USDC") || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  {
    id: "arbitrum",
    label: "Arbitrum One",
    caip2: "eip155:42161",
    kind: "evm",
    testnet: false,
    usdc: env("ARBITRUM_USDC") || "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  {
    id: "optimism",
    label: "Optimism",
    caip2: "eip155:10",
    kind: "evm",
    testnet: false,
    usdc: env("OPTIMISM_USDC") || "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
  {
    id: "avalanche",
    label: "Avalanche",
    caip2: "eip155:43114",
    kind: "evm",
    testnet: false,
    usdc: env("AVALANCHE_USDC") || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  {
    id: "skale-europa",
    label: "SKALE Europa",
    caip2: "eip155:1187947933",
    kind: "evm",
    testnet: false,
    usdc: env("SKALE_USDC") || "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",
  },
  {
    id: "skale-base-sepolia",
    label: "SKALE Base Sepolia",
    caip2: "eip155:324705682",
    kind: "evm",
    testnet: true,
    usdc: env("SKALE_SEPOLIA_USDC") || "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD",
  },
];

const DEXTER_CAIP2_SET = new Set(DEXTER_X402_NETWORKS.map((n) => n.caip2));

/**
 * @param {string} caip2
 * @returns {DexterX402Network | undefined}
 */
export function getDexterNetworkByCaip2(caip2) {
  return DEXTER_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

/**
 * Whether Dexter facilitator lists this CAIP-2 network (v2 exact).
 * @param {string} network
 */
export function isDexterSupportedCaip2(network) {
  return DEXTER_CAIP2_SET.has(String(network || "").trim());
}

/**
 * Enabled networks for 402 accepts. Filter via:
 * - X402_DEXTER_NETWORKS=comma-separated ids (e.g. solana-mainnet,base,polygon)
 * - X402_DEXTER_INCLUDE_TESTNETS=false to drop testnets (default: include testnets in non-production)
 * @returns {DexterX402Network[]}
 */
export function getEnabledDexterNetworks() {
  const filterRaw = env("X402_DEXTER_NETWORKS");
  let list = DEXTER_X402_NETWORKS;
  if (filterRaw) {
    const allow = new Set(
      filterRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    list = list.filter((n) => allow.has(n.id));
  }
  const includeTestnetsEnv = env("X402_DEXTER_INCLUDE_TESTNETS").toLowerCase();
  const includeTestnets =
    includeTestnetsEnv === "true" ||
    includeTestnetsEnv === "1" ||
    (includeTestnetsEnv !== "false" &&
      includeTestnetsEnv !== "0" &&
      process.env.NODE_ENV !== "production");
  if (!includeTestnets) {
    list = list.filter((n) => !n.testnet);
  }
  return sortX402AcceptNetworks(list);
}

/**
 * Resolve payTo addresses for Dexter multi-network 402 offers.
 * @returns {{ solanaPayTo: string, evmPayTo: string }}
 */
export function getDexterPayToAddresses() {
  const solanaPayTo = env("SOLANA_PAYTO") || env("ADDRESS_PAYAI") || env("ADDRESS");
  const evmPayTo =
    env("EVM_PAYTO") || env("BASE_PAYTO") || env("BASE_ADDRESS") || env("EVM_ADDRESS");
  return { solanaPayTo, evmPayTo };
}

/**
 * USDC asset lookup for EVM money parser (ExactEvmScheme).
 * @param {string} caip2
 * @returns {string | null}
 */
export function getDexterEvmUsdcAsset(caip2) {
  const net = getDexterNetworkByCaip2(caip2);
  return net?.kind === "evm" ? net.usdc : null;
}
