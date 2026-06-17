/**
 * Algorand (AVM) x402 v2 networks — GoPlausible facilitator.
 * @see https://github.com/GoPlausible/.github/blob/main/profile/algorand-x402-documentation/README.md
 *
 * Challenge requirement: verify + settle on Algorand Mainnet via facilitator.goplausible.xyz
 */

function env(name) {
  return String(process.env[name] || "").trim();
}

/** Algorand Mainnet CAIP-2 (genesis hash, base64). */
export const ALGORAND_MAINNET_CAIP2 =
  "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";

/** Algorand Testnet CAIP-2. */
export const ALGORAND_TESTNET_CAIP2 =
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";

/** USDC ASA on Algorand Mainnet (6 decimals). */
export const USDC_MAINNET_ASA_ID = env("ALGORAND_USDC_ASA") || "31566704";

/** USDC ASA on Algorand Testnet. */
export const USDC_TESTNET_ASA_ID = env("ALGORAND_TESTNET_USDC_ASA") || "10458941";

export const USDC_DECIMALS = 6;

/** Default GoPlausible facilitator (challenge leaderboard). */
export const DEFAULT_GOPLAUSIBLE_FACILITATOR_URL = "https://facilitator.goplausible.xyz";

/**
 * @typedef {object} AlgorandX402Network
 * @property {string} id
 * @property {string} label
 * @property {string} caip2
 * @property {boolean} testnet
 * @property {string} usdcAsa
 * @property {boolean} defaultEnabled
 */

/** @type {readonly AlgorandX402Network[]} */
export const ALGORAND_X402_NETWORKS = [
  {
    id: "algorand-mainnet",
    label: "Algorand Mainnet",
    caip2: ALGORAND_MAINNET_CAIP2,
    testnet: false,
    usdcAsa: USDC_MAINNET_ASA_ID,
    defaultEnabled: true,
  },
  {
    id: "algorand-testnet",
    label: "Algorand Testnet",
    caip2: ALGORAND_TESTNET_CAIP2,
    testnet: true,
    usdcAsa: USDC_TESTNET_ASA_ID,
    defaultEnabled: false,
  },
];

const ALGORAND_CAIP2_SET = new Set(ALGORAND_X402_NETWORKS.map((n) => n.caip2));

/**
 * @param {string} network
 */
export function isAlgorandCaip2(network) {
  return ALGORAND_CAIP2_SET.has(String(network || "").trim());
}

/** True if network string is any Algorand CAIP-2 (including legacy mapping). */
export function isAlgorandNetwork(network) {
  return /^algorand:/i.test(String(network || ""));
}

/**
 * @param {string} caip2
 * @returns {AlgorandX402Network | undefined}
 */
export function getAlgorandNetworkByCaip2(caip2) {
  return ALGORAND_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

/**
 * Payee address for Algorand x402 (58-char address, opted into USDC ASA).
 * @returns {string}
 */
export function getAlgorandPayTo() {
  return env("ALGORAND_PAYTO") || env("AVM_ADDRESS") || env("RESOURCE_AVM_ADDRESS");
}

export function getGoplausibleFacilitatorUrl() {
  return (
    env("GOPLAUSIBLE_FACILITATOR_URL") ||
    env("ALGORAND_FACILITATOR_URL") ||
    env("FACILITATOR_URL_ALGORAND") ||
    DEFAULT_GOPLAUSIBLE_FACILITATOR_URL
  );
}

/** Algorand inbound x402 enabled when payTo is configured. */
export function isAlgorandEnabled() {
  return Boolean(getAlgorandPayTo());
}

/**
 * Enabled Algorand networks for 402 accepts.
 * Filter: X402_ALGORAND_NETWORKS=comma ids; X402_ALGORAND_INCLUDE_TESTNETS for testnet.
 * @returns {AlgorandX402Network[]}
 */
export function getEnabledAlgorandNetworks() {
  if (!isAlgorandEnabled()) return [];

  const filterRaw = env("X402_ALGORAND_NETWORKS");
  let list = ALGORAND_X402_NETWORKS.filter((n) => n.defaultEnabled);

  if (filterRaw) {
    const allow = new Set(
      filterRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    );
    list = ALGORAND_X402_NETWORKS.filter((n) => allow.has(n.id));
  }

  const includeTestnetsEnv = env("X402_ALGORAND_INCLUDE_TESTNETS").toLowerCase();
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
 * @param {string} caip2
 * @returns {string | null}
 */
export function getAlgorandUsdcAsset(caip2) {
  const net = getAlgorandNetworkByCaip2(caip2);
  return net?.usdcAsa || null;
}

/**
 * Convert USD price to USDC atomic units (6 decimals) for Algorand ASA transfers.
 * @param {number} usd
 * @returns {string}
 */
export function usdToAlgorandUsdcAtomic(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return "1";
  const micro = Math.round(n * 1_000_000);
  return String(micro > 0 ? micro : 1);
}

/**
 * Non-secret status for logs and GET /x402/capabilities.
 */
export function getAlgorandPublicStatus() {
  const payTo = getAlgorandPayTo();
  const enabled = isAlgorandEnabled();
  const networks = getEnabledAlgorandNetworks().map((n) => ({
    id: n.id,
    caip2: n.caip2,
    usdcAsa: n.usdcAsa,
    testnet: n.testnet,
  }));
  return {
    enabled,
    payTo: payTo || null,
    facilitatorUrl: getGoplausibleFacilitatorUrl(),
    networks,
    missing: enabled ? [] : ["ALGORAND_PAYTO or AVM_ADDRESS"],
  };
}
