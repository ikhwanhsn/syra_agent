#!/usr/bin/env node
/**
 * Register Syra on the AIP on-chain registry (did:aip).
 * @see https://aipagents.xyz
 *
 * Prerequisites:
 *   - Funded Solana wallet (devnet SOL for fees + rent on devnet registry).
 *   - SOLANA_PRIVATE_KEY | PAYER_KEYPAIR (JSON byte array) or AGENT_PRIVATE_KEY (base58).
 *   - AIP_CLUSTER=devnet (default) or mainnet-beta when AIP registry is on mainnet.
 *
 * Usage:
 *   cd api && npm run register-aip
 *   cd api && npm run register-aip -- --deregister-first
 */

import "dotenv/config";
import { getAipCluster, getAipRpcUrl } from "../config/aipConfig.js";
import { buildSyraAipAgentCard, buildSyraAipAgentCardDocument } from "../libs/aipAgentCard.js";
import {
  getAipSigner,
  isAgentOnChain,
  registerSyraOnAipRegistry,
} from "../libs/aipRegistryClient.js";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  const deregisterFirst = process.argv.includes("--deregister-first");
  const signer = getAipSigner();
  const wallet = signer.publicKey.toBase58();
  const cluster = getAipCluster();
  const rpc = getAipRpcUrl();

  console.log("AIP Protocol — register Syra agent on-chain");
  console.log(`Signer wallet: ${wallet}`);
  console.log(`Cluster:       ${cluster}`);
  console.log(`RPC:           ${rpc}`);

  const connection = new Connection(rpc, "confirmed");
  const balance = await connection.getBalance(signer.publicKey);
  console.log(`SOL balance:   ${(balance / LAMPORTS_PER_SOL).toFixed(4)}`);

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    console.error("\nInsufficient SOL for registry rent + fees.");
    if (cluster === "devnet") {
      console.error(`Airdrop devnet SOL to: ${wallet}`);
    }
    process.exit(1);
  }

  const card = buildSyraAipAgentCard(wallet);
  const cardDoc = buildSyraAipAgentCardDocument(wallet);
  const agentId = process.env.SYRA_AIP_AGENT_ID?.trim() || "syra";
  const already = await isAgentOnChain(connection, signer.publicKey, agentId);

  if (already && !deregisterFirst) {
    console.log("\nAgent already registered on-chain.");
    console.log(`  DID: ${cardDoc.did}`);
    console.log("  Re-run with --deregister-first to replace the record.");
    console.log("\nNext step: add to api/.env");
    console.log(`SYRA_AIP_WALLET=${wallet}`);
    return;
  }

  const result = await registerSyraOnAipRegistry({
    signer,
    card,
    agentId,
    deregisterFirst,
  });

  console.log("\nRegistration complete:");
  console.log(`  DID:        ${result.did}`);
  console.log(`  PDA:        ${result.pda}`);
  console.log(`  Signature:  ${result.registerSignature}`);
  console.log(`  Endpoint:   ${result.card.endpoint}`);
  console.log(`  Agent Card: ${cardDoc.agentCardUrl}`);

  console.log("\nNext step: add to api/.env");
  console.log(`SYRA_AIP_WALLET=${result.wallet}`);
  console.log(`SYRA_AIP_AGENT_ID=${result.agentId}`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
