#!/usr/bin/env node
/**
 * Recover SOL from legacy multiwallet farm wallets (CLI).
 *
 * Sells all $ANSEM on each wallet, then sweeps remaining SOL to the owner wallet.
 *
 * Required env:
 *   - MONGODB_URI
 *   - AGENT_WALLET_SECRET_ENCRYPTION_KEY
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/recoverMultiwalletFunds.js <ownerWallet>
 *   cd api && node -r dotenv/config scripts/recoverMultiwalletFunds.js <ownerWallet> --dry-run
 *   cd api && node -r dotenv/config scripts/recoverMultiwalletFunds.js <ownerWallet> --public-key=<pk>
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import { assertAgentWalletSecretEncryptionConfigured } from '../libs/agentWalletSecretCrypto.js';
import {
  previewMultiWalletRecovery,
  recoverMultiWalletFunds,
} from '../libs/multiWalletRecovery.js';

function readFlag(name) {
  return process.argv.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));
}

function readFlagValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : null;
}

async function main() {
  assertAgentWalletSecretEncryptionConfigured();
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('MONGODB_URI is required.');
    process.exit(1);
  }

  const ownerWallet = process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]);
  if (!ownerWallet) {
    console.error('usage: node scripts/recoverMultiwalletFunds.js <ownerWallet> [--dry-run] [--public-key=<pk>]');
    process.exit(1);
  }

  const dryRun = readFlag('dry-run');
  const publicKey = readFlagValue('public-key');

  await connectMongoose();

  const preview = await previewMultiWalletRecovery(ownerWallet);
  console.log('\nRecovery preview');
  console.log(`Owner: ${preview.ownerWallet}`);
  console.log(`Wallets: ${preview.walletCount}`);
  console.log(`Total SOL (on-chain): ${preview.totalSol.toFixed(6)}`);
  console.log(`Total $ANSEM: ${preview.totalAnsem.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

  if (preview.walletCount === 0) {
    console.log('\nNo active farm wallets found for this owner.');
    await mongoose.connection.close();
    return;
  }

  if (dryRun) {
    console.log('\nDry run — no transactions sent.');
    for (const w of preview.wallets) {
      console.log(
        `  #${w.walletIndex + 1} ${w.publicKey.slice(0, 8)}… SOL=${w.solBalance.toFixed(4)} ANSEM=${w.ansemBalance.toFixed(2)}`,
      );
    }
    await mongoose.connection.close();
    return;
  }

  console.log('\nRecovering funds…');
  const result = await recoverMultiWalletFunds(
    ownerWallet,
    publicKey ? [publicKey] : undefined,
  );

  console.log(`\nDone: ${result.succeeded} recovered, ${result.skipped} skipped, ${result.failed} failed`);
  console.log(`Total SOL swept: ${result.totalSolSwept.toFixed(6)}`);

  for (const row of result.results) {
    if (!row.success) {
      console.log(`  FAIL ${row.publicKey.slice(0, 8)}… — ${row.error}`);
    } else if (row.skipped) {
      console.log(`  SKIP ${row.publicKey.slice(0, 8)}… — empty`);
    } else {
      const sol = row.solSweptLamports ? Number(row.solSweptLamports) / 1e9 : 0;
      console.log(
        `  OK   ${row.publicKey.slice(0, 8)}… — swept ${sol.toFixed(6)} SOL` +
          (row.sellSignature ? ` (sold ANSEM)` : ''),
      );
    }
  }

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.connection.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
