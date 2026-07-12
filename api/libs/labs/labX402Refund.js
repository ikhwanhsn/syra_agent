/**
 * Refund USDC from the lab payTo wallet back to the x402 payer after successful settlement.
 * Isolated signer — does not route through walletBroker (lab wallets are outside agent policy).
 */
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getActivePayToKeypair, getLabWalletBalances } from './labWalletService.js';
import { pickSolanaConnectionForReads, isSolanaRpcRetryableError } from '../solanaServerRpc.js';
import {
  getMaxLabX402PriceUsd,
  getMinLabX402PriceUsd,
  getWeightedAvgLabX402PriceUsd,
} from './labX402Endpoints.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

/** Distinguishable error so callers can skip (not hard-fail) when the PayTo wallet is underfunded. */
export const PAYTO_INSUFFICIENT_FUNDS = 'PAYTO_INSUFFICIENT_FUNDS';

/** Minimum SOL the PayTo wallet needs to cover fees + possible ATA rent for a refund transfer. */
const PAYTO_MIN_SOL_FOR_REFUND = 0.003;

const REFUND_MAX_ATTEMPTS = 3;
const REFUND_RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Transient send errors worth retrying with a fresh blockhash / RPC. */
function isRetryableRefundError(e) {
  const msg = e?.message || String(e);
  return (
    isSolanaRpcRetryableError(e) ||
    /blockhash|block height exceeded|not confirmed|expired|node is behind|transaction was not confirmed/i.test(
      msg,
    )
  );
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
 * Transfer USDC from the PayTo lab wallet to the payer.
 * Preflights PayTo funding and retries transient send/confirm failures with a fresh
 * blockhash + RPC so a temporary hiccup no longer surfaces as a permanent refund failure.
 * @param {string} payerAddress - Solana base58 payer address
 * @param {number} amountUsd - Human USDC amount to refund
 * @returns {Promise<{ signature: string; amountUsdc: number } | null>}
 */
export async function refundUsdcToPayer(payerAddress, amountUsd) {
  const payer = String(payerAddress || '').trim();
  const amount = Number(amountUsd);
  if (!payer || !Number.isFinite(amount) || amount <= 0) return null;

  const payToKeypair = await getActivePayToKeypair();
  if (!payToKeypair) {
    throw new Error('No active payTo lab wallet configured');
  }

  const payerPk = new PublicKey(payer);
  const payToPk = payToKeypair.publicKey;
  const payToAddr = payToPk.toBase58();
  const amountMicro = BigInt(Math.round(amount * 1e6));

  // Preflight: never attempt a transfer the PayTo wallet cannot cover — it would only ever fail.
  const payToBalances = await getLabWalletBalances(payToAddr);
  if (payToBalances) {
    if (payToBalances.usdcBalance < amount) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo USDC ${payToBalances.usdcBalance.toFixed(4)} < needed ${amount.toFixed(4)}`,
      );
    }
    if (payToBalances.solBalance < PAYTO_MIN_SOL_FOR_REFUND) {
      throw new Error(
        `${PAYTO_INSUFFICIENT_FUNDS}: payTo SOL ${payToBalances.solBalance.toFixed(5)} < needed ${PAYTO_MIN_SOL_FOR_REFUND} for fees`,
      );
    }
  }

  const sourceAta = await getAssociatedTokenAddress(USDC_MAINNET, payToPk);
  const destAta = await getAssociatedTokenAddress(USDC_MAINNET, payerPk);

  let lastErr;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    try {
      // Fresh connection + blockhash each attempt so a stale/expired blockhash self-heals.
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

      const signature = await sendAndConfirmTransaction(connection, tx, [payToKeypair], {
        commitment: 'confirmed',
        maxRetries: 3,
      });

      return { signature, amountUsdc: amount };
    } catch (e) {
      lastErr = e;
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        console.warn(
          `[labX402Refund] refund attempt ${attempt}/${REFUND_MAX_ATTEMPTS} failed, retrying:`,
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
 * Proactively ensure a payer can afford the next call, topping it up from the PayTo wallet
 * when its USDC is too low. This runs BEFORE a paid call so a wallet that drained to $0 can
 * always recover and pay again (the post-payment refund alone cannot rescue a $0 wallet, since
 * a $0 wallet can never make the payment that would trigger it).
 *
 * @param {string} payerAddress
 * @param {{ refundEnabled?: boolean }} [opts]
 * @returns {Promise<{ canPay: boolean; funded: boolean; balanceUsdc: number | null; reason: string; signature?: string | null; amountUsd?: number; error?: string }>}
 */
export async function ensurePayerFundedForNextCall(payerAddress, opts = {}) {
  const minPriceUsd = getMinLabX402PriceUsd();
  const balances = await getLabWalletBalances(payerAddress);

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
    getMaxLabX402PriceUsd(),
    getWeightedAvgLabX402PriceUsd(),
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
    const refund = await refundUsdcToPayer(payerAddress, decision.refundAmountUsd);
    return {
      canPay: true,
      funded: true,
      balanceUsdc: balances.usdcBalance,
      reason: 'topped_up',
      signature: refund?.signature ?? null,
      amountUsd: decision.refundAmountUsd,
    };
  } catch (e) {
    const underfunded = String(e?.message || '').includes(PAYTO_INSUFFICIENT_FUNDS);
    console.warn(
      `[labX402Refund] proactive top-up failed for ${payerAddress} (${underfunded ? 'payTo underfunded' : e?.message || e})`,
    );
    return {
      canPay: balances.usdcBalance >= minPriceUsd,
      funded: false,
      balanceUsdc: balances.usdcBalance,
      reason: underfunded ? 'payto_underfunded' : 'topup_failed',
      error: e?.message || String(e),
    };
  }
}
