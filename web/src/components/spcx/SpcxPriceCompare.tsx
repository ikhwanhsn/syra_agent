import { ArrowRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  bestLiveVenue,
  formatSpread,
  formatUsd,
  isNasdaqReferenceFallback,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { SpcxHelpTip } from "@/components/spcx/SpcxHelpTip";
import { spcxCardClass, spcxKickerClass, spcxMetricValueClass } from "@/components/spcx/spcxStyles";

function PriceBlock({
  label,
  sublabel,
  price,
  muted,
}: {
  label: string;
  sublabel: string;
  price: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-xl border px-4 py-4 sm:px-5 sm:py-5",
        muted
          ? "border-border/35 bg-muted/[0.03]"
          : "border-border/50 bg-background/50",
      )}
    >
      <p className={spcxKickerClass}>{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      <p className={cn("mt-3", spcxMetricValueClass)}>{price}</p>
    </div>
  );
}

export function SpcxPriceCompare({ report }: { report: SpcxIntelligenceReport }) {
  const liveVenue = bestLiveVenue(report);
  const hasLive = Boolean(liveVenue?.priceUsd != null);
  const spreadPct = liveVenue?.spreadPct ?? null;
  const nasdaqFallback = isNasdaqReferenceFallback(report);

  const spreadExplanation =
    !hasLive || spreadPct == null
      ? "No verified on-chain price yet — compare exchange or brokerage routes below."
      : spreadPct > 2
        ? "The token costs more than the stock — you are paying a premium."
        : spreadPct < -2
          ? "The token costs less than the stock — you are getting a discount."
          : "Prices are roughly aligned right now.";

  return (
    <div className={spcxCardClass}>
      <div className="border-b border-border/40 px-5 py-4 sm:px-6">
        <p className={spcxKickerClass}>At a glance</p>
        <h2 className="mt-1 font-display text-lg font-semibold tracking-tight sm:text-xl">
          Stock price vs token price
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Think of this like comparing the same product at two stores — we show if you are overpaying.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-3 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
        <PriceBlock
          label="Traditional stock"
          sublabel={`Nasdaq · ${report.nasdaqTicker}`}
          price={report.nasdaqPriceUsd != null ? formatUsd(report.nasdaqPriceUsd) : "—"}
        />

        <div className="flex flex-col items-center justify-center gap-1 px-2 py-2 sm:py-0">
          {hasLive && spreadPct != null ? (
            <>
              <Badge
                variant={Math.abs(spreadPct) > 5 ? "destructive" : "secondary"}
                className="rounded-lg font-mono tabular-nums"
              >
                {formatSpread(spreadPct)}
              </Badge>
              <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
              <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                <SpcxHelpTip term="Spread" className="text-[10px]">
                  Difference
                </SpcxHelpTip>
              </p>
            </>
          ) : (
            <Minus className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>

        <PriceBlock
          label="Token on Solana"
          sublabel={hasLive ? `${liveVenue!.symbol} · verified pool` : "No verified DEX pool"}
          price={hasLive ? formatUsd(liveVenue!.priceUsd) : "—"}
          muted={!hasLive}
        />
      </div>

      <div className="border-t border-border/40 bg-muted/[0.03] px-5 py-3.5 sm:px-6">
        <p className="text-sm text-muted-foreground">{spreadExplanation}</p>
        {nasdaqFallback ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Stock price is using IPO reference — live Nasdaq feed is temporarily offline.
          </p>
        ) : null}
      </div>
    </div>
  );
}
