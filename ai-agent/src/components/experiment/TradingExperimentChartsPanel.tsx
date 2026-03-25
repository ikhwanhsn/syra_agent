import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TradingExperimentAgentStats, TradingExperimentRunRow } from "@/lib/tradingExperimentApi";
import { TradingExperimentBubbleField } from "@/components/experiment/TradingExperimentBubbleField";

type Props = {
  agents: TradingExperimentAgentStats[];
  chartRuns: TradingExperimentRunRow[];
  loading: boolean;
  agentProfileHref: (agentId: number) => string;
};

const winRateConfig = {
  winRate: {
    label: "Win rate",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const wlConfig = {
  Wins: { label: "Wins", color: "hsl(142 70% 45%)" },
  Losses: { label: "Losses", color: "hsl(0 70% 50%)" },
} satisfies ChartConfig;

const statusConfig = {
  count: { label: "Runs", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const activityConfig = {
  wins: { label: "Wins", color: "hsl(142 70% 45%)" },
  losses: { label: "Losses", color: "hsl(0 70% 50%)" },
  open: { label: "Open", color: "hsl(38 92% 50%)" },
  other: { label: "Other", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const STATUS_COLORS: Record<string, string> = {
  win: "hsl(142 70% 45%)",
  loss: "hsl(0 70% 50%)",
  open: "hsl(38 92% 50%)",
  expired: "hsl(240 5% 55%)",
  skipped_non_buy: "hsl(240 10% 40%)",
  skipped_invalid_levels: "hsl(240 10% 35%)",
  error: "hsl(280 60% 50%)",
};

function shortAgentLabel(a: TradingExperimentAgentStats) {
  const name = a.name.length > 18 ? `${a.name.slice(0, 16)}…` : a.name;
  return `#${a.agentId} ${name}`;
}

export function TradingExperimentChartsPanel({ agents, chartRuns, loading, agentProfileHref }: Props) {
  const winRateRows = useMemo(
    () =>
      [...agents]
        .sort((a, b) => (b.winRatePct ?? -1) - (a.winRatePct ?? -1))
        .map((a) => ({
          label: shortAgentLabel(a),
          agentId: a.agentId,
          winRatePct: a.decided > 0 && a.winRatePct != null ? a.winRatePct : 0,
          decided: a.decided,
          displayPct: a.decided > 0 && a.winRatePct != null ? `${a.winRatePct}%` : "—",
        })),
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
      { name: "Wins" as const, value: w, fill: "hsl(142 70% 45%)" },
      { name: "Losses" as const, value: l, fill: "hsl(0 70% 50%)" },
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

  const openTotal = useMemo(() => agents.reduce((s, a) => s + a.openPositions, 0), [agents]);

  const maxDecided = useMemo(() => Math.max(1, ...agents.map((a) => a.decided)), [agents]);

  const bubbleFieldBubbles = useMemo(
    () =>
      agents.map((a) => {
        const winRatePct = a.winRatePct;
        const decided = a.decided;
        const normalized = decided / maxDecided;
        const radius = 26 + normalized * 64;

        return {
          id: a.agentId,
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

  if (loading && agents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">Loading chart data…</p>
    );
  }

  if (agents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-lg">
        No agents in this suite yet.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
        Visual summary for the selected experiment. Win rates use{" "}
        <strong className="text-foreground">closed</strong> trades only. The status chart and timeline use up to the{" "}
        <strong className="text-foreground">200 most recent runs</strong> in this suite (all agents).
      </p>

      <TradingExperimentBubbleField
        bubbles={bubbleFieldBubbles}
        isLoading={loading}
        getAgentHref={agentProfileHref}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Win rate by agent</h3>
        <p className="text-xs text-muted-foreground">
          Sorted by win %. Agents with no resolved outcomes show 0% bar; hover for record. Click name in table below
          for profile.
        </p>
        <div className="rounded-xl border border-border bg-card/50 p-2 sm:p-4 overflow-x-auto">
          <ChartContainer config={winRateConfig} className="h-[min(420px,70vh)] w-full min-w-[320px] aspect-auto">
            <BarChart
              data={winRateRows}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
              <YAxis
                type="category"
                dataKey="label"
                width={148}
                tick={{ fontSize: 10 }}
                interval={0}
                className="text-xs"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { displayPct?: string; decided?: number } | undefined;
                      if (p?.decided === 0) return "No resolved outcomes yet";
                      return `${p?.displayPct ?? "—"} · ${p?.decided ?? 0} decided`;
                    }}
                  />
                }
              />
              <Bar dataKey="winRatePct" name="winRate" fill="var(--color-winRate)" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ChartContainer>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {winRateRows.map((r) => (
            <li key={r.agentId}>
              <Link to={agentProfileHref(r.agentId)} className="text-primary hover:underline underline-offset-2">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Closed outcomes (suite total)</h3>
          <p className="text-xs text-muted-foreground">
            Sum of wins vs losses across all agents. Open positions:{" "}
            <strong className="text-foreground">{openTotal}</strong> (not shown here).
          </p>
          {aggregateWl.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">No wins or losses yet.</p>
          ) : (
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <ChartContainer config={wlConfig} className="h-[260px] w-full mx-auto aspect-auto max-w-[320px]">
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
          <h3 className="text-sm font-semibold">Run status (recent sample)</h3>
          <p className="text-xs text-muted-foreground">Counts from latest fetched batch of runs.</p>
          {statusBars.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">No runs in sample.</p>
          ) : (
            <div className="rounded-xl border border-border bg-card/50 p-2 sm:p-4">
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
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Activity by day</h3>
        <p className="text-xs text-muted-foreground">
          Stacked run counts per calendar day (UTC) from the recent sample, up to 16 days.
        </p>
        {dailyActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            No dated runs in sample.
          </p>
        ) : (
          <div className="rounded-xl border border-border bg-card/50 p-2 sm:p-4">
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
        )}
      </section>
    </div>
  );
}
