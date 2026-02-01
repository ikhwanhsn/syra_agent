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
import dotenv from "dotenv";

dotenv.config();

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

// Config from env (same names as payai example + existing api names)
const facilitatorUrl = envAny(["PAYAI_FACILITATOR_URL", "FACILITATOR_URL_PAYAI", "FACILITATOR_URL"]);
const baseFacilitatorUrl = envAny(["PAYAI_BASE_FACILITATOR_URL", "BASE_FACILITATOR_URL", "FACILITATOR_URL_PAYAI", "FACILITATOR_URL"]);
const solanaPayTo = envAny(["SOLANA_PAYTO", "ADDRESS_PAYAI", "ADDRESS"]);
const basePayTo = envAny(["BASE_PAYTO", "BASE_ADDRESS", "EVM_ADDRESS"]);
const solanaUsdcMint = envAny(["SOLANA_USDC_MINT", "USDC_MINT", "USDC_DEVNET", "USDC_MAINNET"]);
const baseUsdcAsset = envAny(["BASE_USDC"]);

const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const BASE_USDC_MAINNET = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

const solanaNetwork = normalizeSolanaNetwork(envAny(["SOLANA_NETWORK", "NETWORK_PAYAI", "NETWORK"]) || DEFAULT_SOLANA_NETWORK);
const baseNetwork = normalizeBaseNetwork(envAny(["BASE_NETWORK"]) || DEFAULT_BASE_NETWORK);

let resourceServerInstance = null;
let initPromise = null;

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
    clients.push(new HTTPFacilitatorClient({ url: facilitatorUrl }));
  }
  const baseUrl = baseFacilitatorUrl || facilitatorUrl;
  if (baseUrl && baseUrl !== facilitatorUrl) {
    clients.push(new HTTPFacilitatorClient({ url: baseUrl }));
  }
  if (clients.length === 0) {
    clients.push(new HTTPFacilitatorClient());
  }

  const server = new x402ResourceServer(clients);
  server.registerExtension(bazaarResourceServerExtension);

  const svmScheme = new ExactSvmScheme().registerMoneyParser(async (amount, net) => {
    if (!String(net).startsWith("solana:")) return null;
    const mint = solanaUsdcMint || USDC_MAINNET;
    return { asset: mint, amount: atomicUsdcFromUsd(amount) };
  });
  server.register("solana:*", svmScheme);

  if (basePayTo && baseUsdcAsset) {
    const evmScheme = new ExactEvmScheme().registerMoneyParser(async (amount, net) => {
      if (!String(net).startsWith("eip155:")) return null;
      return { asset: baseUsdcAsset, amount: atomicUsdcFromUsd(amount) };
    });
    server.register("eip155:*", evmScheme);
  }

  const config = {
    solanaNetwork,
    solanaPayTo: solanaPayTo || "",
    ...(basePayTo && { baseNetwork, basePayTo }),
  };
  const assets = {
    solanaUsdcMint: solanaUsdcMint || USDC_MAINNET,
    ...(baseUsdcAsset && { baseUsdc: baseUsdcAsset }),
  };

  resourceServerInstance = { resourceServer: server, config, assets };
  return resourceServerInstance;
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
