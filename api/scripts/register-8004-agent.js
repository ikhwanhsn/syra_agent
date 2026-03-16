#!/usr/bin/env node
/**
 * Register the Syra Agent on the 8004 Trustless Agent Registry (Solana).
 * See: https://8004.qnt.sh/skill.md
 *
 * Prerequisites:
 *   - SOLANA_PRIVATE_KEY or PAYER_KEYPAIR in .env (JSON array of 64 bytes, or use PAYER_KEYPAIR format)
 *   - PINATA_JWT in .env for IPFS pinning (get from https://app.pinata.cloud)
 *   - Optional: SYRA_AGENT_IMAGE_URI (ipfs://... or https://...) for agent image; omit for no image
 *   - Optional: SOLANA_RPC_URL must be an RPC that allows blockchain access (some keys return 403).
 *     Use Helius, QuickNode, Triton, or devnet (SOLANA_CLUSTER=devnet) with a devnet RPC.
 *
 * Usage:
 *   cd api && node scripts/register-8004-agent.js
 *   # Or with env from file: node -r dotenv/config scripts/register-8004-agent.js
 */

import "dotenv/config";
import { Keypair } from "@solana/web3.js";
import {
  SolanaSDK,
  IPFSClient,
  buildRegistrationFileJson,
  ServiceType,
} from "8004-solana";
import bs58 from "bs58";

function getSigner() {
  // SOLANA_PRIVATE_KEY: JSON array of 64 bytes, e.g. "[1,2,...,64]"
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch (_) {
      // not JSON array
    }
  }
  // AGENT_PRIVATE_KEY or ZAUTH_SOLANA_PRIVATE_KEY: base58 secret (64 bytes decoded)
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    const bytes = bs58.decode(b58);
    return Keypair.fromSecretKey(bytes);
  }
  throw new Error(
    "Set SOLANA_PRIVATE_KEY (JSON array of 64 bytes), PAYER_KEYPAIR, or AGENT_PRIVATE_KEY (base58) in .env"
  );
}

async function main() {
  const signer = getSigner();
  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    console.error("Missing PINATA_JWT. Get a JWT at https://app.pinata.cloud and add to .env");
    process.exit(1);
  }

  const imageUri =
    process.env.SYRA_AGENT_IMAGE_URI ||
    "https://syraa.fun/images/logo.jpg"; /* fallback if no IPFS image */

  const metadata = buildRegistrationFileJson({
    name: "Syra",
    description:
      "AI Trading Intelligence Agent for Solana. Real-time signals, crypto news, sentiment, deep research, token reports, memecoin screens, and x402-native API. Used by Telegram bot, Cursor/Claude MCP, and autonomous agents.",
    image: imageUri,
    services: [
      { type: ServiceType.MCP, value: "https://api.syraa.fun" },
    ],
    skills: [
      "natural_language_processing/text_classification/sentiment_analysis",
      "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
      "natural_language_processing/analytical_reasoning/problem_solving",
      "tool_interaction/tool_use_planning",
    ],
    domains: ["finance_and_business/finance"],
    x402Support: true,
  });

  const ipfs = new IPFSClient({
    pinataEnabled: true,
    pinataJwt,
  });

  const sdk = new SolanaSDK({
    cluster: process.env.SOLANA_CLUSTER || "mainnet-beta",
    rpcUrl: process.env.SOLANA_RPC_URL || "https://rpc.ankr.com/solana",
    signer,
  });

  console.log("Uploading registration metadata to IPFS...");
  const cid = await ipfs.addJson(metadata);
  const tokenUri = `ipfs://${cid}`;
  console.log("Token URI:", tokenUri);

  console.log("Registering agent on 8004 (Solana)...");
  let result;
  try {
    result = await sdk.registerAgent(tokenUri, {
      atomEnabled: process.env["8004_ATOM_ENABLED"] === "true",
    });
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("403") || msg.includes("not allowed to access blockchain")) {
      console.error(
        "Solana RPC rejected the request (403). Your RPC API key may not have blockchain access.\n" +
          "Use an RPC that allows full access (e.g. Helius, QuickNode, Triton) or set SOLANA_CLUSTER=devnet\n" +
          "and a devnet RPC in SOLANA_RPC_URL. Current SOLANA_RPC_URL is used from .env."
      );
    }
    throw err;
  }

  if (!result?.asset) {
    console.error("Registration did not return an agent asset. RPC may have blocked the tx. Check logs above.");
    process.exit(1);
  }

  console.log("Registration successful.");
  console.log("Agent asset (NFT) address:", result.asset.toBase58());
  console.log("Transaction signature:", result.signature);
  await ipfs.close();
}

main().catch((err) => {
  console.error(err?.message ?? String(err));
  process.exit(1);
});
