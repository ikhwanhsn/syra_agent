import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import type { SparklinePoint } from "@/lib/btc2/types";

export function Sparkline({
  data,
  positive = true,
  className,
}: {
  data: SparklinePoint[];
  positive?: boolean;
  className?: string;
}) {
  const chartData = data.map((d) => ({ v: d.v }));
  const color = positive ? "hsl(142 76% 36%)" : "hsl(0 72% 51%)";

  return (
    <div className={cn("shrink-0", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${positive ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${positive ? "up" : "down"})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
