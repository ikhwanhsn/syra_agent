import { cn } from "@/lib/utils";
import { overviewChartPanelShell } from "@/components/dashboard/overview/overviewStyles";

export function PerformanceHeatmap({
  data,
  className,
}: {
  data: number[][];
  className?: string;
}) {
  const flat = data.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  function cellColor(v: number) {
    const t = max === min ? 0.5 : (v - min) / (max - min);
    if (t > 0.6) return "bg-emerald-500/70";
    if (t > 0.45) return "bg-emerald-500/35";
    if (t > 0.35) return "bg-muted/50";
    if (t > 0.2) return "bg-red-500/35";
    return "bg-red-500/70";
  }

  return (
    <div className={cn(overviewChartPanelShell, "p-4", className)}>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data[0]?.length ?? 12}, 1fr)` }}>
        {data.map((row, ri) =>
          row.map((v, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={cn("aspect-square rounded-sm transition-colors", cellColor(v))}
              title={`${v.toFixed(2)}%`}
            />
          )),
        )}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>Loss</span>
        <span>Return heatmap (30d)</span>
        <span>Gain</span>
      </div>
    </div>
  );
}