import { useId, useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { formatExperimentPct, type EquityHistoryPoint } from "@/lib/experimentEquityHistory";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
  overviewMetricValueClass,
  type OverviewAccent,
} from "@/components/dashboard/overview/overviewStyles";

const trendConfig = {
  value: { label: "Balance", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export interface ExperimentAgentBalancePanelProps {
  /** e.g. "Pump.fun", "LP lab", "Trading lab" */
  platformLabel: string;
  /** e.g. "10 SOL paper agent", "$1,000 paper agent", "Best cross-CEX spread" */
  bankLabel: string;
  strategyLabel: string;
  startBalance: number;
  currentBalance: number;
  retPct: number;
  closedCount: number;
  openCount: number;
  historyPoints: EquityHistoryPoint[];
  formatBalance: (n: number) => string;
  formatAxis: (n: number) => string;
  startBalanceLabel?: string;
  closedStatLabel?: string;
  openStatLabel?: string;
  /** Defaults to ` trades` */
  closedStatSuffix?: string;
  /** Defaults to ` position` / ` positions` */
  openStatSuffix?: string | null;
  accent?: OverviewAccent;
  className?: string;
}

export function ExperimentAgentBalancePanel({
  platformLabel,
  bankLabel,
  strategyLabel,
  startBalance,
  currentBalance,
  retPct,
  closedCount,
  openCount,
  historyPoints,
  formatBalance,
  formatAxis,
  startBalanceLabel,
  closedStatLabel = "Completed",
  openStatLabel = "Open",
  closedStatSuffix = " trades",
  openStatSuffix,
  accent = "experiment",
  className,
}: ExperimentAgentBalancePanelProps) {
  const gradientId = useId().replace(/:/g, "");

  const trendData = useMemo(() => {
    const points = historyPoints.map((p) => ({ label: p.label, value: p.value, at: p.at }));
    if (points.length < 2) {
      return [
        { label: "Start", value: startBalance, at: Date.now() - 3_600_000 },
        { label: "Now", value: currentBalance, at: Date.now() },
      ];
    }
    const last = points[points.length - 1];
    if (Math.abs(last.value - currentBalance) > 1e-6) {
      points.push({ label: "Now", value: currentBalance, at: Date.now() });
    }
    return points.slice(-32);
  }, [historyPoints, startBalance, currentBalance]);

  const showTrend = trendData.length >= 2;
  const positive = retPct > 0;
  const negative = retPct < 0;
  const startedWith = startBalanceLabel ?? formatBalance(startBalance);
  const openSuffix =
    openStatSuffix === null
      ? ""
      : openStatSuffix ?? ` position${openCount === 1 ? "" : "s"}`;

  return (
    <article
      id="agent-balance-chart"
      className={cn(overviewCardShell, "shrink-0 overflow-hidden", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.42]"
        style={{ background: overviewAccentBackground(accent) }}
        aria-hidden
      />
      <div className="relative flex flex-col">
        <div className="border-b border-border/45 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className={overviewKickerClass}>
                {bankLabel} · {platformLabel}
              </p>
              <p className={cn(overviewMetricValueClass, "mt-1 text-3xl sm:text-[2rem]")}>
                {formatBalance(currentBalance)}
              </p>
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 font-mono text-xs tabular-nums",
                  positive && "text-emerald-600 dark:text-emerald-400",
                  negative && "text-red-600 dark:text-red-400",
                  !positive && !negative && "text-muted-foreground",
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                ) : negative ? (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                ) : null}
                <span>{formatExperimentPct(retPct)}</span>
                <span className="font-sans font-normal text-muted-foreground">· started with {startedWith}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{strategyLabel}</p>
            </div>

            <div className="flex min-w-0 flex-wrap gap-2 lg:max-w-md lg:justify-end">
              <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2 backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{closedStatLabel}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {closedCount}
                  {closedStatSuffix}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2 backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{openStatLabel}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                  {openCount}
                  {openSuffix}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 py-4 sm:px-7 sm:py-5">
          {showTrend ? (
            <div className={cn(overviewChartPanelShell, "p-3 sm:p-4")}>
              <div className={overviewChartTopShine} aria-hidden />
              <ChartContainer config={trendConfig} className="h-[220px] w-full shrink-0 aspect-auto sm:h-[240px]">
                <AreaChart data={trendData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/35" />
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
                    width={52}
                    tick={{ fontSize: 10 }}
                    tickFormatter={formatAxis}
                    domain={["auto", "auto"]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono tabular-nums">{formatBalance(Number(value))}</span>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2.5}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-value)" }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex h-[220px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 text-center sm:h-[240px]">
              <p className="text-sm text-muted-foreground">Balance history builds as trades complete.</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
