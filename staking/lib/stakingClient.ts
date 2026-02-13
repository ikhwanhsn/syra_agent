import {
  Connection,
  PublicKey,
  SystemProgram,
  type SendTransactionOptions,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  type Wallet,
  BN,
} from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  createApproveInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CONFIG } from "@/constants/config";
import {
  getGlobalPoolPda,
  getUserStakeInfoPda,
  getStakingVaultPda,
  getRewardVaultPda,
} from "./staking";

/** Minimal IDL with instruction signatures for Anchor Program */
const STAKING_IDL = {
  version: "0.1.0",
  name: "staking",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "globalPool", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "stakingMint", isMut: false, isSigner: false },
        { name: "rewardMint", isMut: false, isSigner: false },
        { name: "stakingVault", isMut: true, isSigner: false },
        { name: "rewardVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false },
      ],
      args: [
        { name: "rewardPerSecond", type: "u64" },
      ],
    },
    {
      name: "stake",
      accounts: [
        { name: "globalPool", isMut: true, isSigner: false },
        { name: "userStakeInfo", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "userStakingTokenAccount", isMut: true, isSigner: false },
        { name: "stakingVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "unstake",
      accounts: [
        { name: "globalPool", isMut: true, isSigner: false },
        { name: "userStakeInfo", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "userStakingTokenAccount", isMut: true, isSigner: false },
        { name: "stakingVault", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
    {
      name: "claim",
      accounts: [
        { name: "globalPool", isMut: true, isSigner: false },
        { name: "userStakeInfo", isMut: true, isSigner: false },
        { name: "owner", isMut: true, isSigner: true },
        { name: "rewardVault", isMut: true, isSigner: false },
        { name: "userRewardTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [],
  types: [],
};

export type StakingProgram = Program;

export function createStakingProgram(connection: Connection, wallet: Wallet): Program {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return new Program(STAKING_IDL as any, CONFIG.programId, provider);
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
 * Caller must ensure user has approved the token transfer (or we do approve + stake in one tx).
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

  const tx = await program.methods
    .stake(new BN(amountRaw.toString()))
    .accounts({
      globalPool,
      userStakeInfo,
      owner,
      userStakingTokenAccount,
      stakingVault,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

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
    .accounts({
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
 */
export async function claim(connection: Connection, wallet: Wallet): Promise<string> {
  const program = createStakingProgram(connection, wallet);
  const owner = wallet.publicKey!;
  const [globalPool] = getGlobalPoolPda(CONFIG.programId);
  const [userStakeInfo] = getUserStakeInfoPda(owner, CONFIG.programId);
  const rewardVault = getRewardVaultPda(CONFIG.programId);
  const userRewardTokenAccount = getUserRewardAta(owner);

  const tx = await program.methods
    .claim()
    .accounts({
      globalPool,
      userStakeInfo,
      owner,
      rewardVault,
      userRewardTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();

  const sig = await program.provider.sendAndConfirm(tx, [], OPTS);
  return sig;
}

/**
 * Create approve instruction (delegate to staking vault).
 * Use when the program pulls tokens via delegate; add to tx before stake instruction.
 */
export function createStakeApproveInstruction(
  owner: PublicKey,
  amountRaw: bigint
) {
  const userStakingTokenAccount = getUserStakingAta(owner);
  const stakingVault = getStakingVaultPda(CONFIG.programId);
  return createApproveInstruction(
    userStakingTokenAccount,
    stakingVault,
    owner,
    amountRaw,
    [],
    TOKEN_PROGRAM_ID
  );
}
