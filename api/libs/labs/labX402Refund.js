/**
 * Refund USDC from the lab payTo wallet back to the x402 payer after successful settlement.
 * Isolated signer — does not route through walletBroker (lab wallets are outside agent policy).
 * Supports Solana (SPL USDC), Base (ERC-20 USDC via viem),
 * and Algorand (USDC ASA via algosdk).
 */
import {
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  createPublicClient,
  http,
  parseUnits,
  formatEther,
  formatUnits,
} from 'viem';
import algosdk from 'algosdk';
import {
  getActivePayToKeypair,
  getActivePayToEvmAccount,
  getActivePayToAlgorandAccount,
  getLabWalletBalances,
  getBasePublicClient,
  createBaseWalletClient,
  getXlayerPublicClient,
  createXlayerWalletClient,
  getAlgorandAlgodClient,
  getAlgorandUsdcAsaId,
  isAlgorandAddressOptedInUsdc,
  ensureAlgorandLabWalletUsdcOptIn,
} from './labWalletService.js';
import { pickSolanaConnectionForReads, isSolanaRpcRetryableError } from '../solanaServerRpc.js';
import { confirmSolanaTransaction, isSolanaTxConfirmedOnAnyRpc } from '../solanaConfirm.js';
import {
  getMaxLabX402PriceUsd,
  getMinLabX402PriceUsd,
  getWeightedAvgLabX402PriceUsd,
} from './labX402Endpoints.js';
import { getDexterNetworkByCaip2 } from '../../config/dexterX402Networks.js';
import { XLAYER_MAINNET_USDT } from '../../config/okxX402Networks.js';
import { normalizeLabChain } from '../../models/labs/LabX402Settings.js';
import {
  classifyAlgorandRefundError,
  ensureAlgorandPayerAlgoForOptInAndFees,
  ensurePayToAlgoForUsdcRefund,
  PAYTO_USDC_REFUND_FEE_NEED_MICRO,
} from './labAlgorandFeeBuffer.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const BASE_USDC =
  getDexterNetworkByCaip2('eip155:8453')?.usdc ||
  process.env.BASE_USDC ||
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const XLAYER_USDT0 = XLAYER_MAINNET_USDT || '0x779ded0c9e1022225f8e0630b35a9b54be713736';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

/** Distinguishable error so callers can skip (not hard-fail) when the PayTo wallet is underfunded. */
export const PAYTO_INSUFFICIENT_FUNDS = 'PAYTO_INSUFFICIENT_FUNDS';

/** Minimum SOL the PayTo wallet needs to cover fees + possible ATA rent for a refund transfer. */
const PAYTO_MIN_SOL_FOR_REFUND = 0.003;
/** Minimum ETH the Base PayTo wallet needs for gas on a USDC transfer. */
const PAYTO_MIN_ETH_FOR_REFUND = 0.00005;
/** Minimum OKB the X Layer PayTo wallet needs for gas on a USDT0 transfer. */
const PAYTO_MIN_OKB_FOR_REFUND = 0.00005;

const REFUND_MAX_ATTEMPTS = 3;
const REFUND_RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Transient send errors worth retrying with a fresh blockhash / RPC. */
function isRetryableRefundError(e) {
  const msg = e?.message || String(e);
  return (
    isSolanaRpcRetryableError(e) ||
    /blockhash|block height exceeded|not confirmed|expired|node is behind|transaction was not confirmed|nonce|replacement|timeout|429|503|502/i.test(
      msg,
    )
  );
}

/**
 * Extract a submitted tx hash/signature from an error if present.
 * @param {unknown} e
 * @returns {string | null}
 */
