/**
 * Binance B402 — BSC (BNB Smart Chain) x402 v2 payment kinds.
 * @see https://developers.binance.com/docs/onchainpay-x402/introduction
 */
import {
  getSupported,
  hasB402MerchantCredentials,
  isB402Configured,
} from "../libs/b402FacilitatorClient.js";

export const BSC_CAIP2 = "eip155:56";

/** BSC USD1/U/USDC/USDT use 18 decimals; x402 internal pricing uses 6-decimal micro units. */
export const BSC_TOKEN_DECIMALS = 18;
const X402_MICRO_DECIMALS = 6;

/**
 * Convert x402 micro-unit amount (6 decimals, same as USDC) to BSC token atomic units.
 * @param {string|number} microUnits
 * @param {number} [tokenDecimals]
 */
export function x402MicroToBscTokenAtomic(microUnits, tokenDecimals = BSC_TOKEN_DECIMALS) {
  const s = String(microUnits ?? "0").trim();
  let micro;
  try {
    micro = BigInt(s);
  } catch {
    micro = 0n;
  }
  if (micro <= 0n) micro = 1n;
  const scaleExp = Math.max(0, tokenDecimals - X402_MICRO_DECIMALS);
  const native = micro * 10n ** BigInt(scaleExp);
  return native.toString();
}

function env(name) {
  return String(process.env[name] || "").trim();
}

/** @typedef {'eip3009'|'permit2-exact'|'permit2-upto'} B402AssetTransferMethod */

/**
 * @typedef {object} B402TokenConfig
 * @property {string} id - e.g. USD1, USDC
 * @property {string} label
 * @property {string} contract - BSC mainnet ERC-20
 * @property {string} eip712Name
 * @property {string} eip712Version
 * @property {B402AssetTransferMethod} assetTransferMethod
 * @property {string} scheme - exact | upto
 * @property {boolean} eip3009
 */

/** @type {readonly B402TokenConfig[]} */
export const B402_TOKENS = [
  {
    id: "USD1",
    label: "USD1",
    contract: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    eip712Name: "World Liberty Financial USD",
    eip712Version: "1",
    assetTransferMethod: "eip3009",
    scheme: "exact",
    eip3009: true,
  },
  {
    id: "U",
    label: "U",
    contract: "0xcE24439F2D9C6a2289F741120FE202248B666666",
    eip712Name: "United Stables",
    eip712Version: "1",
    assetTransferMethod: "eip3009",
    scheme: "exact",
    eip3009: true,
  },
  {
    id: "USDC",
    label: "USD Coin",
    contract: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    eip712Name: "USD Coin",
    eip712Version: "1",
    assetTransferMethod: "permit2-exact",
    scheme: "exact",
    eip3009: false,
  },
  {
    id: "USDT",
    label: "Tether USD",
    contract: "0x55d398326f99059fF775485246999027B3197955",
    eip712Name: "Tether USD",
    eip712Version: "1",
    assetTransferMethod: "permit2-exact",
    scheme: "exact",
    eip3009: false,
  },
];

let cachedExtraByToken = null;
let cachedExtraAt = 0;
const EXTRA_CACHE_MS = 3600000;

/**
 * @param {string} tokenId
 * @returns {B402TokenConfig | undefined}
 */
export function getB402TokenById(tokenId) {
  const id = String(tokenId || env("B402_TOKEN") || "USD1").trim().toUpperCase();
  return B402_TOKENS.find((t) => t.id.toUpperCase() === id);
}

export function isB402Enabled() {
  return hasB402MerchantCredentials() && Boolean(env("B402_PAY_TO"));
}

/** Opt-in B402 Bazaar discovery indexing on BSC settles (default ON when B402 merchant is enabled). */
export function isB402BazaarEnabled() {
  const flag = env("B402_BAZAAR_ENABLED").toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return isB402Enabled();
}

export function getB402PayTo() {
  return env("B402_PAY_TO");
}

/**
 * Match a /supported kinds[] entry to our token config.
 * @param {object} kind
 * @param {B402TokenConfig} token
 */
function kindMatchesToken(kind, token) {
  if (!kind || kind.network !== BSC_CAIP2) return false;
  const extra = kind.extra || {};
  const method = extra.assetTransferMethod || "";
  if (method && method !== token.assetTransferMethod) return false;
  const name = String(extra.name || "").trim();
  if (name && name !== token.eip712Name) return false;
  return true;
}

/**
 * Resolve signer/spender/name/version/method from B402 /supported (cached).
 * @param {B402TokenConfig} token
 * @returns {Promise<{ name: string, version: string, assetTransferMethod: string, signerAddress: string, spenderAddress?: string | null }>}
 */
export async function getB402ExtraForToken(token) {
  const now = Date.now();
  const key = token.id;
  if (cachedExtraByToken?.[key] && now - cachedExtraAt < EXTRA_CACHE_MS) {
    return cachedExtraByToken[key];
  }

  const fallback = {
    name: token.eip712Name,
    version: token.eip712Version,
    assetTransferMethod: token.assetTransferMethod,
    signerAddress: "",
    spenderAddress: token.eip3009 ? null : undefined,
  };

  if (!isB402Configured()) {
    return fallback;
  }

  try {
    const supported = await getSupported();
    if (!supported.success || !supported.data) return fallback;
    const kinds = Array.isArray(supported.data.kinds) ? supported.data.kinds : [];
    const kind = kinds.find((k) => kindMatchesToken(k, token));
    if (!kind?.extra) return fallback;
    const ex = kind.extra;
    const extra = {
      name: ex.name ?? token.eip712Name,
      version: ex.version ?? token.eip712Version,
      assetTransferMethod: ex.assetTransferMethod ?? token.assetTransferMethod,
      signerAddress: ex.signerAddress ?? "",
      spenderAddress: ex.spenderAddress ?? (token.eip3009 ? null : undefined),
    };
    if (!cachedExtraByToken) cachedExtraByToken = {};
    cachedExtraByToken[key] = extra;
    cachedExtraAt = now;
    return extra;
  } catch (e) {
    console.warn("[b402] getB402ExtraForToken failed:", e?.message || e);
    return fallback;
  }
}

/**
 * Active B402 payment option for 402 accepts (single token from B402_TOKEN).
 * @returns {Promise<{ token: B402TokenConfig, extra: object } | null>}
 */
export async function getActiveB402PaymentKind() {
  if (!isB402Enabled()) return null;
  const token = getB402TokenById(env("B402_TOKEN"));
  if (!token) {
    console.warn("[b402] Unknown B402_TOKEN — supported:", B402_TOKENS.map((t) => t.id).join(", "));
    return null;
  }
  const extra = await getB402ExtraForToken(token);
  return { token, extra };
}

/**
 * @param {string} network
 */
export function isB402Network(network) {
  const n = String(network || "").trim().toLowerCase();
  if (!n) return false;
  if (n === BSC_CAIP2.toLowerCase()) return true;
  if (n === "56" || n === "bsc" || n === "bnb" || n === "bsc-mainnet" || n === "binance") return true;
  return false;
}
