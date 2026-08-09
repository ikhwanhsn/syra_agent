/**
 * x402 V2 Resource Server (PayAI example–style implementation).
 *
 * Uses @x402/core server, HTTPFacilitatorClient, ExactSvmScheme (and optionally ExactEvmScheme)
 * so 402 responses and verify/settle match the payai-x402-example server exactly.
 */
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { builderCodeResourceServerExtension } from "@x402/extensions/builder-code";
import dotenv from "dotenv";
import { createPayAiFacilitatorAuthHeaders } from "./payaiFacilitatorAuth.js";
import {
  getDexterEvmUsdcAsset,
  getEnabledDexterNetworks,
  getDexterNetworkByCaip2,
  getDexterNetworkDecimals,
  usdToDexterAtomic,
} from "../config/dexterX402Networks.js";
import {
  getGoplausibleEvmUsdcAsset,
  getEnabledGoplausibleNetworks,
  getGoplausibleFacilitatorUrl,
} from "../config/goplausibleX402Networks.js";
import {
  getPayaiEvmUsdcAsset,
  getEnabledPayaiNetworks,
} from "../config/payaiX402Networks.js";
import {
  FACILITATOR_URL_PAYAI,
  SOLANA_PAYTO,
  EVM_PAYTO,
  BASE_PAYTO,
  SOLANA_USDC_MINT,
  BASE_USDC,
  NETWORK_PAYAI,
} from "../config/settlement.js";
import { optionalSecret } from "../config/secrets.js";

dotenv.config({ quiet: true });

function env(name) {
  return String(process.env[name] || "").trim();
}

function envAny(names) {
  for (const n of names) {
    const v = env(n);
    if (v) return v;
  }
  return "";
}

function atomicUsdcFromUsd(usd) {
  return String(Math.round(usd * 1_000_000));
}

// CAIP-2 defaults (same as payai-x402-example)
const SOLANA_MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
const SOLANA_DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const SOLANA_TESTNET_GENESIS = "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z";
const DEFAULT_SOLANA_NETWORK = `solana:${SOLANA_MAINNET_GENESIS}`;
const DEFAULT_BASE_NETWORK = "eip155:8453";

function normalizeSolanaNetwork(raw) {
  const n = String(raw || "").trim();
  if (!n || n === "solana" || n === "solana:mainnet") return `solana:${SOLANA_MAINNET_GENESIS}`;
  if (n === "solana-devnet" || n === "solana:devnet") return `solana:${SOLANA_DEVNET_GENESIS}`;
  if (n === "solana-testnet" || n === "solana:testnet") return `solana:${SOLANA_TESTNET_GENESIS}`;
  return n;
}

function normalizeBaseNetwork(raw) {
  const n = String(raw || "").trim();
  if (!n || n === "base") return "eip155:8453";
  if (n === "base-sepolia") return "eip155:84532";
  if (n.startsWith("eip155:")) return n;
  if (/^\d+$/.test(n)) return `eip155:${n}`;
  return n;
}

const USDC_MAINNET = SOLANA_USDC_MINT;
const BASE_USDC_MAINNET = BASE_USDC;

// Settlement constants (secrets stay in env via optionalSecret)
const facilitatorUrl = FACILITATOR_URL_PAYAI;
const baseFacilitatorUrl = FACILITATOR_URL_PAYAI;
const solanaPayTo = SOLANA_PAYTO;
const basePayTo = BASE_PAYTO || EVM_PAYTO;
const solanaUsdcMint = SOLANA_USDC_MINT;
const baseUsdcAsset = basePayTo ? BASE_USDC_MAINNET : "";

const solanaNetwork = normalizeSolanaNetwork(NETWORK_PAYAI || DEFAULT_SOLANA_NETWORK);
const baseNetwork = normalizeBaseNetwork(DEFAULT_BASE_NETWORK);

const payaiApiKeyId = optionalSecret("PAYAI_API_KEY_ID");
const payaiApiKeySecret = optionalSecret("PAYAI_API_KEY_SECRET");
const payaiAuthHeaders =
  payaiApiKeyId && payaiApiKeySecret
    ? createPayAiFacilitatorAuthHeaders(payaiApiKeyId, payaiApiKeySecret)
    : null;
if (payaiApiKeyId && !payaiApiKeySecret) {
  console.warn(
    "[x402] PAYAI_API_KEY_ID is set but PAYAI_API_KEY_SECRET is missing — facilitator calls stay unauthenticated (free tier only)."
  );
}
if (!payaiApiKeyId && payaiApiKeySecret) {
  console.warn(
    "[x402] PAYAI_API_KEY_SECRET is set but PAYAI_API_KEY_ID is missing — facilitator calls stay unauthenticated."
  );
}

