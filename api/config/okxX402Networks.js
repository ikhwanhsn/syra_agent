/**
 * OKX facilitator x402 v2 — X Layer settlement for OKX Agentic Wallets.
 * @see https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk
 *
 * Requires OKX Developer Portal API keys (same as OKX DEX / Onchain OS).
 * Env: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, OKX_X402_PAYTO (or XLAYER_PAYTO).
 */

function env(name) {
  return String(process.env[name] || "").trim();
}

export const XLAYER_MAINNET_CAIP2 = "eip155:196";
export const XLAYER_TESTNET_CAIP2 = "eip155:1952";

/** USDT0 on X Layer mainnet (OKX facilitator default stablecoin). */
export const XLAYER_MAINNET_USDT =
  env("XLAYER_USDT") || "0x779ded0c9e1022225f8e0630b35a9b54be713736";

/** Testnet USD₮0 on X Layer testnet. */
export const XLAYER_TESTNET_USDT =
  env("XLAYER_TESTNET_USDT") || "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d";

/**
 * @typedef {object} OkxX402Network
 * @property {string} id
 * @property {string} label
 * @property {string} caip2
 * @property {boolean} testnet
 * @property {string} stablecoin
 */

/** @type {readonly OkxX402Network[]} */
export const OKX_X402_NETWORKS = [
  {
    id: "xlayer",
    label: "X Layer",
    caip2: XLAYER_MAINNET_CAIP2,
    testnet: false,
    stablecoin: XLAYER_MAINNET_USDT,
  },
  {
    id: "xlayer-testnet",
    label: "X Layer Testnet",
    caip2: XLAYER_TESTNET_CAIP2,
    testnet: true,
    stablecoin: XLAYER_TESTNET_USDT,
  },
];

const OKX_CAIP2_SET = new Set(OKX_X402_NETWORKS.map((n) => n.caip2));

/**
 * @param {string} network
 */
export function isOkxX402Network(network) {
  return OKX_CAIP2_SET.has(String(network || "").trim());
}

/**
 * @param {string} caip2
 * @returns {OkxX402Network | undefined}
 */
export function getOkxNetworkByCaip2(caip2) {
  return OKX_X402_NETWORKS.find((n) => n.caip2 === caip2);
}

export function hasOkxApiCredentials() {
  const apiKey = env("OKX_API_KEY") || env("OKX_ACCESS_KEY");
  const secretKey = env("OKX_SECRET_KEY");
  const passphrase = env("OKX_PASSPHRASE");
  return Boolean(apiKey && secretKey && passphrase);
}

/**
 * Merchant receive address on X Layer (EVM).
 */
export function getOkxX402PayTo() {
  return (
    env("OKX_X402_PAYTO") ||
    env("XLAYER_PAYTO") ||
    env("EVM_PAYTO") ||
    env("BASE_PAYTO") ||
    env("EVM_ADDRESS") ||
    ""
  );
}

/**
 * Enabled OKX x402 networks (mainnet by default in production).
 * @returns {OkxX402Network[]}
 */
export function getEnabledOkxX402Networks() {
  const filterRaw = env("OKX_X402_NETWORKS");
  let list = [...OKX_X402_NETWORKS];

  if (filterRaw) {
    const allow = new Set(
      filterRaw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
    list = OKX_X402_NETWORKS.filter((n) => allow.has(n.id));
  }

  const includeTestnetsEnv = env("OKX_X402_INCLUDE_TESTNETS").toLowerCase();
  const includeTestnets =
    includeTestnetsEnv === "true" ||
    includeTestnetsEnv === "1" ||
    (includeTestnetsEnv !== "false" &&
      includeTestnetsEnv !== "0" &&
      process.env.NODE_ENV !== "production");

  if (!includeTestnets) {
    list = list.filter((n) => !n.testnet);
  }

  return list;
}

/**
 * OKX facilitator inbound merchant enabled when keys + payTo are configured.
 */
export function isOkxX402Enabled() {
  if (!hasOkxApiCredentials()) return false;
  if (!getOkxX402PayTo()) return false;
  return getEnabledOkxX402Networks().length > 0;
}

/**
 * Non-secret status for logs and GET /x402/capabilities.
 */
export function getOkxX402PublicStatus() {
  const payTo = getOkxX402PayTo();
  const missing = [];
  if (!hasOkxApiCredentials()) {
    missing.push("OKX_API_KEY", "OKX_SECRET_KEY", "OKX_PASSPHRASE");
  }
  if (!payTo) {
    missing.push("OKX_X402_PAYTO or XLAYER_PAYTO");
  }
  return {
    enabled: isOkxX402Enabled(),
    payTo: payTo || null,
    facilitator: "okx",
    networks: getEnabledOkxX402Networks().map((n) => ({
      id: n.id,
      caip2: n.caip2,
      label: n.label,
      stablecoin: n.stablecoin,
      testnet: n.testnet,
    })),
    missing,
    docs: "https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk",
    devPortal: "https://web3.okx.com/onchain-os/dev-portal",
  };
}
