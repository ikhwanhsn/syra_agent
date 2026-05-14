import {
  computeAlphaScore,
  computeNarrativeTags,
  computeRiskFlags,
} from "@/components/terminal/IntelligenceEngine";
import { AlphaCell, NarrativeCell, RiskCell } from "@/components/terminal/IntelligenceColumns";
import { GlassCard, SectionHeader } from "@/components/rise/RiseShared";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-foreground/80">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-uof/90 to-foreground/40 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TokenScoreStrip({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const t = copy.tokenDetail;

  if (!market) return null;

  const alpha = computeAlphaScore(market);
  const risks = computeRiskFlags(market);
  const narratives = computeNarrativeTags(market);

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <SectionHeader
        eyebrow={t.sectionScore}
        title={t.scoreSectionHeadline}
        description={t.sectionScoreDescription}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.terminal.alpha}
          </p>
          <div className="mt-3">
            <AlphaCell alpha={alpha} />
          </div>
          <div className="mt-4 space-y-3 border-t border-border/35 pt-4">
            <ScoreBar label={t.scoreMomentum} value={alpha.momentum} max={40} />
            <ScoreBar label={t.scoreFlow} value={alpha.flow} max={25} />
            <ScoreBar label={t.scoreDepth} value={alpha.depth} max={20} />
            <ScoreBar label={t.scoreFreshness} value={alpha.freshness} max={15} />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.terminal.riskFlags}
          </p>
          <div className="mt-3">
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
        </GlassCard>
        <GlassCard>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.terminal.narratives}
          </p>
          <div className="mt-4">
            <NarrativeCell tags={narratives} />
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
