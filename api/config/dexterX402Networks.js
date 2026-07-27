/**
 * Dexter facilitator (https://x402.dexter.cash) supported x402 v2 networks.
 * @see https://dexter.cash/facilitator
 * @see https://github.com/Dexter-DAO
 *
 * Networks align with Dexter GET /supported (v2 exact scheme). Override USDC/USDG per chain via env
 * e.g. POLYGON_USDC, OPTIMISM_USDC, AVALANCHE_USDC, WORLDCHAIN_USDC, MONAD_USDC, ROBINHOOD_USDG, BSC_USDC.
 *
 * Note: eip155:56 (BNB) is listed for Dexter parity but Syra settles BSC via the B402 (Binance)
 * rail — payment builders exclude it from Dexter accepts to avoid double offers.
 */

import { sortX402AcceptNetworks } from "./x402NetworkOrder.js";
import { getPayToAddresses } from "./settlement.js";

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
 * @property {string} usdc - USDC mint (Solana) or ERC-20 contract (EVM); Robinhood uses USDG
 * @property {number} [decimals] - Token decimals (default 6; BNB USDC is 18)
 * @property {string} [assetName] - EIP-712 domain name override (e.g. "Global Dollar" for USDG)
 * @property {string} [assetVersion] - EIP-712 domain version override
 */

/** Default USDC/stablecoin decimals for Dexter Exact scheme. */
export const DEXTER_DEFAULT_DECIMALS = 6;

/** @type {readonly DexterX402Network[]} */
export const DEXTER_X402_NETWORKS = [
  {
    id: "solana-devnet",
    label: "Solana Devnet",
    caip2: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    kind: "solana",
    testnet: true,
    usdc: env("SOLANA_DEVNET_USDC") || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    decimals: 6,
  },
  {
    id: "solana-mainnet",
    label: "Solana Mainnet",
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    kind: "solana",
    testnet: false,
    usdc: env("SOLANA_USDC_MINT") || env("USDC_MAINNET") || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  {
    id: "base",
    label: "Base",
    caip2: "eip155:8453",
    kind: "evm",
    testnet: false,
    usdc: env("BASE_USDC") || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    decimals: 6,
  },
  {
    id: "base-sepolia",
    label: "Base Sepolia",
    caip2: "eip155:84532",
    kind: "evm",
    testnet: true,
    usdc: env("BASE_SEPOLIA_USDC") || "0x036CbD51842C2bd328CeDb96E7855982714B2771",
    decimals: 6,
  },
  {
    id: "polygon",
    label: "Polygon",
    caip2: "eip155:137",
    kind: "evm",
    testnet: false,
    usdc: env("POLYGON_USDC") || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
  },
  {
    id: "arbitrum",
    label: "Arbitrum One",
    caip2: "eip155:42161",
    kind: "evm",
    testnet: false,
    usdc: env("ARBITRUM_USDC") || "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
  },
  {
    id: "optimism",
    label: "Optimism",
    caip2: "eip155:10",
    kind: "evm",
    testnet: false,
    usdc: env("OPTIMISM_USDC") || "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
  },
  {
    id: "avalanche",
    label: "Avalanche",
    caip2: "eip155:43114",
    kind: "evm",
    testnet: false,
    usdc: env("AVALANCHE_USDC") || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
  },
  {
    id: "bnb",
    label: "BNB Smart Chain",
    caip2: "eip155:56",
    kind: "evm",
    testnet: false,
    /** Native BSC USDC (18 decimals). Settled via B402 rail in production, not Dexter accepts. */
    usdc: env("BSC_USDC") || "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
  },
  {
    id: "skale-europa",
    label: "SKALE Europa",
    caip2: "eip155:1187947933",
    kind: "evm",
    testnet: false,
    usdc: env("SKALE_USDC") || "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",
    decimals: 6,
  },
  {
    id: "skale-base-sepolia",
    label: "SKALE Base Sepolia",
    caip2: "eip155:324705682",
    kind: "evm",
    testnet: true,
    usdc: env("SKALE_SEPOLIA_USDC") || "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD",
    decimals: 6,
  },
  {
    id: "world",
    label: "World Chain",
    caip2: "eip155:480",
    kind: "evm",
    testnet: false,
    usdc: env("WORLDCHAIN_USDC") || "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
    decimals: 6,
  },
  {
    id: "monad",
    label: "Monad",
    caip2: "eip155:143",
    kind: "evm",
    testnet: false,
    usdc: env("MONAD_USDC") || "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    decimals: 6,
  },
  {
    id: "robinhood",
    label: "Robinhood Chain",
    caip2: "eip155:4663",
    kind: "evm",
    testnet: false,
    /** Global Dollar (USDG) — not USDC. EIP-712 domain name/version required for Exact. */
    usdc: env("ROBINHOOD_USDG") || "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    decimals: 6,
    assetName: "Global Dollar",
    assetVersion: "1",
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
 * Token decimals for a Dexter network (default 6).
 * @param {DexterX402Network | { decimals?: number } | null | undefined} net
 * @returns {number}
 */
export function getDexterNetworkDecimals(net) {
  const d = Number(net?.decimals);
  return Number.isFinite(d) && d >= 0 ? d : DEXTER_DEFAULT_DECIMALS;
}

/**
 * Convert USD to atomic token units for a Dexter network (respects decimals).
 * @param {number} usd
 * @param {number} [decimals]
 * @returns {string}
 */
export function usdToDexterAtomic(usd, decimals = DEXTER_DEFAULT_DECIMALS) {
  const n = Number(usd);
  const dec = Number.isFinite(decimals) && decimals >= 0 ? decimals : DEXTER_DEFAULT_DECIMALS;
  if (!Number.isFinite(n) || n <= 0) return "0";
  const scale = 10 ** dec;
  const atomic = Math.round(n * scale);
  return String(atomic > 0 ? atomic : 1);
}

/**
 * EIP-712 / Exact extras for a Dexter network (decimals + optional name/version).
 * @param {DexterX402Network | null | undefined} net
 * @returns {Record<string, string | number> | undefined}
 */
export function getDexterNetworkExtra(net) {
  if (!net) return undefined;
  /** @type {Record<string, string | number>} */
  const extra = {};
  const decimals = getDexterNetworkDecimals(net);
  if (decimals !== DEXTER_DEFAULT_DECIMALS) {
    extra.decimals = decimals;
  }
  if (net.assetName) extra.name = net.assetName;
  if (net.assetVersion) extra.version = net.assetVersion;
  return Object.keys(extra).length > 0 ? extra : undefined;
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
  return getPayToAddresses();
}

/**
 * USDC/stablecoin asset lookup for EVM money parser (ExactEvmScheme).
 * @param {string} caip2
 * @returns {string | null}
 */
export function getDexterEvmUsdcAsset(caip2) {
  const net = getDexterNetworkByCaip2(caip2);
  return net?.kind === "evm" ? net.usdc : null;
}
