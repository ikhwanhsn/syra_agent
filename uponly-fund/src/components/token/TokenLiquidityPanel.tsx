import type { RiseAggregateResponse, RiseMarketRow } from "@/lib/riseDashboardTypes";
import { computeFloorCoverage } from "@/lib/marketIntel";
import { formatPct } from "@/lib/marketDisplayFormat";
import { GlassCard, SectionHeader, StatTile } from "@/components/rise/RiseShared";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

function Donut({ pct, label, className }: { pct: number | null; label: string; className?: string }) {
  const p = pct != null && Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - p / 100);
  return (
    <div className={cn("relative flex h-36 w-36 items-center justify-center", className)}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="fill-none stroke-muted/35" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-uof/80 transition-[stroke-dashoffset] duration-500"
          strokeWidth="8"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-xl font-bold tabular-nums">{p.toFixed(0)}%</span>
        <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function TokenLiquidityPanel({
  market,
  aggregate,
  className,
}: {
  market: RiseMarketRow | null;
  aggregate: RiseAggregateResponse | undefined;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;

  if (!market) return null;

  const floorCov = computeFloorCoverage(market.floorMarketCapUsd, market.marketCapUsd);
  const medianFee = aggregate?.ecosystem.medianCreatorFeePct ?? null;
  const feeDelta =
    market.creatorFeePct != null && medianFee != null ? market.creatorFeePct - medianFee : null;

  return (
    <GlassCard className={className}>
      <SectionHeader eyebrow={t.sectionLiquidity} title={t.liquidityLocked} />
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <Donut pct={market.lockedSupplyPct} label={t.liquidityLocked} />
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.liquidityFloorCover}
            </p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted/45">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500/90 to-uof/90 transition-[width]"
                style={{ width: `${floorCov != null ? Math.min(100, floorCov) : 0}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
              {floorCov != null ? formatPct(floorCov) : "—"}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <StatTile
              label={t.liquidityFeeMedian}
              value={feeDelta != null ? `${feeDelta >= 0 ? "+" : ""}${feeDelta.toFixed(2)} pts vs median` : "—"}
              sub={medianFee != null ? `Median ${medianFee.toFixed(2)}%` : undefined}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
