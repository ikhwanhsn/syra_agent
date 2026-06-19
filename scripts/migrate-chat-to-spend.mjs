/**
 * One-time migration: chat -> spend (same anonymousId + keypair, no fund movement).
 *
 * Run from repo root:
 *   node scripts/migrate-chat-to-spend.mjs
 *
 * Requires MONGODB_URI (or api/.env loaded by mongoose connect in script).
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '../api/package.json'));
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../api/.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const { default: AgentWallet } = await import('../api/models/agent/AgentWallet.js');
const { defaultAllocationConfigForPurpose } = await import('../api/config/walletAllocations.js');

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('[migrate-chat-to-spend] connected');

  const filter = {
    $or: [{ purpose: 'chat' }, { purpose: { $exists: false } }, { purpose: null }],
    status: { $ne: 'retired' },
    anonymousId: { $not: /:(lp|earn|treasury|invest|grow)$/ },
  };

  const count = await AgentWallet.countDocuments(filter);
  console.log(`[migrate-chat-to-spend] found ${count} chat/legacy rows`);

  if (count === 0) {
    await mongoose.disconnect();
    return;
  }

  const allocationConfig = defaultAllocationConfigForPurpose('spend');
  const cursor = AgentWallet.find(filter).select('_id anonymousId walletAddress').cursor();

  let updated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    try {
      const res = await AgentWallet.updateOne(
        { _id: doc._id },
        {
          $set: {
            purpose: 'spend',
            provisionedVia: 'migration',
            allocationConfig,
          },
        },
      );
      if (res.modifiedCount) updated += 1;
    } catch (err) {
      if (err?.code === 11000) {
        skipped += 1;
        console.warn(
          `[migrate-chat-to-spend] skip index conflict: ${doc.anonymousId} (left purpose=chat; runtime maps chat->spend)`,
        );
        continue;
      }
      throw err;
    }
  }

  console.log(`[migrate-chat-to-spend] updated ${updated} rows to purpose=spend`);
  if (skipped > 0) {
    console.log(`[migrate-chat-to-spend] skipped ${skipped} rows due to walletAddress+purpose unique index`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[migrate-chat-to-spend] failed:', err);
  process.exit(1);
});
