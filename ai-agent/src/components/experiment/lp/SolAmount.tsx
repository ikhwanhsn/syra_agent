import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import { solToUsd } from "@/lib/lpRealDisplay";
import { cn } from "@/lib/utils";

export interface SolAmountProps {
  sol: number | null | undefined;
  /** Reference SOL/USD (e.g. from lab state). */
  solUsd?: number;
  /** Use position snapshot USD when set (e.g. closed PnL). */
  usdOverride?: number | null;
  className?: string;
  usdClassName?: string;
  align?: "start" | "end" | "center";
  /** Inline "1.23 SOL · $184.50" instead of stacked. */
  inline?: boolean;
}

export function SolAmount({
  sol,
  solUsd,
  usdOverride,
  className,
  usdClassName,
  align = "end",
  inline = false,
}: SolAmountProps) {
  const n = Number(sol);
  if (!Number.isFinite(n)) {
    return <span className={className}>—</span>;
  }

  const usd =
    usdOverride != null && Number.isFinite(Number(usdOverride))
      ? Number(usdOverride)
      : solToUsd(n, solUsd);

  if (inline) {
    return (
      <span className={cn("font-mono tabular-nums", className)}>
        {formatSol(n)} SOL
        {usd != null ? (
          <span className={cn("font-sans text-muted-foreground", usdClassName)}> · {formatLpUsd(usd)}</span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5",
        align === "end" && "items-end",
        align === "start" && "items-start",
        align === "center" && "items-center",
        className,
      )}
    >
      <span className="font-mono text-sm tabular-nums">{formatSol(n)} SOL</span>
      {usd != null ? (
        <span className={cn("text-[11px] tabular-nums text-muted-foreground", usdClassName)}>
          {formatLpUsd(usd)}
        </span>
      ) : null}
    </div>
  );
}
