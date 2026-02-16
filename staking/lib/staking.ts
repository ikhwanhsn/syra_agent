import {
  Connection,
  PublicKey,
  type Commitment,
} from "@solana/web3.js";
import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { CONFIG } from "@/constants/config";

// --- Anchor IDL types (match your program) ---

export interface GlobalPool {
  authority: PublicKey;
  stakingMint: PublicKey;
  rewardMint: PublicKey;
  totalStaked: bigint;
  rewardPerSecond: bigint;
  accumulatedRewardPerShare: bigint; // scaled by 1e12
  lastRewardTime: bigint;
  bump: number;
  isInitialized: boolean;
}

/** Staking period: 0 = 1 minute, 1 = 1 hour, 2 = 1 day */
export type StakingPeriod = 0 | 1 | 2;

export interface UserStakeInfo {
  owner: PublicKey;
  amount: bigint;
  rewardDebt: bigint;
  unlockAt: bigint;
}

export const STAKING_IDL = {
  version: "0.1.0",
  name: "staking",
  instructions: [],
  accounts: [
    {
      name: "globalPool",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "stakingMint", type: "publicKey" },
          { name: "rewardMint", type: "publicKey" },
          { name: "totalStaked", type: "u64" },
          { name: "rewardPerSecond", type: "u64" },
          { name: "accumulatedRewardPerShare", type: "u128" },
          { name: "lastRewardTime", type: "i64" },
          { name: "bump", type: "u8" },
          { name: "isInitialized", type: "bool" },
        ],
      },
    },
    {
      name: "userStakeInfo",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "amount", type: "u64" },
          { name: "rewardDebt", type: "u128" },
          { name: "unlockAt", type: "i64" },
        ],
      },
    },
  ],
} as Idl;

const ACCUMULATED_REWARD_PER_SHARE_PRECISION = 1e12;

/** PDA seeds used by the program */
export const PDA_SEEDS = {
  pool: Buffer.from("pool"),
  position: Buffer.from("position"),
  counter: Buffer.from("counter"),
  stakingVault: Buffer.from("staking_vault"),
  rewardVault: Buffer.from("reward_vault"),
} as const;

/**
 * Derive GlobalPool PDA.
 */
export function getGlobalPoolPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([PDA_SEEDS.pool], programId);
}

/**
 * Derive UserStakeInfo PDA for a period (0=1m, 1=3m, 2=1y).
 */
export function getUserStakeInfoPda(
  user: PublicKey,
  programId: PublicKey,
  period: StakingPeriod = 0
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PDA_SEEDS.pool, user.toBuffer(), Buffer.from([period])],
    programId
  );
}

/**
 * Derive PositionCounter PDA for a user and period (0=1m, 1=3m, 2=1y).
 * Used to get the next stake position index.
 */
export function getPositionCounterPda(
  user: PublicKey,
  programId: PublicKey,
  period: StakingPeriod
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PDA_SEEDS.pool, PDA_SEEDS.counter, user.toBuffer(), Buffer.from([period])],
    programId
  );
}

/**
 * Derive StakePosition PDA for a user, period, and position index.
 */
export function getStakePositionPda(
  user: PublicKey,
  programId: PublicKey,
  period: StakingPeriod,
  positionIndex: number
): [PublicKey, number] {
  const indexBuf = Buffer.alloc(4);
  indexBuf.writeUInt32LE(positionIndex, 0);
  return PublicKey.findProgramAddressSync(
    [PDA_SEEDS.pool, PDA_SEEDS.position, user.toBuffer(), Buffer.from([period]), indexBuf],
    programId
  );
}

/**
 * Derive staking vault ATA (owned by pool PDA).
 */
export function getStakingVaultPda(programId: PublicKey): PublicKey {
  const [poolPda] = getGlobalPoolPda(programId);
  return getAssociatedTokenAddressSync(
    CONFIG.stakingMint,
    poolPda,
    true
  );
}

/**
 * Derive reward vault ATA (owned by pool PDA).
 */
export function getRewardVaultPda(programId: PublicKey): PublicKey {
  const [poolPda] = getGlobalPoolPda(programId);
  return getAssociatedTokenAddressSync(
    CONFIG.rewardMint,
    poolPda,
    true
  );
}

/**
 * Fetch and deserialize GlobalPool account.
 */
export async function fetchGlobalPool(
  connection: Connection,
  programId: PublicKey,
  commitment: Commitment = "confirmed"
): Promise<GlobalPool | null> {
  const [pda] = getGlobalPoolPda(programId);
  const accountInfo = await connection.getAccountInfo(pda, commitment);
  if (!accountInfo?.data) return null;
  return deserializeGlobalPool(accountInfo.data);
}

/**
 * Fetch and deserialize UserStakeInfo account for a period.
 */
export async function fetchUserStakeInfo(
  connection: Connection,
  user: PublicKey,
  programId: PublicKey,
  period: StakingPeriod,
  commitment: Commitment = "confirmed"
): Promise<UserStakeInfo | null> {
  const [pda] = getUserStakeInfoPda(user, programId, period);
  const accountInfo = await connection.getAccountInfo(pda, commitment);
  if (!accountInfo?.data) return null;
  return deserializeUserStakeInfo(accountInfo.data);
}

