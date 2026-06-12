import { useEffect, useId, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  bestLiveVenue,
  formatSpread,
  formatUsd,
  type SpcxIntelligenceReport,
  type SpreadHistoryPoint,
} from "@/lib/spcxApi";
import { spcxCardClass, spcxKickerClass } from "@/components/spcx/spcxStyles";

function formatUpdatedAgo(computedAt: string | undefined): string {
  if (!computedAt) return "—";
  const ts = new Date(computedAt).getTime();
  if (!Number.isFinite(ts)) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SpcxLivePriceChart({
  report,
  data,
  refreshing,
}: {
  report: SpcxIntelligenceReport;
  data: SpreadHistoryPoint[];
  refreshing?: boolean;
}) {
  const nasdaqGradientId = useId().replace(/:/g, "");
  const liveVenue = bestLiveVenue(report);
  const hasEnough = data.length >= 2;

  const [updatedAgo, setUpdatedAgo] = useState(() => formatUpdatedAgo(report.computedAt));

  useEffect(() => {
    setUpdatedAgo(formatUpdatedAgo(report.computedAt));
    const id = setInterval(() => setUpdatedAgo(formatUpdatedAgo(report.computedAt)), 1000);
    return () => clearInterval(id);
  }, [report.computedAt]);

  const chartConfig = useMemo(
    () =>
      ({
        nasdaq: { label: "Nasdaq SPCX", color: "hsl(var(--primary))" },
        onchain: { label: liveVenue?.symbol ?? "SPCXx", color: "hsl(142 76% 36%)" },
      }) satisfies ChartConfig,
    [liveVenue?.symbol],
  );

  const spreadPct = liveVenue?.spreadPct ?? null;

  return (
    <div className={cn(spcxCardClass, "overflow-hidden")}>
      <div className="flex flex-col gap-4 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={spcxKickerClass}>Live prices</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60",
                    refreshing ? "animate-ping" : "",
                  )}
                />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                {refreshing ? "Updating…" : `Updated ${updatedAgo}`}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div>
              <p className="text-[11px] text-muted-foreground">Nasdaq · {report.nasdaqTicker}</p>
              <p className="font-display text-2xl font-semibold tabular-nums tracking-tight sm:text-[1.75rem]">
                {report.nasdaqPriceUsd != null ? formatUsd(report.nasdaqPriceUsd) : "—"}
              </p>
            </div>
            {liveVenue?.priceUsd != null ? (
              <div>
                <p className="text-[11px] text-muted-foreground">{liveVenue.symbol} on Solana</p>
                <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-[1.75rem]">
                  {formatUsd(liveVenue.priceUsd)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
        {spreadPct != null ? (
          <div className="shrink-0 rounded-xl border border-border/45 bg-muted/[0.06] px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spread</p>
            <p
              className={cn(
                "font-mono text-lg font-semibold tabular-nums",
                Math.abs(spreadPct) > 3 ? "text-amber-600 dark:text-amber-400" : "text-foreground",
              )}
            >
              {formatSpread(spreadPct)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="px-2 pb-3 pt-2 sm:px-3">
        {!hasEnough ? (
          <div className="flex h-[200px] items-center justify-center rounded-xl bg-muted/[0.04] text-sm text-muted-foreground">
            Chart fills in as live prices update…
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full sm:h-[220px]">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={nasdaqGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-nasdaq)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-nasdaq)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={32}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
                domain={["auto", "auto"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono tabular-nums">${Number(value).toFixed(2)}</span>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="nasdaq"
                stroke="var(--color-nasdaq)"
                strokeWidth={2}
                fill={`url(#${nasdaqGradientId})`}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="onchain"
                stroke="var(--color-onchain)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
