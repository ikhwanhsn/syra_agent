import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Droplets, Loader2, RefreshCw } from "lucide-react";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import {
  feeAprFromDailyRatio,
  fetchSyraMeteoraLpPools,
  formatPercent,
  formatUsdCompact,
  meteoraDeepLink,
  poolPairLabel,
  sortMeteoraPools,
  type MeteoraLpPool,
} from "@/lib/meteoraPoolsApi";
import { cn } from "@/lib/utils";

function SyraPoolCard({ pool }: { pool: MeteoraLpPool }) {
  const apr = feeAprFromDailyRatio(pool.feeTvlRatio);

  return (
    <article className={cn(overviewCardShell, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}>
      <div className="min-w-0 space-y-1">
        <p className="text-lg font-semibold tracking-tight text-foreground">{poolPairLabel(pool)}</p>
        <p className="text-sm text-muted-foreground">
          {formatUsdCompact(pool.tvlUsd)} TVL · {formatUsdCompact(pool.fee24hUsd)} fees (24h)
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Est. APR</p>
          <p className="font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatPercent(apr)}
          </p>
        </div>
        <Button
          asChild
          className="h-10 gap-2 rounded-xl bg-violet-600 px-4 font-medium text-white hover:bg-violet-500"
        >
          <a href={meteoraDeepLink(pool.poolAddress)} target="_blank" rel="noopener noreferrer">
            Add liquidity
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export default function LpPoolsPage() {
  const poolsQ = useQuery({
    queryKey: ["meteora", "pools", "syra"],
    queryFn: fetchSyraMeteoraLpPools,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const pools = useMemo(() => {
    const raw = poolsQ.data?.pools ?? [];
    const active = raw.filter((p) => p.tvlUsd >= 1 || p.fee24hUsd > 0 || p.volume24hUsd > 0);
    return sortMeteoraPools(active.length > 0 ? active : raw, "apr", "desc");
  }, [poolsQ.data?.pools]);

  const bestApr = useMemo(() => {
    if (!pools.length) return 0;
    return Math.max(...pools.map((p) => feeAprFromDailyRatio(p.feeTvlRatio)));
  }, [pools]);

  const totalTvl = useMemo(() => pools.reduce((sum, p) => sum + p.tvlUsd, 0), [pools]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative flex flex-1 flex-col",
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
        )}
      >
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <header className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Droplets className="h-3.5 w-3.5 text-violet-500" aria-hidden />
              Meteora · SYRA pools
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Provide SYRA liquidity
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              Earn trading fees by adding liquidity to SYRA pools on Meteora. APR is estimated from the last
              24 hours and is not guaranteed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg"
                onClick={() => void poolsQ.refetch()}
                disabled={poolsQ.isFetching}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", poolsQ.isFetching && "animate-spin")} aria-hidden />
                Refresh
              </Button>
            </div>
          </header>

          {poolsQ.isLoading ? (
            <LoadingState />
          ) : poolsQ.isError ? (
            <div className={cn(overviewCardShell, "p-6 text-center")}>
              <p className="text-sm font-medium text-destructive">Could not load SYRA pools.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void poolsQ.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : pools.length === 0 ? (
            <div className={cn(overviewCardShell, "p-8 text-center")}>
              <p className="text-sm font-medium text-foreground">No SYRA pools found on Meteora right now.</p>
              <p className="mt-1 text-xs text-muted-foreground">Check back later or refresh the list.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={cn(overviewCardShell, "px-3 py-4")}>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pools</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{pools.length}</p>
                </div>
                <div className={cn(overviewCardShell, "px-3 py-4")}>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total TVL</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{formatUsdCompact(totalTvl)}</p>
                </div>
                <div className={cn(overviewCardShell, "px-3 py-4")}>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Best APR</p>
                  <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatPercent(bestApr)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {poolsQ.isFetching && !poolsQ.isLoading ? (
                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Updating…
                  </p>
                ) : null}
                {pools.map((pool) => (
                  <SyraPoolCard key={pool.poolAddress} pool={pool} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
