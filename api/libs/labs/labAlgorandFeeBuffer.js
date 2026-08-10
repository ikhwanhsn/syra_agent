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

/** Bounded Algod RPC timeout for fee-buffer reads/sends. */
const ALGOD_TIMEOUT_MS = 12_000;

/**
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 * @template T
 */
function withTimeout(promise, ms, label = 'algod_timeout') {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return promise;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), n);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * How many USDC refunds one PayTo fee top-up should cover in a scheduler tick.
 * Keeps PayTo from pinning at ASA min-balance and re-borrowing (or failing) per payer.
 */
export const PAYTO_USDC_REFUND_BATCH_SIZE = 8n;

/** MicroAlgos PayTo needs above min-balance for a batch of USDC ASA refunds. */
export const PAYTO_USDC_REFUND_FEE_NEED_MICRO =
  (ALGO_FEE_MICRO_PER_TX * 2n + 20_000n) * PAYTO_USDC_REFUND_BATCH_SIZE;

/**
 * MicroAlgos PayTo needs to cover a single USDC ASA refund fee (with buffer).
 * Batch cushion is best-effort; this floor is the hard gate.
 */
export const PAYTO_USDC_REFUND_MIN_FEE_MICRO = ALGO_FEE_MICRO_PER_TX * 2n + 2_000n; // ~0.004 ALGO

/**
 * Extra spendable ALGO cushion after a payer can opt into USDC ASA
 * (covers a few payment / axfer fees).
 */
export const PAYER_ALGO_SEED_FEE_CUSHION_MICRO = 50_000n;

/**
 * Keep this much spendable on a funder after lending batch fee cushions.
 * (~0.051 ALGO = 1 fee + 0.05 cushion)
 */
export const FUNDER_SPARE_MICRO = ALGO_FEE_MICRO_PER_TX + 50_000n;

/**
 * Spare for single-fee (min) borrows only: one payment fee.
 * Typical payer wallets hold ~0.03–0.05 spendable ALGO — below FUNDER_SPARE_MICRO —
 * but can still lend the ~0.004 ALGO PayTo needs for one USDC ASA refund.
 */
export const FUNDER_SPARE_MIN_FEE_MICRO = ALGO_FEE_MICRO_PER_TX;

/**
 * Pure: how much of `spendableMicro` can be lent after keeping `spareMicro`.
 * @param {bigint | number | string} spendableMicro
 * @param {bigint | number | string} spareMicro
 * @returns {bigint}
 */
export function lendableAlgorandMicro(spendableMicro, spareMicro) {
  const spendable = BigInt(spendableMicro ?? 0);
  const spare = BigInt(spareMicro ?? 0);
  if (spendable <= spare) return 0n;
  return spendable - spare;
}

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
  const info = await withTimeout(
    algod.accountInformation(String(address || '').trim()).do(),
    ALGOD_TIMEOUT_MS,
    'algod_account_info_timeout',
  );
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
 * Pure: plan partial ALGO borrows across funders until deficit is filled.
 * Each funder lends min(remaining, spendable − spare). Used so dust siblings
 * can collectively fund PayTo batch/min cushions when no single wallet can.
 *
 * @param {{
 *   deficitMicro: bigint | number | string;
 *   spareMicro?: bigint | number | string;
 *   funders: Array<{ address: string; spendableMicro?: bigint | number | string }>;
 *   receiver?: string;
 * }} input
 * @returns {{
 *   filled: boolean;
 *   remainingMicro: bigint;
 *   totalLentMicro: bigint;
 *   parts: Array<{ address: string; amountMicro: bigint }>;
 * }}
 */
