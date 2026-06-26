import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { EquityCurve } from "./charts/EquityCurve";
import { DrawdownChart } from "./charts/DrawdownChart";
import { PerformanceHeatmap } from "./charts/PerformanceHeatmap";
import { SectionHeader } from "./shared/SectionHeader";
import type { PerformanceMetrics } from "@/lib/btc2/types";
import { formatPct, formatUsd } from "@/lib/btc2/format";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const distConfig = {
  count: { label: "Trades", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

export function Performance({ performance }: { performance: PerformanceMetrics }) {

  const tiles = [
    { label: "Win Rate", value: `${performance.winRate.toFixed(1)}%` },
    { label: "Sharpe Ratio", value: performance.sharpe.toFixed(2) },
    { label: "Sortino", value: performance.sortino.toFixed(2) },
    { label: "Profit Factor", value: performance.profitFactor.toFixed(2) },
    { label: "Avg Trade", value: formatUsd(performance.avgTrade) },
    { label: "Max Drawdown", value: formatPct(performance.maxDrawdown) },
    { label: "Expectancy", value: performance.expectancy.toFixed(2) },
    { label: "Monthly Return", value: formatPct(performance.monthlyReturn, true) },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 10"
        title="Model Performance"
        description="Historical analytics — equity curve, drawdown profile, and return distribution."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={cn(overviewCardShell, "rounded-2xl p-4")}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
              {t.label}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Equity Curve
          </p>
          <EquityCurve data={performance.equityCurve} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Drawdown
          </p>
          <DrawdownChart data={performance.drawdownCurve} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Return Distribution
          </p>
          <ChartContainer config={distConfig} className="h-[180px] w-full">
            <BarChart data={performance.returnDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={9} />
              <YAxis tickLine={false} axisLine={false} width={28} fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Performance Heatmap
          </p>
          <PerformanceHeatmap data={performance.heatmap} />
        </div>
      </div>
    </motion.section>
  );
}
