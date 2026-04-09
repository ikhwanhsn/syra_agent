import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { fetchKpiExtended, type KpiExtendedResponse } from "../api/kpiExtended";
import { LoadingState } from "../components/LoadingState";
import { cn } from "../lib/utils";
import { chartTheme } from "../lib/chartTheme";
import { Link } from "react-router-dom";

function useKpiExtended() {
  return useQuery({
    queryKey: ["kpi-extended"],
    queryFn: fetchKpiExtended,
    refetchInterval: 120_000,
  });
}

function Card({
  className,
  title,
  subtitle,
  children,
}: {
  className?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-800 bg-syra-card p-4 shadow-sm sm:p-6",
        className
      )}
    >
      {title && (
        <div className="mb-3 sm:mb-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-400">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  changeLabel,
  sub,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  sub?: string;
  accent?: "primary" | "accent" | "success";
}) {
  const accentColors = {
    primary: "text-syra-primary",
    accent: "text-syra-accent",
    success: "text-success",
  };
  return (
    <Card>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold sm:text-3xl", accentColors[accent])}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {change != null && change !== 0 && (
          <span
            className={cn(
              "text-sm font-medium",
              change > 0 ? "text-success" : "text-destructive"
            )}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
            {changeLabel && <span className="ml-1 text-gray-500">{changeLabel}</span>}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </Card>
  );
}