function extractSubmittedTxId(e) {
  if (!e || typeof e !== 'object') return null;
  const err = /** @type {Record<string, unknown>} */ (e);
  for (const key of ['txSignature', 'signature', 'hash', 'transactionHash', 'txid']) {
    const v = err[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  const msg = String(err.message || '');
  const m = msg.match(/\b([1-9A-HJ-NP-Za-km-z]{64,100})\b/) || msg.match(/\b(0x[0-9a-fA-F]{64})\b/);
  return m ? m[1] : null;
}

/**
 * Before retrying a refund, check whether a previously submitted tx already landed.
 * @param {string | null | undefined} txId
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {object} [clients]
 * @returns {Promise<boolean>}
 */
async function isRefundTxAlreadyConfirmed(txId, chain, clients = {}) {
  const id = String(txId || '').trim();
  if (!id) return false;
  try {
    if (chain === 'solana') {
      return await isSolanaTxConfirmedOnAnyRpc(id);
    }
    if ((chain === 'base' || chain === 'xlayer') && clients.publicClient) {
      const receipt = await clients.publicClient.getTransactionReceipt({
        hash: /** @type {`0x${string}`} */ (id),
      });
      return Boolean(receipt && receipt.status === 'success');
    }
    if (chain === 'algorand' && clients.algod) {
      const info = await clients.algod.pendingTransactionInformation(id).do();
      return Boolean(info?.confirmedRound || info?.['confirmed-round']);
    }
  } catch {
    // unknown — do not assume confirmed
  }
  return false;
}

/** Refund only when payer USDC cannot cover the most expensive endpoint. */
export function getLabX402RefundLowThresholdUsd() {
  return getMaxLabX402PriceUsd();
}

/**
 * Working USDC buffer after a low-balance top-up (matches labs simulation).
 * @param {number} maxPriceUsd
 * @param {number} avgPriceUsd
 * @returns {number}
 */
export function computeLabX402PayerRefundTarget(maxPriceUsd, avgPriceUsd) {
  const maxPrice = Number(maxPriceUsd);
  const avgPrice = Number(avgPriceUsd);
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) return 0.2;
  const avg = Number.isFinite(avgPrice) && avgPrice > 0 ? avgPrice : maxPrice;
  return Math.max(maxPrice * 2, avg * 3);
}

/** Top-up target after a low-balance refund — enough for several calls before next refund. */
export function getLabX402RefundTargetUsd() {
  return computeLabX402PayerRefundTarget(
    getMaxLabX402PriceUsd(),
    getWeightedAvgLabX402PriceUsd(),
  );
}

/**
 * Decide whether to refund after a successful payment.
 * Skips refund while payer still has enough USDC for another call; tops up only when low.
 * @param {number} usdcBalance - Payer USDC after the payment settled
 * @param {number} maxPriceUsd - Most expensive endpoint price
 * @param {number} avgPriceUsd - Weighted average endpoint price
 * @returns {{ shouldRefund: boolean; refundAmountUsd: number; reason: string; thresholdUsd: number; targetUsd: number }}
 */
export function evaluateLowBalanceRefund(usdcBalance, maxPriceUsd, avgPriceUsd) {
  const balance = Number(usdcBalance);
  const thresholdUsd = Number(maxPriceUsd);
  const targetUsd = computeLabX402PayerRefundTarget(maxPriceUsd, avgPriceUsd);

  if (!Number.isFinite(balance) || balance < 0) {
    return { shouldRefund: true, refundAmountUsd: targetUsd, reason: 'balance_unavailable', thresholdUsd, targetUsd };
  }
  if (!Number.isFinite(thresholdUsd) || thresholdUsd <= 0) {
    return { shouldRefund: false, refundAmountUsd: 0, reason: 'invalid_threshold', thresholdUsd, targetUsd };
  }

  if (balance >= thresholdUsd) {
    return { shouldRefund: false, refundAmountUsd: 0, reason: 'sufficient_balance', thresholdUsd, targetUsd };
  }

  const refundAmountUsd = Math.max(0, Math.round((targetUsd - balance) * 1e6) / 1e6);
  if (refundAmountUsd <= 0) {
    return { shouldRefund: false, refundAmountUsd: 0, reason: 'already_at_target', thresholdUsd, targetUsd };
  }

  return { shouldRefund: true, refundAmountUsd, reason: 'low_balance', thresholdUsd, targetUsd };
}

/**
 * Pure: clamp an Algorand PayTo→payer USDC top-up to what PayTo can send.
 * Only fails when PayTo USDC is below the cheapest call price (true underfund).
 *
 * @param {{
 *   requestedUsd: number;
 *   payToUsdcBalance: number;
 *   minPriceUsd: number;
 * }} input
 * @returns {{
 *   ok: boolean;
 *   amountUsd: number;
 *   partial: boolean;
 *   reason: 'full' | 'partial' | 'payto_underfunded' | 'invalid';
 * }}
 */
export function clampAlgorandPayToUsdcRefundAmount(input = {}) {
  const requested = Number(input.requestedUsd);
  const payToUsdc = Number(input.payToUsdcBalance);
  const minPrice = Number(input.minPriceUsd);

  if (!Number.isFinite(requested) || requested <= 0 || !Number.isFinite(payToUsdc) || payToUsdc < 0) {
    return { ok: false, amountUsd: 0, partial: false, reason: 'invalid' };
  }

  const floor = Number.isFinite(minPrice) && minPrice > 0 ? minPrice : 0;
  if (payToUsdc < floor) {
    return { ok: false, amountUsd: 0, partial: false, reason: 'payto_underfunded' };
  }

  if (payToUsdc >= requested) {
    return { ok: true, amountUsd: requested, partial: false, reason: 'full' };
  }

  const amountUsd = Math.round(payToUsdc * 1e6) / 1e6;
  if (amountUsd <= 0) {
    return { ok: false, amountUsd: 0, partial: false, reason: 'payto_underfunded' };
  }
  return { ok: true, amountUsd, partial: true, reason: 'partial' };
}

/**
 * Transfer USDC from the Solana PayTo lab wallet to the payer.
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerSolana(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !Number.isFinite(amount) || amount <= 0) return null;

  const payToKeypair = await getActivePayToKeypair();
  if (!payToKeypair) {
    throw new Error('No active Solana payTo lab wallet configured');
  }

  const payerPk = new PublicKey(payer);
  const payToPk = payToKeypair.publicKey;
  const payToAddr = payToPk.toBase58();
  const amountMicro = BigInt(Math.round(amount * 1e6));

  const payToBalances = await getLabWalletBalances(payToAddr, 'solana');
  if (payToBalances) {
    if (payToBalances.usdcBalance < amount) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${payToBalances.usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
      );
    }
    if (payToBalances.nativeBalance < PAYTO_MIN_SOL_FOR_REFUND) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo SOL ${payToBalances.nativeBalance.toFixed(5)} < needed ${PAYTO_MIN_SOL_FOR_REFUND} for fees`,
      );
    }
  }

  const sourceAta = await getAssociatedTokenAddress(USDC_MAINNET, payToPk);
  const destAta = await getAssociatedTokenAddress(USDC_MAINNET, payerPk);

  let lastErr;
  /** @type {string | null} */
  let submittedSig = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (submittedSig && (await isRefundTxAlreadyConfirmed(submittedSig, 'solana'))) {
      return { signature: submittedSig, amountUsdc: amount };
    }
    try {
      const { connection } = await pickSolanaConnectionForReads(payToPk);

      const tx = new Transaction();
      const destInfo = await connection.getAccountInfo(destAta);
      if (!destInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(payToPk, destAta, payerPk, USDC_MAINNET),
        );
      }
      tx.add(
        createTransferInstruction(sourceAta, destAta, payToPk, amountMicro, [], TOKEN_PROGRAM_ID),
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = payToPk;
      tx.sign(payToKeypair);

      const signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });
      submittedSig = signature;

      await confirmSolanaTransaction(connection, signature, { lastValidBlockHeight });
      return { signature, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedSig = fromErr;
      if (submittedSig && (await isRefundTxAlreadyConfirmed(submittedSig, 'solana'))) {
        return { signature: submittedSig, amountUsdc: amount };
      }
      // Ambiguous confirm — do NOT re-broadcast a new transfer
      const msg = e?.message || String(e);
      if (
        submittedSig &&
        (/tx_confirm_timeout|tx_blockhash_expired|not confirmed|timeout/i.test(msg) ||
          e?.ambiguous)
      ) {
        console.warn(
          `[labX402Refund] Solana refund confirm ambiguous; not retrying send. sig=${submittedSig}`,
        );
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e) && !submittedSig) {
        console.warn(
          `[labX402Refund] Solana refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
          e?.message || e,
        );
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Transfer USDC from the Base PayTo lab wallet to the payer (ERC-20).
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerBase(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !/^0x[0-9a-fA-F]{40}$/.test(payer) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const payToAccount = await getActivePayToEvmAccount();
  if (!payToAccount) {
    throw new Error('No active Base payTo lab wallet configured');
  }

  const payToAddr = payToAccount.address;
  const publicClient = getBasePublicClient();
  const walletClient = createBaseWalletClient(payToAccount);

  const amountRaw = parseUnits(amount.toFixed(6), 6);

  const [usdcBal, ethBal] = await Promise.all([
    publicClient.readContract({
      address: /** @type {`0x${string}`} */ (BASE_USDC),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [/** @type {`0x${string}`} */ (payToAddr)],
    }),
    publicClient.getBalance({ address: /** @type {`0x${string}`} */ (payToAddr) }),
  ]);

  const usdcBalance = Number(formatUnits(/** @type {bigint} */ (usdcBal), 6));
  const ethBalance = Number(formatEther(ethBal));

  if (usdcBalance < amount) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
    );
  }
  if (ethBalance < PAYTO_MIN_ETH_FOR_REFUND) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo ETH ${ethBalance.toFixed(6)} < needed ${PAYTO_MIN_ETH_FOR_REFUND} for gas`,
    );
  }

  let lastErr;
  /** @type {string | null} */
  let submittedHash = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (
      submittedHash &&
      (await isRefundTxAlreadyConfirmed(submittedHash, 'base', { publicClient }))
    ) {
      return { signature: submittedHash, amountUsdc: amount };
    }
    try {
      const hash = await walletClient.writeContract({
        address: /** @type {`0x${string}`} */ (BASE_USDC),
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [/** @type {`0x${string}`} */ (payer), amountRaw],
      });
      submittedHash = hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return { signature: hash, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedHash = fromErr;
      if (
        submittedHash &&
        (await isRefundTxAlreadyConfirmed(submittedHash, 'base', { publicClient }))
      ) {
        return { signature: submittedHash, amountUsdc: amount };
      }
      if (submittedHash) {
        console.warn(
          `[labX402Refund] Base refund confirm ambiguous; not retrying send. hash=${submittedHash}`,
        );
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] Base refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
          e?.message || e,
        );
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Transfer USDT0 from the X Layer PayTo lab wallet to the payer (ERC-20).
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdt0ToPayerXLayer(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !/^0x[0-9a-fA-F]{40}$/.test(payer) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const payToAccount = await getActivePayToEvmAccount('xlayer');
  if (!payToAccount) {
    throw new Error('No active X Layer payTo lab wallet configured');
  }

  const payToAddr = payToAccount.address;
  const publicClient = getXlayerPublicClient();
  const walletClient = createXlayerWalletClient(payToAccount);

  const amountRaw = parseUnits(amount.toFixed(6), 6);

  const [usdt0Bal, okbBal] = await Promise.all([
    publicClient.readContract({
      address: /** @type {`0x${string}`} */ (XLAYER_USDT0),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [/** @type {`0x${string}`} */ (payToAddr)],
    }),
    publicClient.getBalance({ address: /** @type {`0x${string}`} */ (payToAddr) }),
  ]);

  const usdt0Balance = Number(formatUnits(/** @type {bigint} */ (usdt0Bal), 6));
  const okbBalance = Number(formatEther(okbBal));

  if (usdt0Balance < amount) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDT0 ${usdt0Balance.toFixed(4)} < needed ${amount.toFixed(4)}`,
    );
  }
  if (okbBalance < PAYTO_MIN_OKB_FOR_REFUND) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payTo OKB ${okbBalance.toFixed(6)} < needed ${PAYTO_MIN_OKB_FOR_REFUND} for gas`,
    );
  }

  let lastErr;
  /** @type {string | null} */
  let submittedHash = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (
      submittedHash &&
      (await isRefundTxAlreadyConfirmed(submittedHash, 'xlayer', { publicClient }))
    ) {
      return { signature: submittedHash, amountUsdc: amount };
    }
    try {
      const hash = await walletClient.writeContract({
        address: /** @type {`0x${string}`} */ (XLAYER_USDT0),
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [/** @type {`0x${string}`} */ (payer), amountRaw],
      });
      submittedHash = hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return { signature: hash, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedHash = fromErr;
      if (
        submittedHash &&
        (await isRefundTxAlreadyConfirmed(submittedHash, 'xlayer', { publicClient }))
      ) {
        return { signature: submittedHash, amountUsdc: amount };
      }
      if (submittedHash) {
        console.warn(
          `[labX402Refund] X Layer refund confirm ambiguous; not retrying send. hash=${submittedHash}`,
        );
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] X Layer refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
          e?.message || e,
        );
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Transfer USDC ASA from the Algorand PayTo lab wallet to the payer.
 * Payer must already be opted into the USDC ASA.
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
async function refundUsdcToPayerAlgorand(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !Number.isFinite(amount) || amount <= 0) return null;

  const payToAccount = await getActivePayToAlgorandAccount();
  if (!payToAccount) {
    throw new Error('No active Algorand payTo lab wallet configured');
  }

  const optedIn = await isAlgorandAddressOptedInUsdc(payer);
  if (!optedIn) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: payer not opted into USDC ASA (opt-in required before refund)`,
    );
  }

  const payToBalances = await getLabWalletBalances(payToAccount.address, 'algorand');
  let sendAmount = amount;
  if (payToBalances) {
    const clamp = clampAlgorandPayToUsdcRefundAmount({
      requestedUsd: amount,
      payToUsdcBalance: payToBalances.usdcBalance,
      minPriceUsd: getMinLabX402PriceUsd(),
    });
    if (!clamp.ok) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${Number(payToBalances.usdcBalance).toFixed(4)} < needed ${getMinLabX402PriceUsd().toFixed(4)} (min call)`,
      );
    }
    sendAmount = clamp.amountUsd;
    if (clamp.partial) {
      console.info(
        `[labX402Refund] Algorand partial top-up: requested ${amount.toFixed(4)} USDC, sending ${sendAmount.toFixed(4)} (PayTo balance)`,
      );
    }
  }

  const client = getAlgorandAlgodClient();
  const feeReady = await ensurePayToAlgoForUsdcRefund(payToAccount.address, {
    needMicro: PAYTO_USDC_REFUND_FEE_NEED_MICRO,
    client,
  });
  if (!feeReady.ok) {
    throw new Error(
      `${PAYTO_INSUFFICIENT_FUNDS}: ${feeReady.error || 'payTo ALGO insufficient for USDC refund fees'}`,
    );
  }
  if (feeReady.funded) {
    console.info(
      `[labX402Refund] PayTo fee top-up ${feeReady.amount} ALGO from ${feeReady.from}`,
    );
  } else if (feeReady.belowBatch) {
    console.info(
      `[labX402Refund] PayTo ALGO below batch cushion (spendable ${feeReady.spendable}); proceeding with single-refund fee floor`,
    );
  }

  const asaId = getAlgorandUsdcAsaId();
  const amountMicro = Math.round(sendAmount * 1e6);

  let lastErr;
  /** @type {string | null} */
  let submittedTxid = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (
      submittedTxid &&
      (await isRefundTxAlreadyConfirmed(submittedTxid, 'algorand', { algod: client }))
    ) {
      return { signature: submittedTxid, amountUsdc: sendAmount };
    }
    try {
      const sp = await client.getTransactionParams().do();
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: payToAccount.address,
        receiver: payer,
        amount: amountMicro,
        assetIndex: asaId,
        suggestedParams: sp,
      });
      const signed = txn.signTxn(payToAccount.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      submittedTxid = txid;
      await algosdk.waitForConfirmation(client, txid, 8);
      return { signature: txid, amountUsdc: sendAmount };
    } catch (e) {
      lastErr = classifyAlgorandRefundError(e, PAYTO_INSUFFICIENT_FUNDS);
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedTxid = fromErr;
      if (
        submittedTxid &&
        (await isRefundTxAlreadyConfirmed(submittedTxid, 'algorand', { algod: client }))
      ) {
        return { signature: submittedTxid, amountUsdc: sendAmount };
      }
      if (submittedTxid) {
        console.warn(
          `[labX402Refund] Algorand refund confirm ambiguous; not retrying send. txid=${submittedTxid}`,
        );
        throw lastErr;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] Algorand refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
          e?.message || e,
        );
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw lastErr;
    }
  }

  throw classifyAlgorandRefundError(lastErr, PAYTO_INSUFFICIENT_FUNDS);
}

