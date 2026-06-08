import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { formatExperimentSol, type EquityHistoryPoint } from "@/lib/experimentEquityHistory";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { overviewChartPanelShell, overviewChartTopShine } from "@/components/dashboard/overview/overviewStyles";

export interface ExperimentBalanceChartProps {
  data: EquityHistoryPoint[];
  startSol: number;
  color?: string;
  className?: string;
  height?: number;
}

function formatSolAxis(n: number): string {
  return `${n.toFixed(1)}`;
}

export function ExperimentBalanceChart({
  data,
  startSol,
  color = "hsl(262 83% 58%)",
  className,
  height = 280,
}: ExperimentBalanceChartProps) {
  const gradientId = useId().replace(/:/g, "");

  const chartConfig = useMemo(
    () =>
      ({
        balance: { label: "Balance", color },
      }) satisfies ChartConfig,
    [color],
  );

  const chartData = useMemo(
    () =>
      data.length >= 2
        ? data
        : [
            { at: Date.now() - 3_600_000, value: startSol, label: "Start" },
            { at: Date.now(), value: data[0]?.value ?? startSol, label: "Now" },
          ],
    [data, startSol],
  );

  const yDomain = useMemo(() => {
    const values = chartData.map((p) => p.value);
    const min = Math.min(...values, startSol);
    const max = Math.max(...values, startSol);
    const pad = Math.max(0.5, (max - min) * 0.18);
    return [Math.max(0, min - pad), max + pad] as [number, number];
  }, [chartData, startSol]);

  return (
    <div className={cn(overviewChartPanelShell, "p-3 sm:p-4", className)}>
      <div className={overviewChartTopShine} aria-hidden />
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold tracking-tight text-foreground">Balance over time</p>
        <p className="text-xs text-muted-foreground">Paper SOL</p>
      </div>
      <ChartContainer
        config={chartConfig}
        className="w-full aspect-auto min-h-[220px]"
        style={{ height: Math.max(height, 220) }}
      >
        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <ReferenceLine
            y={startSol}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11 }}
            tickFormatter={formatSolAxis}
            domain={yDomain}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-mono tabular-nums">{formatExperimentSol(Number(value))}</span>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-balance)"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, strokeWidth: 0, fill: "var(--color-balance)" }}
            activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-balance)" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
