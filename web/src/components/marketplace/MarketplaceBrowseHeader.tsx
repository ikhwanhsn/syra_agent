import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceRegisterButton } from "@/components/marketplace/MarketplaceRegisterButton";
import {
  MARKETPLACE_FILTER_DESCRIPTIONS,
  MARKETPLACE_FILTER_LABELS,
  type MarketplaceFilter,
} from "@/lib/marketplaceCatalog";
import {
  playgroundSearchClass,
  playgroundSegmentedRoot,
  playgroundSegmentedTrigger,
  playgroundWalletChipClass,
} from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type TierFilter = MarketplaceFilter;

interface MarketplaceBrowseHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeTier: TierFilter;
  onTierChange: (tier: TierFilter) => void;
  showingCount: number;
  catalogLive: boolean;
  walletConnected?: boolean;
  walletBalance?: string;
  onConnectWallet?: () => void;
}

const TIER_ORDER: TierFilter[] = ["core", "partner", "all"];

const TIER_SHORT_LABELS: Record<TierFilter, string> = {
  core: "Core",
  partner: "Partners",
  all: "All",
};

export function MarketplaceBrowseHeader({
  search,
  onSearchChange,
  activeTier,
  onTierChange,
  showingCount,
  catalogLive,
  walletConnected,
  walletBalance,
  onConnectWallet,
}: MarketplaceBrowseHeaderProps) {
  const tierDescription = MARKETPLACE_FILTER_DESCRIPTIONS[activeTier];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {activeTier === "core" ? "Syra Core APIs" : MARKETPLACE_FILTER_LABELS[activeTier]}
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">{showingCount} APIs</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                catalogLive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground",
              )}
            >
              {catalogLive ? "Live" : "Cached"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{tierDescription}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {walletConnected ? (
            <span className={playgroundWalletChipClass}>
              <Wallet className="h-4 w-4 text-primary" aria-hidden />
              {walletBalance || "0 USDC"}
            </span>
          ) : onConnectWallet ? (
            <Button
              variant="default"
              size="sm"
              className="h-9 rounded-xl px-3.5"
              onClick={onConnectWallet}
            >
              <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
              Connect
            </Button>
          ) : null}
          <MarketplaceRegisterButton variant="outline" />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or path…"
            className={playgroundSearchClass}
            aria-label="Search API catalog"
          />
        </div>

        <div
          className={cn(
            playgroundSegmentedRoot(TIER_ORDER.length),
            "h-11 w-full shrink-0 sm:w-auto sm:min-w-[13rem]",
          )}
          role="group"
          aria-label="Filter by API tier"
        >
          {TIER_ORDER.map((tier) => {
            const active = activeTier === tier;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onTierChange(tier)}
                className={cn(playgroundSegmentedTrigger(active), "min-h-9 px-2 text-xs sm:text-sm")}
              >
                {TIER_SHORT_LABELS[tier]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