export function planAlgorandPartialBorrows(input) {
  let remaining = 0n;
  try {
    remaining = BigInt(input?.deficitMicro ?? 0);
  } catch {
    remaining = 0n;
  }
  if (remaining < 0n) remaining = 0n;

  let spare = FUNDER_SPARE_MIN_FEE_MICRO;
  try {
    spare = BigInt(input?.spareMicro ?? FUNDER_SPARE_MIN_FEE_MICRO);
  } catch {
    spare = FUNDER_SPARE_MIN_FEE_MICRO;
  }
  if (spare < 0n) spare = 0n;

  const receiver = String(input?.receiver || '').trim();
  /** @type {Array<{ address: string; amountMicro: bigint }>} */
  const parts = [];
  let totalLentMicro = 0n;

  for (const f of Array.isArray(input?.funders) ? input.funders : []) {
    if (remaining <= 0n) break;
    const address = String(f?.address || '').trim();
    if (!address || (receiver && address === receiver)) continue;
    let spendableMicro = 0n;
    try {
      spendableMicro = BigInt(f?.spendableMicro ?? 0);
    } catch {
      spendableMicro = 0n;
    }
    const lendable = lendableAlgorandMicro(spendableMicro, spare);
    if (lendable <= 0n) continue;
    const amountMicro = lendable < remaining ? lendable : remaining;
    if (amountMicro <= 0n) continue;
    parts.push({ address, amountMicro });
    totalLentMicro += amountMicro;
    remaining -= amountMicro;
  }

  return {
    filled: remaining === 0n,
    remainingMicro: remaining,
    totalLentMicro,
    parts,
  };
}

/**
 * Borrow ALGO onto `receiver` from one or more funders.
 * Prefers a single rich funder when one can cover the full deficit after spare;
 * otherwise partially consolidates lendable dust across funders until filled.
 *
 * @param {{
 *   receiver: string;
 *   deficitMicro: bigint;
 *   client: algosdk.Algodv2;
 *   funders: { address: string; sk: Uint8Array }[];
 *   spareMicro?: bigint;
 *   allowPartial?: boolean;
 *   sendPayment?: (args: {
 *     funder: { address: string; sk: Uint8Array };
 *     receiver: string;
 *     amountMicro: bigint;
 *     client: algosdk.Algodv2;
 *   }) => Promise<{ txid: string }>;
 *   logPrefix?: string;
 * }} args
 * @returns {Promise<{
 *   ok: true;
 *   funded: true;
 *   from: string;
 *   amount: number;
 *   parts?: Array<{ address: string; amountMicro: bigint }>;
 * } | {
 *   ok: false;
 *   partial?: true;
 *   from?: string;
 *   amount?: number;
 *   parts?: Array<{ address: string; amountMicro: bigint }>;
 * }>}
 */
