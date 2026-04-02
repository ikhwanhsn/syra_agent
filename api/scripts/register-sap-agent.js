#!/usr/bin/env node
/**
 * Register Syra on Synapse Agent Protocol (SAP) on Solana.
 * @see https://explorer.oobeprotocol.ai/docs/examples/register-agent
 *
 * Prerequisites:
 *   - Funded wallet (~0.05+ SOL on chosen cluster for rent + fees).
 *   - Same key env as register-8004: SOLANA_PRIVATE_KEY | PAYER_KEYPAIR (JSON byte array)
 *     or AGENT_PRIVATE_KEY | ZAUTH_SOLANA_PRIVATE_KEY (base58).
 *
 * Environment:
 *   - SAP_RPC_URL — Solana JSON-RPC (required for clarity; e.g. devnet or OOBE mainnet RPC).
 *   - SAP_CLUSTER — Optional override: mainnet-beta | devnet | localnet (else inferred from RPC URL).
 *   - SYRA_SAP_NAME — Display name (default: Syra).
 *   - SYRA_SAP_DESCRIPTION — Max 256 chars (default: short Syra product line).
 *   - SYRA_SAP_AGENT_URI — Metadata / site URL (default: https://syraa.fun).
 *   - SYRA_SAP_X402_ENDPOINT — x402 base URL (default: https://api.syraa.fun).
 *   - SYRA_SAP_AGENT_ID — Optional DID-style id (default: did:sap:syra).
 *   - SAP_SKIP_INDEX — Set to "1" to skip discovery index transactions after registration.
 *
 * After registration, publish HTTP tool descriptors for SAP discovery:
 *   npm run publish-sap-tools
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/register-sap-agent.js
 */

import "dotenv/config";
import { createRequire } from "node:module";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// CJS build: the package ESM entry uses directory imports Node cannot resolve.
const require = createRequire(import.meta.url);
const { SapConnection } = require("@oobe-protocol-labs/synapse-sap-sdk");

const DEFAULT_DESCRIPTION =
  "AI trading intelligence for Solana: news, sentiment, signals, research, trending, x402 API. MCP and agents.";

function getSigner() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      /* fall through */
    }
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    return Keypair.fromSecretKey(bs58.decode(b58));
  }
  throw new Error(
    "Set SOLANA_PRIVATE_KEY (JSON array of 64 bytes), PAYER_KEYPAIR, or AGENT_PRIVATE_KEY (base58) in .env"
  );
}

function rpcAndCluster() {
  const explicit = process.env.SAP_RPC_URL?.trim();
  if (explicit) {
    return { rpcUrl: explicit, cluster: process.env.SAP_CLUSTER?.trim() || undefined };
  }
  const cluster = (process.env.SOLANA_CLUSTER || process.env.SAP_CLUSTER || "devnet").replace(
    /^mainnet$/,
    "mainnet-beta"
  );
  if (cluster === "devnet") {
    return { rpcUrl: "https://api.devnet.solana.com", cluster: "devnet" };
  }
  if (cluster === "mainnet-beta") {
    const rpc =
      process.env.SOLANA_RPC_URL?.trim() ||
      "https://api.mainnet-beta.solana.com";
    return { rpcUrl: rpc, cluster: "mainnet-beta" };
  }
  throw new Error(
    "Set SAP_RPC_URL, or SOLANA_CLUSTER=devnet|mainnet-beta (with SOLANA_RPC_URL for mainnet)."
  );
}

async function main() {
  const keypair = getSigner();
  const { rpcUrl, cluster } = rpcAndCluster();

  const sap = SapConnection.fromKeypair(rpcUrl, keypair, {
    ...(cluster ? { cluster } : {}),
  });
  const { client } = sap;

  const name = process.env.SYRA_SAP_NAME?.trim() || "Syra";
  const description = (process.env.SYRA_SAP_DESCRIPTION?.trim() || DEFAULT_DESCRIPTION).slice(0, 256);
  const agentUri = process.env.SYRA_SAP_AGENT_URI?.trim() || "https://syraa.fun";
  const x402Endpoint = process.env.SYRA_SAP_X402_ENDPOINT?.trim() || "https://api.syraa.fun";
  const agentId = process.env.SYRA_SAP_AGENT_ID?.trim() || "did:sap:syra";

  console.log("SAP cluster:", sap.cluster);
  console.log("RPC:", rpcUrl.replace(/api_key=[^&]+/i, "api_key=(redacted)"));
  console.log("Signer:", keypair.publicKey.toBase58());

  const solBefore = await sap.getBalanceSol(keypair.publicKey);
  console.log("Balance (SOL):", solBefore);

  const result = await client.builder
    .agent(name)
    .description(description)
    .agentId(agentId)
    .agentUri(agentUri)
    .x402Endpoint(x402Endpoint)
    .addCapability("syra:market-intelligence", {
      protocol: "syra",
      version: "2",
      description: "Aggregated crypto market intelligence (Brain, analytics, research).",
    })
    .addCapability("syra:news-sentiment", {
      protocol: "syra",
      version: "2",
      description: "News, sentiment, and trending headlines.",
    })
    .addCapability("syra:signals-research", {
      protocol: "syra",
      version: "2",
      description: "Technical signals, token research, smart-money context.",
    })
    .addPricingTier({
      tierId: "free",
      pricePerCall: 0,
      rateLimit: 10,
      tokenType: "sol",
      settlementMode: "x402",
    })
    .addPricingTier({
      tierId: "standard",
      pricePerCall: 5_000,
      rateLimit: 120,
      tokenType: "sol",
      settlementMode: "x402",
    })
    .addProtocol("MCP")
    .addProtocol("A2A")
    .register();

  console.log("Agent PDA:", result.agentPda.toBase58());
  console.log("Stats PDA:", result.statsPda.toBase58());
  console.log("Register TX:", result.txSignature);

  const agent = await client.agent.fetch();
  console.log("On-chain name:", agent.name);
  console.log("Active:", agent.isActive);
  console.log("Capabilities:", agent.capabilities?.length ?? 0);
  console.log("Pricing tiers:", agent.pricing?.length ?? 0);
  console.log("Protocols:", agent.protocols?.join(", ") ?? "");

  if (process.env.SAP_SKIP_INDEX === "1") {
    console.log("SAP_SKIP_INDEX=1 — skipping discovery indexes.");
    return;
  }

  const caps = ["syra:market-intelligence", "syra:news-sentiment", "syra:signals-research"];
  const protocols = ["MCP", "A2A"];

  for (const capabilityId of caps) {
    try {
      const sig = await client.indexing.initCapabilityIndex(capabilityId);
      console.log("initCapabilityIndex", capabilityId, sig);
    } catch (e) {
      const msg = e?.message || String(e);
      if (/already in use|custom program error|0x0/i.test(msg)) {
        const sig = await client.indexing.addToCapabilityIndex(capabilityId);
        console.log("addToCapabilityIndex", capabilityId, sig);
      } else {
        throw e;
      }
    }
  }

  for (const protocolId of protocols) {
    try {
      const sig = await client.indexing.initProtocolIndex(protocolId);
      console.log("initProtocolIndex", protocolId, sig);
    } catch (e) {
      const msg = e?.message || String(e);
      if (/already in use|custom program error|0x0/i.test(msg)) {
        const sig = await client.indexing.addToProtocolIndex(protocolId);
        console.log("addToProtocolIndex", protocolId, sig);
      } else {
        throw e;
      }
    }
  }

  console.log("Syra SAP registration and indexing complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
