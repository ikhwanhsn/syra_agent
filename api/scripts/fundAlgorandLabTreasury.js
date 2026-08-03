/**
 * Report (and optionally execute) Algorand Labs treasury top-up.
 *
 * Usage (report only):
 *   node -r dotenv/config scripts/fundAlgorandLabTreasury.js
 *
 * Usage (move USDC ASA + ALGO from deposit hub → PayTo):
 *   EXECUTE=1 node -r dotenv/config scripts/fundAlgorandLabTreasury.js
 *
 * Optional overrides:
 *   TARGET_USDC=5          Minimum USDC on PayTo after top-up (default: recommended)
 *   TARGET_ALGO=0.05       Minimum spendable ALGO on PayTo (default: recommended)
 *
 * Requires Mongo + agent secret encryption env (same as API) when EXECUTE=1.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import algosdk from 'algosdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EXECUTE = String(process.env.EXECUTE || '').trim() === '1';

async function main() {
  // Lazy imports after dotenv so mongoose/secrets see env.
  const connectMongoose = (await import('../config/mongoose.js')).default;
  const mongoose = (await import('mongoose')).default;
  const { assessLabTreasury } = await import('../libs/labs/labTreasuryGuard.js');
  const {
    getActivePayToAlgorandAccount,
    getActiveDepositWalletDoc,
    algorandAccountFromLabWalletDoc,
    getAlgorandAlgodClient,
    getAlgorandUsdcAsaId,
    listActivePayerWallets,
    isAlgorandAddressOptedInUsdc,
    ensureAlgorandUsdcOptInForAccount,
  } = await import('../libs/labs/labWalletService.js');
  const {
    getAlgorandAccountSpendableMicro,
    MICRO_ALGO,
  } = await import('../libs/labs/labAlgorandFeeBuffer.js');

  await connectMongoose();

  const payers = await listActivePayerWallets('algorand');
  const assessment = await assessLabTreasury('algorand', { payerCount: payers.length });

  console.log('[fund-algorand-lab-treasury] assessment');
  console.log(
    JSON.stringify(
      {
        canFundAny: assessment.canFundAny,
        reason: assessment.reason,
        payToAddress: assessment.payToAddress,
        payToUsdc: assessment.payToUsdc,
        payToSpendableAlgo: assessment.payToSpendableAlgo,
        payToOptedInUsdc: assessment.payToOptedInUsdc,
        hubAddress: assessment.hubAddress,
        hubUsdc: assessment.hubUsdc,
        hubNative: assessment.hubNative,
        recommendedTopUpUsdc: assessment.recommendedTopUpUsdc,
        recommendedTopUpAlgo: assessment.recommendedTopUpAlgo,
        payerCount: assessment.payerCount,
      },
      null,
      2,
    ),
  );

  if (assessment.canFundAny) {
    console.log('[fund-algorand-lab-treasury] PayTo can already fund calls. Nothing to do.');
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  }

  const targetUsdc = Number(process.env.TARGET_USDC);
  const targetAlgo = Number(process.env.TARGET_ALGO);
  const needUsdc = Number.isFinite(targetUsdc) && targetUsdc > 0
    ? targetUsdc
    : Math.max(assessment.recommendedTopUpUsdc || 1, 1);
  const needAlgo = Number.isFinite(targetAlgo) && targetAlgo > 0
    ? targetAlgo
    : Math.max(assessment.recommendedTopUpAlgo || 0.05, 0.05);

  console.log(
    `[fund-algorand-lab-treasury] send ~$${needUsdc.toFixed(2)} USDC ASA + ~${needAlgo.toFixed(4)} ALGO to PayTo ${assessment.payToAddress}`,
  );
  console.log(
    `[fund-algorand-lab-treasury] preferred source: deposit hub ${assessment.hubAddress || '(none)'}`,
  );

  if (!EXECUTE) {
    console.log(
      '[fund-algorand-lab-treasury] dry run. Re-run with EXECUTE=1 to move funds from hub → PayTo.',
    );
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  }

  if (!assessment.payToAddress) {
    throw new Error('No active Algorand PayTo wallet. Create one in Labs UI first.');
  }
  if (!assessment.hubAddress) {
    throw new Error('No deposit hub. Create one via Labs deposit panel first.');
  }

  const payTo = await getActivePayToAlgorandAccount();
  const hubDoc = await getActiveDepositWalletDoc('algorand');
  if (!payTo || !hubDoc) {
    throw new Error('Could not load PayTo or hub secrets from Mongo.');
  }
  const hub = algorandAccountFromLabWalletDoc(hubDoc);
  const client = getAlgorandAlgodClient();
  const asaId = getAlgorandUsdcAsaId();

  // Ensure PayTo opted into USDC before ASA transfer.
  let opted = await isAlgorandAddressOptedInUsdc(payTo.address);
  if (!opted) {
    console.log('[fund-algorand-lab-treasury] PayTo not opted into USDC; attempting opt-in…');
    // Seed a little ALGO first if needed.
    const spendable = await getAlgorandAccountSpendableMicro(payTo.address, client);
    if (spendable.amountMicro < 300_000n) {
      const deficit = 300_000n - spendable.amountMicro;
      const sp = await client.getTransactionParams().do();
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: hub.address,
        receiver: payTo.address,
        amount: Number(deficit),
        suggestedParams: sp,
      });
      const signed = txn.signTxn(hub.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      await algosdk.waitForConfirmation(client, txid, 8);
      console.log(`[fund-algorand-lab-treasury] seeded ${Number(deficit) / 1e6} ALGO for opt-in tx=${txid}`);
    }
    const opt = await ensureAlgorandUsdcOptInForAccount(payTo);
    if (!opt.ok && !opt.already) {
      throw new Error(`PayTo USDC opt-in failed: ${opt.error}`);
    }
    opted = true;
  }

  // Top up ALGO spendable if needed.
  {
    const spendable = await getAlgorandAccountSpendableMicro(payTo.address, client);
    const have = Number(spendable.spendableMicro) / Number(MICRO_ALGO);
    if (have < needAlgo) {
      const deficitMicro = BigInt(Math.ceil((needAlgo - have) * Number(MICRO_ALGO)));
      const sp = await client.getTransactionParams().do();
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: hub.address,
        receiver: payTo.address,
        amount: Number(deficitMicro),
        suggestedParams: sp,
      });
      const signed = txn.signTxn(hub.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      await algosdk.waitForConfirmation(client, txid, 8);
      console.log(
        `[fund-algorand-lab-treasury] topped up ${Number(deficitMicro) / 1e6} ALGO tx=${txid}`,
      );
    }
  }

  // Top up USDC ASA if needed.
  {
    const haveUsdc = Number(assessment.payToUsdc ?? 0);
    if (haveUsdc < needUsdc) {
      const sendMicro = Math.round((needUsdc - haveUsdc) * 1e6);
      if (sendMicro > 0) {
        const hubInfo = await client.accountInformation(hub.address).do();
        const assets = Array.isArray(hubInfo?.assets) ? hubInfo.assets : [];
        const holding = assets.find(
          (a) => Number(a?.assetId ?? a?.['asset-id'] ?? a?.asset_id) === asaId,
        );
        const hubUsdcMicro = BigInt(holding?.amount ?? 0);
        if (hubUsdcMicro < BigInt(sendMicro)) {
          throw new Error(
            `Hub USDC ${Number(hubUsdcMicro) / 1e6} < needed ${sendMicro / 1e6}. Fund the hub first.`,
          );
        }
        const sp = await client.getTransactionParams().do();
        const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: hub.address,
          receiver: payTo.address,
          amount: sendMicro,
          assetIndex: asaId,
          suggestedParams: sp,
        });
        const signed = txn.signTxn(hub.sk);
        const { txid } = await client.sendRawTransaction(signed).do();
        await algosdk.waitForConfirmation(client, txid, 8);
        console.log(
          `[fund-algorand-lab-treasury] topped up ${(sendMicro / 1e6).toFixed(6)} USDC tx=${txid}`,
        );
      }
    }
  }

  const after = await assessLabTreasury('algorand', { payerCount: payers.length });
  console.log('[fund-algorand-lab-treasury] after', {
    canFundAny: after.canFundAny,
    payToUsdc: after.payToUsdc,
    payToSpendableAlgo: after.payToSpendableAlgo,
    reason: after.reason,
  });
  await mongoose.connection.close().catch(() => {});
  process.exit(after.canFundAny ? 0 : 1);
}

main().catch(async (e) => {
  console.error('[fund-algorand-lab-treasury] failed:', e?.message || e);
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close().catch(() => {});
  } catch {
    /* ignore */
  }
  process.exit(1);
});
