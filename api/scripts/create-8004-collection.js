#!/usr/bin/env node
/**
 * Create a Syra Agent collection on the 8004 Trustless Agent Registry and attach
 * it to the already-registered Syra agent. See: https://8004.qnt.sh/skill.md
 *
 * Prerequisites:
 *   - Syra agent already registered (run: npm run register-8004)
 *   - SOLANA_PRIVATE_KEY or PAYER_KEYPAIR or AGENT_PRIVATE_KEY in .env
 *   - PINATA_JWT in .env for IPFS pinning
 *   - SYRA_AGENT_ASSET: agent NFT address (default: from last registration)
 * Optional (for collection card image, website link, X/Twitter):
 *   - SYRA_COLLECTION_IMAGE_URI: logo image URL (ipfs:// or https://)
 *   - SYRA_COLLECTION_BANNER_URI: banner image URL (optional)
 *   - SYRA_COLLECTION_EXTERNAL_URL: website link (e.g. https://syraa.fun)
 *   - SYRA_COLLECTION_X_URL: X/Twitter profile URL (e.g. https://x.com/syraa)
 *
 * Usage:
 *   cd api && node scripts/create-8004-collection.js
 *   # Or: node -r dotenv/config scripts/create-8004-collection.js
 */

import "dotenv/config";
import { Keypair, PublicKey } from "@solana/web3.js";
import { SolanaSDK, IPFSClient } from "8004-solana";
import bs58 from "bs58";

/** Default agent asset from your registration. Override with SYRA_AGENT_ASSET in .env */
const DEFAULT_AGENT_ASSET = "8aJwH76QsQe5uEAxbFXha24toSUKjHxsdCk4BRuKERYx";

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

  const agentAssetBase58 = process.env.SYRA_AGENT_ASSET || DEFAULT_AGENT_ASSET;
  const asset = new PublicKey(agentAssetBase58);

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

  // AccountNotInitialized usually means cluster mismatch: agent was registered on a different
  // cluster (e.g. mainnet) but this script is using another (e.g. devnet). Use the same
  // SOLANA_CLUSTER and RPC as when you ran register-8004.
  console.log("Cluster:", cluster, "| RPC:", rpcUrl ? new URL(rpcUrl).hostname : "(SDK default)");

  const imageUri = process.env.SYRA_COLLECTION_IMAGE_URI?.trim() || undefined;
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
    ...(imageUri && { image: imageUri }),
    ...(bannerUri && { banner_image: bannerUri }),
    external_url: externalUrl,
    socials,
  };

  console.log("Creating Syra collection metadata and uploading to IPFS...");
  const result = await sdk.createCollection(collectionData);

  if (!result.pointer || !result.uri) {
    console.error("createCollection did not return pointer/uri. Check SDK and IPFS.");
    process.exit(1);
  }

  console.log("Collection URI:", result.uri);
  console.log("Collection pointer:", result.pointer);

  console.log("Attaching collection pointer to Syra agent", agentAssetBase58, "...");
  const txResult = await sdk.setCollectionPointer(asset, result.pointer, { lock: true });

  if (txResult?.success && txResult?.signature) {
    console.log("Collection created and attached successfully.");
    console.log("Transaction signature:", txResult.signature);
  } else {
    const err = txResult?.error ?? "no signature returned";
    if (typeof err === "string" && (err.includes("CollectionPointerAlreadySet") || err.includes("Collection pointer is locked"))) {
      console.error("setCollectionPointer failed: Collection pointer is already set and locked for this agent.");
      console.error("The on-chain pointer cannot be changed. New metadata was uploaded to IPFS:", result.uri);
      console.error("To use new image/links, you would need a different agent that does not have a pointer set yet.");
    } else {
      console.error("setCollectionPointer failed:", typeof err === "string" ? err : (err?.message ?? "unknown error"));
    }
    process.exit(1);
  }

  await ipfs.close();
}

main().catch((err) => {
  console.error(err?.message ?? String(err));
  process.exit(1);
});
