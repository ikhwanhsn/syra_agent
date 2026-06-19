import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewAccentBackground, overviewCardGlow } from "@/components/dashboard/overview/overviewStyles";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";
import {
  walletHeroCard,
  walletKickerClass,
  walletStatHint,
  walletStatLabel,
  walletStatTile,
  walletStatValue,
} from "@/components/wallet/walletPageStyles";

type WalletTreasuryHeroProps = {
  totalUsdc: number | null;
  totalSol: number | null;
  estimatedTreasuryUsd?: number | null;
  solPriceUsd?: number | null;
  chatUsdc?: number | null;
  chatSol?: number | null;
  lpUsdc?: number | null;
  lpSol?: number | null;
  hasLpWallet: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function WalletTreasuryHero({
  totalUsdc,
  totalSol,
  estimatedTreasuryUsd,
  solPriceUsd,
  chatUsdc,
  chatSol,
  lpUsdc,
  lpSol,
  hasLpWallet,
  refreshing,
  onRefresh,
}: WalletTreasuryHeroProps) {
  const heroUsd = estimatedTreasuryUsd ?? totalUsdc;
  const solUsdHint =
    totalSol != null && solPriceUsd != null && solPriceUsd > 0
      ? ` · ${formatSol(totalSol)} SOL ≈ ${formatTreasuryUsd(totalSol * solPriceUsd)}`
      : totalSol != null
        ? ` · ${formatSol(totalSol)} SOL`
        : "";

  return (
    <section className={walletHeroCard} aria-label="Treasury summary">
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("neutral") }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div>
            <p className={walletKickerClass}>Combined operational balance</p>
            <p className="mt-3 font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2.75rem]">
              {formatTreasuryUsd(heroUsd)}
            </p>
            <p className={walletStatHint}>
              {formatTreasuryUsd(totalUsdc)} USDC{solUsdHint}
              {estimatedTreasuryUsd == null && totalUsdc != null ? " · SOL USD estimate unavailable" : ""}
            </p>
          </div>
        </div>

        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 self-start rounded-xl gap-2"
            disabled={refreshing}
            onClick={() => void onRefresh()}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "relative mt-6 grid gap-3",
          hasLpWallet ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        <div className={cn(walletStatTile, "sm:col-span-2 lg:col-span-1")}>
          <p className={walletStatLabel}>Total USDC</p>
          <p className={walletStatValue}>{formatTreasuryUsd(totalUsdc)}</p>
          <p className={walletStatHint}>Stablecoin treasury across agents</p>
        </div>
        <div className={walletStatTile}>
          <p className={walletStatLabel}>Chat agent</p>
          <p className={walletStatValue}>{formatTreasuryUsd(chatUsdc ?? null)}</p>
          <p className={walletStatHint}>
            {chatSol != null ? `${formatSol(chatSol)} SOL` : "— SOL"}
          </p>
        </div>
        {hasLpWallet ? (
          <div className={walletStatTile}>
            <p className={walletStatLabel}>LP agent</p>
            <p className={walletStatValue}>{formatTreasuryUsd(lpUsdc ?? null)}</p>
            <p className={walletStatHint}>
              {lpSol != null ? `${formatSol(lpSol)} SOL` : "— SOL"}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
