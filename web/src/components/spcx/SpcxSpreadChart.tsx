import { useId, useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatSpread, type SpreadHistoryPoint } from "@/lib/spcxApi";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

export function SpcxSpreadChart({ data }: { data: SpreadHistoryPoint[] }) {
  const nasdaqGradientId = useId().replace(/:/g, "");
  const onchainGradientId = useId().replace(/:/g, "");

  const chartConfig = useMemo(
    () =>
      ({
        nasdaq: { label: "Stock (Nasdaq)", color: "hsl(var(--primary))" },
        onchain: { label: "Token (Solana)", color: "hsl(142 76% 36%)" },
      }) satisfies ChartConfig,
    [],
  );

  const hasEnough = data.length >= 2;

  return (
    <Card className={spcxCardClass}>
      <CardHeader className="border-b border-border/40 bg-muted/[0.03] pb-4">
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Price history
        </CardTitle>
        <CardDescription>
          How the stock and token prices have moved over time — useful for spotting when the gap widens.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasEnough ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Not enough data yet. Hit &ldquo;Refresh prices&rdquo; a few times to build the chart.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={nasdaqGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-nasdaq)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-nasdaq)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={onchainGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-onchain)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-onchain)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const spread = (item.payload as SpreadHistoryPoint)?.spreadPct;
                      if (name === "spreadPct") {
                        return (
                          <span className="font-mono tabular-nums">{formatSpread(spread ?? null)}</span>
                        );
                      }
                      return (
                        <span className="font-mono tabular-nums">
                          ${Number(value).toFixed(2)}
                        </span>
                      );
                    }}
                  />
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="nasdaq"
                stroke="var(--color-nasdaq)"
                strokeWidth={2}
                fill={`url(#${nasdaqGradientId})`}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="onchain"
                stroke="var(--color-onchain)"
                strokeWidth={2}
                dot={{ r: 2, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