/** Only send PayAI merchant JWT to PayAI hosts (not x402.org default). */
function shouldUsePayAiAuthForUrl(url) {
  const s = String(url || "").toLowerCase();
  return s.includes("payai");
}

function newFacilitatorClient(url) {
  const u = url || undefined;
  const useAuth = payaiAuthHeaders && shouldUsePayAiAuthForUrl(u);
  if (useAuth) {
    return new HTTPFacilitatorClient({ url: u, createAuthHeaders: payaiAuthHeaders });
  }
  return u ? new HTTPFacilitatorClient({ url: u }) : new HTTPFacilitatorClient();
}

/**
 * [Dexter facilitator](https://dexter.cash/facilitator) — free public x402 facilitator (no PayAI JWT).
 * @see https://github.com/Dexter-DAO
 */
const dexterFacilitatorUrl = env("DEXTER_FACILITATOR_URL") || "https://x402.dexter.cash";

/** @typedef {'payai'|'dexter'|'goplausible'} X402NetworkProfile */

/**
 * @param {X402NetworkProfile} profile
 * @returns {import('../config/payaiX402Networks.js').PayaiX402Network[] | import('../config/dexterX402Networks.js').DexterX402Network[] | import('../config/goplausibleX402Networks.js').GoplausibleX402Network[]}
 */
function getEnabledNetworksForProfile(profile) {
  if (profile === "dexter") return getEnabledDexterNetworks();
  if (profile === "goplausible") return getEnabledGoplausibleNetworks();
  return getEnabledPayaiNetworks();
}

/**
 * @param {X402NetworkProfile} profile
 * @param {string} caip2
 * @returns {string | null}
 */
function getEvmUsdcForProfile(profile, caip2) {
  if (profile === "dexter") return getDexterEvmUsdcAsset(caip2);
  if (profile === "goplausible") return getGoplausibleEvmUsdcAsset(caip2);
  return getPayaiEvmUsdcAsset(caip2);
}

/** @param {import('@x402/core/server').x402ResourceServer} server */
function buildResourceServerBundle(
  server,
  { multiNetwork = false, networkProfile = "payai" } = {}
) {
  server.registerExtension(bazaarResourceServerExtension);
  server.registerExtension(builderCodeResourceServerExtension);

  const profile = multiNetwork ? networkProfile : null;

  const svmScheme = new ExactSvmScheme().registerMoneyParser(async (amount, net) => {
    if (!String(net).startsWith("solana:")) return null;
    if (profile) {
      const row = getEnabledNetworksForProfile(profile).find(
        (n) => n.kind === "solana" && n.caip2 === net
      );
      if (!row) return null;
      const decimals = profile === "dexter" ? getDexterNetworkDecimals(row) : 6;
      return {
        asset: row.usdc,
        amount: profile === "dexter" ? usdToDexterAtomic(amount, decimals) : atomicUsdcFromUsd(amount),
      };
    }
    const mint = solanaUsdcMint || USDC_MAINNET;
    return { asset: mint, amount: atomicUsdcFromUsd(amount) };
  });
  server.register("solana:*", svmScheme);

  const evmPayConfigured = Boolean(basePayTo || envAny(["EVM_PAYTO", "EVM_ADDRESS"]));
  if (profile ? evmPayConfigured : basePayTo && baseUsdcAsset) {
    const evmScheme = new ExactEvmScheme().registerMoneyParser(async (amount, net) => {
      if (!String(net).startsWith("eip155:")) return null;
      if (profile) {
        const asset = getEvmUsdcForProfile(profile, net);
        if (!asset) return null;
        if (profile === "dexter") {
          const row = getDexterNetworkByCaip2(net);
          const decimals = getDexterNetworkDecimals(row);
          return { asset, amount: usdToDexterAtomic(amount, decimals) };
        }
        return { asset, amount: atomicUsdcFromUsd(amount) };
      }
      return { asset: baseUsdcAsset, amount: atomicUsdcFromUsd(amount) };
    });
    server.register("eip155:*", evmScheme);
  }

  const config = profile
    ? {
        multiNetwork: true,
        networkProfile: profile,
        solanaNetwork,
        solanaPayTo: solanaPayTo || "",
        baseNetwork,
        basePayTo: basePayTo || envAny(["EVM_PAYTO", "EVM_ADDRESS"]) || "",
      }
    : {
        solanaNetwork,
        solanaPayTo: solanaPayTo || "",
        ...(basePayTo && { baseNetwork, basePayTo }),
      };
  const assets = {
    solanaUsdcMint: solanaUsdcMint || USDC_MAINNET,
    ...(baseUsdcAsset && { baseUsdc: baseUsdcAsset }),
    ...(profile && { networks: getEnabledNetworksForProfile(profile) }),
  };

  return { resourceServer: server, config, assets };
}

