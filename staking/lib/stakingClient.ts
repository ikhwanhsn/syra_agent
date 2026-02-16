import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  type SendTransactionOptions,
} from "@solana/web3.js";
import { Program, AnchorProvider, type Wallet, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CONFIG } from "@/constants/config";
import {
  getGlobalPoolPda,
  getUserStakeInfoPda,
  getStakingVaultPda,
  getRewardVaultPda,
  getPositionCounterPda,
  getStakePositionPda,
  fetchNextPositionIndex,
  type StakingPeriod,
} from "./staking";

import stakingIdl from "./idl/staking.json";

const STAKING_IDL = stakingIdl as object;

export type StakingProgram = Program;

/** Adapter with at least signTransaction (signAllTransactions optional). */
export interface WalletAdapterLike {
  publicKey: PublicKey | null;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions?(txs: Transaction[]): Promise<Transaction[]>;
}

/**
 * Wrap wallet-adapter so it implements Anchor's Wallet interface (signTransaction + signAllTransactions).
 * Some adapters only provide signTransaction; Anchor's sendAndConfirm may call signAllTransactions.
 */
export function toAnchorWallet(adapter: WalletAdapterLike | null): Wallet {
  if (!adapter?.publicKey) throw new Error("Wallet not connected");
  return {
    publicKey: adapter.publicKey,
    signTransaction: (tx: Transaction) => adapter.signTransaction(tx),
    signAllTransactions: async (txs: Transaction[]) => {
      if (adapter.signAllTransactions) {
        return adapter.signAllTransactions(txs);
      }
      return Promise.all(txs.map((tx) => adapter.signTransaction(tx)));
    },
  };
}

export function createStakingProgram(
  connection: Connection,
  wallet: Wallet
): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  // Use CONFIG.programId so the client invokes the deployed program (lib/idl may have a stale address)
  const idlWithProgramId = { ...(STAKING_IDL as Record<string, unknown>), address: CONFIG.programId.toBase58() };
  return new Program(idlWithProgramId as any, provider);
}

export function getUserStakingAta(user: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    CONFIG.stakingMint,
    user,
    false
  );
}

export function getUserRewardAta(user: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    CONFIG.rewardMint,
    user,
    false
  );
}

const OPTS: SendTransactionOptions = {
  skipPreflight: false,
  preflightCommitment: "confirmed",
  maxRetries: 3,
};

/**
 * Build and send stake transaction (period: 0=1m, 1=3m, 2=1y).
 * Creates user staking ATA if it doesn't exist.
 * Fetches next position index and passes position_counter + stake_position accounts.
 */
export async function stake(
  connection: Connection,
  wallet: Wallet,
  amountRaw: bigint,
  period: StakingPeriod
): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo1m] = getUserStakeInfoPda(owner, CONFIG.programId, 0);
  const [userStakeInfo3m] = getUserStakeInfoPda(owner, CONFIG.programId, 1);
  const [userStakeInfo1y] = getUserStakeInfoPda(owner, CONFIG.programId, 2);
  const [positionCounter1m] = getPositionCounterPda(owner, CONFIG.programId, 0);
  const [positionCounter3m] = getPositionCounterPda(owner, CONFIG.programId, 1);
  const [positionCounter1y] = getPositionCounterPda(owner, CONFIG.programId, 2);

  const positionIndex = await fetchNextPositionIndex(
    connection,
    owner,
    CONFIG.programId,
    period
  );
  const [stakePosition] = getStakePositionPda(owner, CONFIG.programId, period, positionIndex);

  const userStakingTokenAccount = getUserStakingAta(owner);
  const stakingVault = getStakingVaultPda(CONFIG.programId);

  const createStakingAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    owner,
    userStakingTokenAccount,
    owner,
    CONFIG.stakingMint,
    undefined,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID
  );

  const stakeIx = await program.methods
    .stake(new BN(amountRaw.toString()), period, positionIndex)
    .accountsStrict({
      globalPool,
      userStakeInfo1M: userStakeInfo1m,
      userStakeInfo3M: userStakeInfo3m,
      userStakeInfo1Y: userStakeInfo1y,
      owner,
      userStakingTokenAccount,
      stakingVault,
      positionCounter1M: positionCounter1m,
      positionCounter3M: positionCounter3m,
      positionCounter1Y: positionCounter1y,
      stakePosition,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(createStakingAtaIx, stakeIx);
  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}

/**
 * Build and send unstake transaction (period: 0=1m, 1=3m, 2=1y).
 */
/**
 * Unstake only returns staked tokens. Rewards are NOT auto-claimed;
 * user must click "Claim Reward" to claim.
 */
export async function unstake(
  connection: Connection,
  wallet: Wallet,
  amountRaw: bigint,
  period: StakingPeriod
): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo1m] = getUserStakeInfoPda(owner, CONFIG.programId, 0);
  const [userStakeInfo3m] = getUserStakeInfoPda(owner, CONFIG.programId, 1);
  const [userStakeInfo1y] = getUserStakeInfoPda(owner, CONFIG.programId, 2);
  const userStakingTokenAccount = getUserStakingAta(owner);
  const stakingVault = getStakingVaultPda(CONFIG.programId);

  const unstakeIx = await program.methods
    .unstake(new BN(amountRaw.toString()), period)
    .accountsStrict({
      globalPool,
      userStakeInfo1M: userStakeInfo1m,
      userStakeInfo3M: userStakeInfo3m,
      userStakeInfo1Y: userStakeInfo1y,
      owner,
      userStakingTokenAccount,
      stakingVault,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(unstakeIx);
  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}

/**
 * Build and send claim rewards transaction (aggregates all 3 periods).
 * Creates user reward ATA if it doesn't exist.
 */
export async function claim(
  connection: Connection,
  wallet: Wallet
): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo1m] = getUserStakeInfoPda(owner, CONFIG.programId, 0);
  const [userStakeInfo3m] = getUserStakeInfoPda(owner, CONFIG.programId, 1);
  const [userStakeInfo1y] = getUserStakeInfoPda(owner, CONFIG.programId, 2);
  const rewardVault = getRewardVaultPda(CONFIG.programId);
  const userRewardTokenAccount = getUserRewardAta(owner);

  const createRewardAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    owner,
    userRewardTokenAccount,
    owner,
    CONFIG.rewardMint,
    undefined,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID
  );

  const claimIx = await program.methods
    .claim()
    .accountsStrict({
      globalPool,
      userStakeInfo1M: userStakeInfo1m,
      userStakeInfo3M: userStakeInfo3m,
      userStakeInfo1Y: userStakeInfo1y,
      owner,
      rewardVault,
      userRewardTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(createRewardAtaIx, claimIx);
  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}
