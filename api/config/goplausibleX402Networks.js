/**
 * GoPlausible facilitator Solana + Base x402 v2 networks.
 * @see https://facilitator.goplausible.xyz/supported
 * @see https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md
 *
 * GoPlausible also handles Algorand AVM (see algorandX402Networks.js). This module covers
 * SVM/EVM only for Labs Solana/Base failover (Dexter → GoPlausible → PayAI).
 */

import { sortX402AcceptNetworks } from "./x402NetworkOrder.js";
import {
  DEFAULT_GOPLAUSIBLE_FACILITATOR_URL,
  getGoplausibleFacilitatorUrl,
} from "./algorandX402Networks.js";

function env(name) {
  return String(process.env[name] || "").trim();
}

/** @typedef {'solana'|'evm'} GoplausibleNetworkKind */

/**
 * @typedef {object} GoplausibleX402Network
 * @property {string} id - Short id for X402_GOPLAUSIBLE_NETWORKS filter
 * @property {string} label
 * @property {string} caip2 - CAIP-2 network id (x402 v2)
 * @property {GoplausibleNetworkKind} kind
 * @property {boolean} testnet
 * @property {string} usdc - USDC mint (Solana) or contract (EVM, 6 decimals)
 */

/** @type {readonly GoplausibleX402Network[]} */
export const GOPLAUSIBLE_X402_NETWORKS = [
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
];

const GOPLAUSIBLE_CAIP2_SET = new Set(GOPLAUSIBLE_X402_NETWORKS.map((n) => n.caip2));

/**
 * @param {string} caip2
 * @returns {GoplausibleX402Network | undefined}
 */
export function getGoplausibleNetworkByCaip2(caip2) {
  return GOPLAUSIBLE_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

/**
 * Whether GoPlausible facilitator lists this CAIP-2 network (v2 exact).
 * @param {string} network
 */
export function isGoplausibleSupportedCaip2(network) {
  return GOPLAUSIBLE_CAIP2_SET.has(String(network || "").trim());
}

/**
 * Enabled networks for 402 accepts. Filter via:
 * - X402_GOPLAUSIBLE_NETWORKS=comma-separated ids (e.g. solana-mainnet,base)
 * - X402_GOPLAUSIBLE_INCLUDE_TESTNETS=false to drop testnets (default: include testnets in non-production)
 * @returns {GoplausibleX402Network[]}
 */
export function getEnabledGoplausibleNetworks() {
  const filterRaw = env("X402_GOPLAUSIBLE_NETWORKS");
  let list = GOPLAUSIBLE_X402_NETWORKS;
  if (filterRaw) {
    const allow = new Set(
      filterRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    list = list.filter((n) => allow.has(n.id));
  }
  const includeTestnetsEnv = env("X402_GOPLAUSIBLE_INCLUDE_TESTNETS").toLowerCase();
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
 * Resolve payTo addresses for GoPlausible multi-network 402 offers.
 * Same merchant wallets as PayAI / Dexter.
 * @returns {{ solanaPayTo: string, evmPayTo: string }}
 */
export function getGoplausiblePayToAddresses() {
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
export function getGoplausibleEvmUsdcAsset(caip2) {
  const net = getGoplausibleNetworkByCaip2(caip2);
  return net?.kind === "evm" ? net.usdc : null;
}

export { DEFAULT_GOPLAUSIBLE_FACILITATOR_URL, getGoplausibleFacilitatorUrl };