let resourceServerInstance = null;
let initPromise = null;

let resourceServerDexterInstance = null;
let initPromiseDexter = null;

let resourceServerGoplausibleInstance = null;
let initPromiseGoplausible = null;

/**
 * Get the x402 resource server singleton (PayAI example–style).
 * Uses facilitator + ExactSvmScheme (Solana) and optionally ExactEvmScheme (Base).
 * @returns {{ resourceServer: import('@x402/core/server').x402ResourceServer, config: { solanaNetwork: string, solanaPayTo: string, baseNetwork?: string, basePayTo?: string }, assets: { solanaUsdcMint: string, baseUsdc?: string } }}
 */
export function getX402ResourceServer() {
  if (resourceServerInstance) {
    return resourceServerInstance;
  }

  const clients = [];
  if (facilitatorUrl) {
    clients.push(newFacilitatorClient(facilitatorUrl));
  }
  const baseUrl = baseFacilitatorUrl || facilitatorUrl;
  if (baseUrl && baseUrl !== facilitatorUrl) {
    clients.push(newFacilitatorClient(baseUrl));
  }
  if (clients.length === 0) {
    clients.push(newFacilitatorClient());
  }

  const server = new x402ResourceServer(clients);
  resourceServerInstance = buildResourceServerBundle(server, {
    multiNetwork: true,
    networkProfile: "payai",
  });
  return resourceServerInstance;
}

/**
 * Dexter-backed resource server: verify/settle via https://x402.dexter.cash (no PayAI auth).
 * Used by x402 Labs `/insights/*` routes. Same payTo addresses as PayAI default.
 * @see https://dexter.cash/facilitator
 */
export function getX402ResourceServerDexter() {
  if (resourceServerDexterInstance) {
    return resourceServerDexterInstance;
  }
  const clients = [new HTTPFacilitatorClient({ url: dexterFacilitatorUrl })];
  const server = new x402ResourceServer(clients);
  resourceServerDexterInstance = buildResourceServerBundle(server, {
    multiNetwork: true,
    networkProfile: "dexter",
  });
  return resourceServerDexterInstance;
}

/**
 * GoPlausible-backed resource server for Solana + Base (no PayAI auth).
 * Used by Labs `/insights/*` when Dexter is unhealthy. Same payTo as PayAI/Dexter.
 * Algorand AVM still uses x402AvmResourceServer — this profile is SVM/EVM only.
 * @see https://facilitator.goplausible.xyz/supported
 */
export function getX402ResourceServerGoplausible() {
  if (resourceServerGoplausibleInstance) {
    return resourceServerGoplausibleInstance;
  }
  const url = getGoplausibleFacilitatorUrl();
  const clients = [new HTTPFacilitatorClient({ url })];
  const server = new x402ResourceServer(clients);
  resourceServerGoplausibleInstance = buildResourceServerBundle(server, {
    multiNetwork: true,
    networkProfile: "goplausible",
  });
  return resourceServerGoplausibleInstance;
}

/**
 * Ensure the resource server has been initialized (fetch supported kinds from facilitator).
 * Call once before first use (e.g. in first requirePayment).
 */
export async function ensureX402ResourceServerInitialized() {
  const { resourceServer } = getX402ResourceServer();
  if (!initPromise) {
    initPromise = resourceServer.initialize().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  await initPromise;
}

export {
  DEXTER_X402_NETWORKS,
  getEnabledDexterNetworks,
  getDexterPayToAddresses,
} from "../config/dexterX402Networks.js";
export {
  GOPLAUSIBLE_X402_NETWORKS,
  getEnabledGoplausibleNetworks,
  getGoplausiblePayToAddresses,
} from "../config/goplausibleX402Networks.js";
export {
  PAYAI_X402_NETWORKS,
  getEnabledPayaiNetworks,
  getPayaiPayToAddresses,
} from "../config/payaiX402Networks.js";

/** Initialize Dexter-backed resource server (x402 Labs `/insights/*`). */
export async function ensureX402DexterResourceServerInitialized() {
  const { resourceServer } = getX402ResourceServerDexter();
  if (!initPromiseDexter) {
    initPromiseDexter = resourceServer.initialize().catch((e) => {
      initPromiseDexter = null;
      throw e;
    });
  }
  await initPromiseDexter;
}

/** Initialize GoPlausible-backed resource server (Labs Solana/Base failover). */
export async function ensureX402GoplausibleResourceServerInitialized() {
  const { resourceServer } = getX402ResourceServerGoplausible();
  if (!initPromiseGoplausible) {
    initPromiseGoplausible = resourceServer.initialize().catch((e) => {
      initPromiseGoplausible = null;
      throw e;
    });
  }
  await initPromiseGoplausible;
}
