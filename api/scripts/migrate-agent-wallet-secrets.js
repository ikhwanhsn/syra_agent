#!/usr/bin/env node
/**
 * One-time migration: encrypt plaintext AgentWallet.agentSecretKey values.
 *
 * Requires: MONGODB_URI, AGENT_WALLET_SECRET_ENCRYPTION_KEY (same as production API).
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/migrate-agent-wallet-secrets.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import {
  encryptAgentSecretForStorage,
  isAgentWalletSecretEncryptionConfigured,
  isEncryptedAgentWalletSecret,
} from '../libs/agentWalletSecretCrypto.js';

async function main() {
  if (!isAgentWalletSecretEncryptionConfigured()) {
    console.error('Set AGENT_WALLET_SECRET_ENCRYPTION_KEY (32-byte hex or base64) before running.');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  await connectMongoose();
  const cursor = AgentWallet.find({}).select('_id agentSecretKey').cursor();
  let updated = 0;
  let skipped = 0;
  for await (const doc of cursor) {
    if (!doc.agentSecretKey) {
      skipped += 1;
      continue;
    }
    if (isEncryptedAgentWalletSecret(doc.agentSecretKey)) {
      skipped += 1;
      continue;
    }
    const enc = encryptAgentSecretForStorage(doc.agentSecretKey);
    await AgentWallet.updateOne({ _id: doc._id }, { $set: { agentSecretKey: enc } });
    updated += 1;
  }
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
