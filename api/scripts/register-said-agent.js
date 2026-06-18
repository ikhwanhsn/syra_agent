#!/usr/bin/env node
/**
 * Register and verify the Syra agent on SAID Protocol (Solana).
 * @see https://www.saidprotocol.com/docs
 *
 * Prerequisites:
 *   - Funded wallet (>= ~0.012 SOL on mainnet for verification 0.01 SOL + fees).
 *   - SOLANA_PRIVATE_KEY | PAYER_KEYPAIR (JSON byte array) or AGENT_PRIVATE_KEY | ZAUTH_SOLANA_PRIVATE_KEY (base58).
 *   - PINATA_JWT for AgentCard metadata upload (same as 8004 registration).
 *   - SOLANA_RPC_URL with blockchain access (Helius/QuickNode; some keys return 403).
 *
 * Usage:
 *   cd api && npm run register-said
 */

import "dotenv/config";
import {
  getSaidSigner,
  getSignerSolBalance,
  registerAndVerifySyra,
  getVerification,
  MIN_SOL_FOR_SAID_VERIFY,
} from "../libs/saidClient.js";

async function main() {
  const signer = getSaidSigner();
  const wallet = signer.publicKey.toBase58();

  console.log("SAID Protocol — register + verify Syra agent");
  console.log(`Signer wallet: ${wallet}`);

  const balance = await getSignerSolBalance(signer);
  console.log(`SOL balance: ${balance.toFixed(4)}`);

  if (balance < MIN_SOL_FOR_SAID_VERIFY) {
    console.error(
      `\nInsufficient SOL. Need at least ${MIN_SOL_FOR_SAID_VERIFY} SOL for on-chain verification (~0.01 SOL) plus fees.\n` +
        `Send SOL to: ${wallet}`
    );
    process.exit(1);
  }

  const result = await registerAndVerifySyra({ signerKeypair: signer });

  console.log("\nRegistration complete:");
  console.log(`  Wallet:              ${result.wallet}`);
  if (result.agentPDA) console.log(`  Agent PDA:           ${result.agentPDA}`);
  if (result.metadataUri) console.log(`  Metadata URI:        ${result.metadataUri}`);
  if (result.alreadyRegistered) {
    console.log("  On-chain register:   skipped (already registered)");
  } else if (result.registerSignature) {
    console.log(`  Register signature:  ${result.registerSignature}`);
  }
  if (result.alreadyVerified) {
    console.log("  Verification:        skipped (already verified)");
  } else if (result.verifySignature) {
    console.log(`  Verify signature:    ${result.verifySignature}`);
  }
  console.log(`  Verified:            ${result.verified}`);

  const apiCheck = await getVerification(result.wallet);
  if (apiCheck.success && apiCheck.data && typeof apiCheck.data === "object") {
    const data = apiCheck.data;
    console.log("\nSAID API check:");
    console.log(`  registered: ${data.registered ?? "?"}`);
    console.log(`  verified:   ${data.verified ?? "?"}`);
    if (data.name) console.log(`  name:       ${data.name}`);
  } else if (!apiCheck.success) {
    console.warn("\nSAID API check failed (on-chain result above is authoritative):", apiCheck.error);
  }

  console.log("\nNext step: add to api/.env");
  console.log(`SAID_AGENT_WALLET=${result.wallet}`);
}

main().catch((err) => {
  const msg = err?.message || String(err);
  if (/403|not allowed to access blockchain|getAccountInfo/i.test(msg)) {
    console.error(
      "\nSolana RPC rejected the request. Use an RPC with full blockchain access\n" +
        "(Helius, QuickNode, Triton) in SOLANA_RPC_URL."
    );
  }
  console.error(msg);
  process.exit(1);
});
