import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { overviewChartPanelShell, overviewChartTopShine } from "@/components/dashboard/overview/overviewStyles";

const chartConfig = {
  probability: { label: "Probability", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

export function ProbabilityDistribution({
  data,
  className,
}: {
  data: { bucket: string; probability: number }[];
  className?: string;
}) {
  return (
    <div className={cn(overviewChartPanelShell, "p-4", className)}>
      <div className={overviewChartTopShine} aria-hidden />
      <ChartContainer config={chartConfig} className="aspect-[2/1] h-[160px] w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} fontSize={10} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div className="rounded-lg border border-border/60 bg-background/95 px-2 py-1 text-xs shadow-lg backdrop-blur">
                  <span className="font-mono">{(payload[0].value as number).toFixed(1)}%</span>
                </div>
              );
            }}
          />
          <Bar dataKey="probability" fill="var(--color-probability)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
