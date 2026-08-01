/**
 * Algorand spendable ALGO (amount − min-balance) and fee-buffer top-ups for Labs.
 * Used by PayTo USDC refunds, payer opt-in seeding, and mirrors deposit-hub fee borrowing.
 */
import algosdk from 'algosdk';
import LabWallet from '../../models/labs/LabWallet.js';
import {
  algorandAccountFromLabWalletDoc,
  ALGO_MIN_FOR_USDC_OPT_IN,
  computeAlgorandUsdcOptInNeedMicro,
  getActiveDepositWalletDoc,
  getActivePayToAlgorandAccount,
  getAlgorandAlgodClient,
} from './labWalletService.js';

export const ALGO_FEE_MICRO_PER_TX = 1_000n;
export const MICRO_ALGO = 1_000_000n;

/**
 * How many USDC refunds one PayTo fee top-up should cover in a scheduler tick.
 * Keeps PayTo from pinning at ASA min-balance and re-borrowing (or failing) per payer.
 */
export const PAYTO_USDC_REFUND_BATCH_SIZE = 8n;

/** MicroAlgos PayTo needs above min-balance for a batch of USDC ASA refunds. */
export const PAYTO_USDC_REFUND_FEE_NEED_MICRO =
  (ALGO_FEE_MICRO_PER_TX * 2n + 20_000n) * PAYTO_USDC_REFUND_BATCH_SIZE;

/**
 * Extra spendable ALGO cushion after a payer can opt into USDC ASA
 * (covers a few payment / axfer fees).
 */
export const PAYER_ALGO_SEED_FEE_CUSHION_MICRO = 50_000n;

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
 * Pure: how much ALGO a payer needs (and the deficit) so USDC ASA opt-in + fees succeed.
 * @param {{
 *   amountMicro?: bigint | number | string;
 *   minBalanceMicro?: bigint | number | string | null;
 *   feeCushionMicro?: bigint | number | string;
 * }} [input]
 * @returns {{
 *   targetMicro: bigint;
 *   requiredForOptInMicro: bigint;
 *   deficitMicro: bigint;
 *   alreadyOk: boolean;
 * }}
 */
