import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBalanceChangePct,
  formatBalanceChangeUsd,
  type BalanceChangeResult,
} from "@/lib/treasuryBalanceHistory";

export interface BalanceChangeIndicatorProps {
  change: BalanceChangeResult | null | undefined;
  /** Hide when absolute delta is below this USD threshold */
  minAbsUsd?: number;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export function BalanceChangeIndicator({
  change,
  minAbsUsd = 0.01,
  size = "sm",
  className,
  showIcon = true,
}: BalanceChangeIndicatorProps) {
  if (!change || !Number.isFinite(change.deltaUsd) || Math.abs(change.deltaUsd) < minAbsUsd) {
    return null;
  }

  const up = change.deltaUsd > 0;
  const down = change.deltaUsd < 0;
  const pct = formatBalanceChangePct(change.deltaPct);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono tabular-nums",
        size === "sm" ? "text-[11px]" : "text-xs",
        up && "text-emerald-600 dark:text-emerald-400",
        down && "text-red-600 dark:text-red-400",
        !up && !down && "text-muted-foreground",
        className,
      )}
    >
      {showIcon ? (
        up ? (
          <TrendingUp className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
        ) : down ? (
          <TrendingDown className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
        ) : null
      ) : null}
      <span>{formatBalanceChangeUsd(change.deltaUsd)}</span>
      {pct ? <span className="opacity-90">({pct})</span> : null}
      {change.label ? (
        <span className="font-sans font-normal text-muted-foreground">· {change.label}</span>
      ) : null}
    </span>
  );
}
