import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatMmUsd, type MmEquityPoint, type MmVolumePoint } from "@/lib/mmApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface MmVolumeChartProps {
  volumePoints: MmVolumePoint[];
  equityPoints: MmEquityPoint[];
  startingBankUsd: number;
  creatorFeeBps: number;
  loading?: boolean;
  className?: string;
}

export function MmVolumeChart({
  volumePoints,
  equityPoints,
  startingBankUsd,
  creatorFeeBps,
  loading,
  className,
}: MmVolumeChartProps) {
  const volChart = volumePoints.map((p) => ({
    ts: new Date(p.ts).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
    cumulativeVolumeUsd: p.cumulativeVolumeUsd,
    projectedFeeUsd: p.projectedFeeUsd,
  }));

  const equityChart = equityPoints.map((p) => ({
    ts: new Date(p.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    equityUsd: p.equityUsd,
  }));

  if (equityChart.length === 0) {
    equityChart.push(
      { ts: "Start", equityUsd: startingBankUsd },
      { ts: "Now", equityUsd: startingBankUsd },
    );
  }

  if (volChart.length === 0) {
    volChart.push({ ts: "Start", cumulativeVolumeUsd: 0, projectedFeeUsd: 0 });
  }

  return (
    <section className={cn("grid gap-4 xl:grid-cols-2", className)}>
      <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight">Volume & projected fees</h2>
          <p className="text-xs text-muted-foreground">
            Cumulative round-trip volume · pump.fun creator fee at {creatorFeeBps} bps
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volChart}>
                <defs>
                  <linearGradient id="mmVolFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(270 70% 55%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(270 70% 55%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="ts" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatMmUsd(value),
                    name === "projectedFeeUsd" ? "Projected fees" : "Volume",
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Area
                  type="stepAfter"
                  dataKey="cumulativeVolumeUsd"
                  stroke="hsl(270 70% 55%)"
                  fill="url(#mmVolFill)"
                  strokeWidth={2}
                />
                <Line
                  type="stepAfter"
                  dataKey="projectedFeeUsd"
                  stroke="hsl(142 70% 45%)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight">Equity curve</h2>
          <p className="text-xs text-muted-foreground">Paper P&L constraint — must stay non-negative</p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="ts" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value: number) => [formatMmUsd(value), "Equity"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line
                  type="stepAfter"
                  dataKey="equityUsd"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
}
