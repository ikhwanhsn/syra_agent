import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { overviewChartPanelShell, overviewChartTopShine } from "@/components/dashboard/overview/overviewStyles";
import type { SparklinePoint } from "@/lib/btc2/types";
import { formatBtcPrice } from "@/lib/btc2/format";

const chartConfig = {
  price: { label: "BTC", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

export function PriceChart({
  data,
  className,
}: {
  data: SparklinePoint[];
  className?: string;
}) {
  const chartData = data.map((d) => ({
    time: new Date(d.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    price: d.v,
  }));

  return (
    <div className={cn(overviewChartPanelShell, "p-4", className)}>
      <div className={overviewChartTopShine} aria-hidden />
      <ChartContainer config={chartConfig} className="aspect-[3/1] h-[200px] w-full">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={40} />
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
                  <span className="font-mono">{formatBtcPrice(payload[0].value as number)}</span>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="var(--color-price)"
            fill="var(--color-price)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
