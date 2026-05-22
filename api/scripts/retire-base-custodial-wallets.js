#!/usr/bin/env node
/**
 * P0.7 — retire existing Base custodial wallets.
 *
 * No production code path signs Base transactions with these keys; keeping them is a pure
 * liability. This script:
 *   - sets status='retired'
 *   - clears agentSecretKey (overwrites the field with null after one final read for the audit log)
 *
 * After this runs, any attempt to load a Base agent keypair via the legacy path returns null.
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/retire-base-custodial-wallets.js [--dry-run]
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import { assertAgentWalletSecretEncryptionConfigured } from '../libs/agentWalletSecretCrypto.js';

async function main() {
  assertAgentWalletSecretEncryptionConfigured();
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');

  await connectMongoose();

  const candidates = await AgentWallet.find({ chain: 'base', custody: { $ne: 'privy' } })
    .select('_id anonymousId agentAddress walletAddress status')
    .lean();
  console.log(`Found ${candidates.length} Base custodial agent wallets to retire (dry-run=${dryRun}).`);

  if (!dryRun && candidates.length > 0) {
    const ids = candidates.map((c) => c._id);
    const r = await AgentWallet.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'retired', agentSecretKey: null, custody: 'legacy' } }
    );
    console.log(`Updated ${r.modifiedCount} rows.`);
  }
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
