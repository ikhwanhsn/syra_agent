import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import {
  Activity,
  Zap,
  MessageSquare,
  Target,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { API_BASE, LINK_AGENT } from "../../config/global";

type KpiData = {
  totalPaidApiCalls: number;
  paidApiCallsLast7Days: number;
  paidApiCallsLast30Days: number;
  completedPaidToolCalls: number;
  chatsWithPaidToolUse: number;
  byPath: { path: string; count: number }[];
  dailyPaidCalls: { date: string; count: number }[];
  kpiTargets: { paidApiCalls: number; agentSessions: number };
  updatedAt: string;
};

const chartConfig = {
  count: {
    label: "Paid API calls",
    color: "hsl(var(--primary))",
  },
};

export default function Analytics() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpi = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/analytics/kpi`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchKpi();
    const interval = setInterval(fetchKpi, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <main className="relative z-10 pt-28 pb-16">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="text-muted-foreground">Loading analytics…</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <main className="relative z-10 pt-28 pb-16">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
              <p className="text-destructive">{error}</p>
              <a href="/" className="text-sm text-primary hover:underline">
                ← Back to Home
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const kpi = data!;
  const paidProgress = Math.min(
    100,
    (kpi.totalPaidApiCalls / kpi.kpiTargets.paidApiCalls) * 100,
  );
  const agentProgress = Math.min(
    100,
    (kpi.chatsWithPaidToolUse / kpi.kpiTargets.agentSessions) * 100,
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <div className="fixed inset-0 opacity-50 grid-pattern pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="relative z-10 pt-28 pb-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass-card">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Grant KPI dashboard
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
              <span className="neon-text">Analytics</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Paid API usage and AI agent adoption
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all rounded-xl btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </a>
            <a
              href={LINK_AGENT}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 text-sm font-medium btn-primary"
            >
              Launch Agent →
            </a>
          </motion.div>

          {/* KPI cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total paid API calls
                </CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.totalPaidApiCalls.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last 7 days
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.paidApiCallsLast7Days.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Agent paid tool calls
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.completedPaidToolCalls.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Chats with paid tools
                </CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.chatsWithPaidToolUse.toLocaleString()}</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* KPI progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid gap-6 mb-8 sm:grid-cols-2"
          >
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Paid API calls goal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Target: {kpi.kpiTargets.paidApiCalls.toLocaleString()} by end of grant
                </p>
              </CardHeader>
              <CardContent>
                <Progress value={paidProgress} className="h-3" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {kpi.totalPaidApiCalls.toLocaleString()} / {kpi.kpiTargets.paidApiCalls.toLocaleString()} ({paidProgress.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Agent sessions goal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Target: {kpi.kpiTargets.agentSessions.toLocaleString()} chats with paid tool use
                </p>
              </CardHeader>
              <CardContent>
                <Progress value={agentProgress} className="h-3" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {kpi.chatsWithPaidToolUse.toLocaleString()} / {kpi.kpiTargets.agentSessions.toLocaleString()} ({agentProgress.toFixed(0)}%)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily chart */}
          {kpi.dailyPaidCalls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Paid API calls (last 30 days)</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Daily count of successful x402-paid requests
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={kpi.dailyPaidCalls} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Top paths */}
          {kpi.byPath.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Top endpoints by paid calls</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Most used paid API paths (all time)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="py-2 text-left font-medium text-muted-foreground">Path</th>
                          <th className="py-2 text-right font-medium text-muted-foreground">Calls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpi.byPath.map((row) => (
                          <tr key={row.path} className="border-b border-border/30">
                            <td className="py-2 font-mono text-xs">{row.path}</td>
                            <td className="py-2 text-right tabular-nums">{row.count.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Last updated: {new Date(kpi.updatedAt).toLocaleString()}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