/**
 * Fetch all 3 period stake infos for a user (1m, 3m, 1y).
 */
export async function fetchAllUserStakeInfos(
  connection: Connection,
  user: PublicKey,
  programId: PublicKey,
  commitment: Commitment = "confirmed"
): Promise<[UserStakeInfo | null, UserStakeInfo | null, UserStakeInfo | null]> {
  const [info1m, info3m, info1y] = await Promise.all([
    fetchUserStakeInfo(connection, user, programId, 0, commitment),
    fetchUserStakeInfo(connection, user, programId, 1, commitment),
    fetchUserStakeInfo(connection, user, programId, 2, commitment),
  ]);
  return [info1m, info3m, info1y];
}

/**
 * Fetch the next stake position index for a user and period.
 * If the PositionCounter account does not exist, returns 0.
 */
export async function fetchNextPositionIndex(
  connection: Connection,
  user: PublicKey,
  programId: PublicKey,
  period: StakingPeriod,
  commitment: Commitment = "confirmed"
): Promise<number> {
  const [pda] = getPositionCounterPda(user, programId, period);
  const accountInfo = await connection.getAccountInfo(pda, commitment);
  if (!accountInfo?.data || accountInfo.data.length < 8 + 4) return 0;
  return accountInfo.data.readUInt32LE(8);
}

/** Minimal deserialization for GlobalPool (Anchor layout: 8 discriminator + fields) */
function deserializeGlobalPool(data: Buffer): GlobalPool {
  let offset = 8;
  const authority = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;
  const stakingMint = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;
  const rewardMint = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;
  const totalStaked = data.readBigUInt64LE(offset);
  offset += 8;
  const rewardPerSecond = data.readBigUInt64LE(offset);
  offset += 8;
  const accumulatedRewardPerShare =
    data.readBigUInt64LE(offset) +
    data.readBigUInt64LE(offset + 8) * (1n << 64n);
  offset += 16;
  const lastRewardTime = data.readBigInt64LE(offset);
  offset += 8;
  const bump = data.readUInt8(offset);
  offset += 1;
  const isInitialized = data.readUInt8(offset) === 1;
  return {
    authority,
    stakingMint,
    rewardMint,
    totalStaked,
    rewardPerSecond,
    accumulatedRewardPerShare,
    lastRewardTime,
    bump,
    isInitialized,
  };
}

/** Minimal deserialization for UserStakeInfo */
function deserializeUserStakeInfo(data: Buffer): UserStakeInfo {
  let offset = 8;
  const owner = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;
  const amount = data.readBigUInt64LE(offset);
  offset += 8;
  const rewardDebt =
    data.readBigUInt64LE(offset) +
    data.readBigUInt64LE(offset + 8) * (1n << 64n);
  offset += 16;
  const unlockAt = data.readBigInt64LE(offset);
  return { owner, amount, rewardDebt, unlockAt: BigInt(unlockAt) };
}

/**
 * Compute pending reward for a user using:
 * pending_reward = (user_staked_amount * accumulated_reward_per_share) / 1e12 - user_reward_debt
 * Plus any new rewards accrued since lastRewardTime (emission-per-second).
 */
export function computePendingReward(
  pool: GlobalPool,
  user: UserStakeInfo,
  currentTimeSeconds: number
): bigint {
  if (user.amount === 0n) return 0n;

  let accRewardPerShare = pool.accumulatedRewardPerShare;
  const lastTime = Number(pool.lastRewardTime);
  const totalStaked = pool.totalStaked;

  if (totalStaked > 0n && currentTimeSeconds > lastTime) {
    const elapsed = BigInt(currentTimeSeconds - lastTime);
    const rewardAccrued = elapsed * pool.rewardPerSecond;
    accRewardPerShare +=
      (rewardAccrued * BigInt(ACCUMULATED_REWARD_PER_SHARE_PRECISION)) /
      totalStaked;
  }

  const pending =
    (user.amount * accRewardPerShare) /
      BigInt(ACCUMULATED_REWARD_PER_SHARE_PRECISION) -
    user.rewardDebt;

  return pending > 0n ? pending : 0n;
}

/**
 * Get current Unix timestamp in seconds.
 */
export function getCurrentTimeSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Compute APR (annual percentage rate).
 * APR = (rewardPerSecond * secondsPerYear * rewardTokenPrice) / totalStakedValue
 * If no price: use token amounts only (reward vs staked in same unit scale).
 */
export function computeApr(
  rewardPerSecond: bigint,
  totalStaked: bigint,
  stakingDecimals: number,
  rewardDecimals: number,
  secondsPerYear: number,
  rewardTokenPriceUsd: number = 1,
  stakingTokenPriceUsd: number = 1
): number {
  if (totalStaked === 0n) return 0;
  const scaleStaked = 10 ** stakingDecimals;
  const scaleReward = 10 ** rewardDecimals;
  const yearlyReward =
    Number(rewardPerSecond) * secondsPerYear * (rewardTokenPriceUsd / scaleReward);
  const totalStakedValue =
    (Number(totalStaked) / scaleStaked) * stakingTokenPriceUsd;
  if (totalStakedValue <= 0) return 0;
  return (yearlyReward / totalStakedValue) * 100;
}
