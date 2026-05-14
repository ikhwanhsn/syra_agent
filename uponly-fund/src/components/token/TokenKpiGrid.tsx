import { GlassCard, SectionHeader, StatTile, formatPriceSmart, formatRelativeAge } from "@/components/rise/RiseShared";
import { computeRoiFromStart, computeTurnoverRatio } from "@/lib/marketIntel";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export function TokenKpiGrid({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;

  if (!market) return null;

  const roi = computeRoiFromStart(market.priceUsd, market.startingPriceUsd);
  const turnover = computeTurnoverRatio(market.volume24hUsd, market.marketCapUsd);

  return (
    <section className={cn(className)}>
      <SectionHeader
        eyebrow={t.sectionKpis}
        title={market.symbol ? `$${market.symbol}` : t.pageTitle}
        description={t.sectionKpisDescription}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t.kpiGroupMarket}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatTile label={t.kpiPrice} value={formatPriceSmart(market.priceUsd)} />
            <StatTile label={t.kpiFloor} value={formatPriceSmart(market.floorPriceUsd)} />
            <StatTile
              label={t.kpiFloorDelta}
              value={market.floorDeltaPct != null ? formatPct(market.floorDeltaPct) : "—"}
            />
            <StatTile label={t.kpiMcap} value={formatUsd(market.marketCapUsd, { compact: false })} />
            <StatTile label={t.kpiFloorMcap} value={formatUsd(market.floorMarketCapUsd, { compact: false })} />
            <StatTile label={t.kpiStartPrice} value={formatPriceSmart(market.startingPriceUsd)} />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t.kpiGroupLiquidity}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatTile label={t.kpiVol24h} value={formatUsd(market.volume24hUsd, { compact: false })} />
            <StatTile label={t.kpiVolAll} value={formatUsd(market.volumeAllTimeUsd, { compact: false })} />
            <StatTile
              label={t.kpiRoi}
              value={roi != null ? formatPct(roi) : "—"}
              accent={roi != null && roi > 0}
            />
            <StatTile
              label={t.kpiTurnover}
              value={turnover != null ? `${turnover.toFixed(2)}×` : "—"}
              sub="24h"
            />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t.kpiGroupSupply}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatTile label={t.kpiHolders} value={formatInt(market.holders)} />
            <StatTile
              label={t.kpiLocked}
              value={market.lockedSupplyPct != null ? `${market.lockedSupplyPct.toFixed(1)}%` : "—"}
            />
            <StatTile
              label={t.kpiCreatorFee}
              value={market.creatorFeePct != null ? `${market.creatorFeePct}%` : "—"}
            />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t.kpiGroupLifecycle}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatTile label={t.kpiAge} value={formatRelativeAge(market.ageHours)} />
            <StatTile
              label={t.kpiCreatedAt}
              value={market.createdAt ? new Date(market.createdAt).toLocaleString() : "—"}
            />
            <StatTile
              label={t.kpiUpdatedAt}
              value={market.updatedAt ? new Date(market.updatedAt).toLocaleString() : "—"}
            />
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
