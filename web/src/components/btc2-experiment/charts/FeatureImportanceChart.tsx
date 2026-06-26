import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { overviewChartPanelShell, overviewChartTopShine } from "@/components/dashboard/overview/overviewStyles";

const chartConfig = {
  importance: { label: "Importance", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

export function FeatureImportanceChart({
  data,
  className,
}: {
  data: { name: string; importance: number }[];
  className?: string;
}) {
  const top = data.slice(0, 10);

  return (
    <div className={cn(overviewChartPanelShell, "p-4", className)}>
      <div className={overviewChartTopShine} aria-hidden />
      <ChartContainer config={chartConfig} className="aspect-[1.2/1] h-[220px] w-full">
        <BarChart data={top} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} domain={[0, 1]} fontSize={10} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={100}
            fontSize={9}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="rounded-lg border border-border/60 bg-background/95 px-2 py-1 text-xs shadow-lg backdrop-blur">
                  <span className="font-mono">{((payload[0].value as number) * 100).toFixed(1)}%</span>
                </div>
              );
            }}
          />
          <Bar dataKey="importance" fill="var(--color-importance)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
