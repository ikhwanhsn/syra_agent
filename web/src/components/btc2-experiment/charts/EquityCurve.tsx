import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { overviewChartPanelShell, overviewChartTopShine } from "@/components/dashboard/overview/overviewStyles";
import type { SparklinePoint } from "@/lib/btc2/types";
import { formatUsd } from "@/lib/btc2/format";

const chartConfig = {
  equity: { label: "Equity", color: "hsl(142 76% 36%)" },
} satisfies ChartConfig;

export function EquityCurve({
  data,
  className,
}: {
  data: SparklinePoint[];
  className?: string;
}) {
  const chartData = data.map((d, i) => ({ i, equity: d.v }));

  return (
    <div className={cn(overviewChartPanelShell, "p-4", className)}>
      <div className={overviewChartTopShine} aria-hidden />
      <ChartContainer config={chartConfig} className="aspect-[2.5/1] h-[180px] w-full">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="i" hide />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            domain={["auto", "auto"]}
            width={52}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="rounded-lg border border-border/60 bg-background/95 px-2 py-1 text-xs shadow-lg backdrop-blur">
                  <span className="font-mono">{formatUsd(payload[0].value as number)}</span>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="var(--color-equity)"
            fill="var(--color-equity)"
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
