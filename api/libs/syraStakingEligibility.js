/**
 * SYRA Streamflow staking eligibility — use for product utilities
 * (trading agent creation, premium tiers, etc.) backed by MongoDB registry.
 */
import {
  checkStakingEligibility,
  getWalletStakingSummary,
  DEFAULT_MIN_ACTIVE_STAKE_AMOUNT,
  DEFAULT_STAKING_MINT,
  DEFAULT_STAKING_DECIMALS,
  humanToRawAmount,
} from '../services/streamflowStakingService.js';

export {
  DEFAULT_MIN_ACTIVE_STAKE_AMOUNT,
  DEFAULT_STAKING_MINT,
  DEFAULT_STAKING_DECIMALS,
};

/**
 * Active staked SYRA (human-readable) from DB snapshot.
 * @param {string} walletAddress
 * @param {object} [options]
 * @returns {Promise<{ amount: number; amountRaw: string; activeLockCount: number } | null>}
 */
export async function getActiveStakedSyra(walletAddress, options = {}) {
  if (!walletAddress?.trim()) return null;
  try {
    const summary = await getWalletStakingSummary(walletAddress.trim(), {
      mint: options.mint,
      network: options.network,
      decimals: options.decimals,
    });
    return {
      amount: Number(summary.activeStakedAmountFormatted) || 0,
      amountRaw: summary.activeStakedAmountRaw,
      activeLockCount: summary.activeLockCount,
    };
  } catch {
    return null;
  }
}

/**
 * Whether wallet has ≥ minAmount SYRA in active Streamflow locks (default 1M).
 * Prefer this over wallet balance for "staked SYRA" utility gates.
 *
 * @param {string} walletAddress
 * @param {number} [minAmount] - human-readable SYRA (default 1_000_000)
 * @returns {Promise<boolean>}
 */
export async function isActiveStakerEligible(walletAddress, minAmount = DEFAULT_MIN_ACTIVE_STAKE_AMOUNT) {
  if (!walletAddress?.trim()) return false;
  try {
    const result = await checkStakingEligibility(walletAddress.trim(), {
      minAmountFormatted: minAmount,
      mint: DEFAULT_STAKING_MINT,
    });
    return Boolean(result.eligible);
  } catch {
    return false;
  }
}

/**
 * Full eligibility payload for API responses and feature gates.
 */
export async function getStakingEligibility(walletAddress, options = {}) {
  return checkStakingEligibility(walletAddress?.trim() || '', {
    minAmountFormatted: options.minAmount ?? DEFAULT_MIN_ACTIVE_STAKE_AMOUNT,
    minAmountRaw: options.minAmountRaw,
    mint: options.mint ?? DEFAULT_STAKING_MINT,
    network: options.network,
    decimals: options.decimals ?? DEFAULT_STAKING_DECIMALS,
  });
}

/**
 * Raw threshold for comparisons (e.g. 1M SYRA with 6 decimals).
 */
export function minActiveStakeRaw(minHuman = DEFAULT_MIN_ACTIVE_STAKE_AMOUNT, decimals = DEFAULT_STAKING_DECIMALS) {
  return humanToRawAmount(minHuman, decimals)?.toString() ?? '0';
}
