import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { fetchKpi, type KpiResponse } from "../api/kpi";
import { LoadingState } from "../components/LoadingState";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

function useKpi() {
  return useQuery({
    queryKey: ["kpi"],
    queryFn: fetchKpi,
    refetchInterval: 60_000,
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

/** Compute week-over-week and month-over-month growth from daily counts */
function growthFromDaily(
  daily: { date: string; count: number }[],
  daysBack: number
): { prevSum: number; currSum: number; pctChange: number } {
  if (daily.length < daysBack * 2) {
    return { prevSum: 0, currSum: 0, pctChange: 0 };
  }
  const sorted = [...daily].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const curr = sorted.slice(-daysBack);
  const prev = sorted.slice(-daysBack * 2, -daysBack);
  const currSum = curr.reduce((s, d) => s + d.count, 0);
  const prevSum = prev.reduce((s, d) => s + d.count, 0);
  const pctChange =
    prevSum > 0 ? ((currSum - prevSum) / prevSum) * 100 : 0;
  return { prevSum, currSum, pctChange };
}

function GrowthInsightsContent({ data }: { data: KpiResponse }) {
  const {
    totalPaidApiCalls,
    paidApiCallsLast7Days,
    paidApiCallsLast30Days,
    completedPaidToolCalls,
    chatsWithPaidToolUse,
    byPath,
    dailyPaidCalls,
    kpiTargets,
    insights,
    updatedAt,
  } = data;

  const wow = growthFromDaily(dailyPaidCalls, 7);
  const mom = growthFromDaily(dailyPaidCalls, 30);

  const paidProgress =
    kpiTargets.paidApiCalls > 0
      ? Math.min(100, (totalPaidApiCalls / kpiTargets.paidApiCalls) * 100)
      : 0;
  const agentProgress =
    kpiTargets.agentSessions > 0
      ? Math.min(100, (chatsWithPaidToolUse / kpiTargets.agentSessions) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      <header className="flex flex-col gap-2 border-b border-gray-800 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Growth & insights
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Syra usage trends, KPI progress, and adoption metrics. Last updated:{" "}
            {new Date(updatedAt).toLocaleString()}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/60 px-3 py-2 text-sm font-medium text-gray-300 hover:border-syra-primary/50 hover:bg-gray-800 hover:text-white"
        >
          ← Overview
        </Link>
      </header>

      {/* Growth at a glance */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Growth at a glance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Paid calls (7d)" subtitle="x402 API">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-syra-primary">
                {paidApiCallsLast7Days.toLocaleString()}
              </span>
              {wow.pctChange !== 0 && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    wow.pctChange > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {wow.pctChange > 0 ? "+" : ""}
                  {wow.pctChange.toFixed(1)}% WoW
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Previous 7d: {wow.prevSum.toLocaleString()}
            </p>
          </Card>
          <Card title="Paid calls (30d)" subtitle="x402 API">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-syra-primary">
                {paidApiCallsLast30Days.toLocaleString()}
              </span>
              {mom.pctChange !== 0 && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    mom.pctChange > 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {mom.pctChange > 0 ? "+" : ""}
                  {mom.pctChange.toFixed(1)}% MoM
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Previous 30d: {mom.prevSum.toLocaleString()}
            </p>
          </Card>
          <Card title="Agent sessions" subtitle="Chats with paid tool use">
            <span className="text-2xl font-semibold text-syra-primary">
              {chatsWithPaidToolUse.toLocaleString()}
            </span>
            <p className="mt-1 text-xs text-gray-500">
              Completed paid tool calls: {completedPaidToolCalls.toLocaleString()}
            </p>
          </Card>
          <Card title="Total paid calls" subtitle="All-time x402">
            <span className="text-2xl font-semibold text-syra-primary">
              {totalPaidApiCalls.toLocaleString()}
            </span>
          </Card>
        </div>
      </section>

      {/* KPI goals */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          KPI targets
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card
            title="Paid API calls"
            subtitle={`Target: ${kpiTargets.paidApiCalls.toLocaleString()}`}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="font-medium text-white">
                  {totalPaidApiCalls.toLocaleString()} /{" "}
                  {kpiTargets.paidApiCalls.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-syra-primary transition-all"
                  style={{ width: `${Math.min(100, paidProgress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {paidProgress >= 100
                  ? "Target reached"
                  : `${(100 - paidProgress).toFixed(0)}% to target`}
              </p>
            </div>
          </Card>
          <Card
            title="Agent sessions (chats with paid use)"
            subtitle={`Target: ${kpiTargets.agentSessions.toLocaleString()}`}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="font-medium text-white">
                  {chatsWithPaidToolUse.toLocaleString()} /{" "}
                  {kpiTargets.agentSessions.toLocaleString()}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-syra-accent transition-all"
                  style={{ width: `${Math.min(100, agentProgress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {agentProgress >= 100
                  ? "Target reached"
                  : `${(100 - agentProgress).toFixed(0)}% to target`}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Usage by endpoint */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Usage by endpoint
        </h2>
        <Card subtitle="Top x402 endpoints by paid calls">
          {byPath.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No data yet.</p>
          ) : (
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byPath.slice(0, 12).map(({ path, count }) => ({
                    name: path.replace(/^\//, "").slice(0, 24),
                    count,
                    fullPath: path,
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1117",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, _name, props) => [
                      value.toLocaleString(),
                      props.payload?.fullPath ?? "",
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      {/* Paid calls trend */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Paid API calls trend (30d)
        </h2>
        <Card>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyPaidCalls}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1117",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(v: string) =>
                    new Date(v).toLocaleDateString()
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  dot={{ fill: "#00d4ff", r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* All requests (if insights available) */}
      {insights && insights.dailyRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            All requests (x402 + non-x402)
          </h2>
          <Card subtitle="Last 30 days">
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={insights.dailyRequests}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9ca3af", fontSize: 10 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f1117",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(v: string) =>
                      new Date(v).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: "#a78bfa", r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {/* Market context placeholder for future */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          More insight
        </h2>
        <Card
          title="Research & strategy"
          subtitle="Growth strategy, competitors, and market signals"
        >
          <p className="text-sm text-gray-400">
            Use the <strong className="text-gray-300">Research</strong> page for
            X search panels (growth strategy, competitors, adoption, trends) and
            executive summaries. Combine with this page for full Syra growth
            insight.
          </p>
          <Link
            to="/research"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-syra-primary hover:underline"
          >
            Open Research →
          </Link>
        </Card>
      </section>
    </div>
  );
}

export function InsightsPage() {
  const { data, isLoading, error } = useKpi();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
        <LoadingState message="Loading insights…" size="lg" />
      </div>
    );
  }

  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200 sm:p-6">
          <p className="font-semibold">Failed to load insights</p>
          <p className="mt-2 text-sm">{msg}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-syra-primary hover:underline">
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">No data.</p>
      </div>
    );
  }

  return <GrowthInsightsContent data={data} />;
}
