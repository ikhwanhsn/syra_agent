/**
 * Build unsigned Jito stake-pool deposit (SOL → JitoSOL) for the invest agent wallet.
 * Uses raw StakePoolInstruction.depositSol so the agent wallet is the sole signer
 * (high-level depositSol creates an ephemeral keypair incompatible with Privy custody).
 */
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  STAKE_POOL_PROGRAM_ID,
  StakePoolInstruction,
  getStakePoolAccount,
} from '@solana/spl-stake-pool';
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { getBlockchainSolanaConnection } from '../solanaTxUtils.js';

/** Jito mainnet stake pool */
export const JITO_STAKE_POOL = new PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb');

const MIN_SOL = 0.01;
const MAX_SOL = 500;

/**
 * @param {PublicKey} stakePoolAddress
 * @returns {Promise<PublicKey>}
 */
async function findWithdrawAuthority(stakePoolAddress) {
  const [pda] = PublicKey.findProgramAddressSync(
    [stakePoolAddress.toBuffer(), Buffer.from('withdraw')],
    STAKE_POOL_PROGRAM_ID,
  );
  return pda;
}

/**
 * @param {{ agentAddress: string; amountSol: number }} params
 * @returns {Promise<{ serializedTxBase64: string; lastValidBlockHeight: number; amountLamports: number }>}
 */
export async function buildJitoDepositTx({ agentAddress, amountSol }) {
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
  const minReserve = 5_000_000;
  if (balance < lamports + minReserve) {
    throw new Error(
      `Insufficient SOL in invest wallet (need ~${((lamports + minReserve) / LAMPORTS_PER_SOL).toFixed(4)} SOL incl. fees)`,
    );
  }

  const stakePoolAccount = await getStakePoolAccount(connection, JITO_STAKE_POOL);
  const stakePool = stakePoolAccount.account.data;
  const poolMint = stakePool.poolMint;
  const jitoSolAta = getAssociatedTokenAddressSync(poolMint, owner, false);
  const withdrawAuthority = await findWithdrawAuthority(JITO_STAKE_POOL);

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(owner, jitoSolAta, owner, poolMint),
    StakePoolInstruction.depositSol({
      stakePool: JITO_STAKE_POOL,
      depositAuthority: undefined,
      withdrawAuthority,
      reserveStake: stakePool.reserveStake,
      fundingAccount: owner,
      destinationPoolAccount: jitoSolAta,
      managerFeeAccount: stakePool.managerFeeAccount,
      referralPoolAccount: jitoSolAta,
      poolMint,
      lamports,
    }),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.feePayer = owner;
  tx.recentBlockhash = blockhash;

  const serializedTxBase64 = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64');

  return {
    serializedTxBase64,
    lastValidBlockHeight,
    amountLamports: lamports,
  };
}
