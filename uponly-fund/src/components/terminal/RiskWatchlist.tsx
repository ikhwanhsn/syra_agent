import { useMemo } from "react";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { GlassCard, TokenAvatar } from "@/components/rise/RiseShared";
import { computeRiskFlags, rankByRisk } from "./IntelligenceEngine";
import { RiskCell } from "./IntelligenceColumns";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export function RiskWatchlist({ onSelect }: { onSelect: (market: RiseMarketRow) => void }) {
  const allMarkets = useRiseMarketsAll(150);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const rows = useMemo(() => rankByRisk(allMarkets.data ?? []).slice(0, 5), [allMarkets.data]);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{copy.terminal.riskWatchlist}</h3>
        <span className="text-[0.65rem] text-muted-foreground">{copy.terminal.highestFlags}</span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const flags = computeRiskFlags(row);
          return (
            <button
              key={row.mint}
              type="button"
              onClick={() => onSelect(row)}
              className="w-full rounded-xl border border-border/55 bg-background/35 p-2 text-left hover:bg-background/50"
            >
              <div className="flex items-center gap-2">
                <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">${row.symbol || "—"}</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {formatUsd(row.volume24hUsd, { compact: true })} {copy.terminal.volSuffix}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <RiskCell flags={flags} />
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}