/**
 * Transfer USDC/USDT0 from the PayTo lab wallet to the payer (chain-aware).
 * @param {string} payerAddress
 * @param {number} amountUsd
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} [chain]
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
export async function refundUsdcToPayer(payerAddress, amountUsd, chain) {
  const c =
    chain != null
      ? normalizeLabChain(chain)
      : /^0x/i.test(String(payerAddress || ''))
        ? 'base'
        : 'solana';
  if (c === 'algorand') return refundUsdcToPayerAlgorand(payerAddress, amountUsd);
  if (c === 'xlayer') return refundUsdt0ToPayerXLayer(payerAddress, amountUsd);
  if (c === 'base') return refundUsdcToPayerBase(payerAddress, amountUsd);
  return refundUsdcToPayerSolana(payerAddress, amountUsd);
}

/**
 * Proactively ensure a payer can afford the next call, topping it up from the PayTo wallet
 * when its USDC/USDT0 is too low.
 *
 * @param {string} payerAddress
 * @param {{ refundEnabled?: boolean; chain?: 'solana' | 'base' | 'algorand' | 'xlayer'; priceMultiplier?: number }} [opts]
 * @returns {Promise<{ canPay: boolean; funded: boolean; balanceUsdc: number | null; reason: string; signature?: string | null; amountUsd?: number; error?: string }>}
 */
