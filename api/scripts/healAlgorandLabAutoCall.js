/**
 * Heal Algorand Labs auto-call after treasury pause / prior chronic disable.
 *
 * - Assesses treasury
 * - Auto-distributes from hub when fundable via hub
 * - Clears pause + sets autoCallEnabled=true when canFundAny
 * - If still underfunded but autoCallEnabled was false, re-enables watch (keeps pause)
 *
 * Usage:
 *   node -r dotenv/config scripts/healAlgorandLabAutoCall.js
 */
import dns from 'node:dns';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Atlas SRV/TXT lookups often flake on local resolvers; prefer public DNS.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* ignore */
}

async function main() {
  const connectMongoose = (await import('../config/mongoose.js')).default;
  const mongoose = (await import('mongoose')).default;
  const {
    assessLabTreasury,
    recoverLabAutoCallFromTreasury,
    ensureLabAutoCallEnabledForTreasuryWatch,
  } = await import('../libs/labs/labTreasuryGuard.js');
  const { listActivePayerWallets } = await import('../libs/labs/labWalletService.js');
  const { getLabX402Settings } = await import('../libs/labs/labX402Payer.js');
  const { distributeLabDeposit } = await import('../libs/labs/labDepositDistributor.js');

  await connectMongoose();

  const before = await getLabX402Settings('algorand');
  const payers = await listActivePayerWallets('algorand');
  let assessment = await assessLabTreasury('algorand', {
    payerCount: payers.length,
    priceMultiplier: before.priceMultiplier,
  });

  console.log('[heal-algorand-lab] before', {
    autoCallEnabled: before.autoCallEnabled,
    autoCallPausedReason: before.autoCallPausedReason,
    autoCallPausedAt: before.autoCallPausedAt,
    canFundAny: assessment.canFundAny,
    reason: assessment.reason,
    hubHasFunds: assessment.hubHasFunds,
    funderUsdc: assessment.funderUsdc,
    hubUsdc: assessment.hubUsdc,
  });

  if (
    !assessment.canFundAny &&
    assessment.hubHasFunds &&
    before.depositDistributeEnabled !== false
  ) {
    console.log('[heal-algorand-lab] distributing from hub…');
    try {
      const dist = await distributeLabDeposit('algorand', { force: true });
      console.log('[heal-algorand-lab] distribute result', {
        skipped: dist?.skipped,
        reason: dist?.reason,
        transferCount: Array.isArray(dist?.transfers) ? dist.transfers.length : 0,
      });
    } catch (e) {
      console.warn('[heal-algorand-lab] distribute failed:', e?.message || e);
    }
    assessment = await assessLabTreasury('algorand', {
      payerCount: payers.length,
      priceMultiplier: before.priceMultiplier,
    });
  }

  if (assessment.canFundAny) {
    await recoverLabAutoCallFromTreasury('algorand');
    console.log('[heal-algorand-lab] recovered: autoCallEnabled=true, pause cleared');
  } else if (!before.autoCallEnabled) {
    await ensureLabAutoCallEnabledForTreasuryWatch('algorand');
    console.log(
      '[heal-algorand-lab] still underfunded; re-enabled auto-call watch (pause kept). Fund hub/PayTo next.',
    );
  } else {
    console.log(
      '[heal-algorand-lab] still underfunded with watch enabled. Fund hub/PayTo or run fundAlgorandLabTreasury.js',
    );
  }

  const after = await getLabX402Settings('algorand');
  const afterAssessment = await assessLabTreasury('algorand', {
    payerCount: payers.length,
    priceMultiplier: after.priceMultiplier,
  });
  console.log('[heal-algorand-lab] after', {
    autoCallEnabled: after.autoCallEnabled,
    autoCallPausedReason: after.autoCallPausedReason,
    paused: Boolean(after.autoCallPausedReason),
    canFundAny: afterAssessment.canFundAny,
    reason: afterAssessment.reason,
  });

  await mongoose.connection.close().catch(() => {});
  const ok = after.autoCallEnabled === true && (afterAssessment.canFundAny ? !after.autoCallPausedReason : true);
  process.exit(ok ? 0 : 1);
}

main().catch(async (e) => {
  console.error('[heal-algorand-lab] failed:', e?.message || e);
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close().catch(() => {});
  } catch {
    /* ignore */
  }
  process.exit(1);
});
