import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  bestLiveVenue,
  formatSpread,
  isNasdaqReferenceFallback,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { SpcxHelpTip } from "@/components/spcx/SpcxHelpTip";
import { spcxCardQuietClass, spcxKickerClass, spcxMetricValueClass } from "@/components/spcx/spcxStyles";

function MetricTile({
  label,
  helpTerm,
  helpText,
  value,
  hint,
  className,
}: {
  label: string;
  helpTerm?: string;
  helpText?: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn(spcxCardQuietClass, className)}>
      <CardContent className="p-4 sm:p-5">
        <p className={spcxKickerClass}>
          {helpTerm && helpText ? (
            <SpcxHelpTip term={helpTerm}>{label}</SpcxHelpTip>
          ) : (
            label
          )}
        </p>
        <p className={cn("mt-2", spcxMetricValueClass)}>{value}</p>
        {hint ? (
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SpcxMetricsRow({ report }: { report: SpcxIntelligenceReport }) {
  const topVenue = bestLiveVenue(report);
  const hasLiveOnchain = Boolean(topVenue);
  const nasdaqFallback = isNasdaqReferenceFallback(report);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Stock price"
        helpTerm="Nasdaq"
        helpText="The US stock exchange where SpaceX shares (SPCX) trade."
        value={report.nasdaqPriceUsd != null ? `$${report.nasdaqPriceUsd.toFixed(2)}` : "—"}
        hint={
          nasdaqFallback
            ? "Using IPO reference — not live market"
            : `${report.nasdaqTicker} on Nasdaq`
        }
      />
      <MetricTile
        label="Token price"
        helpTerm="Token"
        helpText="Digital stock exposure on Solana — trades like crypto, 24/7."
        value={hasLiveOnchain ? `$${topVenue!.priceUsd!.toFixed(2)}` : "Not live"}
        hint={hasLiveOnchain ? `${topVenue!.symbol} verified pool` : "Waiting for official liquidity"}
      />
      <MetricTile
        label="Price gap"
        helpTerm="Spread"
        helpText="How much more (or less) the token costs compared to the stock."
        value={hasLiveOnchain ? formatSpread(topVenue!.spreadPct ?? null) : "—"}
        hint={
          hasLiveOnchain && topVenue?.spreadLabel
            ? topVenue.spreadLabel === "premium"
              ? "Token costs more than stock"
              : topVenue.spreadLabel === "discount"
                ? "Token costs less than stock"
                : "Prices are aligned"
            : "Updates live as prices move"
        }
      />
      <MetricTile
        label="Ways to buy"
        helpTerm="Venues"
        helpText="Platforms that offer SpaceX exposure — exchange, on-chain, or brokerage."
        value={`${report.venues.filter((v) => v.status === "live").length} of ${report.venues.length} live`}
        hint="See Where to buy tab for details"
      />
    </div>
  );
}
