#!/usr/bin/env node
/**
 * Register a new Syra Agent on 8004 and attach the Syra Agents collection
 * (with image, website, X link from .env) in one run. See: https://8004.qnt.sh/skill.md
 *
 * Prerequisites:
 *   - SOLANA_PRIVATE_KEY or PAYER_KEYPAIR or AGENT_PRIVATE_KEY in .env
 *   - PINATA_JWT in .env
 * Optional agent: SYRA_AGENT_IMAGE_URI
 * Collection: either use an existing collection or create a new one:
 *   - SYRA_COLLECTION_POINTER: existing pointer (e.g. c1:bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm).
 *     If set, the new agent is added to this collection (no new collection created).
 *   - If not set: creates new collection (use SYRA_COLLECTION_IMAGE_URI, SYRA_COLLECTION_EXTERNAL_URL, SYRA_COLLECTION_X_URL for card).
 *
 * Usage:
 *   cd api && node scripts/register-8004-agent-with-collection.js
 *   # Or from repo root: node api/scripts/register-8004-agent-with-collection.js
 *   # (script always loads api/.env so SYRA_COLLECTION_POINTER is read correctly)
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Always load api/.env so SYRA_COLLECTION_POINTER is read even when run from repo root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { Keypair } from "@solana/web3.js";
import {
  SolanaSDK,
  IPFSClient,
  buildRegistrationFileJson,
  ServiceType,
} from "8004-solana";
import bs58 from "bs58";

function getSigner() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch (_) {}
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    const bytes = bs58.decode(b58);
    return Keypair.fromSecretKey(bytes);
  }
  throw new Error(
    "Set SOLANA_PRIVATE_KEY (JSON array), PAYER_KEYPAIR, or AGENT_PRIVATE_KEY (base58) in .env"
  );
}

async function main() {
  const signer = getSigner();
  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    console.error("Missing PINATA_JWT. Get a JWT at https://app.pinata.cloud and add to .env");
    process.exit(1);
  }

  const ipfs = new IPFSClient({
    pinataEnabled: true,
    pinataJwt,
  });

  const cluster = process.env.SOLANA_CLUSTER || "mainnet-beta";
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

  const sdk = new SolanaSDK({
    cluster,
    rpcUrl,
    signer,
    ipfsClient: ipfs,
  });

  console.log("Cluster:", cluster, "| RPC:", rpcUrl ? new URL(rpcUrl).hostname : "(SDK default)");

  // --- 1. Register new agent ---
  const imageUri =
    process.env.SYRA_AGENT_IMAGE_URI || "https://syraa.fun/images/logo.jpg";

  const metadata = buildRegistrationFileJson({
    name: "Syra",
    description:
      "AI Trading Intelligence Agent for Solana. Real-time signals, crypto news, sentiment, deep research, token reports, memecoin screens, and x402-native API. Used by Telegram bot, Cursor/Claude MCP, and autonomous agents.",
    image: imageUri,
    services: [{ type: ServiceType.MCP, value: "https://api.syraa.fun" }],
    skills: [
      "natural_language_processing/text_classification/sentiment_analysis",
      "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
      "natural_language_processing/analytical_reasoning/problem_solving",
      "tool_interaction/tool_use_planning",
    ],
    domains: ["finance_and_business/finance"],
    x402Support: true,
  });

  console.log("Uploading agent registration metadata to IPFS...");
  const cid = await ipfs.addJson(metadata);
  const tokenUri = `ipfs://${cid}`;
  console.log("Token URI:", tokenUri);

  console.log("Registering new agent on 8004 (Solana)...");
  let result;
  try {
    result = await sdk.registerAgent(tokenUri, {
      atomEnabled: process.env["8004_ATOM_ENABLED"] === "true",
    });
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes("403") || msg.includes("not allowed to access blockchain")) {
      console.error(
        "Solana RPC rejected the request (403). Use an RPC with full access or SOLANA_CLUSTER=devnet."
      );
    }
    throw err;
  }

  if (!result?.asset) {
    console.error("Registration did not return an agent asset. Check logs above.");
    process.exit(1);
  }

  const asset = result.asset;
  console.log("Agent registered. Asset:", asset.toBase58(), "| Tx:", result.signature);

  // --- 2. Attach collection to new agent (existing pointer or create new collection) ---
  const existingPointer = process.env.SYRA_COLLECTION_POINTER?.trim() || undefined;

  if (!existingPointer) {
    console.warn(
      "SYRA_COLLECTION_POINTER is not set in api/.env — a new collection will be created.\n" +
        "To add this agent to your existing Syra collection, set SYRA_COLLECTION_POINTER=c1:... in api/.env"
    );
  }

  let collectionPointer;
  if (existingPointer) {
    if (!existingPointer.startsWith("c1:")) {
      console.error("SYRA_COLLECTION_POINTER must start with c1:");
      await ipfs.close();
      process.exit(1);
    }
    collectionPointer = existingPointer;
    console.log("Using existing collection pointer:", collectionPointer);
  } else {
    const imageUriCol = process.env.SYRA_COLLECTION_IMAGE_URI?.trim() || undefined;
    const bannerUri = process.env.SYRA_COLLECTION_BANNER_URI?.trim() || undefined;
    const externalUrl =
      process.env.SYRA_COLLECTION_EXTERNAL_URL?.trim() || "https://syraa.fun";
    const xUrl =
      process.env.SYRA_COLLECTION_X_URL?.trim() ||
      process.env.SYRA_COLLECTION_TWITTER_URL?.trim() ||
      "https://x.com/syraa";

    const socials = {
      website: externalUrl,
      x: xUrl,
    };

    const collectionData = {
      name: "Syra Agents",
      symbol: "SYRA",
      description:
        "AI Trading Intelligence Agents for Solana. Real-time signals, crypto news, sentiment, deep research, token reports, and x402-native API. Used by Telegram bot, Cursor/Claude MCP, and autonomous agents.",
      ...(imageUriCol && { image: imageUriCol }),
      ...(bannerUri && { banner_image: bannerUri }),
      external_url: externalUrl,
      socials,
    };

    console.log("Creating Syra collection metadata and uploading to IPFS...");
    const colResult = await sdk.createCollection(collectionData);

    if (!colResult.pointer || !colResult.uri) {
      console.error("createCollection did not return pointer/uri.");
      await ipfs.close();
      process.exit(1);
    }

    console.log("Collection URI:", colResult.uri, "| Pointer:", colResult.pointer);
    collectionPointer = colResult.pointer;
  }

  console.log("Attaching collection pointer to new agent...");
  const txResult = await sdk.setCollectionPointer(asset, collectionPointer, { lock: true });

  if (txResult?.success && txResult?.signature) {
    console.log("Collection attached. Tx:", txResult.signature);
  } else {
    console.error("setCollectionPointer failed:", txResult?.error ?? "no signature");
    await ipfs.close();
    process.exit(1);
  }

  await ipfs.close();

  console.log("\nDone. New agent asset (save for SYRA_AGENT_ASSET):", asset.toBase58());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
