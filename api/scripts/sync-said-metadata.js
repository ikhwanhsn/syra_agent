#!/usr/bin/env node
/**
 * Refresh Syra AgentCard on SAID: pin new JSON to IPFS + update on-chain metadata URI.
 *
 * Usage:
 *   cd api && npm run sync-said-metadata
 */

import "dotenv/config";
import {
  refreshSyraSaidMetadata,
  getVerification,
  getSyraSaidWallet,
} from "../libs/saidClient.js";
import { SYRA_AGENT_DESCRIPTION } from "../config/syraBranding.js";

async function main() {
  const wallet = getSyraSaidWallet();
  if (!wallet) {
    console.error("Set SAID_AGENT_WALLET in .env (run npm run register-said first).");
    process.exit(1);
  }

  console.log("Refreshing Syra SAID metadata (IPFS + on-chain update_agent)…");
  console.log(`Wallet: ${wallet}`);
  console.log(`New description: ${SYRA_AGENT_DESCRIPTION}`);

  const result = await refreshSyraSaidMetadata();

  console.log("\nOn-chain update complete:");
  console.log(`  Metadata URI: ${result.metadataUri}`);
  console.log(`  Tx signature: ${result.txSignature}`);
  if (!result.offChainSuccess) {
    console.warn(`  Off-chain directory sync skipped/failed: ${result.offChainError ?? "unknown"}`);
  }

  // SAID API may cache briefly
  await new Promise((r) => setTimeout(r, 3000));

  const check = await getVerification(wallet);
  if (check.success && check.data && typeof check.data === "object") {
    const identity = check.data.identity;
    console.log("\nSAID API identity:");
    console.log(`  description: ${identity?.description ?? "?"}`);
  }

  console.log("\nProfile: https://www.saidprotocol.com/agents/" + wallet);
}

main().catch((err) => {
  console.error(err?.message ?? String(err));
  process.exit(1);
});
