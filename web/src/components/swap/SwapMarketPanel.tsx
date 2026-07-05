import { useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import {
  assetPathFromQuery,
  fetchMintChart,
  fetchSwapMarketNews,
  type TokensDossierPayload,
} from "@/lib/tokensDossierApi";
import { TokensOhlcvChart } from "@/components/dossier/TokensOhlcvChart";
import { AssetNewsList } from "@/components/assets/intelligence/AssetNewsList";
import { AssetEventsList } from "@/components/assets/intelligence/AssetEventsList";
import { SwapTokenLogo } from "@/components/swap/SwapTokenLogo";
import type { SelectedSwapToken } from "@/components/swap/TokenSelectDialog";

type FocusSide = "output" | "input";

function formatPriceUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return formatCompactUsd(n);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 6,
  }).format(n);
}

function MetricTile({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 font-mono text-base font-semibold tabular-nums sm:text-lg",
          valueClassName,
        )}
      >
        {value}
        {icon}
      </p>
    </div>
  );
}

function resolveChartStats(data: TokensDossierPayload | undefined) {
  const asset = data?.asset;
  const stats = asset?.stats;
  const canonical = asset?.canonicalMarket;
  const candles = data?.ohlcv.candles ?? [];
  const lastClose = candles.length > 0 ? candles[candles.length - 1]?.close : undefined;
  const dayAgo = candles.length > 0 ? candles[Math.max(0, candles.length - 24)]?.close : undefined;
  const candleChange24 =
    lastClose != null && dayAgo != null && dayAgo > 0
      ? ((lastClose - dayAgo) / dayAgo) * 100
      : undefined;

  return {
    price: stats?.price ?? canonical?.price ?? lastClose,
    change24: stats?.priceChange24hPercent ?? candleChange24,
    marketCap: stats?.marketCap ?? canonical?.marketCap,
    volume24: stats?.volume24hUSD ?? canonical?.volume24hUSD,
    assetId: data?.assetId,
  };
}

export function SwapMarketPanel({
  inputToken,
  outputToken,
  className,
}: {
  inputToken: SelectedSwapToken;
  outputToken: SelectedSwapToken;
  className?: string;
}) {
  const [focusSide, setFocusSide] = useState<FocusSide>("output");
  const focusToken = focusSide === "output" ? outputToken : inputToken;

  const chartQ = useQuery({
    queryKey: ["swap-market-chart", focusToken.mint],
    queryFn: ({ signal }) => fetchMintChart(focusToken.mint, { signal }),
    enabled: Boolean(focusToken.mint),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const feedQ = useQuery({
    queryKey: ["swap-market-feed", focusToken.mint, focusToken.symbol, focusToken.name],
    queryFn: ({ signal }) =>
      fetchSwapMarketNews(
        {
          mint: focusToken.mint,
          symbol: focusToken.symbol,
          name: focusToken.name,
        },
        { signal },
      ),
    enabled: Boolean(focusToken.mint),
    staleTime: 90_000,
    gcTime: 10 * 60_000,
    retry: 0,
    placeholderData: keepPreviousData,
  });

  const stats = resolveChartStats(chartQ.data);
  // Always prefer Jupiter/swap logo — dossier images are often missing or wrong.
  const displaySymbol = focusToken.symbol;
  const displayName = focusToken.name || focusToken.symbol;
  const displayIcon = focusToken.icon;
  const change24 = stats.change24;
  const detailPath = useMemo(
    () =>
      stats.assetId
        ? assetPathFromQuery({ assetId: stats.assetId })
        : assetPathFromQuery({ mint: focusToken.mint }),
    [focusToken.mint, stats.assetId],
  );

  const feedError =
    feedQ.isError
      ? feedQ.error instanceof Error
        ? feedQ.error.message
        : "Market feed could not be loaded."
      : undefined;

  const newsBlock = feedQ.data?.news ?? {
    ok: false,
    items: [],
    error: feedError,
  };

  const eventsBlock = feedQ.data?.events ?? {
    ok: false,
    items: [],
    error: feedError,
  };

  const candles = chartQ.data?.ohlcv.candles ?? [];
  const chartReady = candles.length >= 2;
  const showChartSkeleton = chartQ.isPending && !chartQ.data;
  const showFeedSkeleton = feedQ.isPending && !feedQ.data;
  const metricsLoading = showChartSkeleton;

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      <Card className={overviewCardShell}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <SwapTokenLogo
                mint={focusToken.mint}
                symbol={displaySymbol}
                icon={displayIcon}
                size="lg"
              />
              <div className="min-w-0">
                <p className={overviewKickerClass}>Market</p>
                <CardTitle className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {displayName}
                </CardTitle>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">
                  {displaySymbol}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-border/50 bg-muted/20 p-1">
                {(
                  [
                    { side: "output" as const, token: outputToken, label: "Buy" },
                    { side: "input" as const, token: inputToken, label: "Sell" },
                  ] as const
                ).map(({ side, token, label }) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setFocusSide(side)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      focusSide === side
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label} {token.symbol}
                  </button>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <Link to={detailPath}>
                  Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metricsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] rounded-xl" />
              ))
            ) : (
              <>
                <MetricTile
                  label="Price"
                  value={stats.price != null ? formatPriceUsd(stats.price) : "—"}
                />
                <MetricTile
                  label="24h"
                  value={change24 != null ? formatPct(change24) : "—"}
                  valueClassName={
                    change24 != null
                      ? change24 >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                      : undefined
                  }
                  icon={
                    change24 != null ? (
                      change24 >= 0 ? (
                        <TrendingUp className="h-4 w-4 opacity-70" />
                      ) : (
                        <TrendingDown className="h-4 w-4 opacity-70" />
                      )
                    ) : null
                  }
                />
                <MetricTile
                  label="Market cap"
                  value={formatCompactUsd(stats.marketCap)}
                />
                <MetricTile
                  label="24h volume"
                  value={formatCompactUsd(stats.volume24)}
                />
              </>
            )}
          </div>

          {showChartSkeleton ? (
            <Skeleton className="h-[280px] w-full rounded-xl sm:h-[320px]" />
          ) : chartQ.isError && !chartQ.data ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/15 px-4 text-center sm:h-[320px]">
              <p className="text-sm text-muted-foreground">
                {chartQ.error instanceof Error
                  ? chartQ.error.message
                  : "Could not load chart for this token."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void chartQ.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : chartReady ? (
            <TokensOhlcvChart
              candles={candles}
              symbol={displaySymbol}
              intervalLabel={chartQ.data?.ohlcv.interval || "1H"}
              height={320}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-border/45 bg-background/25 text-sm text-muted-foreground sm:h-[320px]">
              {chartQ.data?.ohlcv.error?.trim() ||
                "No chart data available for this token yet."}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {showFeedSkeleton ? (
          <>
            <Card className={overviewCardShell}>
              <CardHeader className="pb-3">
                <Skeleton className="mb-2 h-5 w-16 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 border-b border-border/40 pb-3 last:border-0">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className={overviewCardShell}>
              <CardHeader className="pb-3">
                <Skeleton className="mb-2 h-5 w-16 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 border-b border-border/40 pb-3 last:border-0">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <AssetNewsList news={newsBlock} />
            <AssetEventsList events={eventsBlock} />
          </>
        )}
      </div>
    </div>
  );
}
