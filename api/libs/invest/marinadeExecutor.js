/**
 * Build unsigned Marinade liquid-staking deposit (SOL → mSOL) for the invest agent wallet.
 * Caller signs via walletBroker (Privy / legacy custody).
 */
import { BN, Marinade, MarinadeConfig } from '@marinade.finance/marinade-ts-sdk';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { getBlockchainSolanaConnection } from '../solanaTxUtils.js';

const MIN_SOL = 0.01;
const MAX_SOL = 500;

/**
 * @param {{ agentAddress: string; amountSol: number }} params
 * @returns {Promise<{ serializedTxBase64: string; lastValidBlockHeight: number; amountLamports: number }>}
 */
export async function buildMarinadeDepositTx({ agentAddress, amountSol }) {
  const amount = Number(amountSol);
  if (!Number.isFinite(amount) || amount < MIN_SOL) {
    throw new Error(`amountSol must be at least ${MIN_SOL}`);
  }
  if (amount > MAX_SOL) {
    throw new Error(`amountSol must be at most ${MAX_SOL}`);
  }

  let owner;
  try {
    owner = new PublicKey(agentAddress);
  } catch {
    throw new Error('Invalid agentAddress');
  }

  const connection = getBlockchainSolanaConnection();
  const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
  if (lamports <= 0) throw new Error('amountSol too small');

  const balance = await connection.getBalance(owner, 'confirmed');
  // Leave headroom for fees + optional mSOL ATA rent
  const minReserve = 5_000_000;
  if (balance < lamports + minReserve) {
    throw new Error(
      `Insufficient SOL in invest wallet (need ~${((lamports + minReserve) / LAMPORTS_PER_SOL).toFixed(4)} SOL incl. fees)`,
    );
  }

  const config = new MarinadeConfig({
    connection,
    publicKey: owner,
  });
  const marinade = new Marinade(config);
  const { transaction } = await marinade.deposit(new BN(lamports));

  if (!(transaction instanceof Transaction)) {
    throw new Error('Marinade deposit did not return a legacy Transaction');
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.feePayer = owner;
  transaction.recentBlockhash = blockhash;

  const serializedTxBase64 = transaction
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64');

  return {
    serializedTxBase64,
    lastValidBlockHeight,
    amountLamports: lamports,
  };
}
