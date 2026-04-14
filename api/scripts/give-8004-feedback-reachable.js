#!/usr/bin/env node
/**
 * Submit "reachable" feedback with score 100 for an 8004 agent (after verifying liveness).
 * Use this to add a positive review so the agent’s displayed score can move toward 100.
 * @see https://8004.qnt.sh/skill.md (Section 5 Feedback, Section 23 Monitor agent health)
 *
 * Prerequisites:
 *   - SOLANA_PRIVATE_KEY or PAYER_KEYPAIR or AGENT_PRIVATE_KEY (the wallet that gives feedback = "client")
 *   - Either PINATA_JWT (to upload feedback file to IPFS) or FEEDBACK_URI (HTTPS or ipfs://)
 *
 * Usage:
 *   cd api && node scripts/give-8004-feedback-reachable.js <AGENT_ASSET_BASE58>
 *   # Or: 8004_AGENT_ASSET=<base58> node scripts/give-8004-feedback-reachable.js
 *
 * The script runs a liveness check first; if the agent is not "live", it exits with instructions.
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { Keypair, PublicKey } from "@solana/web3.js";
import { SolanaSDK, IPFSClient, Tag } from "8004-solana";
import bs58 from "bs58";
import { getLiveness } from "../libs/agentRegistry8004.js";

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

function getAgentAsset() {
  const fromEnv =
    process.env["8004_AGENT_ASSET"] ||
    process.env["SYRA_AGENT_ASSET"] ||
    process.argv[2];
  if (!fromEnv || typeof fromEnv !== "string") {
    console.error("Usage: node give-8004-feedback-reachable.js <AGENT_ASSET_BASE58>");
    console.error("   or set 8004_AGENT_ASSET or SYRA_AGENT_ASSET in .env");
    process.exit(1);
  }
  try {
    return new PublicKey(fromEnv.trim());
  } catch (e) {
    console.error("Invalid agent asset (public key):", e.message);
    process.exit(1);
  }
}

async function main() {
  const signer = getSigner();
  const asset = getAgentAsset();
  const assetBase58 = asset.toBase58();

  const cluster = process.env.SOLANA_CLUSTER || "mainnet-beta";
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

  // 1. Liveness check (read-only)
  const report = await getLiveness(assetBase58, { timeoutMs: 15000 });
  if (report.status !== "live") {
    console.error(
      "Agent is not fully live (status: %s). Fix MCP/A2A endpoints so they respond successfully, then re-run.",
      report.status
    );
    if (report.deadServices && report.deadServices.length) {
      console.error("Dead services:", report.deadServices);
    }
    process.exit(1);
  }

  // 2. Resolve feedbackUri
  let feedbackUri = process.env.FEEDBACK_URI;
  if (!feedbackUri && process.env.PINATA_JWT) {
    const ipfs = new IPFSClient({
      pinataEnabled: true,
      pinataJwt: process.env.PINATA_JWT,
    });
    const feedbackFile = {
      version: "1.0",
      type: "reachable-feedback",
      agent: assetBase58,
      client: signer.publicKey.toBase58(),
      reachable: true,
      score: 100,
      timestamp: new Date().toISOString(),
    };
    const cid = await ipfs.addJson(feedbackFile);
    feedbackUri = `ipfs://${cid}`;
    await ipfs.close();
  }
  if (!feedbackUri || feedbackUri.length > 250) {
    console.error(
      "Missing feedbackUri. Set FEEDBACK_URI (HTTPS or ipfs://, max 250 chars) or PINATA_JWT in .env"
    );
    process.exit(1);
  }

  // 3. Give feedback (reachable=1, score=100)
  const sdk = new SolanaSDK({
    cluster,
    rpcUrl,
    signer,
  });

  await sdk.giveFeedback(asset, {
    value: 1,
    valueDecimals: 0,
    tag1: Tag.reachable,
    score: 100,
    feedbackUri,
  });
}

main().catch((e) => {
  console.error(e?.message ?? String(e));
  process.exit(1);
});