async function borrowAlgorandAlgoFromFunders(args) {
  const {
    receiver,
    deficitMicro,
    client,
    funders,
    spareMicro = FUNDER_SPARE_MICRO,
    allowPartial = true,
    sendPayment,
    logPrefix = '[labAlgorandFeeBuffer]',
  } = args;

  const need = BigInt(deficitMicro ?? 0);
  if (need <= 0n) {
    return { ok: true, funded: true, from: receiver, amount: 0 };
  }

  /** @type {Map<string, { address: string; sk: Uint8Array }>} */
  const byAddr = new Map();
  /** @type {Array<{ address: string; sk: Uint8Array; spendableMicro: bigint }>} */
  const withSpendable = [];

  for (const funder of funders || []) {
    if (!funder?.address || funder.address === receiver) continue;
    if (byAddr.has(funder.address)) continue;
    byAddr.set(funder.address, funder);
    try {
      const finfo = await getAlgorandAccountSpendableMicro(funder.address, client);
      withSpendable.push({
        address: funder.address,
        sk: funder.sk,
        spendableMicro: finfo.spendableMicro,
      });
    } catch (e) {
      console.warn(
        `${logPrefix} spendable read failed for ${funder.address}:`,
        e?.message || e,
      );
    }
  }

  // Richest first so a single payment covers the deficit when possible.
  const ordered = orderAlgorandAlgoFundersBySpendable(withSpendable);

  // Fast path: one funder can cover the full deficit after spare.
  for (const funder of ordered) {
    const lendable = lendableAlgorandMicro(funder.spendableMicro, spareMicro);
    if (lendable < need) continue;
    try {
      await sendAlgorandAlgoPayment({
        funder,
        receiver,
        amountMicro: need,
        client,
        sendPayment,
      });
      return {
        ok: true,
        funded: true,
        from: funder.address,
        amount: Number(need) / Number(MICRO_ALGO),
        parts: [{ address: funder.address, amountMicro: need }],
      };
    } catch (e) {
      console.warn(`${logPrefix} fee top-up from ${funder.address} failed:`, e?.message || e);
    }
  }

  if (!allowPartial) {
    return { ok: false };
  }

  // Dust consolidation: lend whatever each funder can spare (fee-aware min spare)
  // so many ~0.03 ALGO siblings can collectively fill PayTo.
  const partialSpare =
    spareMicro > FUNDER_SPARE_MIN_FEE_MICRO ? FUNDER_SPARE_MIN_FEE_MICRO : spareMicro;
  const plan = planAlgorandPartialBorrows({
    deficitMicro: need,
    spareMicro: partialSpare,
    receiver,
    funders: ordered,
  });

  /** @type {Array<{ address: string; amountMicro: bigint }>} */
  const sentParts = [];
  let totalSent = 0n;

  for (const part of plan.parts) {
    const funder = byAddr.get(part.address);
    if (!funder) continue;
    try {
      await sendAlgorandAlgoPayment({
        funder,
        receiver,
        amountMicro: part.amountMicro,
        client,
        sendPayment,
      });
      sentParts.push(part);
      totalSent += part.amountMicro;
    } catch (e) {
      console.warn(
        `${logPrefix} partial fee top-up from ${part.address} failed:`,
        e?.message || e,
      );
    }
  }

  if (totalSent >= need && sentParts.length > 0) {
    const from =
      sentParts.length === 1 ? sentParts[0].address : `aggregated:${sentParts.length}`;
    return {
      ok: true,
      funded: true,
      from,
      amount: Number(totalSent) / Number(MICRO_ALGO),
      parts: sentParts,
    };
  }

  if (totalSent > 0n) {
    const from =
      sentParts.length === 1 ? sentParts[0].address : `aggregated:${sentParts.length}`;
    return {
      ok: false,
      partial: true,
      from,
      amount: Number(totalSent) / Number(MICRO_ALGO),
      parts: sentParts,
    };
  }

  return { ok: false };
}

/**
 * @param {{
 *   funder: { address: string; sk: Uint8Array };
 *   receiver: string;
 *   amountMicro: bigint;
 *   client: algosdk.Algodv2;
 *   sendPayment?: (args: {
 *     funder: { address: string; sk: Uint8Array };
 *     receiver: string;
 *     amountMicro: bigint;
 *     client: algosdk.Algodv2;
 *   }) => Promise<{ txid: string }>;
 * }} args
 */
async function sendAlgorandAlgoPayment(args) {
  const { funder, receiver, amountMicro, client, sendPayment } = args;
  if (typeof sendPayment === 'function') {
    await sendPayment({
      funder,
      receiver,
      amountMicro,
      client,
    });
    return;
  }
  const sp = await withTimeout(
    client.getTransactionParams().do(),
    ALGOD_TIMEOUT_MS,
    'algod_params_timeout',
  );
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: funder.address,
    receiver,
    amount: Number(amountMicro),
    suggestedParams: sp,
  });
  const signed = txn.signTxn(funder.sk);
  const { txid } = await withTimeout(
    client.sendRawTransaction(signed).do(),
    ALGOD_TIMEOUT_MS,
    'algod_send_timeout',
  );
  await withTimeout(
    algosdk.waitForConfirmation(client, txid, 8),
    ALGOD_TIMEOUT_MS * 2,
    'algod_confirm_timeout',
  );
}

/**
 * Pure: order ALGO funder candidates by spendable microAlgos (desc).
 * Used so the richest sibling lends first and we minimize fee-hop churn.
 *
 * @param {Array<{ address: string; spendableMicro?: bigint | number | string; [k: string]: unknown }>} candidates
 * @returns {Array<{ address: string; spendableMicro: bigint; [k: string]: unknown }>}
 */
