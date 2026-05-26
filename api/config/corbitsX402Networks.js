/**
 * Corbits facilitator (https://facilitator.corbits.dev) supported x402 v2 networks.
 * @see https://docs.corbits.dev/facilitator/overview
 *
 * Networks align with Corbits GET /supported (v2). Override USDC per chain via env
 * e.g. POLYGON_USDC, MONAD_TESTNET_USDC, SKALE_USDC.
 */

function env(name) {
  return String(process.env[name] || "").trim();
}

/** @typedef {'solana'|'evm'} CorbitsNetworkKind */

/**
 * @typedef {object} CorbitsX402Network
 * @property {string} id - Short id for X402_CORBITS_NETWORKS filter
 * @property {string} label
 * @property {string} caip2 - CAIP-2 network id (x402 v2)
 * @property {CorbitsNetworkKind} kind
 * @property {boolean} testnet
 * @property {string} usdc - USDC mint (Solana) or contract (EVM)
 */

/** @type {readonly CorbitsX402Network[]} */
export const CORBITS_X402_NETWORKS = [
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
    id: "skale-europa",
    label: "SKALE Europa",
    caip2: "eip155:1187947933",
    kind: "evm",
    testnet: false,
    usdc: env("SKALE_USDC") || "0x85889c8c714505E0c94b30fcfcF64fE3Ac8FCb20",
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
    id: "monad-testnet",
    label: "Monad Testnet",
    caip2: "eip155:10143",
    kind: "evm",
    testnet: true,
    usdc: env("MONAD_TESTNET_USDC") || "0x534b2f3A21130d7a60830c2Df862319e593943A3",
  },
];

const CORBITS_CAIP2_SET = new Set(CORBITS_X402_NETWORKS.map((n) => n.caip2));

/**
 * @param {string} caip2
 * @returns {CorbitsX402Network | undefined}
 */
export function getCorbitsNetworkByCaip2(caip2) {
  return CORBITS_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

/**
 * Whether Corbits facilitator lists this CAIP-2 network (v2).
 * @param {string} network
 */
export function isCorbitsSupportedCaip2(network) {
  return CORBITS_CAIP2_SET.has(String(network || "").trim());
}

/**
 * Enabled networks for 402 accepts. Filter via:
 * - X402_CORBITS_NETWORKS=comma-separated ids (e.g. solana-mainnet,base,polygon)
 * - X402_CORBITS_INCLUDE_TESTNETS=false to drop testnets (default: include testnets in non-production)
 * @returns {CorbitsX402Network[]}
 */
export function getEnabledCorbitsNetworks() {
  const filterRaw = env("X402_CORBITS_NETWORKS");
  let list = CORBITS_X402_NETWORKS;
  if (filterRaw) {
    const allow = new Set(
      filterRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    list = list.filter((n) => allow.has(n.id));
  }
  const includeTestnetsEnv = env("X402_CORBITS_INCLUDE_TESTNETS").toLowerCase();
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
 * Resolve payTo addresses for Corbits multi-network 402 offers.
 * @returns {{ solanaPayTo: string, evmPayTo: string }}
 */
export function getCorbitsPayToAddresses() {
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
export function getCorbitsEvmUsdcAsset(caip2) {
  const net = getCorbitsNetworkByCaip2(caip2);
  return net?.kind === "evm" ? net.usdc : null;
}
