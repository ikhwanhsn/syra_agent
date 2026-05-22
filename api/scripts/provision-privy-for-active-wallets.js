#!/usr/bin/env node
/**
 * Provision Privy Server Wallets alongside existing legacy custodial wallets.
 *
 * Flow per AgentWallet row:
 *   1. If custody === 'privy' already, skip.
 *   2. Create a Privy server wallet for the same chain.
 *   3. Insert a NEW AgentWallet row with custody='privy', status='active', anonymousId = legacy + ':privy'.
 *   4. Mark the legacy row status='migrating'.
 *
 * The user-facing sweep (drain legacy → new Privy agent address) is triggered by the frontend
 * and signed with the connected user wallet. This script only stages the new wallet row + Privy
 * provisioning so the sweep UI has something to target.
 *
 * Required env:
 *   - MONGODB_URI
 *   - AGENT_WALLET_SECRET_ENCRYPTION_KEY (mandatory at boot now)
 *   - PRIVY_APP_ID, PRIVY_APP_SECRET
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/provision-privy-for-active-wallets.js [--limit=50] [--chain=solana]
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import {
  assertAgentWalletSecretEncryptionConfigured,
} from '../libs/agentWalletSecretCrypto.js';
import {
  isPrivyConfigured,
  createPrivyServerWallet,
} from '../services/privyServerWallet.js';

function readFlag(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  return arg.split('=')[1];
}

async function main() {
  assertAgentWalletSecretEncryptionConfigured();
  if (!isPrivyConfigured()) {
    console.error('PRIVY_APP_ID and PRIVY_APP_SECRET are required.');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  const limit = Number.parseInt(readFlag('limit', '25'), 10);
  const chainFilter = readFlag('chain', 'solana');
  if (chainFilter !== 'solana') {
    console.error('Only chain=solana is supported in P1 (Base custody is retired).');
    process.exit(1);
  }

  await connectMongoose();

  const candidates = await AgentWallet.find({
    custody: { $in: ['legacy', null] },
    status: { $in: ['active', null] },
    chain: 'solana',
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  console.log(`Found ${candidates.length} legacy active Solana wallets to provision Privy for.`);

  let provisioned = 0;
  let failed = 0;
  for (const row of candidates) {
    try {
      const { privyWalletId, agentAddress } = await createPrivyServerWallet({
        chain: 'solana',
        anonymousId: row.anonymousId,
      });
      const newAnonymousId = `${row.anonymousId}:privy`;
      await AgentWallet.create({
        anonymousId: newAnonymousId,
        walletAddress: row.walletAddress,
        chain: 'solana',
        agentAddress,
        custody: 'privy',
        privyWalletId,
        status: 'active',
        avatarUrl: row.avatarUrl,
        dailySpendCapUsd: row.dailySpendCapUsd ?? 250,
        hourlySpendCapUsd: row.hourlySpendCapUsd ?? 100,
        perTxCapUsd: row.perTxCapUsd ?? 50,
        allowedTools: row.allowedTools || [],
        destinationAllowlist: row.walletAddress ? [row.walletAddress] : [],
      });
      await AgentWallet.updateOne({ _id: row._id }, { $set: { status: 'migrating' } });
      provisioned += 1;
      console.log(`  + ${row.anonymousId} → ${privyWalletId} ${agentAddress}`);
    } catch (err) {
      failed += 1;
      console.error(`  ! failed for ${row.anonymousId}: ${err?.message || err}`);
    }
  }

  await mongoose.connection.close();
  console.log(`Done. provisioned=${provisioned} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
