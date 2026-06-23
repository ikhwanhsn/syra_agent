/** KOL reward pool share paid to participants (basis points). */
export const KOL_USER_REWARD_BPS = 8000;

/** S3 Labs platform fee share (basis points). */
export const KOL_PLATFORM_FEE_BPS = 2000;

/** S3 Labs platform fee recipient (on-chain). */
export const S3LABS_FEE_WALLET = "854tpY9AnaMYDpviWeo4eWXzoUmvLrYwkU16F2MtzHz8";

/** Minimum KOL reward pool size (SOL). */
export const MIN_KOL_REWARD_SOL = 0.1;

/** Campaign duration bounds (days). */
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 30;

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Minimum total deposit (SOL) that yields MIN_KOL_REWARD_SOL to the KOL pool. */
export function minTotalDepositSol() {
  return (MIN_KOL_REWARD_SOL * 10000) / KOL_USER_REWARD_BPS;
}

/** Minimum total deposit in lamports. */
export function minTotalDepositLamports() {
  return Math.ceil(minTotalDepositSol() * LAMPORTS_PER_SOL);
}

/**
 * @returns {string}
 */
export function getS3labsFeeWallet() {
  return S3LABS_FEE_WALLET;
}

/**
 * Split total campaign deposit into KOL pool (80%) and platform fee (20%).
 * @param {number} rewardLamports
 */
export function splitRewardPool(rewardLamports) {
  const total = BigInt(Math.floor(Number(rewardLamports) || 0));
  const kolPoolLamports = Number((total * BigInt(KOL_USER_REWARD_BPS)) / 10000n);
  const platformFeeLamports = Number(total - BigInt(kolPoolLamports));
  return { kolPoolLamports, platformFeeLamports };
}
