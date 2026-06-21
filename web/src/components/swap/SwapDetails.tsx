import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JupiterQuoteDisplay } from "@/hooks/useJupiterQuote";

export interface SwapDetailsProps {
  display: JupiterQuoteDisplay | null;
  inputSymbol: string;
  outputSymbol: string;
  isLoading?: boolean;
  isDebouncing?: boolean;
  error?: string | null;
  className?: string;
}

export function SwapDetails({
  display,
  inputSymbol,
  outputSymbol,
  isLoading,
  isDebouncing,
  error,
  className,
}: SwapDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  if (error) {
    return (
      <p
        className={cn(
          "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive",
          className,
        )}
      >
        {error}
      </p>
    );
  }

  if (!display && !isLoading) return null;

  const impact = display?.priceImpactPct;
  const impactClass =
    impact != null && impact >= 3
      ? "text-destructive"
      : impact != null && impact >= 1
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <div className={cn("rounded-xl border border-border/40 bg-muted/10", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-xs text-muted-foreground">
          {isLoading || isDebouncing ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Fetching best route…
            </span>
          ) : display?.rateFormatted ? (
            <>
              1 {inputSymbol} ≈ {display.rateFormatted} {outputSymbol}
            </>
          ) : (
            "Route details"
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && display ? (
        <dl className="space-y-2 border-t border-border/40 px-4 py-3 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Minimum received</dt>
            <dd className="font-mono font-medium tabular-nums text-foreground">
              {display.minReceivedFormatted} {outputSymbol}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Price impact</dt>
            <dd className={cn("font-mono font-medium tabular-nums", impactClass)}>
              {impact != null ? `${impact.toFixed(2)}%` : "—"}
            </dd>
          </div>
          {display.platformFeeBps > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Platform fee</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">
                {(display.platformFeeBps / 100).toFixed(2)}%
              </dd>
            </div>
          ) : null}
          {display.routeLabels.length > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-muted-foreground">Route</dt>
              <dd className="text-right font-medium text-foreground">
                {display.routeLabels.join(" → ")}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Powered by</dt>
            <dd className="font-medium text-foreground">Jupiter</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
