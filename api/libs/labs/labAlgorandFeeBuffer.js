/**
 * Algorand spendable ALGO (amount − min-balance) and fee-buffer top-ups for Labs.
 * Used by PayTo USDC refunds and mirrors deposit-hub fee borrowing.
 */
import algosdk from 'algosdk';
import LabWallet from '../../models/labs/LabWallet.js';
import {
  algorandAccountFromLabWalletDoc,
  getActiveDepositWalletDoc,
  getAlgorandAlgodClient,
} from './labWalletService.js';

export const ALGO_FEE_MICRO_PER_TX = 1_000n;
export const MICRO_ALGO = 1_000_000n;

/** MicroAlgos PayTo needs above min-balance for one USDC ASA refund (fee ×2 + cushion). */
export const PAYTO_USDC_REFUND_FEE_NEED_MICRO =
  ALGO_FEE_MICRO_PER_TX * 2n + 20_000n;

/** Keep this much spendable on a funder after lending. */
const FUNDER_SPARE_MICRO = ALGO_FEE_MICRO_PER_TX + 50_000n;

/**
 * Pure: spendable microAlgos given account amount and min-balance.
 * @param {bigint | number | string} amountMicro
 * @param {bigint | number | string} minBalanceMicro
 * @returns {bigint}
 */
export function computeAlgorandSpendableMicro(amountMicro, minBalanceMicro) {
  const amount = BigInt(amountMicro ?? 0);
  const minBal = BigInt(minBalanceMicro ?? 0);
  return amount > minBal ? amount - minBal : 0n;
}

/**
 * Read amount / min-balance / spendable from Algod account info object.
 * @param {object | null | undefined} info
 * @returns {{ amountMicro: bigint; minBalanceMicro: bigint; spendableMicro: bigint }}
 */
export function spendableFromAccountInfo(info) {
  const amountMicro = BigInt(info?.amount ?? 0);
  const minBalanceMicro = BigInt(info?.minBalance ?? info?.['min-balance'] ?? 0);
  return {
    amountMicro,
    minBalanceMicro,
    spendableMicro: computeAlgorandSpendableMicro(amountMicro, minBalanceMicro),
  };
}

/**
 * Fetch spendable ALGO for an address.
 * @param {string} address
 * @param {algosdk.Algodv2} [client]
 * @returns {Promise<{ amountMicro: bigint; minBalanceMicro: bigint; spendableMicro: bigint }>}
 */
export async function getAlgorandAccountSpendableMicro(address, client) {
  const algod = client || getAlgorandAlgodClient();
  const info = await algod.accountInformation(String(address || '').trim()).do();
  return spendableFromAccountInfo(info);
}

/**
 * True when an Algod / network error is an account min-balance rejection.
 * @param {unknown} err
 * @returns {boolean}
 */
export function isAlgorandBelowMinBalanceError(err) {
  const msg = err?.message || String(err || '');
  return /balance\s+\d+\s+below\s+min\s+\d+/i.test(msg) || /below min/i.test(msg);
}

/**
 * Wrap a below-min (or generic) message as PAYTO_INSUFFICIENT_FUNDS when appropriate.
 * @param {unknown} err
 * @param {string} paytoInsufficientFundsTag
 * @returns {Error}
 */
export function classifyAlgorandRefundError(err, paytoInsufficientFundsTag) {
  const msg = err?.message || String(err || '');
  if (String(msg).includes(paytoInsufficientFundsTag)) {
    return err instanceof Error ? err : new Error(msg);
  }
  if (isAlgorandBelowMinBalanceError(err)) {
    return new Error(
      `${paytoInsufficientFundsTag}: payTo ALGO below min-balance (need spendable fees): ${msg}`,
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

/**
 * Ensure PayTo has enough spendable ALGO for a USDC ASA refund.
 * Borrows deficit from deposit hub, then active Algorand payers.
 *
 * @param {string} payToAddress
 * @param {{ needMicro?: bigint; client?: algosdk.Algodv2; funders?: { address: string; sk: Uint8Array }[]; sendPayment?: (args: { funder: { address: string; sk: Uint8Array }; receiver: string; amountMicro: bigint; client: algosdk.Algodv2 }) => Promise<{ txid: string }> }} [opts]
 * @returns {Promise<{ ok: boolean; already?: boolean; funded?: boolean; from?: string; amount?: number; spendable?: number; error?: string }>}
 */
export async function ensurePayToAlgoForUsdcRefund(payToAddress, opts = {}) {
  const payTo = String(payToAddress || '').trim();
  if (!payTo) return { ok: false, error: 'missing_payto' };

  const needMicro = opts.needMicro ?? PAYTO_USDC_REFUND_FEE_NEED_MICRO;
  const client = opts.client || getAlgorandAlgodClient();

  let payInfo;
  try {
    payInfo = await getAlgorandAccountSpendableMicro(payTo, client);
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }

  if (payInfo.spendableMicro >= needMicro) {
    return {
      ok: true,
      already: true,
      spendable: Number(payInfo.spendableMicro) / Number(MICRO_ALGO),
    };
  }

  const deficit = needMicro - payInfo.spendableMicro;

  /** @type {{ address: string; sk: Uint8Array }[]} */
  let funders = Array.isArray(opts.funders) ? opts.funders : [];

  if (!Array.isArray(opts.funders)) {
    try {
      const hubDoc = await getActiveDepositWalletDoc('algorand');
      if (hubDoc?.encryptedSecret && hubDoc.address !== payTo) {
        funders.push(algorandAccountFromLabWalletDoc(hubDoc));
      }
    } catch {
      /* ignore */
    }

    try {
      const payerDocs = await LabWallet.find({
        chain: 'algorand',
        role: 'payer',
        active: true,
      })
        .select('+encryptedSecret')
        .lean();
      for (const doc of payerDocs || []) {
        if (!doc?.encryptedSecret || doc.address === payTo) continue;
        if (funders.some((f) => f.address === doc.address)) continue;
        try {
          funders.push(algorandAccountFromLabWalletDoc(doc));
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }

  for (const funder of funders) {
    try {
      const finfo = await getAlgorandAccountSpendableMicro(funder.address, client);
      if (finfo.spendableMicro < deficit + FUNDER_SPARE_MICRO) continue;

      if (typeof opts.sendPayment === 'function') {
        await opts.sendPayment({
          funder,
          receiver: payTo,
          amountMicro: deficit,
          client,
        });
      } else {
        const sp = await client.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: funder.address,
          receiver: payTo,
          amount: Number(deficit),
          suggestedParams: sp,
        });
        const signed = txn.signTxn(funder.sk);
        const { txid } = await client.sendRawTransaction(signed).do();
        await algosdk.waitForConfirmation(client, txid, 8);
      }

      return {
        ok: true,
        funded: true,
        from: funder.address,
        amount: Number(deficit) / Number(MICRO_ALGO),
      };
    } catch (e) {
      console.warn(
        `[labAlgorandFeeBuffer] PayTo fee top-up from ${funder.address} failed:`,
        e?.message || e,
      );
    }
  }

  const spendableAlgo = Number(payInfo.spendableMicro) / Number(MICRO_ALGO);
  const needAlgo = Number(needMicro) / Number(MICRO_ALGO);
  return {
    ok: false,
    error: `insufficient_algo_for_usdc_refund (payTo spendable ${spendableAlgo} ALGO; need ~${needAlgo} above min-balance)`,
    spendable: spendableAlgo,
  };
}
