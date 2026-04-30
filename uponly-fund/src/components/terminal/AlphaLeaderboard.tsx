import { useMemo } from "react";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { ChangePill, GlassCard, TokenAvatar } from "@/components/rise/RiseShared";
import { computeAlphaScore, rankByAlpha } from "./IntelligenceEngine";
import { AlphaCell } from "./IntelligenceColumns";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export function AlphaLeaderboard({ onSelect }: { onSelect: (market: RiseMarketRow) => void }) {
  const allMarkets = useRiseMarketsAll(150);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const topRows = useMemo(() => rankByAlpha(allMarkets.data ?? []).slice(0, 10), [allMarkets.data]);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">{copy.terminal.alphaLeaderboard}</h3>
        <span className="text-[0.65rem] text-muted-foreground">{copy.terminal.topTen}</span>
      </div>
      <div className="space-y-2">
        {topRows.map((row, idx) => (
          <button
            key={row.mint}
            type="button"
            onClick={() => onSelect(row)}
            className="flex w-full items-center gap-2 rounded-xl border border-border/55 bg-background/35 p-2 text-left hover:bg-background/50"
          >
            <span className="w-5 text-[0.65rem] text-muted-foreground">#{idx + 1}</span>
            <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">${row.symbol || "—"}</p>
              <AlphaCell alpha={computeAlphaScore(row)} compact />
            </div>
            <ChangePill pct={row.priceChange24hPct} />
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
