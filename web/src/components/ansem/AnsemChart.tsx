import { useMemo, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TokensOhlcvChart } from "@/components/dossier/TokensOhlcvChart";
import { PumpfunPriceChart } from "@/components/chat/PumpfunPriceChart";
import {
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { ANSEM, ANSEM_LOGO_URL } from "@/lib/ansem";
import type { AnsemMarketSnapshot } from "@/lib/ansemMarketApi";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import { fetchMintChart } from "@/lib/tokensDossierApi";
import { useDelayedMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { cn } from "@/lib/utils";

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

function chartSourceLabel(source: string | undefined): string | null {
  if (!source || source === "tokens.xyz") return null;
  const labels: Record<string, string> = {
    pumpfun: "pump.fun",
    coingecko: "CoinGecko",
    binance: "Binance",
    geckoterminal: "GeckoTerminal",
    dexscreener: "DexScreener",
  };
  return labels[source] ?? source;
}

export function AnsemChart({
  market,
  isLoading: marketLoading,
  className,
}: {
  market?: AnsemMarketSnapshot;
  isLoading?: boolean;
  className?: string;
}) {
  const symbol = market?.symbol ?? ANSEM.symbol;
  const name = market?.name ?? ANSEM.name;
  const imageUrl = market?.imageUrl ?? ANSEM_LOGO_URL;

  const chartQ = useQuery({
    queryKey: ["ansem-chart", ANSEM.mint],
    queryFn: ({ signal }) => fetchMintChart(ANSEM.mint, { signal }),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const candles = chartQ.data?.ohlcv.candles ?? [];
  const chartReady = candles.length >= 2;

  const chartLoadingActive =
    chartQ.isFetching && (!chartQ.data || chartQ.isPlaceholderData);
  const showChartSkeleton = useDelayedMinimumSkeleton(chartLoadingActive);
  const chartStale = chartLoadingActive && chartQ.isPlaceholderData;

  const stats = useMemo(() => {
    const lastClose = candles.length > 0 ? candles[candles.length - 1]?.close : undefined;
    const dayAgo = candles.length > 0 ? candles[Math.max(0, candles.length - 24)]?.close : undefined;
    const candleChange24 =
      lastClose != null && dayAgo != null && dayAgo > 0
        ? ((lastClose - dayAgo) / dayAgo) * 100
        : undefined;

    return {
      price: market?.priceUsd ?? lastClose,
      change24: market?.priceChange24hPercent ?? candleChange24,
      marketCap: market?.marketCapUsd,
      volume24: market?.volume24hUsd,
    };
  }, [candles, market]);

  const change24 = stats.change24;
  const chartSource = chartSourceLabel(chartQ.data?.ohlcv.source);
  const metricsLoading = marketLoading || showChartSkeleton;

  if (marketLoading && !market) {
    return (
      <section className={cn("min-w-0", className)}>
        <Card className={overviewCardShell}>
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[280px] w-full rounded-xl sm:h-[380px]" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0", className)}>
      <Card className={overviewCardShell}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <img
                src={imageUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-2xl border border-border/50 object-cover shadow-sm sm:h-14 sm:w-14"
              />
              <div className="min-w-0">
                <p className={overviewKickerClass}>Market</p>
                <CardTitle className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {name}
                </CardTitle>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">${symbol}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div
            className={cn(
              "grid grid-cols-2 gap-3 sm:grid-cols-4",
              chartStale && !metricsLoading && "opacity-50 transition-opacity duration-200",
            )}
          >
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
                <MetricTile label="Market cap" value={formatCompactUsd(stats.marketCap)} />
                <MetricTile label="24h volume" value={formatCompactUsd(stats.volume24)} />
              </>
            )}
          </div>

          {showChartSkeleton ? (
            <Skeleton className="h-[280px] w-full rounded-xl sm:h-[380px]" />
          ) : chartReady ? (
            <div
              className={cn(
                "space-y-2",
                chartStale && "opacity-50 transition-opacity duration-200",
              )}
            >
              {chartSource ? (
                <p className="text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  Chart · {chartSource}
                </p>
              ) : null}
              <TokensOhlcvChart
                candles={candles}
                symbol={symbol}
                intervalLabel={chartQ.data?.ohlcv.interval || "1H"}
                height={380}
              />
            </div>
          ) : chartQ.isError && !chartQ.data ? (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-muted/15 px-4 text-center sm:h-[380px]">
              <p className="text-sm text-muted-foreground">
                {chartQ.error instanceof Error
                  ? chartQ.error.message
                  : "Could not load chart for this token."}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void chartQ.refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {chartQ.data?.ohlcv.error?.trim() ? (
                <p className="text-center text-xs text-muted-foreground">
                  {chartQ.data.ohlcv.error.trim()}
                </p>
              ) : null}
              <div className="overflow-hidden rounded-xl border border-border/50">
                <PumpfunPriceChart
                  mint={ANSEM.mint}
                  title={symbol}
                  variant="terminal"
                  source="pump.fun"
                  defaultRange="1W"
                  chartHeight={380}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
