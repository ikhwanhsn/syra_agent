import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { BalanceChangeIndicator } from "@/components/dashboard/overview/BalanceChangeIndicator";
import type { BalanceChangeResult } from "@/lib/treasuryBalanceHistory";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";

export interface TreasuryAllocationInput {
  userUsdc: number | null;
  userSol: number | null;
  chatUsdc: number | null;
  chatSol: number | null;
  lpUsdc: number | null;
  lpSol: number | null;
  solPriceUsd?: number | null;
  totalUsd?: number | null;
  totalUsdc?: number | null;
  totalSol?: number | null;
}

const allocationConfig = {
  wallet: { label: "Connected wallet", color: "hsl(262 83% 58%)" },
  trading: { label: "Trading agent", color: "hsl(var(--primary))" },
  lp: { label: "LP agent", color: "hsl(187 85% 43%)" },
} satisfies ChartConfig;

const trendConfig = {
  value: { label: "Total", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

function segmentUsd(usdc: number | null, sol: number | null, solPriceUsd: number | null | undefined): number {
  const u = usdc ?? 0;
  const s = sol ?? 0;
  const px = solPriceUsd != null && solPriceUsd > 0 ? solPriceUsd : 0;
  return u + s * px;
}

function formatUsdcPlain(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OverviewTreasuryAllocationChart({
  treasury,
  loading,
  totalChange,
  historyPoints = [],
  className,
}: {
  treasury: TreasuryAllocationInput;
  loading?: boolean;
  totalChange?: BalanceChangeResult | null;
  historyPoints?: Array<{ label: string; value: number; at: number }>;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "");

  const segments = useMemo(() => {
    const px = treasury.solPriceUsd;
    return [
      {
        key: "wallet",
        label: allocationConfig.wallet.label,
        value: segmentUsd(treasury.userUsdc, treasury.userSol, px),
        fill: "var(--color-wallet)",
      },
      {
        key: "trading",
        label: allocationConfig.trading.label,
        value: segmentUsd(treasury.chatUsdc, treasury.chatSol, px),
        fill: "var(--color-trading)",
      },
      {
        key: "lp",
        label: allocationConfig.lp.label,
        value: segmentUsd(treasury.lpUsdc, treasury.lpSol, px),
        fill: "var(--color-lp)",
      },
    ].filter((s) => s.value > 0);
  }, [treasury]);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const primaryTotal =
    treasury.totalUsd != null && treasury.totalUsd > 0
      ? treasury.totalUsd
      : treasury.totalUsdc != null
        ? treasury.totalUsdc
        : total;

  const trendData = useMemo(() => {
    const points = [...historyPoints];
    if (total > 0) {
      points.push({ at: Date.now(), value: total, label: "Now" });
    }
    return points.slice(-32);
  }, [historyPoints, total]);

  const showTrend = trendData.length >= 2;

  return (
    <article className={cn(overviewCardShell, "overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.42]"
        style={{ background: overviewAccentBackground("marketplace") }}
        aria-hidden
      />
      <div className="relative flex flex-col">
        {/* Metric header */}
        <div className="border-b border-border/45 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className={overviewKickerClass}>Total portfolio value</p>
              {loading ? (
                <div className="mt-2 h-10 w-44 animate-pulse rounded-lg bg-muted/50" />
              ) : (
                <p className={cn(overviewMetricValueClass, "mt-1 text-3xl sm:text-[2rem]")}>
                  <AnimatedMetric
                    value={primaryTotal > 0 ? primaryTotal : null}
                    format={formatCompactUsd}
                    deltaMode
                  />
                </p>
              )}
              {!loading ? <BalanceChangeIndicator change={totalChange} size="md" className="mt-2" /> : null}
              {!loading ? (
                <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                  {treasury.totalUsdc != null ? `$${formatUsdcPlain(treasury.totalUsdc)} USDC` : "— USDC"}
                  {treasury.totalSol != null ? ` · ${formatSol(treasury.totalSol)} SOL` : ""}
                </p>
              ) : null}
            </div>

            {!loading && segments.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-2 lg:max-w-md lg:justify-end">
                {segments.map((seg) => {
                  const pct = total > 0 ? (seg.value / total) * 100 : 0;
                  return (
                    <div
                      key={seg.key}
                      className="rounded-xl border border-border/50 bg-background/35 px-3 py-2 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: seg.fill }} aria-hidden />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {seg.label.replace(" agent", "").replace("Connected wallet", "Wallet")}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                        {formatCompactUsd(seg.value)}
                      </p>
                      <p className="text-[10px] tabular-nums text-muted-foreground">{pct.toFixed(0)}%</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Primary chart — full width on top */}
        <div className="px-5 py-4 sm:px-7 sm:py-5">
          {loading ? (
            <div className="h-[220px] animate-pulse rounded-2xl bg-muted/30" />
          ) : showTrend ? (
            <div className={cn(overviewChartPanelShell, "p-3 sm:p-4")}>
              <div className={overviewChartTopShine} aria-hidden />
              <ChartContainer config={trendConfig} className="h-[220px] w-full aspect-auto sm:h-[240px]">
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
                    tickFormatter={(v: number) => formatCompactUsd(v)}
                    domain={["auto", "auto"]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono tabular-nums">{formatCompactUsd(Number(value))}</span>
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
          ) : segments.length === 0 ? (
            <div className="flex h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 text-center">
              <p className="text-sm text-muted-foreground">No treasury balances yet.</p>
              <p className="mt-1 text-xs text-muted-foreground/80">Fund your wallet or agent treasuries to track value.</p>
            </div>
          ) : (
            <div className={cn(overviewChartPanelShell, "flex h-[220px] items-center justify-center p-6 sm:h-[240px]")}>
              <p className="text-sm text-muted-foreground">Balance history builds after your next visit.</p>
            </div>
          )}
        </div>

        {/* Allocation breakdown */}
        {!loading && segments.length > 0 ? (
          <div className="grid border-t border-border/45 lg:grid-cols-[minmax(0,240px)_1fr]">
            <div className="border-b border-border/45 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Allocation
              </p>
              <ChartContainer config={allocationConfig} className="mx-auto aspect-square h-[180px] w-full max-w-[200px]">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <span className="font-mono tabular-nums">
                            {formatCompactUsd(Number(value))} · {name}
                          </span>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={segments}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {segments.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                        const { cx, cy } = viewBox;
                        return (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan
                              x={cx}
                              y={(cy ?? 0) - 4}
                              className="fill-muted-foreground text-[9px] font-medium uppercase tracking-wider"
                            >
                              Mix
                            </tspan>
                            <tspan x={cx} y={(cy ?? 0) + 12} className="fill-foreground text-sm font-semibold">
                              {segments.length}
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <ul className="space-y-3 p-5 sm:p-6">
              {segments.map((seg) => {
                const pct = total > 0 ? (seg.value / total) * 100 : 0;
                return (
                  <li key={seg.key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{seg.label}</span>
                      <span className="font-mono text-sm tabular-nums text-foreground">
                        <AnimatedMetric value={seg.value} format={formatCompactUsd} />
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/45">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: seg.fill }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{pct.toFixed(1)}% of portfolio</p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
