import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { overviewChartPanelShell, overviewChartTopShine } from "@/components/dashboard/overview/overviewStyles";
import type { PortfolioAsset } from "@/lib/btc2/types";
import { formatUsd } from "@/lib/btc2/format";

const COLORS = ["hsl(38 92% 50%)", "hsl(217 91% 60%)", "hsl(142 76% 36%)"];

const chartConfig = {
  BTC: { label: "BTC", color: COLORS[0] },
  SOL: { label: "SOL", color: COLORS[1] },
  USDC: { label: "USDC", color: COLORS[2] },
} satisfies ChartConfig;

export function AllocationPie({
  assets,
  className,
}: {
  assets: PortfolioAsset[];
  className?: string;
}) {
  const data = assets.map((a) => ({
    name: a.symbol,
    value: Math.round(a.allocation * 100),
    usd: a.valueUsd,
  }));

  return (
    <div className={cn(overviewChartPanelShell, "p-4", className)}>
      <div className={overviewChartTopShine} aria-hidden />
      <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px] w-full max-w-[220px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const p = payload[0].payload as { name: string; value: number; usd: number };
              return (
                <div className="rounded-lg border border-border/60 bg-background/95 px-2 py-1 text-xs shadow-lg backdrop-blur">
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 font-mono">{p.value}% · {formatUsd(p.usd)}</span>
                </div>
              );
            }}
          />
        </PieChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-mono font-medium">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
