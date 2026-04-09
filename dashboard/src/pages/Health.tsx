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
  ComposedChart,
  Area,
} from "recharts";
import { fetchKpiExtended, type KpiExtendedResponse } from "../api/kpiExtended";
import { LoadingState } from "../components/LoadingState";
import { cn } from "../lib/utils";
import { chartTheme, httpStatusColors } from "../lib/chartTheme";
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

function latencyBadge(ms: number) {
  if (ms < 200) return { label: "Excellent", color: "bg-success/15 text-success" };
  if (ms < 500) return { label: "Good", color: "bg-muted text-muted-foreground" };
  if (ms < 1000) return { label: "Moderate", color: "bg-warning/15 text-warning" };
  return { label: "Slow", color: "bg-destructive/15 text-destructive" };
}

function HealthContent({ data }: { data: KpiExtendedResponse }) {
  const { health, conversion } = data;

  const avgBadge = latencyBadge(health.avgLatency);
  const p95Badge = latencyBadge(health.p95Latency);
  const p99Badge = latencyBadge(health.p99Latency);

  const totalStatusCodes = health.statusCodeDistribution.reduce((s, d) => s + d.count, 0);
  const successCount = health.statusCodeDistribution.find((d) => d.status === "2xx")?.count ?? 0;
  const overallSuccessRate = totalStatusCodes > 0 ? Math.round((successCount / totalStatusCodes) * 10000) / 100 : 100;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-6">
      <header className="flex flex-col gap-2 border-b border-gray-800 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">System health</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            API reliability, latency, error rates, and performance. Last updated:{" "}
            {new Date(data.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/api-errors"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/60 px-3 py-2 text-sm font-medium text-gray-300 hover:border-syra-primary/50 hover:bg-gray-800 hover:text-white"
          >
            Error log →
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/60 px-3 py-2 text-sm font-medium text-gray-300 hover:border-syra-primary/50 hover:bg-gray-800 hover:text-white"
          >
            ← Overview
          </Link>
        </div>
      </header>

      {/* Health Hero */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">Performance overview (7d)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <span className="text-xs text-gray-500">Success rate</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold sm:text-3xl", overallSuccessRate >= 99 ? "text-success" : overallSuccessRate >= 95 ? "text-warning" : "text-destructive")}>
                {overallSuccessRate}%
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{successCount.toLocaleString()} / {totalStatusCodes.toLocaleString()} requests</p>
          </Card>
          <Card>
            <span className="text-xs text-gray-500">Avg latency</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-syra-primary sm:text-3xl">{health.avgLatency}ms</span>
              <span className={cn("rounded px-2 py-0.5 text-xs font-medium", avgBadge.color)}>{avgBadge.label}</span>
            </div>
          </Card>
          <Card>
            <span className="text-xs text-gray-500">P95 latency</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-syra-accent sm:text-3xl">{health.p95Latency}ms</span>
              <span className={cn("rounded px-2 py-0.5 text-xs font-medium", p95Badge.color)}>{p95Badge.label}</span>
            </div>
          </Card>
          <Card>
            <span className="text-xs text-gray-500">P99 latency</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-warning sm:text-3xl">{health.p99Latency}ms</span>
              <span className={cn("rounded px-2 py-0.5 text-xs font-medium", p99Badge.color)}>{p99Badge.label}</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Status code distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Status code distribution (7d)
          </h2>
          <Card>
            {health.statusCodeDistribution.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No data.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="h-48 w-48 sm:h-56 sm:w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={health.statusCodeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="status"
                      >
                        {health.statusCodeDistribution.map((entry) => (
                          <Cell key={entry.status} fill={httpStatusColors[entry.status] || "#52525b"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTheme.tooltipContentStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {health.statusCodeDistribution.map((d) => (
                    <div key={d.status} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: httpStatusColors[d.status] || "#52525b" }}
                      />
                      <span className="text-sm text-gray-300">
                        {d.status}: <span className="font-medium text-white">{d.count.toLocaleString()}</span>
                        <span className="ml-1 text-gray-500">
                          ({totalStatusCodes > 0 ? ((d.count / totalStatusCodes) * 100).toFixed(1) : 0}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Slowest endpoints */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Slowest endpoints (7d)
          </h2>
          <Card>
            {health.slowestEndpoints.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No latency data.</p>
            ) : (
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={health.slowestEndpoints.map((e) => ({
                      name: e.path.replace(/^\//, "").slice(0, 22),
                      avg: e.avgDuration,
                      max: e.maxDuration,
                      fullPath: e.path,
                    }))}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis type="number" tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                    <Tooltip
                      contentStyle={chartTheme.tooltipContentStyle}
                      formatter={(value: number, name: string) => [`${value}ms`, name === "avg" ? "Avg" : "Max"]}
                    />
                    <Bar dataKey="avg" fill={chartTheme.series[1]} radius={[0, 4, 4, 0]} name="Avg (ms)" />
                    <Bar dataKey="max" fill={chartTheme.series[3]} radius={[0, 4, 4, 0]} name="Max (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Daily error rate trend */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Error rate trend (30d)
        </h2>
        <Card>
          {health.dailyErrorRate.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No data.</p>
          ) : (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={health.dailyErrorRate} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: chartTheme.tick, fontSize: 10 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis yAxisId="left" tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: chartTheme.tick, fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={chartTheme.tooltipContentStyle}
                    labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="total" stroke={chartTheme.series[0]} fill={chartTheme.series[0]} fillOpacity={0.1} name="Total" />
                  <Bar yAxisId="left" dataKey="errors" fill={chartTheme.series[3]} fillOpacity={0.6} radius={[2, 2, 0, 0]} name="Errors" />
                  <Line yAxisId="right" type="monotone" dataKey="errorRate" stroke={chartTheme.series[2]} strokeWidth={2} dot={false} name="Error rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      {/* Error rate by endpoint */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Error rate by endpoint (7d)
        </h2>
        <Card>
          {health.errorRateByEndpoint.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No errors in the last 7 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="pb-2 pr-4 font-medium">Endpoint</th>
                    <th className="pb-2 pr-4 font-medium text-right">Total</th>
                    <th className="pb-2 pr-4 font-medium text-right">Errors</th>
                    <th className="pb-2 pr-4 font-medium text-right">Error rate</th>
                    <th className="pb-2 font-medium text-right">Avg latency</th>
                  </tr>
                </thead>
                <tbody>
                  {health.errorRateByEndpoint.map((e) => (
                    <tr key={e.path} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 font-mono text-gray-300">{e.path}</td>
                      <td className="py-2 pr-4 text-right text-white">{e.total.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right text-destructive">{e.errors.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            e.errorRate < 5
                              ? "bg-success/15 text-success"
                              : e.errorRate < 15
                                ? "bg-warning/15 text-warning"
                                : "bg-destructive/15 text-destructive"
                          )}
                        >
                          {e.errorRate}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-400">{e.avgDuration}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

export function HealthPage() {
  const { data, isLoading, error } = useKpiExtended();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
        <LoadingState message="Loading health data..." size="lg" />
      </div>
    );
  }

  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive sm:p-6">
          <p className="font-semibold">Failed to load health data</p>
          <p className="mt-2 text-sm">{msg}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-syra-primary hover:underline">
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-400">No data.</p></div>;

  return <HealthContent data={data} />;
}
