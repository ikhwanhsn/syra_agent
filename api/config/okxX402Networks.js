/**
 * OKX facilitator x402 v2 — X Layer settlement for OKX Agentic Wallets.
 * @see https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk
 *
 * Requires OKX Developer Portal API keys (same as OKX DEX / Onchain OS).
 * Env secrets: OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE.
 * PayTo: OKX_X402_PAYTO from settlement.js.
 */
import { isProduction } from "./runtime.js";
import { OKX_X402_PAYTO } from "./settlement.js";

function env(name) {
  return String(process.env[name] || "").trim();
}

export const XLAYER_MAINNET_CAIP2 = "eip155:196";
export const XLAYER_TESTNET_CAIP2 = "eip155:1952";

/** USDT0 on X Layer mainnet (OKX facilitator default stablecoin). */
export const XLAYER_MAINNET_USDT = "0x779ded0c9e1022225f8e0630b35a9b54be713736";

/** Testnet USD₮0 on X Layer testnet. */
export const XLAYER_TESTNET_USDT = "0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d";

/**
 * EIP-712 domain for USDT0 transferWithAuthorization on X Layer.
 * Name uses U+20AE TUGRIK SIGN (₮), not ASCII "T" — wrong domain → invalid sig → perpetual 402.
 * @see @okxweb3/x402-evm DEFAULT_STABLECOINS
 */
export const XLAYER_USDT0_EIP712_NAME = "USD\u20AE0";
export const XLAYER_USDT0_EIP712_VERSION = "1";

/**
 * @typedef {object} OkxX402Network
 * @property {string} id
 * @property {string} label
 * @property {string} caip2
 * @property {boolean} testnet
 * @property {string} stablecoin
 * @property {string} eip712Name
 * @property {string} eip712Version
 */

/** @type {readonly OkxX402Network[]} */
export const OKX_X402_NETWORKS = [
  {
    id: "xlayer",
    label: "X Layer",
    caip2: XLAYER_MAINNET_CAIP2,
    testnet: false,
    stablecoin: XLAYER_MAINNET_USDT,
    eip712Name: XLAYER_USDT0_EIP712_NAME,
    eip712Version: XLAYER_USDT0_EIP712_VERSION,
  },
  {
    id: "xlayer-testnet",
    label: "X Layer Testnet",
    caip2: XLAYER_TESTNET_CAIP2,
    testnet: true,
    stablecoin: XLAYER_TESTNET_USDT,
    eip712Name: XLAYER_USDT0_EIP712_NAME,
    eip712Version: XLAYER_USDT0_EIP712_VERSION,
  },
];

/**
 * EIP-712 extra block for an OKX X Layer accept (exact / EIP-3009).
 * @param {OkxX402Network} net
 */
export function getOkxEip712Extra(net) {
  return {
    name: net.eip712Name,
    version: net.eip712Version,
    eip712: { name: net.eip712Name, version: net.eip712Version },
  };
}

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
  return String(OKX_X402_PAYTO || "").trim();
}

/**
 * Enabled OKX x402 networks (mainnet by default in production).
 * @returns {OkxX402Network[]}
 */
export function getEnabledOkxX402Networks() {
  let list = [...OKX_X402_NETWORKS];

  // Dev includes testnets; production mainnet-only.
  if (isProduction()) {
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
    missing.push("OKX_X402_PAYTO");
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
