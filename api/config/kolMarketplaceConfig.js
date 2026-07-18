/** S3 Labs flat platform fee per campaign creation (SOL). */
export const KOL_PLATFORM_FEE_SOL = 0.005;

/** S3 Labs platform fee recipient (on-chain). */
export const S3LABS_FEE_WALLET = "854tpY9AnaMYDpviWeo4eWXzoUmvLrYwkU16F2MtzHz8";

/** Minimum KOL reward pool size (SOL). */
export const MIN_KOL_REWARD_SOL = 0.01;

/** Minimum KOL reward added per top-up (SOL). */
export const MIN_TOPUP_KOL_REWARD_SOL = 0.01;

/** Minimum on-chain KOL payout (SOL). Amounts below roll over until this threshold is met. */
export const MIN_KOL_PAYOUT_SOL = 0.01;

/** Campaign duration bounds (days). */
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 30;

/**
 * Soft score multiplier for wallets that already created+funded a campaign.
 * Applied at payout ranking only — does not rewrite stored latestScore.
 */
export const CREATOR_SCORE_BONUS = 1.15;

/** Default: 100% of pool to top-N when payoutTopN is set. */
export const DEFAULT_PAYOUT_TOP_N_SHARE_BPS = 10_000;

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Convert SOL to lamports with stable rounding for user-entered amounts. */
export function solToLamports(sol) {
  return Math.round(Number(sol) * LAMPORTS_PER_SOL);
}

/** Flat platform fee in lamports. */
export const KOL_PLATFORM_FEE_LAMPORTS = solToLamports(KOL_PLATFORM_FEE_SOL);

/** Minimum KOL reward pool in lamports. */
export const MIN_KOL_REWARD_LAMPORTS = solToLamports(MIN_KOL_REWARD_SOL);

/** Minimum on-chain payout in lamports. */
export const MIN_KOL_PAYOUT_LAMPORTS = solToLamports(MIN_KOL_PAYOUT_SOL);

/**
 * Platform fee for a create deposit. First funded campaign is waived (0).
 * @param {boolean} isFirstCampaign
 */
export function getCreatePlatformFeeLamports(isFirstCampaign) {
  return isFirstCampaign ? 0 : KOL_PLATFORM_FEE_LAMPORTS;
}

/** Minimum total deposit (SOL) = min KOL pool + flat platform fee. */
export function minTotalDepositSol(platformFeeSol = KOL_PLATFORM_FEE_SOL) {
  return MIN_KOL_REWARD_SOL + Number(platformFeeSol || 0);
}

/** Minimum total deposit in lamports. */
export function minTotalDepositLamports(platformFeeLamports = KOL_PLATFORM_FEE_LAMPORTS) {
  return MIN_KOL_REWARD_LAMPORTS + Math.max(0, Math.floor(Number(platformFeeLamports) || 0));
}

/**
 * @returns {string}
 */
export function getS3labsFeeWallet() {
  return S3LABS_FEE_WALLET;
}

/**
 * Split total campaign deposit into KOL pool and platform fee.
 * @param {number} rewardLamports
 * @param {number} [platformFeeLamports] — override (e.g. waived = 0)
 */
export function splitRewardPool(
  rewardLamports,
  platformFeeLamports = KOL_PLATFORM_FEE_LAMPORTS,
) {
  const total = Math.floor(Number(rewardLamports) || 0);
  const fee = Math.min(
    Math.max(0, Math.floor(Number(platformFeeLamports) || 0)),
    total,
  );
  const kolPoolLamports = total - fee;
  return { kolPoolLamports, platformFeeLamports: fee };
}

/**
 * Compute deposit breakdown for a reward top-up (KOL amount + flat platform fee).
 * Top-ups always charge the full platform fee (never waived).
 * @param {number} kolRewardSol
 */
export function computeTopUpDeposit(kolRewardSol) {
  const kolRewardLamports = solToLamports(kolRewardSol);
  const platformFeeLamports = KOL_PLATFORM_FEE_LAMPORTS;
  return {
    kolRewardLamports,
    platformFeeLamports,
    totalDepositLamports: kolRewardLamports + platformFeeLamports,
  };
}