function mergeDailyBySource(data: KpiExtendedResponse["revenue"]["dailyBySource"]) {
  const byDate: Record<string, { date: string; api: number; agent: number; total: number }> = {};
  for (const d of data) {
    if (!byDate[d.date]) byDate[d.date] = { date: d.date, api: 0, agent: 0, total: 0 };
    if (d.source === "agent") byDate[d.date].agent += d.count;
    else byDate[d.date].api += d.count;
    byDate[d.date].total += d.count;
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function RevenueContent({ data }: { data: KpiExtendedResponse }) {
  const { revenue, conversion } = data;
  const dailyMerged = mergeDailyBySource(revenue.dailyBySource);

  const totalApiCalls = revenue.bySource.find((s) => s.source === "api")?.count ?? 0;
  const totalAgentCalls = revenue.bySource.find((s) => s.source === "agent")?.count ?? 0;
  const grandTotal = totalApiCalls + totalAgentCalls;

  const sourceData = revenue.bySource.map((s) => ({
    name: s.source === "agent" ? "Agent" : "Direct API",
    value: s.count,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-6">
      <header className="flex flex-col gap-2 border-b border-gray-800 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Revenue & monetization</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            x402 paid API usage, revenue trends, and conversion. Last updated:{" "}
            {new Date(data.updatedAt).toLocaleString()}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/60 px-3 py-2 text-sm font-medium text-gray-300 hover:border-syra-primary/50 hover:bg-gray-800 hover:text-white"
        >
          ← Overview
        </Link>
      </header>

      {/* Hero metrics */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">Revenue overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total paid calls (all-time)"
            value={grandTotal}
            accent="primary"
          />
          <MetricCard
            label="Paid calls (30d)"
            value={revenue.paidCurr30d}
            change={revenue.growthPct}
            changeLabel="MoM"
            sub={`Previous 30d: ${revenue.paidPrev30d.toLocaleString()}`}
            accent="success"
          />
          <MetricCard
            label="Conversion rate (30d)"
            value={`${conversion.conversionRate}%`}
            sub={`${conversion.paidRequests30d.toLocaleString()} paid / ${conversion.totalRequests30d.toLocaleString()} total`}
            accent="accent"
          />
          <MetricCard
            label="Paid today (hourly)"
            value={revenue.hourlyToday.reduce((s, h) => s + h.count, 0)}
            sub={`${revenue.hourlyToday.length} active hours`}
            accent="primary"
          />
        </div>
      </section>

      {/* Revenue trend by source */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Daily paid calls by source (30d)
        </h2>
        <Card>
          {dailyMerged.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No data yet.</p>
          ) : (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyMerged} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: chartTheme.tick, fontSize: 10 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={chartTheme.tooltipContentStyle}
                    labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="api" stackId="1" stroke={chartTheme.series[0]} fill={chartTheme.series[0]} fillOpacity={0.3} name="Direct API" />
                  <Area type="monotone" dataKey="agent" stackId="1" stroke={chartTheme.series[2]} fill={chartTheme.series[2]} fillOpacity={0.3} name="Agent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by source pie */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Revenue split by source
          </h2>
          <Card>
            {sourceData.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No data yet.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="h-48 w-48 sm:h-56 sm:w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sourceData.map((_, i) => (
                          <Cell key={i} fill={chartTheme.pie[i % chartTheme.pie.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTheme.tooltipContentStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {sourceData.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: chartTheme.pie[i % chartTheme.pie.length] }}
                      />
                      <span className="text-sm text-gray-300">
                        {s.name}: <span className="font-medium text-white">{s.value.toLocaleString()}</span>
                        <span className="ml-1 text-gray-500">
                          ({grandTotal > 0 ? ((s.value / grandTotal) * 100).toFixed(1) : 0}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Hourly activity today */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Hourly activity today
          </h2>
          <Card>
            {revenue.hourlyToday.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No paid calls yet today.</p>
            ) : (
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue.hourlyToday} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: chartTheme.tick, fontSize: 9 }}
                      tickFormatter={(v: string) => v.slice(11, 16)}
                    />
                    <YAxis tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                    <Tooltip
                      contentStyle={chartTheme.tooltipContentStyle}
                      labelFormatter={(v: string) => v.slice(11, 16)}
                    />
                    <Bar dataKey="count" fill={chartTheme.series[1]} radius={[4, 4, 0, 0]} name="Paid calls" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Top endpoints by revenue */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Top endpoints by paid calls (30d)
        </h2>
        <Card>
          {revenue.byPathAndSource.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="pb-2 pr-4 font-medium">Endpoint</th>
                    <th className="pb-2 pr-4 font-medium">Source</th>
                    <th className="pb-2 pr-4 font-medium text-right">Calls</th>
                    <th className="pb-2 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.byPathAndSource.slice(0, 20).map(({ path, source, count }, i) => (
                    <tr key={`${path}-${source}-${i}`} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 font-mono text-gray-300">{path}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            source === "agent"
                              ? "bg-secondary/40 text-secondary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {source === "agent" ? "Agent" : "API"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-medium text-syra-primary">{count.toLocaleString()}</td>
                      <td className="py-2 text-right text-gray-400">
                        {revenue.paidCurr30d > 0 ? ((count / revenue.paidCurr30d) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Conversion funnel */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Conversion funnel (30d)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <span className="text-xs text-gray-500">Total API requests</span>
            <p className="mt-1 text-2xl font-bold text-white">{conversion.totalRequests30d.toLocaleString()}</p>
          </Card>
          <Card className="border-l-4 border-l-ring">
            <span className="text-xs text-gray-500">Paid requests (x402)</span>
            <p className="mt-1 text-2xl font-bold text-white">{conversion.paidRequests30d.toLocaleString()}</p>
          </Card>
          <Card className="border-l-4 border-l-success">
            <span className="text-xs text-gray-500">Conversion rate</span>
            <p className="mt-1 text-2xl font-bold text-success">{conversion.conversionRate}%</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export function RevenuePage() {
  const { data, isLoading, error } = useKpiExtended();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
        <LoadingState message="Loading revenue data..." size="lg" />
      </div>
    );
  }

  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive sm:p-6">
          <p className="font-semibold">Failed to load revenue data</p>
          <p className="mt-2 text-sm">{msg}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-syra-primary hover:underline">
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-400">No data.</p></div>;

  return <RevenueContent data={data} />;
}
