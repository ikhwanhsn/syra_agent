"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  ExternalLink,
  Lock,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import {
  aboutCardClass,
  aboutKickerClass,
  aboutStatValueClass,
} from "@/components/about/aboutStyles";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useSyraDuneAnalytics } from "@/hooks/useSyraDuneAnalytics";
import { truncateBase58 } from "@/data/marketing/agentIdentity";
import { formatCompactAmount } from "@/lib/marketing/tokenFormat";
import { SYRA_DUNE_OVERVIEW_URL } from "@/lib/syraDuneAnalyticsApi";
import { cn } from "@/lib/utils";

type AnalyticsTab = "trading" | "holders" | "staking" | "treasury";

const volumeChartConfig = {
  buyVolumeUsd: { label: "Buy volume", color: "hsl(142 76% 42%)" },
  sellVolumeUsd: { label: "Sell volume", color: "hsl(0 72% 58%)" },
} satisfies ChartConfig;

const tradersChartConfig = {
  uniqueTraders: { label: "Unique traders", color: "hsl(199 89% 48%)" },
} satisfies ChartConfig;

const vwapChartConfig = {
  vwapPriceUsd: { label: "VWAP (USD)", color: "hsl(262 83% 58%)" },
} satisfies ChartConfig;

const holdersChartConfig = {
  holderCount: { label: "Holders", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

const stakingChartConfig = {
  cumulativeNetLocked: { label: "Locked (approx.)", color: "hsl(187 85% 43%)" },
} satisfies ChartConfig;

const buybackChartConfig = {
  cumulativeSyraBought: { label: "SYRA bought", color: "hsl(142 76% 36%)" },
} satisfies ChartConfig;

function formatUsd(value: number, compact = false): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (compact || value >= 1_000_000) {
    return `$${formatCompactAmount(value)}`;
  }
  if (value >= 1) {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  }
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 6 });
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1) return formatUsd(value);
  return `$${value.toPrecision(4)}`;
}

function formatPct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function KpiCard({
  label,
  value,
  hint,
  loading,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        aboutCardClass,
        "rounded-[1.15rem] px-4 py-4 sm:rounded-[1.25rem] sm:px-5 sm:py-5",
        accent && "about-analytics-kpi-featured",
      )}
    >
      <p className={aboutKickerClass}>{label}</p>
      <p
        className={cn(
          aboutStatValueClass,
          "mt-2.5 text-xl sm:text-2xl",
          loading && "animate-pulse text-muted-foreground/30",
        )}
      >
        {loading ? "···" : value}
      </p>
      {hint ? <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

function ChartPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(aboutCardClass, "about-analytics-chart rounded-[1.25rem] p-4 sm:p-5", className)}>
      <div className="mb-4">
        <h3 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base">
          {title}
        </h3>
        {description ? <p className="mt-1 text-[12.5px] text-muted-foreground/85">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(aboutCardClass, "h-24 animate-pulse rounded-[1.15rem] bg-muted/10")} />
        ))}
      </div>
      <div className={cn(aboutCardClass, "h-80 animate-pulse rounded-[1.25rem] bg-muted/10")} />
    </div>
  );
}

const TABS: { id: AnalyticsTab; label: string; icon: typeof Activity }[] = [
  { id: "trading", label: "Trading", icon: BarChart3 },
  { id: "holders", label: "Holders", icon: Users },
  { id: "staking", label: "Staking", icon: Lock },
  { id: "treasury", label: "Treasury", icon: Wallet },
];

