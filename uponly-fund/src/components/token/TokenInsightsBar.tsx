import {
  computeAlphaScore,
  computeNarrativeTags,
  computeRiskFlags,
} from "@/components/terminal/IntelligenceEngine";
import { AlphaCell, NarrativeCell, RiskCell } from "@/components/terminal/IntelligenceColumns";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

/** Compact signal row — one glance for alpha, risk, and narrative without three heavy cards. */
export function TokenInsightsBar({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  if (!market) return null;

  const alpha = computeAlphaScore(market);
  const risks = computeRiskFlags(market);
  const narratives = computeNarrativeTags(market);

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border border-border/50 bg-card/35 px-4 py-3 backdrop-blur-md sm:grid-cols-3 sm:gap-4 sm:px-5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5 border-border/35 sm:border-r sm:pr-4">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {copy.terminal.alpha}
        </span>
        <AlphaCell alpha={alpha} />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 border-border/35 sm:border-r sm:px-1 sm:pr-4">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {copy.terminal.riskFlags}
        </span>
        <RiskCell
          flags={risks}
          presentation="watchlist"
          flagLabels={copy.terminal.riskLabel}
          watchlistCopy={{
            riskHeading: copy.terminal.risk,
            clearState: copy.terminal.riskWatchlistClear,
          }}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 sm:pl-1">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {copy.terminal.narratives}
        </span>
        <NarrativeCell tags={narratives} />
      </div>
    </div>
  );
}
