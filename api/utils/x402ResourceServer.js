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
  getCorbitsEvmUsdcAsset,
  getEnabledCorbitsNetworks,
} from "../config/corbitsX402Networks.js";
import {
  getDexterEvmUsdcAsset,
  getEnabledDexterNetworks,
} from "../config/dexterX402Networks.js";
import {
  getPayaiEvmUsdcAsset,
  getEnabledPayaiNetworks,
} from "../config/payaiX402Networks.js";

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

const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const BASE_USDC_MAINNET = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

// Config from env (same names as payai example + existing api names)
const facilitatorUrl = envAny(["PAYAI_FACILITATOR_URL", "FACILITATOR_URL_PAYAI", "FACILITATOR_URL"]);
const baseFacilitatorUrl = envAny(["PAYAI_BASE_FACILITATOR_URL", "BASE_FACILITATOR_URL", "FACILITATOR_URL_PAYAI", "FACILITATOR_URL"]);
const solanaPayTo = envAny(["SOLANA_PAYTO", "ADDRESS_PAYAI", "ADDRESS"]);
const basePayTo = envAny(["BASE_PAYTO", "BASE_ADDRESS", "EVM_ADDRESS"]);
const solanaUsdcMint = envAny(["SOLANA_USDC_MINT", "USDC_MINT", "USDC_DEVNET", "USDC_MAINNET"]);
// Default Base USDC mainnet when Base payTo is set so Base is supported with only BASE_PAYTO
const baseUsdcAsset = envAny(["BASE_USDC"]) || (basePayTo ? BASE_USDC_MAINNET : "");

const solanaNetwork = normalizeSolanaNetwork(envAny(["SOLANA_NETWORK", "NETWORK_PAYAI", "NETWORK"]) || DEFAULT_SOLANA_NETWORK);
const baseNetwork = normalizeBaseNetwork(envAny(["BASE_NETWORK"]) || DEFAULT_BASE_NETWORK);

const payaiApiKeyId = env("PAYAI_API_KEY_ID");
const payaiApiKeySecret = env("PAYAI_API_KEY_SECRET");
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
 * [Corbits facilitator](https://docs.corbits.dev/facilitator/overview) — no PayAI JWT.
 * Payment flow: https://docs.corbits.dev/facilitator/how-it-works.md (`/accepts`, `/settle`). Burst traffic can 429; throttle clients / retries in callers (e.g. tester agent).
 */
const corbitsFacilitatorUrl =
  env("CORBITS_FACILITATOR_URL") || "https://facilitator.corbits.dev";

/**
 * [Dexter facilitator](https://dexter.cash/facilitator) — free public x402 facilitator (no PayAI JWT).
 * @see https://github.com/Dexter-DAO
 */
const dexterFacilitatorUrl = env("DEXTER_FACILITATOR_URL") || "https://x402.dexter.cash";

/** @typedef {'payai'|'corbits'|'dexter'} X402NetworkProfile */

/**
 * @param {X402NetworkProfile} profile
 * @returns {import('../config/payaiX402Networks.js').PayaiX402Network[] | import('../config/corbitsX402Networks.js').CorbitsX402Network[] | import('../config/dexterX402Networks.js').DexterX402Network[]}
 */
function getEnabledNetworksForProfile(profile) {
  if (profile === "corbits") return getEnabledCorbitsNetworks();
  if (profile === "dexter") return getEnabledDexterNetworks();
  return getEnabledPayaiNetworks();
}

/**
 * @param {X402NetworkProfile} profile
 * @param {string} caip2
 * @returns {string | null}
 */
function getEvmUsdcForProfile(profile, caip2) {
  if (profile === "corbits") return getCorbitsEvmUsdcAsset(caip2);
  if (profile === "dexter") return getDexterEvmUsdcAsset(caip2);
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
      return { asset: row.usdc, amount: atomicUsdcFromUsd(amount) };
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

let resourceServerCorbitsInstance = null;
let initPromiseCorbits = null;

let resourceServerDexterInstance = null;
let initPromiseDexter = null;

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
 * Second singleton for experiments: verify/settle only via Corbits facilitator (no PayAI auth).
 * Same payTo / networks as default — clients still pay your SOLANA_PAYTO / BASE_PAYTO.
 * @see https://docs.corbits.dev/facilitator/overview
 */
export function getX402ResourceServerCorbits() {
  if (resourceServerCorbitsInstance) {
    return resourceServerCorbitsInstance;
  }
  const clients = [new HTTPFacilitatorClient({ url: corbitsFacilitatorUrl })];
  const server = new x402ResourceServer(clients);
  resourceServerCorbitsInstance = buildResourceServerBundle(server, {
    multiNetwork: true,
    networkProfile: "corbits",
  });
  return resourceServerCorbitsInstance;
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

/** Initialize Corbits-backed resource server (for route experiments such as GET /news). */
export {
  CORBITS_X402_NETWORKS,
  getEnabledCorbitsNetworks,
  getCorbitsPayToAddresses,
} from "../config/corbitsX402Networks.js";
export {
  DEXTER_X402_NETWORKS,
  getEnabledDexterNetworks,
  getDexterPayToAddresses,
} from "../config/dexterX402Networks.js";
export {
  PAYAI_X402_NETWORKS,
  getEnabledPayaiNetworks,
  getPayaiPayToAddresses,
} from "../config/payaiX402Networks.js";

export async function ensureX402CorbitsResourceServerInitialized() {
  const { resourceServer } = getX402ResourceServerCorbits();
  if (!initPromiseCorbits) {
    initPromiseCorbits = resourceServer.initialize().catch((e) => {
      initPromiseCorbits = null;
      throw e;
    });
  }
  await initPromiseCorbits;
}

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