export function AboutAnalyticsSection({ embedded = false }: { embedded?: boolean }) {
  const { data, loading, error, refresh } = useSyraDuneAnalytics();
  const [tab, setTab] = useState<AnalyticsTab>("trading");
  const [refreshing, setRefreshing] = useState(false);

  const venueTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data?.trading.venues ?? []) {
      map.set(row.project, (map.get(row.project) ?? 0) + row.volumeUsd);
    }
    return Array.from(map.entries())
      .map(([project, volumeUsd]) => ({ project, volumeUsd }))
      .sort((a, b) => b.volumeUsd - a.volumeUsd)
      .slice(0, 8);
  }, [data?.trading.venues]);

  const buybackSeries = useMemo(() => {
    return [...(data?.buybacks.events ?? [])]
      .reverse()
      .map((e) => ({
        label: e.blockTime ? new Date(e.blockTime).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        cumulativeSyraBought: e.cumulativeSyraBought,
      }));
  }, [data?.buybacks.events]);

  const updatedLabel = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  const body = (
    <section
      id={embedded ? undefined : "syra-analytics"}
      className={cn("about-analytics-section", !embedded && "scroll-mt-24")}
      aria-label="SYRA on-chain analytics"
    >
      <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", embedded ? "mb-5" : "mb-8")}>
        {embedded ? (
          <AboutSectionHeader
            kicker="On-chain data"
            title="$SYRA analytics"
            description="Live trading, holder, staking, and treasury buyback metrics — powered by Dune."
            className="mb-0"
          />
        ) : (
          <div>
            <p className={aboutKickerClass}>On-chain data</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] text-foreground">$SYRA analytics</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Live trading, holder, staking, and treasury buyback metrics from Solana — powered by Dune Analytics.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 border-border/50 bg-background/40"
            onClick={() => void handleRefresh()}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", (loading || refreshing) && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 border-border/50 bg-background/40" asChild>
            <a href={data?.links?.duneOverview ?? SYRA_DUNE_OVERVIEW_URL} target="_blank" rel="noopener noreferrer">
              View on Dune
              <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-50" />
            </a>
          </Button>
        </div>
      </div>

        {error && !data ? (
          <div className={cn(aboutCardClass, "rounded-[1.25rem] border-destructive/25 px-6 py-8 text-center")}>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void handleRefresh()}>
              Try again
            </Button>
          </div>
        ) : null}

        {loading && !data ? <AnalyticsSkeleton /> : null}

        {data ? (
          <div className="space-y-5">
            <div className="about-analytics-kpi-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard label="Price" value={formatPrice(data.overview.priceUsd)} loading={loading} accent />
              <KpiCard label="FDV" value={formatUsd(data.overview.fdvUsd, true)} loading={loading} />
              <KpiCard label="24h volume" value={formatUsd(data.overview.volume24hUsd, true)} loading={loading} />
              <KpiCard label="7d volume" value={formatUsd(data.overview.volume7dUsd, true)} loading={loading} />
              <KpiCard
                label="Holders"
                value={data.overview.totalHolders.toLocaleString()}
                loading={loading}
              />
              <KpiCard
                label="Top 10 hold"
                value={formatPct(data.overview.top10ConcentrationPct)}
                hint="Supply concentration"
                loading={loading}
              />
            </div>

            <div className="about-analytics-tabs flex flex-wrap gap-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "about-analytics-tab inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition-all duration-200",
                    tab === id
                      ? "border-foreground/20 bg-foreground/[0.06] text-foreground shadow-sm"
                      : "border-border/40 bg-background/30 text-muted-foreground hover:border-border/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            {tab === "trading" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartPanel title="Daily volume" description="Buy vs sell volume (USD, last 90 days)" className="lg:col-span-2">
                  <ChartContainer config={volumeChartConfig} className="h-[280px] w-full">
                    <BarChart data={data.trading.dailyVolume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatUsd(Number(v), true)} width={48} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="buyVolumeUsd" stackId="vol" fill="var(--color-buyVolumeUsd)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="sellVolumeUsd" stackId="vol" fill="var(--color-sellVolumeUsd)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </ChartPanel>

                <ChartPanel title="VWAP price" description="Volume-weighted average price per day">
                  <ChartContainer config={vwapChartConfig} className="h-[240px] w-full">
                    <LineChart data={data.trading.vwap} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatPrice(Number(v))} width={56} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="vwapPriceUsd" stroke="var(--color-vwapPriceUsd)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                </ChartPanel>

                <ChartPanel title="Unique traders" description="Distinct wallets trading SYRA per day">
                  <ChartContainer config={tradersChartConfig} className="h-[240px] w-full">
                    <AreaChart data={data.trading.uniqueTraders} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tickLine={false} axisLine={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="uniqueTraders"
                        stroke="var(--color-uniqueTraders)"
                        fill="var(--color-uniqueTraders)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </ChartPanel>

                <ChartPanel title="Volume by venue" description="DEX share (90-day total)" className="lg:col-span-2">
                  <ChartContainer config={{ volumeUsd: { label: "Volume", color: "hsl(var(--primary))" } }} className="h-[220px] w-full">
                    <BarChart data={venueTotals} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => formatUsd(Number(v), true)} />
                      <YAxis type="category" dataKey="project" tickLine={false} axisLine={false} width={88} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="volumeUsd" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </ChartPanel>
              </div>
            ) : null}

            {tab === "holders" ? (
              <div className="grid gap-4 lg:grid-cols-5">
                <ChartPanel title="Holders over time" description="Wallets with positive SYRA balance" className="lg:col-span-3">
                  <ChartContainer config={holdersChartConfig} className="h-[280px] w-full">
                    <AreaChart data={data.holders.overTime} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} />
                      <YAxis tickLine={false} axisLine={false} width={44} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="holderCount"
                        stroke="var(--color-holderCount)"
                        fill="var(--color-holderCount)"
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </ChartPanel>

                <ChartPanel title="Top holders" description="Largest balances by % of supply" className="lg:col-span-2">
                  <div className="about-analytics-table-wrap max-h-[280px] overflow-auto rounded-xl border border-border/30">
                    <table className="w-full min-w-[280px] text-left text-[12px]">
                      <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                        <tr className="border-b border-border/30 text-muted-foreground">
                          <th className="px-3 py-2.5 font-medium">Wallet</th>
                          <th className="px-3 py-2.5 font-medium text-right">SYRA</th>
                          <th className="px-3 py-2.5 font-medium text-right">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.holders.topHolders.slice(0, 15).map((row) => (
                          <tr key={row.wallet} className="border-b border-border/20 last:border-0">
                            <td className="px-3 py-2 font-mono text-[11px] text-foreground/90">
                              <a
                                href={`https://solscan.io/account/${row.wallet}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary hover:underline"
                              >
                                {truncateBase58(row.wallet, 4, 4)}
                              </a>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-foreground/90">
                              {formatCompactAmount(row.syraBalance)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {formatPct(row.pctOfSupply)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ChartPanel>
              </div>
            ) : null}

            {tab === "staking" ? (
              <ChartPanel
                title="Streamflow locks (approximate)"
                description="On-chain proxy for SYRA locked via Streamflow. Syra app registry is the source of truth for active locks."
              >
                <ChartContainer config={stakingChartConfig} className="h-[300px] w-full">
                  <AreaChart data={data.staking.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactAmount(Number(v))} width={52} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="cumulativeNetLocked"
                      stroke="var(--color-cumulativeNetLocked)"
                      fill="var(--color-cumulativeNetLocked)"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </ChartPanel>
            ) : null}

            {tab === "treasury" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                  <KpiCard
                    label="SYRA bought"
                    value={formatCompactAmount(data.buybacks.cumulativeSyraBought)}
                    hint="Treasury buybacks (cumulative)"
                  />
                  <KpiCard
                    label="USD spent"
                    value={formatUsd(data.buybacks.cumulativeUsdSpent, true)}
                    hint="From x402 revenue buybacks"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartPanel title="Cumulative buybacks" description="SYRA accumulated by treasury wallet">
                    {buybackSeries.length > 1 ? (
                      <ChartContainer config={buybackChartConfig} className="h-[220px] w-full">
                        <LineChart data={buybackSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactAmount(Number(v))} width={48} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="cumulativeSyraBought"
                            stroke="var(--color-cumulativeSyraBought)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ChartContainer>
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">No treasury buyback events indexed yet.</p>
                    )}
                  </ChartPanel>

                  <ChartPanel title="Recent buybacks" description="USDC → SYRA via Jupiter">
                    <div className="about-analytics-table-wrap max-h-[220px] overflow-auto rounded-xl border border-border/30">
                      <table className="w-full min-w-[280px] text-left text-[12px]">
                        <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                          <tr className="border-b border-border/30 text-muted-foreground">
                            <th className="px-3 py-2.5 font-medium">Time</th>
                            <th className="px-3 py-2.5 font-medium text-right">SYRA</th>
                            <th className="px-3 py-2.5 font-medium text-right">USD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.buybacks.events.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                                No buyback trades found yet.
                              </td>
                            </tr>
                          ) : (
                            data.buybacks.events.slice(0, 12).map((row) => (
                              <tr key={`${row.txId}-${row.blockTime}`} className="border-b border-border/20 last:border-0">
                                <td className="px-3 py-2 text-foreground/85">
                                  {row.blockTime
                                    ? new Date(row.blockTime).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatCompactAmount(row.syraBought)}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatUsd(row.usdSpent)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </ChartPanel>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/25 bg-muted/[0.06] px-4 py-3 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 opacity-60" aria-hidden />
                <span>
                  Data refreshes every ~5 min · All-time volume {formatUsd(data.overview.volumeAllTimeUsd, true)}
                </span>
              </div>
              {updatedLabel ? (
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  Updated {updatedLabel}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
    </section>
  );

  return body;
}
