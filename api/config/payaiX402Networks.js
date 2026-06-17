/**
 * PayAI facilitator (https://facilitator.payai.network) supported x402 v2 networks.
 * @see https://docs.payai.network/x402/supported-networks
 *
 * USDC addresses align with PayAI echo-merchant defaults so verify/settle match the facilitator.
 * Override per chain via env e.g. POLYGON_USDC, ARBITRUM_USDC, SEI_USDC.
 */

function env(name) {
  return String(process.env[name] || "").trim();
}

/** @typedef {'solana'|'evm'} PayaiNetworkKind */

/**
 * @typedef {object} PayaiX402Network
 * @property {string} id - Short id for X402_PAYAI_NETWORKS filter
 * @property {string} v1Network - PayAI v1 network string (docs table)
 * @property {string} label
 * @property {string} caip2 - CAIP-2 network id (x402 v2)
 * @property {PayaiNetworkKind} kind
 * @property {boolean} testnet
 * @property {string} usdc - USDC mint (Solana) or contract (EVM)
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
    usdc: env("SOLANA_DEVNET_USDC") || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  },
  {
    id: "solana-mainnet",
    v1Network: "solana",
    label: "Solana",
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    kind: "solana",
    testnet: false,
    usdc: env("SOLANA_USDC_MINT") || env("USDC_MAINNET") || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  {
    id: "base",
    v1Network: "base",
    label: "Base",
    caip2: "eip155:8453",
    kind: "evm",
    testnet: false,
    usdc: env("BASE_USDC") || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  },
  {
    id: "base-sepolia",
    v1Network: "base-sepolia",
    label: "Base Sepolia",
    caip2: "eip155:84532",
    kind: "evm",
    testnet: true,
    usdc: env("BASE_SEPOLIA_USDC") || "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  {
    id: "polygon",
    v1Network: "polygon",
    label: "Polygon",
    caip2: "eip155:137",
    kind: "evm",
    testnet: false,
    usdc: env("POLYGON_USDC") || "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  },
  {
    id: "polygon-amoy",
    v1Network: "polygon-amoy",
    label: "Polygon Amoy",
    caip2: "eip155:80002",
    kind: "evm",
    testnet: true,
    usdc: env("POLYGON_AMOY_USDC") || "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  },
  {
    id: "arbitrum",
    v1Network: "arbitrum",
    label: "Arbitrum One",
    caip2: "eip155:42161",
    kind: "evm",
    testnet: false,
    usdc: env("ARBITRUM_USDC") || "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  {
    id: "arbitrum-sepolia",
    v1Network: "arbitrum-sepolia",
    label: "Arbitrum Sepolia",
    caip2: "eip155:421614",
    kind: "evm",
    testnet: true,
    usdc: env("ARBITRUM_SEPOLIA_USDC") || "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  },
  {
    id: "avalanche",
    v1Network: "avalanche",
    label: "Avalanche",
    caip2: "eip155:43114",
    kind: "evm",
    testnet: false,
    usdc: env("AVALANCHE_USDC") || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  {
    id: "avalanche-fuji",
    v1Network: "avalanche-fuji",
    label: "Avalanche Fuji",
    caip2: "eip155:43113",
    kind: "evm",
    testnet: true,
    usdc: env("AVALANCHE_FUJI_USDC") || "0x5425890298aed601595a70AB815c96711a31Bc65",
  },
  {
    id: "sei",
    v1Network: "sei",
    label: "Sei",
    caip2: "eip155:1329",
    kind: "evm",
    testnet: false,
    usdc: env("SEI_USDC") || "0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1",
  },
  {
    id: "sei-testnet",
    v1Network: "sei-testnet",
    label: "Sei Testnet",
    caip2: "eip155:713715",
    kind: "evm",
    testnet: true,
    usdc: env("SEI_TESTNET_USDC") || "0x4E4a29f76cD0dFf2A4e5E56d7a065E0aF33f32e2",
  },
  {
    id: "skale-base",
    v1Network: "skale-base",
    label: "SKALE Base",
    caip2: "eip155:1187947933",
    kind: "evm",
    testnet: false,
    usdc: env("SKALE_USDC") || "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",
  },
  {
    id: "skale-base-sepolia",
    v1Network: "skale-base-sepolia",
    label: "SKALE Base Sepolia",
    caip2: "eip155:324705682",
    kind: "evm",
    testnet: true,
    usdc: env("SKALE_SEPOLIA_USDC") || "0x2e08028E3C4c2356572E096d8EF835cD5C6030bD",
  },
  {
    id: "xlayer",
    v1Network: "xlayer",
    label: "X Layer",
    caip2: "eip155:196",
    kind: "evm",
    testnet: false,
    usdc: env("XLAYER_USDC") || "0x74b7f16337b8972027f6196a17a631ac6de26d22",
  },
  {
    id: "xlayer-testnet",
    v1Network: "xlayer-testnet",
    label: "X Layer Testnet",
    caip2: "eip155:1952",
    kind: "evm",
    testnet: true,
    usdc: env("XLAYER_TESTNET_USDC") || "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d",
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
 * Whether PayAI facilitator lists this CAIP-2 network (v2).
 * @param {string} network
 */
export function isPayaiSupportedCaip2(network) {
  return PAYAI_CAIP2_SET.has(String(network || "").trim());
}

/**
 * Enabled networks for 402 accepts — all PayAI doc networks with configured USDC.
 * Filter via:
 * - X402_PAYAI_NETWORKS=comma-separated ids (subset)
 * - X402_PAYAI_INCLUDE_TESTNETS=false to drop testnets in production
 * @returns {PayaiX402Network[]}
 */
export function getEnabledPayaiNetworks() {
  const filterRaw = env("X402_PAYAI_NETWORKS");
  let list = PAYAI_X402_NETWORKS.filter((n) => Boolean(n.usdc));

  if (filterRaw) {
    const allow = new Set(
      filterRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    list = PAYAI_X402_NETWORKS.filter((n) => allow.has(n.id) && Boolean(n.usdc));
  }

  const includeTestnetsEnv = env("X402_PAYAI_INCLUDE_TESTNETS").toLowerCase();
  const includeTestnets =
    includeTestnetsEnv === "true" ||
    includeTestnetsEnv === "1" ||
    (includeTestnetsEnv !== "false" &&
      includeTestnetsEnv !== "0" &&
      process.env.NODE_ENV !== "production");
  if (!includeTestnets) {
    list = list.filter((n) => !n.testnet);
  }
  return [...list];
}

/**
 * Resolve payTo addresses for PayAI multi-network 402 offers.
 * @returns {{ solanaPayTo: string, evmPayTo: string }}
 */
export function getPayaiPayToAddresses() {
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
export function getPayaiEvmUsdcAsset(caip2) {
  const net = getPayaiNetworkByCaip2(caip2);
  return net?.kind === "evm" && net.usdc ? net.usdc : null;
}
