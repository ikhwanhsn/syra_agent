import { useMemo } from "react";
import { PieChart } from "lucide-react";
import { FUND_STATS } from "@/data/fundStats";
import { useRiseDashboard } from "@/lib/RiseDashboardContext";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  GlassCard,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
} from "@/components/rise/RiseShared";
import { useLanguage } from "@/lib/LanguageContext";

type AllocationPanelProps = {
  className?: string;
  onSelect: (market: RiseMarketRow) => void;
};

function buildWeights(rows: RiseMarketRow[]): Map<string, number> {
  const seeded = rows.map((row, index) => ({ row, score: Math.max(1, 100 - index * 14) }));
  const total = seeded.reduce((sum, item) => sum + item.score, 0);
  return new Map(seeded.map((item) => [item.row.mint, item.score / total]));
}

export function AllocationPanel({ className, onSelect }: AllocationPanelProps) {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const { aggregate } = useRiseDashboard();

  const deployedPct = useMemo(() => {
    if (FUND_STATS.aumUsd <= 0) return 0;
    return Math.max(0, Math.min(100, (FUND_STATS.deployedUsd / FUND_STATS.aumUsd) * 100));
  }, []);

  const holdings = useMemo(() => (aggregate.data?.largestByMcap ?? []).slice(0, 5), [aggregate.data]);
  const weights = useMemo(() => buildWeights(holdings), [holdings]);
  const gradient = useMemo(
    () =>
      `conic-gradient(hsl(var(--uof) / 0.78) 0% ${deployedPct}%, hsl(var(--muted-foreground) / 0.2) ${deployedPct}% 100%)`,
    [deployedPct],
  );

  return (
    <GlassCard className={cn("p-4 sm:p-5 lg:p-6", className)}>
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <section>
          <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <PieChart className="h-3.5 w-3.5" aria-hidden />
            {isZh ? "仓位分布图" : "Allocation map"}
          </div>
          <div className="mx-auto flex w-fit flex-col items-center gap-4">
            <div className="relative h-44 w-44 rounded-full p-3" style={{ background: gradient }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-border/55 bg-background/90 text-center shadow-inner">
                <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{isZh ? "已部署" : "Deployed"}</p>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{formatPct(deployedPct)}</p>
                <p className="text-[0.65rem] text-muted-foreground">{formatUsd(FUND_STATS.deployedUsd, { compact: true })}</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border/50 bg-background/35 p-2">
                <p className="text-muted-foreground">{isZh ? "已部署" : "Deployed"}</p>
                <p className="mt-1 font-medium tabular-nums text-foreground">
                  {formatUsd(FUND_STATS.deployedUsd, { compact: true })}
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/35 p-2">
                <p className="text-muted-foreground">{isZh ? "闲置" : "Idle"}</p>
                <p className="mt-1 font-medium tabular-nums text-foreground">{formatUsd(FUND_STATS.idleUsd, { compact: true })}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground sm:text-lg">
              {isZh ? "头部持仓（实时）" : "Top holdings (live)"}
            </h2>
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">{isZh ? "RISE 按市值排序" : "RISE largest by mcap"}</span>
          </div>
          <div className="space-y-2">
            {holdings.map((market) => {
              const weight = weights.get(market.mint) ?? 0;
              return (
                <button
                  key={market.mint}
                  type="button"
                  onClick={() => onSelect(market)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/55 bg-background/35 px-3 py-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-foreground">${market.symbol || "—"}</p>
                      <VerifiedBadge verified={market.isVerified} />
                    </div>
                    <p className="truncate text-[0.7rem] text-muted-foreground sm:text-xs">{market.name || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(market.priceUsd)}</p>
                    <ChangePill pct={market.priceChange24hPct} className="mt-1" />
                  </div>
                  <div className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                    {formatPct(weight * 100)}
                  </div>
                </button>
              );
            })}
            {holdings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/55 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
                {isZh ? "等待持仓数据流..." : "Waiting for holdings feed..."}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </GlassCard>
  );
}
