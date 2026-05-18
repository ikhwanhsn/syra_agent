import { formatPriceSmart, formatRelativeAge } from "@/components/rise/RiseShared";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { computeRoiFromStart } from "@/lib/marketIntel";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

type StatItemProps = {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  className?: string;
};

function StatItem({ label, value, sub, accent, className }: StatItemProps) {
  return (
    <div className={cn("flex min-w-[5.5rem] shrink-0 flex-col gap-0.5 px-4 py-3 first:pl-5 sm:min-w-[6.5rem]", className)}>
      <span className="text-[0.65rem] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-display text-sm font-semibold tabular-nums tracking-tight text-foreground sm:text-base",
          accent && "text-emerald-400",
        )}
      >
        {value}
      </span>
      {sub ? <span className="text-[0.62rem] text-muted-foreground/80">{sub}</span> : null}
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={cn("w-px shrink-0 self-stretch bg-border/40", className)} aria-hidden />;
}

/** Horizontal strip of the six metrics traders scan first — DEX-style at-a-glance row. */
export function TokenStatsBar({
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

  return (
    <div
      className={cn(
        "flex overflow-x-auto rounded-2xl border border-border/50 bg-card/40 shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset] backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <StatItem label={t.kpiMcap} value={formatUsd(market.marketCapUsd, { compact: true })} />
      <Divider />
      <StatItem label={t.kpiVol24h} value={formatUsd(market.volume24hUsd, { compact: true })} />
      <Divider className="hidden sm:block" />
      <StatItem label={t.kpiHolders} value={formatInt(market.holders)} className="hidden sm:flex" />
      <Divider className="hidden sm:block" />
      <StatItem label={t.kpiFloor} value={formatPriceSmart(market.floorPriceUsd)} />
      <Divider />
      <StatItem
        label={t.kpiRoi}
        value={roi != null ? formatPct(roi) : "—"}
        accent={roi != null && roi > 0}
      />
      <Divider />
      <StatItem label={t.kpiAge} value={formatRelativeAge(market.ageHours)} />
    </div>
  );
}
