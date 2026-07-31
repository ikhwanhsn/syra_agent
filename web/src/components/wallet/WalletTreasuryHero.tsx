import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewAccentBackground, overviewCardGlow } from "@/components/dashboard/overview/overviewStyles";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";
import {
  walletHeroCard,
  walletHeroValue,
  walletStatHint,
  walletStatTile,
  walletStatValue,
} from "@/components/wallet/walletPageStyles";

type WalletBreakdown = {
  label: string;
  usdc: number | null;
  sol: number | null;
};

type WalletTreasuryHeroProps = {
  totalUsdc: number | null;
  totalSol: number | null;
  estimatedTreasuryUsd?: number | null;
  solPriceUsd?: number | null;
  chatUsdc?: number | null;
  chatSol?: number | null;
  earnUsdc?: number | null;
  earnSol?: number | null;
  /** @deprecated Use earnUsdc */
  lpUsdc?: number | null;
  /** @deprecated Use earnSol */
  lpSol?: number | null;
  hasEarnWallet?: boolean;
  /** @deprecated Use hasEarnWallet */
  hasLpWallet?: boolean;
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
  earnUsdc,
  earnSol,
  lpUsdc,
  lpSol,
  hasEarnWallet,
  hasLpWallet,
  refreshing,
  onRefresh,
}: WalletTreasuryHeroProps) {
  const heroUsd = estimatedTreasuryUsd ?? totalUsdc;
  const showEarn = hasEarnWallet ?? hasLpWallet ?? false;
  const earnUsdcResolved = earnUsdc ?? lpUsdc ?? null;
  const earnSolResolved = earnSol ?? lpSol ?? null;

  const breakdowns: WalletBreakdown[] = [
    { label: "Spend", usdc: chatUsdc ?? null, sol: chatSol ?? null },
    ...(showEarn ? [{ label: "Earn", usdc: earnUsdcResolved, sol: earnSolResolved }] : []),
  ];

  const solLine =
    totalSol != null && solPriceUsd != null && solPriceUsd > 0
      ? `${formatSol(totalSol)} SOL`
      : totalSol != null
        ? `${formatSol(totalSol)} SOL`
        : null;

  return (
    <section className={walletHeroCard} aria-label="Treasury summary">
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("neutral") }}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={walletHeroValue}>{formatTreasuryUsd(heroUsd)}</p>
            <p className={walletStatHint}>
              {formatTreasuryUsd(totalUsdc)} USDC
              {solLine ? ` · ${solLine}` : ""}
            </p>
          </div>

          {onRefresh ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
              disabled={refreshing}
              aria-label="Refresh balances"
              onClick={() => void onRefresh()}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
            </Button>
          ) : null}
        </div>

        {breakdowns.length > 0 ? (
          <div
            className={cn(
              "mt-5 grid gap-2.5",
              breakdowns.length > 1 ? "sm:grid-cols-2" : "sm:max-w-xs",
            )}
          >
            {breakdowns.map((item) => (
              <div key={item.label} className={walletStatTile}>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className={walletStatValue}>{formatTreasuryUsd(item.usdc)}</p>
                <p className={walletStatHint}>
                  {item.sol != null ? `${formatSol(item.sol)} SOL` : ", SOL"}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
