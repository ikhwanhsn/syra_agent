#!/usr/bin/env node
/**
 * Migrate ALL users' LP wallets (:lp) → earn wallets (:earn).
 *
 * For each LP wallet:
 *   1. close   — force-close open Meteora positions
 *   2. sweep   — transfer SOL + SPL tokens to that user's :earn agent
 *   3. repoint — LpRealConfig → earn, retire :lp
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/migrate-lp-to-earn.js --dry-run
 *   cd api && node -r dotenv/config scripts/migrate-lp-to-earn.js --confirm
 *   cd api && node -r dotenv/config scripts/migrate-lp-to-earn.js --step audit
 *   cd api && node -r dotenv/config scripts/migrate-lp-to-earn.js --step all --confirm
 *   cd api && node -r dotenv/config scripts/migrate-lp-to-earn.js --wallet <owner> --confirm
 *       (legacy single-owner path for one admin wallet)
 */
import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  /* ignore */
}
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import { assertAgentWalletSecretEncryptionConfigured } from '../libs/agentWalletSecretCrypto.js';
import {
  migrateAllLpWalletsToEarn,
  migrateLpClosePositions,
  migrateLpSweepToEarn,
  migrateLpRepointAndRetire,
  runLpToEarnMigration,
  listAllLpAgentWallets,
  resolveEarnSiblingForLp,
  recoverBaseFromLpAnonymousId,
} from '../libs/lpToEarnMigration.js';
import { snapshotAgentBalances } from '../libs/agentWalletSweep.js';
import LpRealPosition from '../models/LpRealPosition.js';

function parseArgs(argv) {
  const out = {
    dryRun: argv.includes('--dry-run'),
    confirm: argv.includes('--confirm'),
    step: 'all',
    wallet: null,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--step' && argv[i + 1]) {
      out.step = String(argv[++i]).trim().toLowerCase();
    } else if (argv[i] === '--wallet' && argv[i + 1]) {
      out.wallet = String(argv[++i]).trim();
    }
  }
  return out;
}

async function auditAll() {
  const all = await listAllLpAgentWallets();
  const rows = [];
  for (const lp of all) {
    const base = recoverBaseFromLpAnonymousId(lp.anonymousId);
    let earn = null;
    try {
      const ctx = await resolveEarnSiblingForLp(lp);
      earn = ctx.earn;
    } catch {
      earn = null;
    }
    let balances = null;
    let balError = null;
    try {
      balances = await snapshotAgentBalances(lp.agentAddress);
    } catch (e) {
      balError = e?.message || String(e);
    }
    const openCount = await LpRealPosition.countDocuments({
      agentAddress: lp.agentAddress,
      status: { $in: ['open', 'opening', 'closing'] },
    });
    const hasFunds =
      balances &&
      (balances.sol > 0.005 || (balances.tokens && balances.tokens.length > 0));
    rows.push({
      lpAnonymousId: lp.anonymousId,
      lpAgentAddress: lp.agentAddress,
      lpStatus: lp.status,
      ownerWallet: lp.walletAddress || null,
      baseAnonymousId: base,
      earnAnonymousId: earn?.anonymousId || null,
      earnAgentAddress: earn?.agentAddress || null,
      openPositions: openCount,
      sol: balances?.sol ?? null,
      tokenCount: balances?.tokens?.length ?? 0,
      tokens: balances?.tokens?.map((t) => ({
        mint: t.mint,
        uiAmount: t.uiAmount,
      })),
      hasFunds: Boolean(hasFunds),
      needsMigration: Boolean(hasFunds || openCount > 0 || lp.status === 'active'),
      balError,
    });
  }
  return {
    total: rows.length,
    needsMigration: rows.filter((r) => r.needsMigration).length,
    withFunds: rows.filter((r) => r.hasFunds).length,
    withOpen: rows.filter((r) => r.openPositions > 0).length,
    missingEarn: rows.filter((r) => r.needsMigration && !r.earnAgentAddress).length,
    wallets: rows,
  };
}

async function main() {
  assertAgentWalletSecretEncryptionConfigured();
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  await connectMongoose();

  if (args.step === 'audit') {
    const data = await auditAll();
    console.log(JSON.stringify(data, null, 2));
    await mongoose.connection.close();
    return;
  }

  if (!args.dryRun && !args.confirm) {
    console.error('Refusing to run without --dry-run or --confirm.');
    process.exit(1);
  }

  let result;
  if (args.wallet) {
    // Single owner (legacy admin path)
    const opts = { ownerWallet: args.wallet, dryRun: args.dryRun, confirm: args.confirm, all: false };
    if (args.step === 'close') result = await migrateLpClosePositions(opts);
    else if (args.step === 'sweep') result = await migrateLpSweepToEarn(opts);
    else if (args.step === 'repoint') result = await migrateLpRepointAndRetire(opts);
    else result = await runLpToEarnMigration(opts);
  } else {
    // ALL users
    result = await migrateAllLpWalletsToEarn({
      dryRun: args.dryRun,
      confirm: args.confirm,
      onlyWithFunds: true,
    });
  }

  console.log('[migrate-lp-to-earn] result:');
  console.log(JSON.stringify(result, null, 2));
  await mongoose.connection.close();

  if (result.ok === false || (result.failed && result.failed > 0)) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('[migrate-lp-to-earn] FAILED:', err?.code || '', err?.message || err);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
