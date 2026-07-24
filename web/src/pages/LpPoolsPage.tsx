import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Droplets, RefreshCw } from "lucide-react";
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

const POOLS_SKELETON_MIN_MS = 450;

/** Keep skeleton visible for at least `minMs` so fast responses do not flash. */
function useMinimumSkeleton(active: boolean, minMs = POOLS_SKELETON_MIN_MS): boolean {
  const [visible, setVisible] = useState(active);
  const loadStartedAt = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    if (active) {
      loadStartedAt.current = Date.now();
      setVisible(true);
      return;
    }

    const started = loadStartedAt.current;
    if (started == null) {
      setVisible(false);
      return;
    }

    const remaining = minMs - (Date.now() - started);
    if (remaining <= 0) {
      loadStartedAt.current = null;
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      loadStartedAt.current = null;
      setVisible(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [active, minMs]);

  return visible;
}

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

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[4.5rem] w-full rounded-2xl" />
      ))}
    </div>
  );
}

function PoolCardSkeleton() {
  return (
    <div className={cn(overviewCardShell, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between")}>
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-44 max-w-full" />
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="space-y-1.5 text-right">
          <Skeleton className="ml-auto h-3 w-12" />
          <Skeleton className="ml-auto h-6 w-16" />
        </div>
        <Skeleton className="h-10 w-[8.5rem] rounded-xl" />
      </div>
    </div>
  );
}

function PoolsContentSkeleton({ poolCount = 3 }: { poolCount?: number }) {
  return (
    <div className="animate-in fade-in duration-300 space-y-8">
      <StatsSkeleton />
      <div className="space-y-3">
        {Array.from({ length: poolCount }).map((_, i) => (
          <PoolCardSkeleton key={i} />
        ))}
      </div>
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
    return sortMeteoraPools(raw, "apr", "desc");
  }, [poolsQ.data?.pools]);

  const bestApr = useMemo(() => {
    if (!pools.length) return 0;
    return Math.max(...pools.map((p) => feeAprFromDailyRatio(p.feeTvlRatio)));
  }, [pools]);

  const totalTvl = useMemo(() => pools.reduce((sum, p) => sum + p.tvlUsd, 0), [pools]);

  const isInitialLoad = poolsQ.isLoading && !poolsQ.data;
  const showSkeleton = useMinimumSkeleton(isInitialLoad);

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
          <header className="relative space-y-3 pr-10 text-center sm:pr-12">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              disabled={poolsQ.isFetching}
              aria-label="Refresh pools"
              onClick={() => void poolsQ.refetch()}
            >
              <RefreshCw className={cn("h-4 w-4", poolsQ.isFetching && "animate-spin")} aria-hidden />
            </Button>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Droplets className="h-3.5 w-3.5 text-violet-500" aria-hidden />
              Meteora · SYRA pools
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Provide SYRA liquidity
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              Earn trading fees by adding liquidity to SYRA pools on Meteora. All listed pools are
              shown — APR is estimated from the last 24 hours and is not guaranteed.
            </p>
          </header>

          {showSkeleton ? (
            <PoolsContentSkeleton poolCount={Math.max(pools.length, 3)} />
          ) : poolsQ.isError ? (
            <div className={cn(overviewCardShell, "animate-in fade-in duration-300 p-6 text-center")}>
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
            <div className={cn(overviewCardShell, "animate-in fade-in duration-300 p-8 text-center")}>
              <p className="text-sm font-medium text-foreground">No SYRA pools found on Meteora right now.</p>
              <p className="mt-1 text-xs text-muted-foreground">Check back later or refresh the list.</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 space-y-8">
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
                {pools.map((pool) => (
                  <SyraPoolCard key={pool.poolAddress} pool={pool} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