export function orderAlgorandAlgoFundersBySpendable(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  /** @type {Array<{ address: string; spendableMicro: bigint; [k: string]: unknown }>} */
  const normalized = [];
  for (const c of list) {
    if (!c || typeof c !== 'object') continue;
    const address = String(c.address || '').trim();
    if (!address) continue;
    let spendableMicro = 0n;
    try {
      spendableMicro = BigInt(c.spendableMicro ?? 0);
    } catch {
      spendableMicro = 0n;
    }
    if (spendableMicro < 0n) spendableMicro = 0n;
    normalized.push({ ...c, address, spendableMicro });
  }
  normalized.sort((a, b) => {
    if (a.spendableMicro === b.spendableMicro) {
      return String(a.address).localeCompare(String(b.address));
    }
    return a.spendableMicro < b.spendableMicro ? 1 : -1;
  });
  return normalized;
}

/**
 * Default funder order for Algorand labs: PayTo → deposit hub → sibling payers
 * (richest spendable ALGO first when siblings are included).
 * @param {string} receiverAddress
 * @param {{ includePayTo?: boolean; includeSiblingPayers?: boolean }} [opts]
 * @returns {Promise<{ address: string; sk: Uint8Array }[]>}
 */
async function loadDefaultAlgorandAlgoFunders(receiverAddress, opts = {}) {
  const receiver = String(receiverAddress || '').trim();
  /** @type {{ address: string; sk: Uint8Array }[]} */
  const funders = [];
  const includePayTo = opts.includePayTo !== false;
  const includeSiblingPayers = opts.includeSiblingPayers === true;

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

  if (includeSiblingPayers) {
    try {
      const payerDocs = await LabWallet.find({
        chain: 'algorand',
        role: 'payer',
        active: true,
      })
        .select('+encryptedSecret')
        .lean();
      /** @type {Array<{ address: string; sk: Uint8Array; spendableMicro: bigint }>} */
      const siblings = [];
      for (const doc of payerDocs || []) {
        if (!doc?.encryptedSecret || doc.address === receiver) continue;
        if (funders.some((f) => f.address === doc.address)) continue;
        try {
          const account = algorandAccountFromLabWalletDoc(doc);
          let spendableMicro = 0n;
          try {
            const info = await getAlgorandAccountSpendableMicro(account.address);
            spendableMicro = info.spendableMicro;
          } catch {
            /* keep 0 — still try later if borrow path can read again */
          }
          siblings.push({ ...account, spendableMicro });
        } catch {
          /* ignore */
        }
      }
      const ordered = orderAlgorandAlgoFundersBySpendable(siblings);
      for (const s of ordered) {
        funders.push({ address: s.address, sk: s.sk });
      }
    } catch {
      /* ignore */
    }
  }

  return funders;
}

/**
 * Ensure PayTo has enough spendable ALGO for USDC ASA refunds.
 * Tries to top up to the batch cushion (borrows from deposit hub, then active payers).
 * If borrow fails but PayTo can still cover a single refund fee (`minMicro`), returns
 * `{ ok: true, belowBatch: true }` so refunds proceed. Hard-fails only below that floor.
 *
 * @param {string} payToAddress
 * @param {{
 *   needMicro?: bigint;
 *   minMicro?: bigint;
 *   client?: algosdk.Algodv2;
 *   funders?: { address: string; sk: Uint8Array }[];
 *   includePayTo?: boolean;
 *   includeSiblingPayers?: boolean;
 *   sendPayment?: (args: { funder: { address: string; sk: Uint8Array }; receiver: string; amountMicro: bigint; client: algosdk.Algodv2 }) => Promise<{ txid: string }>;
 * }} [opts]
 * @returns {Promise<{ ok: boolean; already?: boolean; funded?: boolean; belowBatch?: boolean; from?: string; amount?: number; spendable?: number; error?: string }>}
 */
