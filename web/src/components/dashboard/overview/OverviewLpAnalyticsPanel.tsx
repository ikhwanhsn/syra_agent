import { Link } from "@/lib/navigation";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Droplets } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { cn } from "@/lib/utils";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import type { LpRealSummary } from "@/lib/lpAgentRealApi";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

const lpPnlConfig = {
  value: { label: "SOL", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const PNL_COLORS: Record<string, string> = {
  "Total return": "hsl(var(--primary))",
  "Realized PnL": "hsl(142 71% 45%)",
  Unrealized: "hsl(38 92% 50%)",
  "Fees claimed": "hsl(187 85% 43%)",
};

export function OverviewLpAnalyticsPanel({
  summary,
  loading,
  className,
}: {
  summary: LpRealSummary | undefined;
  loading?: boolean;
  className?: string;
}) {
  const wlData = summary
    ? [
        { name: "Wins", value: summary.wins, fill: "hsl(142 71% 45%)" },
        { name: "Losses", value: summary.losses, fill: "hsl(var(--destructive) / 0.55)" },
        { name: "Open", value: summary.openCount, fill: "hsl(var(--ring))" },
      ].filter((d) => d.value > 0)
    : [];

  const pnlBars = summary
    ? [
        { label: "Total return", value: summary.totalReturnSol },
        { label: "Realized PnL", value: summary.realizedNetPnlSol },
        { label: "Unrealized", value: summary.unrealizedPnlSol },
        { label: "Fees claimed", value: summary.totalFeesClaimedSol },
      ]
    : [];

  const maxAbs = pnlBars.reduce((m, b) => Math.max(m, Math.abs(b.value)), 0);

  return (
    <article className={cn(overviewCardShell, "flex h-full flex-col", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{ background: overviewAccentBackground("experiment") }}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className={overviewKickerClass}>LP analytics</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">Meteora agent P&amp;L</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Realized, unrealized, and fee income in SOL</p>
          </div>
          <Link
            to="/lp-experiment"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open LP experiment"
          >
            <Droplets className="h-4 w-4" aria-hidden />
          </Link>
        </header>

        {loading ? (
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-24 animate-pulse rounded-2xl bg-muted/30" />
            <div className="h-40 animate-pulse rounded-2xl bg-muted/25" />
          </div>
        ) : !summary ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">LP agent not set up yet.</p>
            <Link
              to="/lp-experiment"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
            >
              Deploy LP agent
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {(
                [
                  { label: "Wins", value: summary.wins, accent: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Losses", value: summary.losses, accent: "text-destructive/90" },
                  { label: "Open", value: summary.openCount, accent: "text-foreground" },
                ] as const
              ).map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/50 bg-background/30 px-3 py-2.5 text-center backdrop-blur-sm"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className={cn("mt-0.5 font-mono text-lg font-semibold tabular-nums", stat.accent)}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {wlData.length > 0 ? (
              <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-muted/40">
                {wlData.map((seg) => {
                  const total = wlData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? (seg.value / total) * 100 : 0;
                  return (
                    <div
                      key={seg.name}
                      className="h-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: seg.fill }}
                      title={`${seg.name}: ${seg.value}`}
                    />
                  );
                })}
              </div>
            ) : null}

            <div className={cn(overviewChartPanelShell, "flex-1 p-3 sm:p-4")}>
              <div className={overviewChartTopShine} aria-hidden />
              <ChartContainer config={lpPnlConfig} className="h-[200px] w-full aspect-auto">
                <BarChart data={pnlBars} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tick={{ fontSize: 10 }}
                    domain={maxAbs > 0 ? [Math.min(...pnlBars.map((b) => b.value), 0), Math.max(...pnlBars.map((b) => b.value))] : ["auto", "auto"]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono tabular-nums">{formatSol(Number(value))} SOL</span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {pnlBars.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={PNL_COLORS[entry.label] ?? "hsl(var(--primary))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            <p className="mt-3 text-center font-mono text-sm tabular-nums text-muted-foreground">
              Deployed{" "}
              <span className="font-semibold text-foreground">
                <AnimatedMetric value={summary.deployedSol} format={formatSol} />
              </span>{" "}
              SOL
            </p>
          </>
        )}
      </div>
    </article>
  );
}
