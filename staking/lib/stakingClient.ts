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
  return new Program(STAKING_IDL as any, provider);
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
 * Build and send stake transaction.
 * Creates user staking ATA if it doesn't exist.
 */
export async function stake(
  connection: Connection,
  wallet: Wallet,
  amountRaw: bigint
): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo] = getUserStakeInfoPda(owner, CONFIG.programId);
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
    .stake(new BN(amountRaw.toString()))
    .accountsStrict({
      globalPool,
      userStakeInfo,
      owner,
      userStakingTokenAccount,
      stakingVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(createStakingAtaIx, stakeIx);
  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}

/**
 * Build and send unstake transaction.
 */
export async function unstake(
  connection: Connection,
  wallet: Wallet,
  amountRaw: bigint
): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo] = getUserStakeInfoPda(owner, CONFIG.programId);
  const userStakingTokenAccount = getUserStakingAta(owner);
  const stakingVault = getStakingVaultPda(CONFIG.programId);

  const tx = await program.methods
    .unstake(new BN(amountRaw.toString()))
    .accountsStrict({
      globalPool,
      userStakeInfo,
      owner,
      userStakingTokenAccount,
      stakingVault,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();

  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}

/**
 * Build and send claim rewards transaction.
 * Creates user reward ATA if it doesn't exist.
 */
export async function claim(
  connection: Connection,
  wallet: Wallet
): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo] = getUserStakeInfoPda(owner, CONFIG.programId);
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
      userStakeInfo,
      owner,
      rewardVault,
      userRewardTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(createRewardAtaIx, claimIx);
  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}
