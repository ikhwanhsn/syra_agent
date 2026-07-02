import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  tierLabel,
  tierWalletLimitLabel,
  type MultiWalletTierId,
  type MultiWalletTierSummary,
} from "@/lib/multiWalletApi";

interface MultiWalletTierBadgeProps {
  tier: MultiWalletTierSummary | null;
  className?: string;
}

export function MultiWalletTierBadge({ tier, className }: MultiWalletTierBadgeProps) {
  if (!tier) return null;

  const variant =
    tier.tier === "admin" || tier.tier === "whale"
      ? "default"
      : tier.tier === "staker"
        ? "secondary"
        : "outline";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant={variant}>{tierLabel(tier.tier)}</Badge>
      <span className="text-xs text-muted-foreground">
        {tier.activeCount} / {tierWalletLimitLabel(tier.limit)} wallets
      </span>
      {tier.remaining != null && tier.remaining <= 0 ? (
        <span className="text-xs font-medium text-amber-500">Limit reached</span>
      ) : null}
    </div>
  );
}

export function tierUpgradeHint(tier: MultiWalletTierId, summary?: MultiWalletTierSummary | null): string | null {
  if (tier === "basic" && summary?.upgradeHints?.basic) {
    return summary.upgradeHints.basic;
  }
  switch (tier) {
    case "basic":
      return "No $SYRA required — create up to 5 wallets. Stake 1M+ $SYRA to unlock 25, or 10M+ for 100.";
    case "staker":
      return "Stake 10M+ $SYRA to unlock 100 wallets.";
    case "whale":
      return "You have the maximum staker tier (100 wallets).";
    case "admin":
      return "Admin tier — unlimited wallet generation.";
    default:
      return null;
  }
}
