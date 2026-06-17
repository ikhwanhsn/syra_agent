import { cn } from "@/lib/utils";
import { PRICE_LINE, RATIO_GTE, RATIO_LT } from "@/components/btc/chart/btcChartShared";

export function ChartLegend({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 flex flex-col gap-1.5 rounded-xl border border-border/50 bg-background/85 px-3 py-2 text-[11px] shadow-md backdrop-blur-md",
        compact ? "right-2 top-2" : "right-3 top-3",
      )}
    >
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="h-0.5 w-5 rounded-full bg-[#3b82f6]" aria-hidden />
        BTC Price
      </span>
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: RATIO_GTE }} aria-hidden />
        Buy pressure
      </span>
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: RATIO_LT }} aria-hidden />
        Sell pressure
      </span>
    </div>
  );
}

export function ChartFootnote({ ratioNote }: { ratioNote: string }) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,22rem)] rounded-xl border border-border/40 bg-background/80 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground shadow-sm backdrop-blur-sm">
      <p>{ratioNote}</p>
      <p className="mt-1">
        <span className="text-emerald-600 dark:text-emerald-400">Green = buy pressure</span>
        {" · "}
        <span className="text-red-600 dark:text-red-400">Red = sell pressure</span>
      </p>
      <p className="mt-0.5">Bubble size = flow extremity percentile</p>
    </div>
  );
}

// Kept for share frame color reference
export { PRICE_LINE };
