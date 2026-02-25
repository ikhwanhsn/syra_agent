import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchKpi, type KpiResponse } from "../api/kpi";
import { LoadingState } from "../components/LoadingState";
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
  children,
}: {
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-800 bg-syra-card p-4 shadow-sm sm:p-6",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  target,
}: {
  label: string;
  value: number;
  sub?: string;
  target?: number;
}) {
  const progress = target && target > 0 ? Math.min(100, (value / target) * 100) : null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xl font-semibold text-syra-primary sm:text-2xl">{value.toLocaleString()}</span>
      {sub != null && <span className="text-sm text-gray-400">{sub}</span>}
      {progress != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-syra-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

const defaultInsights: KpiResponse["insights"] = {
  totalRequestsLast24h: 0,
  totalRequestsLast7d: 0,
  totalRequestsLast30d: 0,
  errorCountLast7d: 0,
  errorCountLast30d: 0,
  requestsByPath: [],
  dailyRequests: [],
};

function DashboardContent({ data }: { data: KpiResponse }) {
  const {
    totalPaidApiCalls,
    paidApiCallsLast7Days,
    paidApiCallsLast30Days,
    completedPaidToolCalls,
    chatsWithPaidToolUse,
    byPath,
    dailyPaidCalls,
    kpiTargets,
    insights = defaultInsights,
    updatedAt,
  } = data;

  const paidProgress =
    kpiTargets.paidApiCalls > 0
      ? Math.min(100, (totalPaidApiCalls / kpiTargets.paidApiCalls) * 100)
      : 0;
  const agentProgress =
    kpiTargets.agentSessions > 0
      ? Math.min(100, (chatsWithPaidToolUse / kpiTargets.agentSessions) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-6">
      <header className="flex flex-col gap-2 border-b border-gray-800 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:pb-6">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Overview</h1>
        <p className="text-xs text-gray-500 sm:text-sm">
          Last updated: {new Date(updatedAt).toLocaleString()}
        </p>
      </header>

      {/* API request insights (volume, errors) — includes x402 and non-x402 */}
      {insights && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:mb-4 sm:text-lg">
            API request insights
            <span className="ml-2 text-xs font-normal text-gray-500">(x402 + non-x402)</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <StatCard label="Requests (24h)" value={insights.totalRequestsLast24h} />
            </Card>
            <Card>
              <StatCard label="Requests (7d)" value={insights.totalRequestsLast7d} />
            </Card>
            <Card>
              <StatCard label="Requests (30d)" value={insights.totalRequestsLast30d} />
            </Card>
            <Card>
              <StatCard
                label="Errors (7d)"
                value={insights.errorCountLast7d}
                sub={insights.totalRequestsLast7d > 0 ? `${((insights.errorCountLast7d / insights.totalRequestsLast7d) * 100).toFixed(1)}% error rate` : undefined}
              />
              {insights.errorCountLast7d > 0 && (
                <Link
                  to="/api-errors?days=7"
                  className="mt-2 block text-xs text-syra-primary hover:underline"
                >
                  View details →
                </Link>
              )}
            </Card>
            <Card>
              <StatCard
                label="Errors (30d)"
                value={insights.errorCountLast30d}
                sub={insights.totalRequestsLast30d > 0 ? `${((insights.errorCountLast30d / insights.totalRequestsLast30d) * 100).toFixed(1)}% error rate` : undefined}
              />
              {insights.errorCountLast30d > 0 && (
                <Link
                  to="/api-errors?days=30"
                  className="mt-2 block text-xs text-syra-primary hover:underline"
                >
                  View details →
                </Link>
              )}
            </Card>
          </div>
          {insights.dailyRequests.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-medium text-gray-400">All requests (last 30 days)</h3>
              <Card>
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
                        labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6", r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
          {insights.requestsByPath.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-medium text-gray-400">Requests by path (with avg latency)</h3>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-gray-400">
                        <th className="pb-2 pr-4 font-medium">Path</th>
                        <th className="pb-2 pr-4 font-medium">Count</th>
                        <th className="pb-2 font-medium">Avg (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.requestsByPath.map(({ path: p, count, avgDurationMs }) => (
                        <tr key={p} className="border-b border-gray-800/80">
                          <td className="py-2 pr-4 font-mono text-gray-300">{p}</td>
                          <td className="py-2 pr-4 text-syra-primary">{count.toLocaleString()}</td>
                          <td className="py-2 text-gray-400">{avgDurationMs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </section>
      )}

      {/* Usage: summary cards (x402 API) */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:mb-4 sm:text-lg">
          Usage (paid){" "}
          <span className="inline-flex rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
            x402 API
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <StatCard label="Total paid API calls (x402)" value={totalPaidApiCalls} />
          </Card>
          <Card>
            <StatCard
              label="Paid API calls — 7d (x402)"
              value={paidApiCallsLast7Days}
            />
          </Card>
          <Card>
            <StatCard
              label="Paid API calls — 30d (x402)"
              value={paidApiCallsLast30Days}
            />
          </Card>
          <Card>
            <StatCard
              label="Completed paid tool calls (agent)"
              value={completedPaidToolCalls}
              sub={`${chatsWithPaidToolUse} chats with paid tool use`}
            />
          </Card>
        </div>
      </section>

      {/* Daily paid calls chart (x402) */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:mb-4 sm:text-lg">
          Paid API calls (last 30 days){" "}
          <span className="inline-flex rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
            x402
          </span>
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
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1117",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  dot={{ fill: "#00d4ff", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Top endpoints (byPath) — all x402 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:mb-4 sm:text-lg">
          Top endpoints by paid calls{" "}
          <span className="inline-flex rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
            x402 API
          </span>
        </h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Path</th>
                  <th className="pb-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {byPath.map(({ path: p, count }) => (
                  <tr key={p} className="border-b border-gray-800/80">
                    <td className="py-2 pr-4 font-mono text-gray-300">{p}</td>
                    <td className="py-2 text-syra-primary">{count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {byPath.length === 0 && (
              <p className="py-4 text-center text-gray-500">No data yet.</p>
            )}
          </div>
        </Card>
      </section>

      {/* Growth: KPI targets */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:mb-4 sm:text-lg">Growth vs KPI targets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card title="Paid API calls (x402)">
            <StatCard
              label="Current vs target"
              value={totalPaidApiCalls}
              sub={`Target: ${kpiTargets.paidApiCalls.toLocaleString()}`}
              target={kpiTargets.paidApiCalls}
            />
            <p className="mt-2 text-xs text-gray-500">
              {paidProgress >= 100
                ? "Target reached"
                : `${Math.round(100 - paidProgress)}% to target`}
            </p>
          </Card>
          <Card title="Agent sessions (chats with paid tool use)">
            <StatCard
              label="Current vs target"
              value={chatsWithPaidToolUse}
              sub={`Target: ${kpiTargets.agentSessions.toLocaleString()}`}
              target={kpiTargets.agentSessions}
            />
            <p className="mt-2 text-xs text-gray-500">
              {agentProgress >= 100
                ? "Target reached"
                : `${Math.round(100 - agentProgress)}% to target`}
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useKpi();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
        <LoadingState message="Loading KPI data…" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200 sm:p-6">
          <p className="font-semibold">Failed to load dashboard</p>
          <p className="mt-2 text-sm">
            {error instanceof Error ? error.message : String(error)}
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Ensure VITE_API_BASE_URL and VITE_API_KEY are set and the API is reachable.
          </p>
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

  return <DashboardContent data={data} />;
}