export async function ensurePayToAlgoForUsdcRefund(payToAddress, opts = {}) {
  const payTo = String(payToAddress || '').trim();
  if (!payTo) return { ok: false, error: 'missing_payto' };

  const needMicro = opts.needMicro ?? PAYTO_USDC_REFUND_FEE_NEED_MICRO;
  const minMicro = opts.minMicro ?? PAYTO_USDC_REFUND_MIN_FEE_MICRO;
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
    // Default (refund path): receiver is PayTo — borrow from hub then sibling payers.
    // Treasury heal may set includePayTo:true so a payer funder can borrow from PayTo.
    funders = await loadDefaultAlgorandAlgoFunders(payTo, {
      includePayTo: opts.includePayTo === true,
      includeSiblingPayers: opts.includeSiblingPayers !== false,
    });
  }

  // Prefer a rich single funder (batch spare); otherwise multi-funder dust
  // consolidation (min-fee spare) fills as much of the batch cushion as possible.
  const borrowed = await borrowAlgorandAlgoFromFunders({
    receiver: payTo,
    deficitMicro: deficit,
    client,
    funders,
    spareMicro: FUNDER_SPARE_MICRO,
    allowPartial: true,
    sendPayment: opts.sendPayment,
    logPrefix: '[labAlgorandFeeBuffer] PayTo',
  });
  if (borrowed.ok) return borrowed;

  // Re-read after partial consolidation — dust siblings may have lifted PayTo
  // above the single-refund floor even when the batch cushion is still short.
  let afterInfo = payInfo;
  try {
    afterInfo = await getAlgorandAccountSpendableMicro(payTo, client);
  } catch {
    afterInfo = payInfo;
  }

  if (afterInfo.spendableMicro >= needMicro) {
    return {
      ok: true,
      funded: Boolean(borrowed.partial),
      belowBatch: false,
      from: borrowed.from,
      amount: borrowed.amount,
      parts: borrowed.parts,
      spendable: Number(afterInfo.spendableMicro) / Number(MICRO_ALGO),
    };
  }

  if (afterInfo.spendableMicro >= minMicro) {
    return {
      ok: true,
      funded: Boolean(borrowed.partial),
      belowBatch: true,
      from: borrowed.from,
      amount: borrowed.amount,
      parts: borrowed.parts,
      spendable: Number(afterInfo.spendableMicro) / Number(MICRO_ALGO),
    };
  }

  // Still below single-refund floor — explicit min-fee borrow (lower spare).
  const minDeficit = minMicro - afterInfo.spendableMicro;
  const borrowedMin = await borrowAlgorandAlgoFromFunders({
    receiver: payTo,
    deficitMicro: minDeficit,
    client,
    funders,
    spareMicro: FUNDER_SPARE_MIN_FEE_MICRO,
    allowPartial: true,
    sendPayment: opts.sendPayment,
    logPrefix: '[labAlgorandFeeBuffer] PayTo(min)',
  });
  if (borrowedMin.ok) {
    return { ...borrowedMin, belowBatch: true };
  }

  try {
    afterInfo = await getAlgorandAccountSpendableMicro(payTo, client);
  } catch {
    /* keep prior */
  }
  if (afterInfo.spendableMicro >= minMicro) {
    const parts = [...(borrowed.parts || []), ...(borrowedMin.parts || [])];
    let totalMicro = 0n;
    for (const p of parts) {
      try {
        totalMicro += BigInt(p.amountMicro ?? 0);
      } catch {
        /* ignore */
      }
    }
    return {
      ok: true,
      funded: parts.length > 0,
      belowBatch: true,
      from: borrowedMin.from || borrowed.from,
      amount: Number(totalMicro) / Number(MICRO_ALGO),
      parts,
      spendable: Number(afterInfo.spendableMicro) / Number(MICRO_ALGO),
    };
  }

  const spendableAlgo = Number(afterInfo.spendableMicro) / Number(MICRO_ALGO);
  const needAlgo = Number(needMicro) / Number(MICRO_ALGO);
  return {
    ok: false,
    error: `insufficient_algo_for_usdc_refund (payTo spendable ${spendableAlgo} ALGO; need ~${needAlgo} above min-balance)`,
    spendable: spendableAlgo,
  };
}

/**
 * Ensure an Algorand payer has enough ALGO to opt into USDC ASA and retain fee cushion.
 * Borrows deficit from PayTo → deposit hub → sibling payers (richest ALGO first).
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
    funders = await loadDefaultAlgorandAlgoFunders(payer, {
      includePayTo: true,
      includeSiblingPayers: true,
    });
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
