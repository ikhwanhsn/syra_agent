import { useMemo } from "react";
import { GlassCard, MarketRowCard, SectionHeader } from "@/components/rise/RiseShared";
import { findSimilarMarkets } from "@/lib/marketIntel";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useNavigateToToken } from "@/lib/useNavigateToToken";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export function TokenSimilarMarkets({
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
  const go = useNavigateToToken();

  const similar = useMemo(() => (market ? findSimilarMarkets(market, all, { limit: 6 }) : []), [market, all]);

  if (!market) return null;

  return (
    <GlassCard className={className}>
      <SectionHeader eyebrow={t.sectionSimilar} title={t.similarTitle} description={t.similarSubtitle} />
      {similar.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t.chartNoData}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {similar.map((m) => (
            <li key={m.mint}>
              <MarketRowCard market={m} onClick={() => go(m)} className="h-full min-h-[4.5rem]" />
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
