import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TrendingUp, Users, Activity, DollarSign, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { API_BASE } from "../../config/global";

type DashboardMetrics = {
  volume24h: string;
  volumeChangePct: number;
  activeTraders: number;
  activeTradersChangePct: number;
  whaleMoves: number;
  whaleMovesChangePct: number;
  tvlTracked: string;
  tvlChangePct: number;
};

type FlowPoint = { index: number; inflow: number; outflow: number };

type DashboardSummary = {
  period: string;
  metrics: DashboardMetrics;
  flowIndex: FlowPoint[];
  updatedAt: string;
};

const STATS = [
  { key: "volume24h" as const, label: "24h Volume", icon: TrendingUp, valueKey: "volume24h" as const, changeKey: "volumeChangePct" as const },
  { key: "activeTraders" as const, label: "Active Traders", icon: Users, valueKey: "activeTraders" as const, changeKey: "activeTradersChangePct" as const },
  { key: "whaleMoves" as const, label: "Whale Moves", icon: Activity, valueKey: "whaleMoves" as const, changeKey: "whaleMovesChangePct" as const },
  { key: "tvlTracked" as const, label: "$ TVL Tracked", icon: DollarSign, valueKey: "tvlTracked" as const, changeKey: "tvlChangePct" as const },
];

/* Match landing top section: accent (teal) + neon-purple (slate) from gradient-primary */
const INFLOW_COLOR = "hsl(var(--accent))";
const OUTFLOW_COLOR = "hsl(var(--neon-purple))";

function FlowChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const segmentName = (payload[0]?.payload as { name?: string })?.name ?? "Segment";
  const inflow = payload.find((p) => p.dataKey === "inflow")?.value as number | undefined;
  const outflow = payload.find((p) => p.dataKey === "outflow")?.value as number | undefined;
  return (
    <div className="rounded-lg border border-primary/20 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="text-xs font-medium text-muted-foreground mb-2">{segmentName}</div>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: INFLOW_COLOR }} />
          <span className="text-foreground">Inflow</span>
          <span className="font-mono font-medium tabular-nums">{inflow != null ? inflow.toFixed(1) : "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: OUTFLOW_COLOR }} />
          <span className="text-foreground">Outflow</span>
          <span className="font-mono font-medium tabular-nums">{outflow != null ? outflow.toFixed(1) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

export const LiveDashboard = () => {
  const ref = useRef(null);
  const timeFrameRef = useRef("1D");
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [timeFrame, setTimeFrame] = useState("1D");
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  timeFrameRef.current = timeFrame;

  const fetchSummary = async (period: string) => {
    const hasData = data != null;
    if (!hasData) setLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const url = `${API_BASE}/v1/regular/dashboard-summary?period=${period}&t=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json: DashboardSummary = await res.json();
      if (timeFrameRef.current === json.period) setData(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to load data";
      const isNetwork = /failed to fetch|network|err_failed|connection/i.test(msg);
      setError(
        isNetwork && import.meta.env.DEV
          ? "Dashboard unavailable. Start the API: cd api && npm run dev"
          : msg
      );
      if (!hasData) setData(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary(timeFrame);
  }, [timeFrame]);

  useEffect(() => {
    if (!timeFrame) return;
    const interval = setInterval(() => fetchSummary(timeFrame), 60 * 1000);
    return () => clearInterval(interval);
  }, [timeFrame]);

  const metrics = data?.metrics;
  const flowIndex = data?.flowIndex ?? [];
  const isDataReady = data != null && data.period === timeFrame && !isRefreshing;
  // Top section: highlight period only when we're actually showing that period's data (no blink on click)
  const displayedPeriod = data?.period ?? timeFrame;

  const formatChange = (pct: number) => (pct >= 0 ? `+${pct}%` : `${pct}%`);
  const formatValue = (stat: typeof STATS[0], m: DashboardMetrics | undefined) => {
    if (!m) return "—";
    const v = m[stat.valueKey];
    return typeof v === "number" ? v.toLocaleString() : String(v);
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-neon-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
          >
            Live Dashboard
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Real-time <span className="neon-text">Market Intelligence</span>
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-8 glass-card rounded-2xl"
        >
          {/* Top section: stable when changing period — no blink; only content below updates after skeleton/data ready */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 min-w-[10rem]">
              <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
              <span className="text-sm text-muted-foreground">Live Data Feed</span>
            </div>
            <div className="flex gap-2">
              {["1H", "4H", "1D", "1W"].map((period) => (
                <button
                  key={period}
                  disabled={loading && !data}
                  className={`px-4 py-2 text-xs rounded-lg transition-colors relative z-10 w-12 ${
                    displayedPeriod === period
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  } disabled:opacity-70 disabled:cursor-wait`}
                  onClick={() => setTimeFrame(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 py-3 px-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading && !data ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4"
              >
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center justify-center min-h-[7rem]"
                  >
                    <stat.icon className="w-5 h-5 text-primary/70 mb-2" />
                    <span className="text-xs text-muted-foreground mb-3">{stat.label}</span>
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ))}
              </motion.div>
            ) : data ? (
              <motion.div
                key="metrics"
                initial={false}
                animate={{ opacity: 1 }}
                className={`grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4 relative transition-opacity duration-200 ${isRefreshing ? "opacity-90" : ""}`}
              >
                {STATS.map((stat) => {
                  const change = metrics ? (metrics[stat.changeKey] as number) : 0;
                  const positive = change >= 0;
                  return (
                    <div key={stat.label} className="p-4 glass-card rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <div className="text-xl font-bold text-foreground">
                        {formatValue(stat, metrics ?? undefined)}
                      </div>
                      <div
                        className={`text-xs ${positive ? "text-green-400" : "text-red-400"}`}
                      >
                        {formatChange(change)}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {data && (
            <motion.div
              key={isDataReady ? `chart-ready-${data.updatedAt}` : "chart-stale"}
              initial={isDataReady ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="p-6 glass-card rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Smart Money Flow Index</span>
                <span className="flex items-center gap-2 text-xs text-primary">
                  {isRefreshing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                  {isRefreshing ? "Updating…" : "Updating live"}
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      flowIndex.length
                        ? flowIndex.map((point, i) => ({
                            index: i,
                            name: i === 0 ? "24h ago" : i === flowIndex.length - 1 ? "Now" : i === Math.floor(flowIndex.length / 2) ? "12h ago" : `Segment ${i + 1}`,
                            inflow: point.inflow,
                            outflow: point.outflow,
                          }))
                        : Array.from({ length: 24 }, (_, i) => ({
                            index: i,
                            name: i === 0 ? "24h ago" : i === 23 ? "Now" : i === 12 ? "12h ago" : `Segment ${i + 1}`,
                            inflow: 50,
                            outflow: 30,
                          }))
                    }
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="index"
                      ticks={(() => {
                        const n = flowIndex.length || 24;
                        return [0, Math.floor(n / 2), n - 1];
                      })()}
                      tickFormatter={(value) => {
                        const n = flowIndex.length || 24;
                        if (value === 0) return "24h ago";
                        if (value === n - 1) return "Now";
                        return "12h ago";
                      }}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip content={<FlowChartTooltip />} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} />
                    <Bar dataKey="inflow" fill={INFLOW_COLOR} radius={[2, 2, 0, 0]} maxBarSize={24} isAnimationActive={isDataReady} opacity={0.85} />
                    <Bar dataKey="outflow" fill={OUTFLOW_COLOR} radius={[2, 2, 0, 0]} maxBarSize={24} isAnimationActive={isDataReady} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};
