import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import { Bar, BarChart, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts";
import { FlaskConical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { UserCustomStrategyAgentStats } from "@/lib/tradingExperimentApi";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

const winLossConfig = {
  wins: { label: "Wins", color: "hsl(142 71% 45%)" },
  losses: { label: "Losses", color: "hsl(var(--destructive) / 0.55)" },
  pending: { label: "Pending", color: "hsl(var(--muted-foreground) / 0.28)" },
} satisfies ChartConfig;

const strategyBarConfig = {
  winRate: { label: "Win rate", color: "hsl(var(--primary))" },
  open: { label: "Open", color: "hsl(var(--ring))" },
} satisfies ChartConfig;

function winRateFill(pct: number, decided: number): string {
  if (decided <= 0) return "hsl(var(--muted-foreground) / 0.35)";
  if (pct >= 55) return "hsl(142 71% 45%)";
  if (pct >= 42) return "hsl(38 92% 50%)";
  return "hsl(var(--destructive) / 0.65)";
}

export function OverviewTradingAnalyticsPanel({
  agents,
  wins,
  losses,
  open,
  loading,
  error,
  className,
}: {
  agents: UserCustomStrategyAgentStats[];
  wins: number;
  losses: number;
  open: number;
  loading?: boolean;
  error?: boolean;
  className?: string;
}) {
  const decided = wins + losses;
  const winRatePct = decided > 0 ? (wins / decided) * 100 : 0;
  const hasResolvedTrades = decided > 0;

  const pieData = useMemo(() => {
    if (hasResolvedTrades) {
      return [
        { name: "wins", value: wins, fill: "var(--color-wins)" },
        { name: "losses", value: losses, fill: "var(--color-losses)" },
      ];
    }
    return [{ name: "pending", value: 1, fill: "var(--color-pending)" }];
  }, [hasResolvedTrades, wins, losses]);

  const strategyRows = useMemo(
    () =>
      [...agents]
        .sort((a, b) => {
          if (b.decided !== a.decided) return b.decided - a.decided;
          if ((b.openPositions ?? 0) !== (a.openPositions ?? 0)) {
            return (b.openPositions ?? 0) - (a.openPositions ?? 0);
          }
          return (b.winRatePct ?? -1) - (a.winRatePct ?? -1);
        })
        .slice(0, 6)
        .map((a) => ({
          id: a.strategyId,
          label: a.name.length > 18 ? `${a.name.slice(0, 16)}…` : a.name,
          token: a.token,
          bar: a.bar,
          winRatePct: a.decided > 0 && a.winRatePct != null ? a.winRatePct : 0,
          decided: a.decided,
          wins: a.wins,
          losses: a.losses,
          openPositions: a.openPositions ?? 0,
        })),
    [agents],
  );

  const anyStrategyDecided = strategyRows.some((r) => r.decided > 0);
  const totalOpen = strategyRows.reduce((sum, r) => sum + r.openPositions, 0);
  const chartMode: "winRate" | "open" | "status" = anyStrategyDecided
    ? "winRate"
    : totalOpen > 0
      ? "open"
      : "status";
  const openMax = Math.max(1, ...strategyRows.map((r) => r.openPositions));

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
            <p className={overviewKickerClass}>Trading analytics</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">Strategy performance</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hasResolvedTrades
                ? `${wins}W · ${losses}L · ${open} open across ${agents.length} strategies`
                : `${agents.length} strateg${agents.length === 1 ? "y" : "ies"} · ${open} open · awaiting first close`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/40">
              <FlaskConical className="h-4 w-4 text-muted-foreground" aria-hidden />
            </span>
            <Button variant="ghost" size="sm" className="hidden rounded-lg gap-1 sm:inline-flex" asChild>
              <Link to="/trading-experiment">
                <Plus className="h-3.5 w-3.5" />
                New
              </Link>
            </Button>
          </div>
        </header>

        {error ? (
          <p className="text-sm text-destructive">Sign in and connect your wallet to load strategies.</p>
        ) : loading ? (
          <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,200px)_1fr]">
            <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-muted/40" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-muted/30" />
              ))}
            </div>
          </div>
        ) : decided === 0 && agents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No custom strategies yet.</p>
            <Button size="sm" className="mt-4 rounded-xl" asChild>
              <Link to="/trading-experiment">Launch trading experiment</Link>
            </Button>
          </div>
        ) : (
          <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,200px)_1fr] lg:items-start">
            <div className={cn(overviewChartPanelShell, "flex flex-col items-center p-4")}>
              <div className={overviewChartTopShine} aria-hidden />
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Win rate
              </p>
              <ChartContainer config={winLossConfig} className="mx-auto h-[160px] w-full max-w-[180px] aspect-square">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={hasResolvedTrades ? 2 : 0}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                        const { cx, cy } = viewBox;
                        if (!hasResolvedTrades) {
                          return (
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan
                                x={cx}
                                y={(cy ?? 0) - 4}
                                className="fill-foreground text-xl font-semibold tabular-nums"
                              >
                                —
                              </tspan>
                              <tspan
                                x={cx}
                                y={(cy ?? 0) + 14}
                                className="fill-muted-foreground text-[9px] font-medium"
                              >
                                {open > 0 ? `${open} open` : "No closes"}
                              </tspan>
                            </text>
                          );
                        }
                        return (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan
                              x={cx}
                              y={(cy ?? 0) + 2}
                              className="fill-foreground text-2xl font-semibold tabular-nums"
                            >
                              {`${winRatePct.toFixed(0)}%`}
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="mt-3 flex w-full justify-center gap-4 text-[11px] text-muted-foreground">
                {hasResolvedTrades ? (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[hsl(142_71%_45%)]" aria-hidden />
                      Wins {wins}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive)/0.55)]" aria-hidden />
                      Losses {losses}
                    </span>
                  </>
                ) : (
                  <span className="text-center text-[11px] leading-snug">
                    Win rate unlocks after your first resolved trade
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {chartMode === "winRate"
                    ? "Win rate by strategy"
                    : chartMode === "open"
                      ? "Open positions by strategy"
                      : "Your strategies"}
                </p>
                {chartMode !== "winRate" ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {chartMode === "open"
                      ? "Strategies are live — closes will populate win rate"
                      : "Strategies deployed — waiting for signals and first close"}
                  </p>
                ) : null}
              </div>

              {strategyRows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/50 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                  Strategies created — waiting for first resolved trade.
                </p>
              ) : chartMode === "status" ? (
                <ul className="space-y-2">
                  {strategyRows.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/30 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{row.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {row.token}
                          {row.bar ? ` · ${row.bar}` : ""} · monitoring
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Active
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={cn(overviewChartPanelShell, "p-3 sm:p-4")}>
                  <div className={overviewChartTopShine} aria-hidden />
                  <ChartContainer
                    config={strategyBarConfig}
                    className="w-full aspect-auto"
                    style={{ height: Math.max(140, strategyRows.length * 48 + 40) }}
                  >
                    <BarChart
                      data={strategyRows}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                    >
                      <XAxis
                        type="number"
                        domain={chartMode === "winRate" ? [0, 100] : [0, openMax]}
                        hide
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={96}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, _name, item) => {
                              const row = item.payload as (typeof strategyRows)[number];
                              if (chartMode === "open") {
                                return (
                                  <span className="font-mono text-xs tabular-nums">
                                    {Number(value)} open · {row.token}
                                    {row.decided > 0 ? ` · ${row.wins}W/${row.losses}L` : ""}
                                  </span>
                                );
                              }
                              return (
                                <span className="font-mono text-xs tabular-nums">
                                  {Number(value).toFixed(0)}% · {row.wins}W/{row.losses}L · {row.token}
                                </span>
                              );
                            }}
                          />
                        }
                      />
                      {chartMode === "winRate" ? (
                        <Bar dataKey="winRatePct" radius={[0, 6, 6, 0]} maxBarSize={24} minPointSize={4}>
                          {strategyRows.map((row) => (
                            <Cell key={row.id} fill={winRateFill(row.winRatePct, row.decided)} />
                          ))}
                        </Bar>
                      ) : (
                        <Bar
                          dataKey="openPositions"
                          fill="var(--color-open)"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={24}
                          minPointSize={8}
                        />
                      )}
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </article>
  );
}
