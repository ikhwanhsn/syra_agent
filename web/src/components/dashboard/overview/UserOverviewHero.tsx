import type { ReactNode } from "react";
import { LayoutDashboard, Loader2, RefreshCw, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { cn } from "@/lib/utils";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
import { BalanceChangeIndicator } from "@/components/dashboard/overview/BalanceChangeIndicator";
import type { BalanceChangeResult } from "@/lib/treasuryBalanceHistory";

export interface UserOverviewHeroProps {
  walletLabel?: string;
  totalUsd: number | null;
  totalUsdc: number | null;
  totalSol: number | null;
  totalChange?: BalanceChangeResult | null;
  isLoading?: boolean;
  liveSignals?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

function formatUsdcPlain(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function UserOverviewHero({
  walletLabel,
  totalUsd,
  totalUsdc,
  totalSol,
  totalChange,
  isLoading,
  liveSignals,
  onRefresh,
  refreshing,
  className,
}: UserOverviewHeroProps) {
  const primaryValue =
    totalUsd != null && totalUsd > 0
      ? totalUsd
      : totalUsdc != null
        ? totalUsdc
        : null;
  const primaryFormat =
    totalUsd != null && totalUsd > 0 ? formatCompactUsd : (n: number) => `$${formatUsdcPlain(n)}`;

  return (
    <div
      className={cn(
        overviewCardShell,
        "mb-2 overflow-hidden rounded-3xl px-5 py-7 sm:px-8 sm:py-9",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: overviewAccentBackground("marketplace") }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.16) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.16) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -top-16 h-[300px] w-[300px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.14), transparent 68%)" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
            Your portfolio
          </div>
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/55 bg-background/50 shadow-inner backdrop-blur-md">
              <LayoutDashboard className="h-6 w-6 text-foreground" aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Overview
              </h1>
              <p className="mt-1.5 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                {walletLabel ? (
                  <>
                    Balances for{" "}
                    <span className="font-mono text-[13px] text-foreground/90">{walletLabel}</span> — connected
                    wallet, trading agent, and LP treasury.
                  </>
                ) : (
                  "Connect your wallet to see balances, agent treasuries, and live performance."
                )}
              </p>
            </div>
          </div>

          {walletLabel ? (
            <div className="rounded-2xl border border-border/50 bg-background/30 px-4 py-4 backdrop-blur-md sm:max-w-md">
              <p className={overviewKickerClass}>Total assets</p>
              {isLoading ? (
                <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-muted/50" />
              ) : (
                <p className={cn(overviewMetricValueClass, "mt-1")}>
                  <AnimatedMetric value={primaryValue} format={primaryFormat} deltaMode />
                </p>
              )}
              {!isLoading ? <BalanceChangeIndicator change={totalChange} size="md" className="mt-2" /> : null}
              <p className="mt-1.5 text-sm tabular-nums text-muted-foreground">
                {isLoading ? (
                  <span className="inline-block h-4 w-28 animate-pulse rounded bg-muted/40" />
                ) : (
                  <>
                    {totalUsdc != null ? `$${formatUsdcPlain(totalUsdc)} USDC` : "— USDC"}
                    {totalSol != null ? ` · ${formatSol(totalSol)} SOL` : ""}
                  </>
                )}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          {liveSignals ? <div className="flex flex-wrap gap-2">{liveSignals}</div> : null}
          {onRefresh && walletLabel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl gap-2 sm:w-auto"
              disabled={refreshing || isLoading}
              onClick={() => void onRefresh()}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Refresh balances
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function UserOverviewConnectHero({
  onConnect,
  className,
}: {
  onConnect: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        overviewCardShell,
        "mb-2 overflow-hidden rounded-3xl px-5 py-10 sm:px-8 sm:py-12",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: overviewAccentBackground("neutral") }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/55 bg-background/50">
          <Wallet className="h-7 w-7 text-foreground" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Your command center</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Connect a Solana wallet to view your assets, agent treasuries, trading strategies, and LP performance — all in
          one place.
        </p>
        <Button type="button" className="mt-6 rounded-xl px-6" onClick={onConnect}>
          Connect wallet
        </Button>
      </div>
    </div>
  );
}