export function computeAlgorandPayerAlgoSeedNeedMicro(input = {}) {
  const amountMicro = BigInt(input.amountMicro ?? 0);
  const needFromMin = computeAlgorandUsdcOptInNeedMicro(input.minBalanceMicro);
  const floorMicro = BigInt(Math.round(ALGO_MIN_FOR_USDC_OPT_IN * Number(MICRO_ALGO)));
  const requiredForOptInMicro = needFromMin > floorMicro ? needFromMin : floorMicro;
  const cushion = BigInt(input.feeCushionMicro ?? PAYER_ALGO_SEED_FEE_CUSHION_MICRO);
  const targetMicro = requiredForOptInMicro + cushion;
  const deficitMicro = amountMicro < targetMicro ? targetMicro - amountMicro : 0n;
  return {
    targetMicro,
    requiredForOptInMicro,
    deficitMicro,
    alreadyOk: deficitMicro === 0n,
  };
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
 * @param {{
 *   receiver: string;
 *   deficitMicro: bigint;
 *   client: algosdk.Algodv2;
 *   funders: { address: string; sk: Uint8Array }[];
 *   sendPayment?: (args: {
 *     funder: { address: string; sk: Uint8Array };
 *     receiver: string;
 *     amountMicro: bigint;
 *     client: algosdk.Algodv2;
 *   }) => Promise<{ txid: string }>;
 *   logPrefix?: string;
 * }} args
 * @returns {Promise<{ ok: true; funded: true; from: string; amount: number } | { ok: false }>}
 */
async function borrowAlgorandAlgoFromFunders(args) {
  const {
    receiver,
    deficitMicro,
    client,
    funders,
    sendPayment,
    logPrefix = '[labAlgorandFeeBuffer]',
  } = args;

  for (const funder of funders) {
    if (!funder?.address || funder.address === receiver) continue;
    try {
      const finfo = await getAlgorandAccountSpendableMicro(funder.address, client);
      if (finfo.spendableMicro < deficitMicro + FUNDER_SPARE_MICRO) continue;

      if (typeof sendPayment === 'function') {
        await sendPayment({
          funder,
          receiver,
          amountMicro: deficitMicro,
          client,
        });
      } else {
        const sp = await client.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: funder.address,
          receiver,
          amount: Number(deficitMicro),
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
        amount: Number(deficitMicro) / Number(MICRO_ALGO),
      };
    } catch (e) {
      console.warn(`${logPrefix} fee top-up from ${funder.address} failed:`, e?.message || e);
    }
  }

  return { ok: false };
}

/**
 * Default funder order for Algorand labs: PayTo → deposit hub → other active payers.
 * @param {string} receiverAddress
 * @param {{ includePayTo?: boolean }} [opts]
 * @returns {Promise<{ address: string; sk: Uint8Array }[]>}
 */
async function loadDefaultAlgorandAlgoFunders(receiverAddress, opts = {}) {
  const receiver = String(receiverAddress || '').trim();
  /** @type {{ address: string; sk: Uint8Array }[]} */
  const funders = [];
  const includePayTo = opts.includePayTo !== false;

  if (includePayTo) {
    try {
      const payTo = await getActivePayToAlgorandAccount();
      if (payTo?.sk && payTo.address && payTo.address !== receiver) {
        funders.push(payTo);
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const hubDoc = await getActiveDepositWalletDoc('algorand');
    if (hubDoc?.encryptedSecret && hubDoc.address !== receiver) {
      if (!funders.some((f) => f.address === hubDoc.address)) {
        funders.push(algorandAccountFromLabWalletDoc(hubDoc));
      }
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
      if (!doc?.encryptedSecret || doc.address === receiver) continue;
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

  return funders;
}

/**
 * Ensure PayTo has enough spendable ALGO for USDC ASA refunds.
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
    // PayTo is the receiver — borrow from hub then payers (not from itself).
    funders = await loadDefaultAlgorandAlgoFunders(payTo, { includePayTo: false });
  }

  const borrowed = await borrowAlgorandAlgoFromFunders({
    receiver: payTo,
    deficitMicro: deficit,
    client,
    funders,
    sendPayment: opts.sendPayment,
    logPrefix: '[labAlgorandFeeBuffer] PayTo',
  });
  if (borrowed.ok) return borrowed;

  const spendableAlgo = Number(payInfo.spendableMicro) / Number(MICRO_ALGO);
  const needAlgo = Number(needMicro) / Number(MICRO_ALGO);
  return {
    ok: false,
    error: `insufficient_algo_for_usdc_refund (payTo spendable ${spendableAlgo} ALGO; need ~${needAlgo} above min-balance)`,
    spendable: spendableAlgo,
  };
}

/**
 * Ensure an Algorand payer has enough ALGO to opt into USDC ASA and retain fee cushion.
 * Borrows deficit from PayTo → deposit hub → other active payers.
 *
 * @param {string} payerAddress
 * @param {{
 *   client?: algosdk.Algodv2;
 *   funders?: { address: string; sk: Uint8Array }[];
 *   feeCushionMicro?: bigint;
 *   sendPayment?: (args: {
 *     funder: { address: string; sk: Uint8Array };
 *     receiver: string;
 *     amountMicro: bigint;
 *     client: algosdk.Algodv2;
 *   }) => Promise<{ txid: string }>;
 * }} [opts]
 * @returns {Promise<{ ok: boolean; already?: boolean; funded?: boolean; from?: string; amount?: number; target?: number; error?: string }>}
 */
export async function ensureAlgorandPayerAlgoForOptInAndFees(payerAddress, opts = {}) {
  const payer = String(payerAddress || '').trim();
  if (!payer) return { ok: false, error: 'missing_payer' };

  const client = opts.client || getAlgorandAlgodClient();

  let payInfo;
  try {
    payInfo = await getAlgorandAccountSpendableMicro(payer, client);
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }

  const seed = computeAlgorandPayerAlgoSeedNeedMicro({
    amountMicro: payInfo.amountMicro,
    minBalanceMicro: payInfo.minBalanceMicro,
    feeCushionMicro: opts.feeCushionMicro,
  });

  if (seed.alreadyOk) {
    return {
      ok: true,
      already: true,
      amount: Number(payInfo.amountMicro) / Number(MICRO_ALGO),
      target: Number(seed.targetMicro) / Number(MICRO_ALGO),
    };
  }

  /** @type {{ address: string; sk: Uint8Array }[]} */
  let funders = Array.isArray(opts.funders) ? opts.funders : [];
  if (!Array.isArray(opts.funders)) {
    funders = await loadDefaultAlgorandAlgoFunders(payer, { includePayTo: true });
  }

  const borrowed = await borrowAlgorandAlgoFromFunders({
    receiver: payer,
    deficitMicro: seed.deficitMicro,
    client,
    funders,
    sendPayment: opts.sendPayment,
    logPrefix: '[labAlgorandFeeBuffer] payer opt-in',
  });
  if (borrowed.ok) {
    return {
      ...borrowed,
      target: Number(seed.targetMicro) / Number(MICRO_ALGO),
    };
  }

  const haveAlgo = Number(payInfo.amountMicro) / Number(MICRO_ALGO);
  const needAlgo = Number(seed.targetMicro) / Number(MICRO_ALGO);
  return {
    ok: false,
    error: `insufficient_algo_for_opt_in_seed (payer has ${haveAlgo} ALGO; need ~${needAlgo})`,
    target: needAlgo,
  };
}
