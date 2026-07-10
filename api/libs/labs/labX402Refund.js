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
import { getActivePayToKeypair } from './labWalletService.js';
import { pickSolanaConnectionForReads } from '../solanaServerRpc.js';
import {
  getMaxLabX402PriceUsd,
  getWeightedAvgLabX402PriceUsd,
} from './labX402Endpoints.js';

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

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
  const amountMicro = BigInt(Math.round(amount * 1e6));

  const { connection } = await pickSolanaConnectionForReads(payToPk);

  const sourceAta = await getAssociatedTokenAddress(USDC_MAINNET, payToPk);
  const destAta = await getAssociatedTokenAddress(USDC_MAINNET, payerPk);

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
}