export async function ensurePayerFundedForNextCall(payerAddress, opts = {}) {
  const chain =
    opts.chain != null
      ? normalizeLabChain(opts.chain)
      : /^0x/i.test(String(payerAddress || ''))
        ? 'base'
        : 'solana';
  const rawMult = Number(opts.priceMultiplier);
  const priceMultiplier =
    Number.isFinite(rawMult) ? Math.min(100, Math.max(1, rawMult)) : 1;
  const minPriceUsd = getMinLabX402PriceUsd() * priceMultiplier;

  // Algorand payers must hold enough ALGO to opt into USDC ASA, then opt in,
  // before PayTo can top them up with USDC.
  if (chain === 'algorand') {
    const algoSeed = await ensureAlgorandPayerAlgoForOptInAndFees(payerAddress);
    if (algoSeed.funded) {
      console.info(
        `[labX402Refund] Payer ALGO seed ${algoSeed.amount} ALGO from ${algoSeed.from}`,
      );
    } else if (!algoSeed.ok && !algoSeed.already) {
      console.warn(
        `[labX402Refund] Payer ALGO seed skipped for ${payerAddress}: ${algoSeed.error || 'unknown'}`,
      );
    }

    const optIn = await ensureAlgorandLabWalletUsdcOptIn(payerAddress);
    if (!optIn.ok && !optIn.already) {
      const balancesAfterFail = await getLabWalletBalances(payerAddress, chain);
      const reason = String(optIn.error || '').includes('insufficient_algo_for_opt_in')
        ? 'insufficient_algo_for_opt_in'
        : 'usdc_opt_in_failed';
      return {
        canPay: false,
        funded: false,
        balanceUsdc: balancesAfterFail?.usdcBalance ?? null,
        reason,
        error: optIn.error || reason,
      };
    }
  }

  let balances = await getLabWalletBalances(payerAddress, chain);

  // Balance unknown (RPC unavailable) — stay optimistic and let the payment attempt decide.
  if (!balances) {
    return { canPay: true, funded: false, balanceUsdc: null, reason: 'balance_unavailable' };
  }

  // Manual funding mode: do not auto top-up, only report affordability.
  if (opts.refundEnabled === false) {
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: 'refund_disabled',
    };
  }

  const decision = evaluateLowBalanceRefund(
    balances.usdcBalance,
    getMaxLabX402PriceUsd() * priceMultiplier,
    getWeightedAvgLabX402PriceUsd() * priceMultiplier,
  );

  if (!decision.shouldRefund) {
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: decision.reason,
    };
  }

  try {
    const refund = await refundUsdcToPayer(payerAddress, decision.refundAmountUsd, chain);
    // Re-read after top-up so Algorand opt-in + ASA balance are current.
    balances = (await getLabWalletBalances(payerAddress, chain)) ?? balances;
    if (!refund) {
      return {
        canPay: balances.usdcBalance >= minPriceUsd,
        funded: false,
        balanceUsdc: balances.usdcBalance,
        reason: balances.usdcBalance >= minPriceUsd ? decision.reason : 'topup_failed',
      };
    }
    return {
      // Partial Algorand top-ups must report canPay from the real post-top-up balance.
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: true,
      balanceUsdc: balances.usdcBalance,
      reason: 'topped_up',
      signature: refund.signature ?? null,
      amountUsd: refund.amountUsdc ?? decision.refundAmountUsd,
    };
  } catch (e) {
    const msg = e?.message || String(e);
    const underfunded = String(msg).includes(PAYTO_INSUFFICIENT_FUNDS);
    const notOptedIn = /not opted into USDC ASA/i.test(String(msg));
    console.warn(
      `[labX402Refund] proactive top-up failed for ${payerAddress} (${underfunded ? 'payTo underfunded' : msg})`,
    );
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: notOptedIn
        ? 'usdc_opt_in_required'
        : underfunded
          ? 'payto_underfunded'
          : 'topup_failed',
      error: msg,
    };
  }
}
