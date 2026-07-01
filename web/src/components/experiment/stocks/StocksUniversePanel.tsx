import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatStocksUsd } from "@/lib/stocksExperimentApi";
import type { StocksUniverseEntry } from "@/lib/stocksExperimentApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface StocksUniversePanelProps {
  universe: StocksUniverseEntry[];
  loading?: boolean;
  className?: string;
}

export function StocksUniversePanel({ universe, loading, className }: StocksUniversePanelProps) {
  if (loading && universe.length === 0) {
    return (
      <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "rounded-2xl p-4")}>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-6 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (universe.length === 0) {
    return (
      <div
        className={cn(
          overviewCardShell,
          "rounded-2xl px-6 py-10 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        No tradeable xStocks in universe. Check mint configuration.
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {universe.map((entry) => {
        const spread =
          entry.priceUsd && entry.nasdaqPriceUsd && entry.nasdaqPriceUsd > 0
            ? Math.abs((entry.priceUsd / entry.nasdaqPriceUsd - 1) * 100)
            : null;

        return (
          <div
            key={entry.symbol}
            className={cn(
              overviewCardShell,
              "rounded-2xl p-4 transition-[border-color] duration-200 hover:border-border/70",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold tracking-tight text-foreground">{entry.symbol}</p>
                <p className="text-xs text-muted-foreground">{entry.name}</p>
              </div>
              {entry.nasdaqTicker ? (
                <Badge variant="outline" className="rounded-md text-[10px] font-normal">
                  {entry.nasdaqTicker}
                </Badge>
              ) : null}
            </div>
            <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-foreground">
              {entry.priceUsd != null ? formatStocksUsd(entry.priceUsd) : "—"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {entry.priceSource ?? "—"}
              {spread != null ? ` · ${spread.toFixed(2)}% vs Nasdaq` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
