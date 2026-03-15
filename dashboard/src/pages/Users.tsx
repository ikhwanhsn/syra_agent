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
  AreaChart,
  Area,
} from "recharts";
import { fetchKpiExtended, type KpiExtendedResponse } from "../api/kpiExtended";
import { LoadingState } from "../components/LoadingState";
import { cn } from "../lib/utils";
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
  sub,
  trend,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: "primary" | "accent" | "emerald" | "amber";
}) {
  const accentColors = {
    primary: "text-syra-primary",
    accent: "text-syra-accent",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };
  return (
    <Card>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold sm:text-3xl", accentColors[accent])}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {trend === "up" && <span className="text-xs text-emerald-400">↑</span>}
        {trend === "down" && <span className="text-xs text-red-400">↓</span>}
      </div>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </Card>
  );
}

function UsersContent({ data }: { data: KpiExtendedResponse }) {
  const { users, playground } = data;

  const userGrowth7dPct =
    users.uniqueUsersLast30d > 0
      ? Math.round((users.uniqueUsersLast7d / users.uniqueUsersLast30d) * 1000) / 10
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-6">
      <header className="flex flex-col gap-2 border-b border-gray-800 pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Users & engagement</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            User growth, chat engagement, tool usage, and playground activity. Last updated:{" "}
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

      {/* User KPIs */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">User metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Unique users (all-time)"
            value={users.uniqueUsersTotal}
            accent="primary"
          />
          <MetricCard
            label="Active users (7d)"
            value={users.uniqueUsersLast7d}
            sub={`${userGrowth7dPct}% of 30d active`}
            accent="emerald"
          />
          <MetricCard
            label="Active users (30d)"
            value={users.uniqueUsersLast30d}
            accent="accent"
          />
          <MetricCard
            label="New chats (30d)"
            value={users.chatsLast30d}
            sub={`7d: ${users.chatsLast7d.toLocaleString()}`}
            accent="amber"
          />
        </div>
      </section>

      {/* Engagement metrics */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">Engagement</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total chats"
            value={users.totalChats}
            accent="primary"
          />
          <MetricCard
            label="Total messages"
            value={users.totalMessages}
            accent="accent"
          />
          <MetricCard
            label="Avg messages/chat"
            value={users.avgMessagesPerChat}
            accent="emerald"
          />
          <MetricCard
            label="Max messages (single chat)"
            value={users.maxMessagesInChat}
            accent="amber"
          />
        </div>
      </section>

      {/* Daily active users chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Daily active users (30d)
          </h2>
          <Card>
            {users.dailyActiveUsers.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No data yet.</p>
            ) : (
              <div className="h-52 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={users.dailyActiveUsers} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
                      contentStyle={{ backgroundColor: "#0f1117", border: "1px solid #374151", borderRadius: "8px" }}
                      labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="count" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.2} name="Active users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>

        {/* Daily new chats */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Daily new chats (30d)
          </h2>
          <Card>
            {users.dailyNewChats.length === 0 ? (
              <p className="py-6 text-center text-gray-500">No data yet.</p>
            ) : (
              <div className="h-52 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={users.dailyNewChats} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
                      contentStyle={{ backgroundColor: "#0f1117", border: "1px solid #374151", borderRadius: "8px" }}
                      labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="New chats" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Tool usage */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Tool usage (agent)
        </h2>
        <Card>
          {users.toolUsage.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No tool usage data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="pb-2 pr-4 font-medium">Tool</th>
                    <th className="pb-2 pr-4 font-medium text-right">Total</th>
                    <th className="pb-2 pr-4 font-medium text-right">Completed</th>
                    <th className="pb-2 pr-4 font-medium text-right">Errors</th>
                    <th className="pb-2 font-medium text-right">Success rate</th>
                  </tr>
                </thead>
                <tbody>
                  {users.toolUsage.map((tool) => (
                    <tr key={tool.name} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 font-mono text-gray-300">{tool.name}</td>
                      <td className="py-2 pr-4 text-right text-white">{tool.total.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right text-emerald-400">{tool.completed.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right text-red-400">{tool.errors.toLocaleString()}</td>
                      <td className="py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            tool.successRate >= 90
                              ? "bg-emerald-500/20 text-emerald-300"
                              : tool.successRate >= 70
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-red-500/20 text-red-300"
                          )}
                        >
                          {tool.successRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Top Agents */}
      {users.topAgents.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
            Top agents by chat count
          </h2>
          <Card>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={users.topAgents.map((a) => ({
                    name: a.agentId.slice(0, 20) || "default",
                    count: a.count,
                  }))}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f1117", border: "1px solid #374151", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Chats" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {/* Playground metrics */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-200 sm:text-lg">
          Playground engagement
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total shared requests"
            value={playground.totalShares}
            accent="primary"
          />
          <MetricCard
            label="Shares (7d)"
            value={playground.sharesLast7d}
            accent="emerald"
          />
          <MetricCard
            label="Shares (30d)"
            value={playground.sharesLast30d}
            accent="accent"
          />
        </div>
        {playground.dailyShares.length > 0 && (
          <div className="mt-4">
            <Card subtitle="Daily shares (30d)">
              <div className="h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={playground.dailyShares} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
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
                      contentStyle={{ backgroundColor: "#0f1117", border: "1px solid #374151", borderRadius: "8px" }}
                      labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 2 }} name="Shares" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
        {playground.byChain.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {playground.byChain.map(({ chain, count }) => (
              <Card key={chain}>
                <span className="text-xs text-gray-500">Shares by {chain}</span>
                <p className="mt-1 text-xl font-bold text-white">{count.toLocaleString()}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function UsersPage() {
  const { data, isLoading, error } = useKpiExtended();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
        <LoadingState message="Loading user data..." size="lg" />
      </div>
    );
  }

  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200 sm:p-6">
          <p className="font-semibold">Failed to load user data</p>
          <p className="mt-2 text-sm">{msg}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-syra-primary hover:underline">
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-gray-400">No data.</p></div>;

  return <UsersContent data={data} />;
}
