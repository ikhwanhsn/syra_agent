import { useId, useMemo } from "react";
import { Link } from "@/lib/navigation";
import { ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BalanceChangeIndicator } from "@/components/dashboard/overview/BalanceChangeIndicator";
import { cn } from "@/lib/utils";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { PILLAR_OVERVIEW_META } from "@/lib/machineMoneyOverview";
import { PILLAR_COPY, type PillarId } from "@/lib/pillarsApi";
import type { BalanceChangeResult } from "@/lib/treasuryBalanceHistory";
import type { PillarWalletPurpose } from "@/lib/agentWalletCatalog";
import { PILLAR_WALLET_PURPOSES } from "@/lib/agentWalletCatalog";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";

const PILLAR_CHART_COLORS: Record<PillarWalletPurpose, string> = {
  earn: "hsl(38 92% 50%)",
  treasury: "hsl(262 83% 58%)",
  invest: "hsl(199 89% 48%)",
  spend: "hsl(187 85% 43%)",
  grow: "hsl(142 76% 36%)",
};

const trendConfig = {
  value: { label: "Balance", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60_000;

function formatUsdcPlain(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pillarUsd(
  usdc: number | null,
  sol: number | null,
  solPriceUsd: number | null | undefined,
): number {
  const u = usdc ?? 0;
  const s = sol ?? 0;
  const px = solPriceUsd != null && solPriceUsd > 0 ? solPriceUsd : 0;
  return u + s * px;
}

type TrendPoint = { label: string; value: number; at: number };

/** Trim ancient outliers so compact sparklines stay readable after large balance moves. */
function buildCompactTrendData(
  historyPoints: TrendPoint[],
  current: number,
): TrendPoint[] {
  const now = Date.now();
  let points = historyPoints.filter((p) => now - p.at <= SEVEN_DAYS_MS);

  if (points.length === 0) {
    points = historyPoints.slice(-6);
  } else {
    points = points.slice(-8);
  }

  if (current > 0) {
    points.push({ at: now, value: current, label: "Now" });
  }

  if (points.length < 2) {
    const v = current > 0 ? current : points[0]?.value ?? 0;
    return [
      { at: now - 6 * 60 * 60_000, value: v, label: "" },
      { at: now, value: v, label: "Now" },
    ];
  }

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const positive = values.filter((v) => v > 0);
  const min = positive.length > 0 ? Math.min(...positive) : 0;
  if (max > 0 && min > 0 && max / min > 3.5) {
    const threshold = max * 0.45;
    let startIdx = 0;
    for (let i = 0; i < points.length; i++) {
      if (points[i].value <= threshold) {
        startIdx = i;
        break;
      }
    }
    const trimmed = points.slice(startIdx);
    if (trimmed.length >= 2) return trimmed;
  }

  return points;
}

function sparklineDomain(data: TrendPoint[]): [number, number] {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const pad = range === 0 ? Math.max(max * 0.08, 0.5) : range * 0.15;
  return [Math.max(0, min - pad), max + pad];
}

export interface OverviewBalanceChartProps {
  totalUsd: number | null;
  totalUsdc: number | null;
  totalSol: number | null;
  solPriceUsd?: number | null;
  pillarBalances: Partial<Record<PillarWalletPurpose, { usdc: number | null; sol: number | null }>>;
  historyPoints?: TrendPoint[];
  totalChange?: BalanceChangeResult | null;
  loading?: boolean;
  walletLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  variant?: "compact" | "full";
  className?: string;
}

export function OverviewBalanceChart({
  totalUsd,
  totalUsdc,
  totalSol,
  solPriceUsd,
  pillarBalances,
  historyPoints = [],
  totalChange,
  loading,
  walletLabel,
  refreshing,
  onRefresh,
  variant = "full",
  className,
}: OverviewBalanceChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const glowId = useId().replace(/:/g, "");
  const compact = variant === "compact";

  const pillarSegments = useMemo(() => {
    return PILLAR_WALLET_PURPOSES.map((purpose) => {
      const bal = pillarBalances[purpose];
      const value = pillarUsd(bal?.usdc ?? null, bal?.sol ?? null, solPriceUsd);
      return {
        purpose,
        label: PILLAR_COPY[purpose as PillarId].headline,
        value,
        color: PILLAR_CHART_COLORS[purpose],
        href: PILLAR_COPY[purpose as PillarId].href,
        accent: PILLAR_OVERVIEW_META[purpose as PillarId].accent,
      };
    }).filter((s) => s.value > 0);
  }, [pillarBalances, solPriceUsd]);

  const allocationTotal = pillarSegments.reduce((sum, s) => sum + s.value, 0);

  const primaryTotal =
    totalUsd != null && totalUsd > 0
      ? totalUsd
      : totalUsdc != null
        ? totalUsdc
        : allocationTotal > 0
          ? allocationTotal
          : null;

  const trendData = useMemo(() => {
    const current = primaryTotal ?? 0;
    if (compact) {
      return buildCompactTrendData(historyPoints, current);
    }
    const points = [...historyPoints];
    if (current > 0) {
      points.push({ at: Date.now(), value: current, label: "Now" });
    }
    return points.slice(-32);
  }, [historyPoints, primaryTotal, compact]);

  const yDomain = useMemo(() => sparklineDomain(trendData), [trendData]);

  const showTrend = trendData.length >= 2;
  const hasBalance = primaryTotal != null && primaryTotal > 0;
  const chartHeight = compact ? 108 : 240;

  const chartPanel = loading ? (
    <div className="animate-pulse rounded-xl bg-muted/20" style={{ height: chartHeight }} />
  ) : showTrend ? (
    <div
      className={cn(
        "relative overflow-hidden",
        compact ? "h-[108px]" : cn(overviewChartPanelShell, "p-3 sm:p-4"),
      )}
    >
      {!compact ? <div className={overviewChartTopShine} aria-hidden /> : null}
      {!compact ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold tracking-tight text-foreground">Balance over time</p>
          <p className="text-xs text-muted-foreground">USD · local history</p>
        </div>
      ) : null}
      {compact ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/80 to-transparent"
          aria-hidden
        />
      ) : null}
      <ChartContainer
        config={trendConfig}
        className={cn("w-full", compact ? "h-[108px]" : "aspect-auto")}
        style={compact ? undefined : { height: chartHeight }}
      >
        <AreaChart
          data={trendData}
          margin={
            compact
              ? { top: 8, right: 0, left: 0, bottom: 0 }
              : { top: 12, right: 8, left: 0, bottom: 0 }
          }
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={compact ? 0.22 : 0.32} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis hide domain={compact ? yDomain : ["auto", "auto"]} width={0} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const at = payload?.[0]?.payload?.at as number | undefined;
                  if (!at) return "Balance";
                  return new Date(at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }}
                formatter={(value) => (
                  <span className="font-mono tabular-nums">{formatCompactUsd(Number(value))}</span>
                )}
              />
            }
          />
          <Area
            type="natural"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={compact ? 1.75 : 2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            filter={compact ? `url(#${glowId})` : undefined}
            activeDot={{
              r: compact ? 3.5 : 5,
              strokeWidth: 2,
              stroke: "hsl(var(--background))",
              fill: "hsl(var(--primary))",
            }}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ChartContainer>
      {compact ? (
        <span className="absolute right-0 top-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          7d
        </span>
      ) : null}
    </div>
  ) : !hasBalance ? (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/5 px-3 text-center",
        compact ? "h-[108px]" : "h-[200px] sm:h-[240px]",
      )}
    >
      <p className="text-sm text-muted-foreground">No balance yet</p>
      {!compact ? (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/80">
          Fund your pillar wallets to track portfolio value over time.
        </p>
      ) : null}
    </div>
  ) : (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-muted/5",
        compact ? "h-[108px]" : cn(overviewChartPanelShell, "h-[200px] p-6 sm:h-[240px]"),
      )}
    >
      <p className="text-center text-xs text-muted-foreground sm:text-sm">
        Balance history builds after your next visit.
      </p>
    </div>
  );

  const allocationBar =
    !loading && pillarSegments.length > 0 ? (
      <div className={compact ? "space-y-2.5" : "space-y-3"}>
        {!compact ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pillar allocation
            </p>
            <p className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatCompactUsd(allocationTotal)}
            </p>
          </div>
        ) : null}
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted/30">
          {pillarSegments.map((seg) => {
            const pct = allocationTotal > 0 ? (seg.value / allocationTotal) * 100 : 0;
            return (
              <Link
                key={seg.purpose}
                to={seg.href}
                className="h-full rounded-full transition-opacity hover:opacity-90"
                style={{ width: `${Math.max(pct, 4)}%`, background: seg.color }}
                title={`${seg.label}: ${formatCompactUsd(seg.value)} (${pct.toFixed(0)}%)`}
                aria-label={`${seg.label}: ${formatCompactUsd(seg.value)}`}
              />
            );
          })}
        </div>
        {compact ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {pillarSegments.map((seg) => (
              <Link
                key={seg.purpose}
                to={seg.href}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: seg.color }} aria-hidden />
                <span>{seg.label}</span>
                <span className="font-mono tabular-nums text-foreground/80">
                  {formatCompactUsd(seg.value)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {pillarSegments.map((seg) => {
              const pct = allocationTotal > 0 ? (seg.value / allocationTotal) * 100 : 0;
              return (
                <Link
                  key={seg.purpose}
                  to={seg.href}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: seg.color }} aria-hidden />
                  <span className={seg.accent}>{seg.label}</span>
                  <span className="font-mono tabular-nums">{pct.toFixed(0)}%</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    ) : null;

  if (compact) {
    return (
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden rounded-2xl",
          "border border-border/60 bg-gradient-to-b from-card/90 via-card/70 to-card/50",
          "shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.06),0_20px_50px_-24px_rgba(0,0,0,0.65)]",
          "backdrop-blur-xl",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(280px 120px at 100% 0%, hsl(var(--primary) / 0.08), transparent 70%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
          aria-hidden
        />

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <p className={overviewKickerClass}>Total balance</p>
              {loading ? (
                <div className="h-10 w-36 animate-pulse rounded-lg bg-muted/40" />
              ) : (
                <p className="font-mono text-[2rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
                  <AnimatedMetric
                    value={hasBalance ? primaryTotal : null}
                    format={formatCompactUsd}
                    deltaMode
                  />
                </p>
              )}
              {!loading ? (
                <div className="flex flex-wrap items-center gap-2">
                  <BalanceChangeIndicator change={totalChange} size="sm" variant="pill" />
                  {walletLabel ? (
                    <span className="rounded-md border border-border/50 bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {walletLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {onRefresh ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-background/60 hover:text-foreground"
                disabled={refreshing || loading}
                onClick={() => void onRefresh()}
                aria-label="Refresh balances"
              >
                {refreshing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
            ) : null}
          </div>

          <div className="mt-5 border-t border-border/40 pt-4">{chartPanel}</div>

          {allocationBar ? <div className="mt-4 border-t border-border/40 pt-4">{allocationBar}</div> : null}

          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full rounded-xl border border-border/50 bg-background/50 font-medium shadow-none hover:bg-background/80"
            asChild
          >
            <Link to="/treasury">
              Manage treasury
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 opacity-60" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article className={cn(overviewCardShell, "overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.42]"
        style={{ background: overviewAccentBackground("marketplace") }}
        aria-hidden
      />

      <div className="relative">
        <div className="border-b border-border/45 px-5 py-5 sm:px-7 sm:py-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={overviewKickerClass}>Portfolio balance</p>
                  {walletLabel ? (
                    <span className="font-mono text-[10px] text-muted-foreground/80">{walletLabel}</span>
                  ) : null}
                </div>
                {loading ? (
                  <div className="mt-2 h-10 w-44 animate-pulse rounded-lg bg-muted/50" />
                ) : (
                  <p className={cn(overviewMetricValueClass, "mt-1 text-3xl sm:text-[2rem]")}>
                    <AnimatedMetric
                      value={hasBalance ? primaryTotal : null}
                      format={formatCompactUsd}
                      deltaMode
                    />
                  </p>
                )}
                {!loading ? (
                  <BalanceChangeIndicator change={totalChange} size="md" className="mt-2" />
                ) : null}
                {!loading && (totalUsdc != null || totalSol != null) ? (
                  <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                    {totalUsdc != null ? `$${formatUsdcPlain(totalUsdc)} USDC` : "— USDC"}
                    {totalSol != null ? ` · ${formatSol(totalSol)} SOL` : ""}
                  </p>
                ) : null}
              </div>

              {onRefresh ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl"
                  disabled={refreshing || loading}
                  onClick={() => void onRefresh()}
                  aria-label="Refresh balances"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              ) : null}
            </div>

            {!loading && pillarSegments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pillarSegments.map((seg) => {
                  const pct = allocationTotal > 0 ? (seg.value / allocationTotal) * 100 : 0;
                  return (
                    <Link
                      key={seg.purpose}
                      to={seg.href}
                      className="group rounded-xl border border-border/50 bg-background/35 px-3 py-2 backdrop-blur-md transition-colors hover:border-border/80 hover:bg-background/55"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full transition-transform group-hover:scale-110"
                          style={{ background: seg.color }}
                          aria-hidden
                        />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {seg.label}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCompactUsd(seg.value)}
                      </p>
                      <p className="text-[10px] tabular-nums text-muted-foreground">{pct.toFixed(0)}%</p>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-4 sm:px-7 sm:py-5">{chartPanel}</div>

        {allocationBar ? (
          <div className="border-t border-border/45 px-5 py-4 sm:px-7 sm:py-5">{allocationBar}</div>
        ) : null}
      </div>
    </article>
  );
}
