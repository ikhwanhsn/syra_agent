import { useId, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, Trophy } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  encodeExperimentLabAgentId,
  type TradingExperimentAgentStats,
  type TradingExperimentRunRow,
} from "@/lib/tradingExperimentApi";
import { TradingExperimentBubbleField } from "@/components/experiment/TradingExperimentBubbleField";
import { cn } from "@/lib/utils";

type Props = {
  agents: TradingExperimentAgentStats[];
  chartRuns: TradingExperimentRunRow[];
  loading: boolean;
  /** Encoded id from {@link encodeExperimentLabAgentId} (unique across merged ledgers). */
  agentProfileHref: (encodedLabAgentId: number) => string;
  /** When agents is empty, overrides the default empty copy (e.g. chart filters). */
  emptyMessage?: string;
};

const winRateConfig = {
  winRate: {
    label: "Win rate",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const wlConfig = {
  Wins: { label: "Wins", color: "hsl(var(--foreground))" },
  Losses: { label: "Losses", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const statusConfig = {
  count: { label: "Runs", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const activityConfig = {
  wins: { label: "Wins", color: "hsl(var(--foreground))" },
  losses: { label: "Losses", color: "hsl(var(--muted-foreground))" },
  open: { label: "Open", color: "hsl(var(--ring))" },
  other: { label: "Other", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const STATUS_COLORS: Record<string, string> = {
  win: "hsl(var(--foreground))",
  loss: "hsl(var(--muted-foreground))",
  open: "hsl(var(--ring))",
  expired: "hsl(0 0% 48%)",
  skipped_invalid_levels: "hsl(0 0% 35%)",
  error: "hsl(var(--destructive))",
};

/** Truncate less aggressively when the chart allocates wider Y-axis space. */
function shortAgentLabel(a: TradingExperimentAgentStats) {
  const name = a.name.length > 26 ? `${a.name.slice(0, 24)}…` : a.name;
  return `#${a.agentId} ${name}`;
}

const WIN_RATE_ROW_PX = 46;
const WIN_RATE_CHART_VERTICAL_PAD = 80;
const WIN_RATE_CHART_MAX_PX = 2200;

function winRateBarFillKey(pct: number, decided: number): "muted" | "rose" | "amber" | "emerald" {
  if (decided <= 0) return "muted";
  if (pct < 42) return "rose";
  if (pct < 55) return "amber";
  return "emerald";
}

function winRateBarGradientUrls(gradPrefix: string): Record<"muted" | "rose" | "amber" | "emerald", string> {
  return {
    muted: `url(#${gradPrefix}-muted)`,
    rose: `url(#${gradPrefix}-rose)`,
    amber: `url(#${gradPrefix}-amber)`,
    emerald: `url(#${gradPrefix}-emerald)`,
  };
}

export function TradingExperimentChartsPanel({
  agents,
  chartRuns,
  loading,
  agentProfileHref,
  emptyMessage,
}: Props) {
  const winRateRows = useMemo(
    () =>
      [...agents]
        .sort((a, b) => (b.winRatePct ?? -1) - (a.winRatePct ?? -1))
        .map((a) => {
          const suite = a.experimentSuite ?? "primary";
          return {
            rowKey: `${suite}-${a.agentId}`,
            encodedId: encodeExperimentLabAgentId(suite, a.agentId),
            label: shortAgentLabel(a),
            agentId: a.agentId,
            winRatePct: a.decided > 0 && a.winRatePct != null ? a.winRatePct : 0,
            decided: a.decided,
            displayPct: a.decided > 0 && a.winRatePct != null ? `${a.winRatePct}%` : "—",
          };
        }),
    [agents],
  );

  const aggregateWl = useMemo(() => {
    let w = 0;
    let l = 0;
    for (const a of agents) {
      w += a.wins;
      l += a.losses;
    }
    return [
      { name: "Wins" as const, value: w, fill: "hsl(var(--foreground))" },
      { name: "Losses" as const, value: l, fill: "hsl(var(--muted-foreground))" },
    ].filter((x) => x.value > 0);
  }, [agents]);

  const statusBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of chartRuns) {
      const s = r.status || "unknown";
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status: status.replace(/_/g, " "), count, raw: status }))
      .sort((a, b) => b.count - a.count);
  }, [chartRuns]);

  const dailyActivity = useMemo(() => {
    const map = new Map<
      string,
      { day: string; wins: number; losses: number; open: number; other: number; total: number }
    >();
    for (const r of chartRuns) {
      if (!r.createdAt) continue;
      const day = new Date(r.createdAt).toISOString().slice(0, 10);
      if (!map.has(day)) {
        map.set(day, { day, wins: 0, losses: 0, open: 0, other: 0, total: 0 });
      }
      const row = map.get(day)!;
      row.total += 1;
      if (r.status === "win") row.wins += 1;
      else if (r.status === "loss") row.losses += 1;
      else if (r.status === "open") row.open += 1;
      else row.other += 1;
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
    return sorted.slice(-16);
  }, [chartRuns]);

  const maxDecided = useMemo(() => Math.max(1, ...agents.map((a) => a.decided)), [agents]);

  const bubbleFieldBubbles = useMemo(
    () =>
      agents.map((a) => {
        const winRatePct = a.winRatePct;
        const decided = a.decided;
        const normalized = decided / maxDecided;
        const radius = 26 + normalized * 64;
        const suite = a.experimentSuite ?? "primary";

        return {
          id: encodeExperimentLabAgentId(suite, a.agentId),
          displayAgentId: a.agentId,
          label: shortAgentLabel(a),
          token: a.token,
          winRatePct,
          openPositions: a.openPositions,
          decided,
          radius,
        };
      }),
    [agents, maxDecided],
  );

  const winRateChartHeight = useMemo(() => {
    const n = Math.max(1, winRateRows.length);
    return Math.min(
      WIN_RATE_CHART_MAX_PX,
      Math.max(
        WIN_RATE_ROW_PX * 5 + WIN_RATE_CHART_VERTICAL_PAD,
        n * WIN_RATE_ROW_PX + WIN_RATE_CHART_VERTICAL_PAD,
      ),
    );
  }, [winRateRows.length]);

  const winRateYAxisWidth = useMemo(() => {
    let maxLen = 14;
    for (const r of winRateRows) {
      if (r.label.length > maxLen) maxLen = r.label.length;
    }
    return Math.min(288, Math.max(172, Math.round(maxLen * 7.4 + 32)));
  }, [winRateRows]);

  const winRateGradId = useId().replace(/:/g, "");
  const winRateBarFills = useMemo(() => winRateBarGradientUrls(winRateGradId), [winRateGradId]);

  if (loading && agents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-20 text-center shadow-inner">
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-muted-foreground" aria-hidden />
        <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">Loading chart data</p>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">Preparing the bubble map and aggregates…</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-20 text-center shadow-inner">
        <Trophy className="mx-auto h-10 w-10 text-muted-foreground/35" aria-hidden />
        <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">Nothing to chart yet</p>
        <p className="mt-1.5 max-w-md mx-auto text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {emptyMessage ?? "No agents loaded yet."}
        </p>
      </div>
    );
  }

  const chartShell =
    "relative overflow-hidden rounded-2xl border border-border/60 bg-card/45 shadow-lg shadow-black/[0.06] backdrop-blur-sm dark:bg-card/35 dark:shadow-black/40";

  return (
    <div className="space-y-10">
      <TradingExperimentBubbleField
        bubbles={bubbleFieldBubbles}
        isLoading={loading}
        getAgentHref={agentProfileHref}
      />

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500/90 dark:text-emerald-400/90">
              Performance
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Win rate by agent</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Sorted by win rate. Bars are color-coded by outcome quality; the dashed line marks 50%. Hover a bar for
              resolved counts, or use the index below to open an agent.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground sm:justify-end">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-gradient-to-r from-teal-300 to-emerald-600" aria-hidden />
              55%+
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-gradient-to-r from-amber-200 to-amber-600" aria-hidden />
              42–54%
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-gradient-to-r from-rose-300 to-rose-600" aria-hidden />
              Under 42%
            </span>
          </div>
        </div>
        <div className={cn(chartShell, "shadow-[0_32px_64px_-28px_rgba(0,0,0,0.45)] dark:shadow-[0_36px_72px_-24px_rgba(0,0,0,0.75)]")}>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            aria-hidden
          />
          <div className="max-h-[min(88vh,2200px)] overflow-y-auto overflow-x-auto overscroll-contain [scrollbar-width:thin]">
            <ChartContainer
              config={winRateConfig}
              className={cn(
                "w-full min-w-[min(100%,520px)] aspect-auto",
                "[&_.recharts-cartesian-axis-tick_text]:fill-foreground/80 [&_.recharts-cartesian-axis-tick_text]:text-[11px]",
                "[&_.recharts-cartesian-axis-tick_text]:font-medium",
              )}
              style={{ height: winRateChartHeight, minHeight: winRateChartHeight }}
            >
              <BarChart
                data={winRateRows}
                layout="vertical"
                margin={{ top: 16, right: 28, left: 8, bottom: 16 }}
                barCategoryGap="18%"
              >
                <defs>
                  <linearGradient id={`${winRateGradId}-emerald`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5eead4" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id={`${winRateGradId}-amber`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id={`${winRateGradId}-rose`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  <linearGradient id={`${winRateGradId}-muted`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="4 6" className="stroke-border/35" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="tabular-nums"
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={winRateYAxisWidth}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  interval={0}
                />
                <ReferenceLine
                  x={50}
                  stroke="hsl(var(--border))"
                  strokeDasharray="5 5"
                  strokeOpacity={0.85}
                />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.25)" }}
                  content={
                    <ChartTooltipContent
                      className="border-border/60 bg-popover/95 shadow-xl backdrop-blur-md"
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { displayPct?: string; decided?: number } | undefined;
                        if (p?.decided === 0) return "No resolved outcomes yet";
                        return `${p?.displayPct ?? "—"} · ${p?.decided ?? 0} decided`;
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="winRatePct"
                  name="winRate"
                  radius={[0, 7, 7, 0]}
                  barSize={20}
                  stroke="hsl(var(--background) / 0.4)"
                  strokeWidth={1}
                >
                  {winRateRows.map((row) => (
                    <Cell
                      key={row.rowKey}
                      fill={winRateBarFills[winRateBarFillKey(row.winRatePct, row.decided)]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-muted/10 p-4 shadow-sm sm:p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agent index</p>
          <ul className="grid max-h-[min(280px,42vh)] grid-cols-1 gap-2.5 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2 lg:grid-cols-3 [scrollbar-width:thin]">
            {winRateRows.map((r) => {
              const tier = winRateBarFillKey(r.winRatePct, r.decided);
              const tierRing =
                tier === "emerald"
                  ? "ring-emerald-500/25 hover:ring-emerald-500/40"
                  : tier === "amber"
                    ? "ring-amber-500/25 hover:ring-amber-500/40"
                    : tier === "rose"
                      ? "ring-rose-500/25 hover:ring-rose-500/40"
                      : "ring-border/40 hover:ring-border/60";
              return (
                <li key={r.rowKey}>
                  <Link
                    to={agentProfileHref(r.encodedId)}
                    className={cn(
                      "flex min-h-[2.85rem] items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-3.5 py-2.5 text-left text-sm text-foreground shadow-sm ring-1 ring-transparent backdrop-blur-sm transition-all duration-200",
                      "hover:-translate-y-px hover:border-primary/30 hover:bg-muted/40 hover:shadow-md",
                      tierRing,
                    )}
                  >
                    <span
                      className={cn(
                        "h-8 w-1 shrink-0 rounded-full bg-gradient-to-b",
                        tier === "emerald" && "from-teal-300 to-emerald-600",
                        tier === "amber" && "from-amber-200 to-amber-600",
                        tier === "rose" && "from-rose-300 to-rose-600",
                        tier === "muted" && "from-muted-foreground/40 to-muted-foreground/70",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium leading-snug tracking-tight">{r.label}</span>
                    <span className="shrink-0 rounded-lg bg-muted/90 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-foreground/90 ring-1 ring-border/40">
                      {r.displayPct}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Aggregate W / L</h3>
          {aggregateWl.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 bg-muted/10 py-10 text-center text-sm text-muted-foreground">
              No wins or losses yet.
            </p>
          ) : (
            <div className={cn(chartShell, "p-5 sm:p-6")}>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                aria-hidden
              />
              <ChartContainer config={wlConfig} className="relative mx-auto h-[260px] w-full max-w-[320px] aspect-auto">
                <PieChart>
                  <Pie
                    data={aggregateWl}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {aggregateWl.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Runs by status</h3>
          {statusBars.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 bg-muted/10 py-10 text-center text-sm text-muted-foreground">
              No runs in sample.
            </p>
          ) : (
            <div className={cn(chartShell)}>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
                aria-hidden
              />
              <div className="p-3 sm:p-4">
                <ChartContainer config={statusConfig} className="h-[260px] w-full aspect-auto">
                  <BarChart data={statusBars} margin={{ top: 8, right: 8, left: 4, bottom: 64 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="status" angle={-32} textAnchor="end" interval={0} height={72} tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} width={32} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {statusBars.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.raw] ?? "hsl(var(--muted-foreground))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Daily activity</h3>
        {dailyActivity.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-muted/10 py-10 text-center text-sm text-muted-foreground">
            No dated runs in sample.
          </p>
        ) : (
          <div className={cn(chartShell)}>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
              aria-hidden
            />
            <div className="p-3 sm:p-4">
              <ChartContainer config={activityConfig} className="h-[280px] w-full aspect-auto">
                <AreaChart data={dailyActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickMargin={8} />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="wins"
                    stackId="1"
                    stroke="var(--color-wins)"
                    fill="var(--color-wins)"
                    fillOpacity={0.85}
                  />
                  <Area
                    type="monotone"
                    dataKey="losses"
                    stackId="1"
                    stroke="var(--color-losses)"
                    fill="var(--color-losses)"
                    fillOpacity={0.85}
                  />
                  <Area
                    type="monotone"
                    dataKey="open"
                    stackId="1"
                    stroke="var(--color-open)"
                    fill="var(--color-open)"
                    fillOpacity={0.85}
                  />
                  <Area
                    type="monotone"
                    dataKey="other"
                    stackId="1"
                    stroke="var(--color-other)"
                    fill="var(--color-other)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
