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

const USDC_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

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
