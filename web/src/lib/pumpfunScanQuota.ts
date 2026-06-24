import type { MemecoinAnalysisQuota } from "@/lib/pumpfunAnalysisApi";

export const PUMPFUN_SCAN_TIER_LIMITS = {
  free: 3,
  staker: 15,
} as const;

export const PUMPFUN_SCAN_STAKE_THRESHOLDS = {
  staker: "1M+",
  unlimited: "10M+",
} as const;

export const PUMPFUN_SCAN_TIER_SUMMARY =
  `${PUMPFUN_SCAN_TIER_LIMITS.free}/day free · ${PUMPFUN_SCAN_TIER_LIMITS.staker}/day with ${PUMPFUN_SCAN_STAKE_THRESHOLDS.staker} $SYRA staked · unlimited with ${PUMPFUN_SCAN_STAKE_THRESHOLDS.unlimited} $SYRA staked`;

export function isPumpfunScanUnlimitedTier(tier: string | undefined): boolean {
  return tier === "bypass" || tier === "unlimited";
}

export function tierUpgradeHint(tier: string | undefined): string | null {
  switch (tier) {
    case "free":
    case "holder":
      return `Stake ${PUMPFUN_SCAN_STAKE_THRESHOLDS.staker} $SYRA for ${PUMPFUN_SCAN_TIER_LIMITS.staker} scans/day, or ${PUMPFUN_SCAN_STAKE_THRESHOLDS.unlimited} $SYRA staked for unlimited.`;
    case "staker":
      return `Stake ${PUMPFUN_SCAN_STAKE_THRESHOLDS.unlimited} $SYRA for unlimited scans/day.`;
    default:
      return null;
  }
}

export function tierLabel(tier: string | undefined): string {
  switch (tier) {
    case "staker":
      return `${PUMPFUN_SCAN_STAKE_THRESHOLDS.staker} staked`;
    case "unlimited":
      return "Unlimited";
    case "bypass":
      return "Unlimited";
    case "holder":
      return "Free";
    case "locked":
      return "Wallet required";
    default:
      return "Free";
  }
}

export function formatQuotaResetHint(resetAt: string | undefined): string {
  if (!resetAt) return "Resets midnight UTC";
  try {
    return `Resets ${new Date(resetAt).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })}`;
  } catch {
    return "Resets midnight UTC";
  }
}

export function isPumpfunScanLimitReached(quota: MemecoinAnalysisQuota | undefined): boolean {
  if (!quota) return false;
  if (isPumpfunScanUnlimitedTier(quota.tier)) return false;
  return quota.limit > 0 && quota.remaining <= 0;
}
