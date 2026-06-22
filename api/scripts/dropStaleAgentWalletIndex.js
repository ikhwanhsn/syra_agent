/**
 * Migration: drop the stale `walletAddress_1_chain_1` unique index on agentwallets.
 *
 * Why: the AgentWallet schema enforces uniqueness on { walletAddress, chain, purpose } so a single
 * connected wallet can own one wallet per pillar purpose (spend/earn/treasury/invest/grow/lp).
 * An older schema version created a `{ walletAddress, chain }` unique index. When both indexes exist,
 * provisioning the second pillar (earn) for a wallet fails with E11000 — only the spend wallet is ever
 * created. This script removes the obsolete index. Safe to run repeatedly (idempotent).
 *
 * Usage: node scripts/dropStaleAgentWalletIndex.js
 */
import 'dotenv/config';
import connectMongoose from '../config/mongoose.js';
import AgentWallet from '../models/agent/AgentWallet.js';

const STALE_INDEX_NAME = 'walletAddress_1_chain_1';

async function run() {
  await connectMongoose();

  const indexes = await AgentWallet.collection.indexes();
  const stale = indexes.find((idx) => idx.name === STALE_INDEX_NAME);

  if (!stale) {
    console.log(`[migration] '${STALE_INDEX_NAME}' not present — nothing to do.`);
    return;
  }

  console.log(`[migration] dropping stale index '${STALE_INDEX_NAME}' (key=${JSON.stringify(stale.key)})…`);
  await AgentWallet.collection.dropIndex(STALE_INDEX_NAME);
  console.log('[migration] dropped. Ensuring schema indexes are in sync…');

  await AgentWallet.syncIndexes();

  const after = await AgentWallet.collection.indexes();
  console.log('[migration] indexes now:');
  for (const idx of after) {
    console.log(`  ${idx.name}: key=${JSON.stringify(idx.key)} unique=${idx.unique ?? false} sparse=${idx.sparse ?? false}`);
  }
}

run()
  .then(() => {
    console.log('[migration] done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[migration] failed:', err?.message ?? err);
    process.exit(1);
  });
