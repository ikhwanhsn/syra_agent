/** S3 Labs flat platform fee per campaign creation (SOL). */
export const KOL_PLATFORM_FEE_SOL = 0.05;

/** S3 Labs platform fee recipient (on-chain). */
export const S3LABS_FEE_WALLET = "854tpY9AnaMYDpviWeo4eWXzoUmvLrYwkU16F2MtzHz8";

/** Minimum KOL reward pool size (SOL). */
export const MIN_KOL_REWARD_SOL = 0.1;

/** Minimum KOL reward added per top-up (SOL). */
export const MIN_TOPUP_KOL_REWARD_SOL = 0.1;

/** Minimum on-chain KOL payout (SOL). Amounts below roll over until this threshold is met. */
export const MIN_KOL_PAYOUT_SOL = 0.01;

/** Campaign duration bounds (days). */
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 30;

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Flat platform fee in lamports. */
export const KOL_PLATFORM_FEE_LAMPORTS = Math.floor(KOL_PLATFORM_FEE_SOL * LAMPORTS_PER_SOL);

/** Minimum on-chain payout in lamports. */
export const MIN_KOL_PAYOUT_LAMPORTS = Math.floor(MIN_KOL_PAYOUT_SOL * LAMPORTS_PER_SOL);

/** Minimum total deposit (SOL) = min KOL pool + flat platform fee. */
export function minTotalDepositSol() {
  return MIN_KOL_REWARD_SOL + KOL_PLATFORM_FEE_SOL;
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
 * Split total campaign deposit into KOL pool and flat platform fee.
 * @param {number} rewardLamports
 */
export function splitRewardPool(rewardLamports) {
  const total = Math.floor(Number(rewardLamports) || 0);
  const platformFeeLamports = Math.min(KOL_PLATFORM_FEE_LAMPORTS, total);
  const kolPoolLamports = total - platformFeeLamports;
  return { kolPoolLamports, platformFeeLamports };
}

/**
 * Compute deposit breakdown for a reward top-up (KOL amount + flat platform fee).
 * @param {number} kolRewardSol
 */
export function computeTopUpDeposit(kolRewardSol) {
  const kolRewardLamports = Math.floor(Number(kolRewardSol) * LAMPORTS_PER_SOL);
  const platformFeeLamports = KOL_PLATFORM_FEE_LAMPORTS;
  return {
    kolRewardLamports,
    platformFeeLamports,
    totalDepositLamports: kolRewardLamports + platformFeeLamports,
  };
}
