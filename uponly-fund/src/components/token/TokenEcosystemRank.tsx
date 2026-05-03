import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { computeMarketRanks } from "@/lib/marketIntel";
import { GlassCard, SectionHeader } from "@/components/rise/RiseShared";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

function RankBar({
  label,
  topPct,
  topPctTemplate,
  className,
}: {
  label: string;
  topPct: number | null;
  topPctTemplate: string;
  className?: string;
}) {
  const width = topPct != null ? Math.min(100, Math.max(8, 100 - topPct)) : 0;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-medium text-foreground/90">{label}</span>
        {topPct != null ? (
          <span className="rounded-full border border-border/50 bg-background/50 px-2 py-0.5 font-mono text-[0.65rem] tabular-nums text-foreground">
            {topPctTemplate.replace("{pct}", String(topPct))}
          </span>
        ) : (
          <span className="text-[0.65rem] text-muted-foreground">—</span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ring/80 to-uof/75 transition-[width]"
          style={{ width: `${topPct != null ? width : 0}%` }}
        />
      </div>
    </div>
  );
}

export function TokenEcosystemRank({
  market,
  all,
  className,
}: {
  market: RiseMarketRow | null;
  all: RiseMarketRow[];
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;

  const ranks = market ? computeMarketRanks(market, all) : null;

  if (!market) return null;

  return (
    <GlassCard className={className}>
      <SectionHeader
        eyebrow={t.sectionEcosystem}
        title={t.rankTop}
        description={`${all.length} markets in cohort`}
      />
      <div className="mt-6 space-y-5">
        <RankBar
          label={t.rankMcap}
          topPct={ranks?.mcap?.topPct ?? null}
          topPctTemplate={t.topPercentLabel}
        />
        <RankBar
          label={t.rankVol}
          topPct={ranks?.volume24h?.topPct ?? null}
          topPctTemplate={t.topPercentLabel}
        />
        <RankBar
          label={t.rankHolders}
          topPct={ranks?.holders?.topPct ?? null}
          topPctTemplate={t.topPercentLabel}
        />
        <RankBar
          label={t.rankAge}
          topPct={ranks?.ageHours?.topPct ?? null}
          topPctTemplate={t.topPercentLabel}
        />
      </div>
    </GlassCard>
  );
}
