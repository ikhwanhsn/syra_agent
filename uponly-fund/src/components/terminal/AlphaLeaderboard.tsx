import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePill, GlassCard, TokenAvatar } from "@/components/rise/RiseShared";
import { computeAlphaScore, rankByAlpha } from "./IntelligenceEngine";
import { AlphaCell } from "./IntelligenceColumns";
import { TERMINAL_SIDEBAR_LIST_SIZE } from "./terminalSidebarConstants";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { cn } from "@/lib/utils";

export function AlphaLeaderboard({ onSelect }: { onSelect: (market: RiseMarketRow) => void }) {
  const allMarkets = useRiseMarketsAll(150);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  const topRows = useMemo(
    () => rankByAlpha(allMarkets.data ?? []).slice(0, TERMINAL_SIDEBAR_LIST_SIZE),
    [allMarkets.data],
  );

  const loading = allMarkets.isPending && topRows.length === 0;

  return (
    <GlassCard
      padded={false}
      className={cn(
        "h-full w-full min-h-0 flex flex-col border-border/40 shadow-[0_22px_50px_-28px_hsl(0_0%_0%/0.4),inset_0_1px_0_hsl(0_0%_100%/0.05)] dark:shadow-[0_26px_60px_-28px_hsl(0_0%_0%/0.55),inset_0_1px_0_hsl(0_0%_100%/0.04)]",
      )}
    >
      <div className="shrink-0 border-b border-border/35 bg-muted/[0.08] px-4 py-3.5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background/40 text-muted-foreground shadow-sm">
              <Trophy className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground sm:text-[0.9375rem]">
                {copy.terminal.alphaLeaderboard}
              </h3>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{copy.terminal.topTen}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 border-border/45 bg-background/30 font-mono text-[0.65rem] font-normal tabular-nums">
            {loading ? TERMINAL_SIDEBAR_LIST_SIZE : topRows.length}
          </Badge>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 sm:p-4">
        {loading ? (
          Array.from({ length: TERMINAL_SIDEBAR_LIST_SIZE }, (_, i) => (
            <Skeleton key={`alpha-sk-${i}`} className="min-h-[3rem] flex-1 basis-0 rounded-xl" />
          ))
        ) : topRows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/[0.03] px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">{copy.terminal.sidebarListsEmpty}</p>
          </div>
        ) : (
          topRows.map((row, idx) => (
            <button
              key={row.mint}
              type="button"
              onClick={() => onSelect(row)}
              className="flex min-h-[3rem] w-full flex-1 basis-0 items-center gap-2.5 rounded-xl border border-transparent bg-background/20 px-2 py-2 text-left transition-all duration-200 hover:border-border/45 hover:bg-muted/15 hover:shadow-sm active:scale-[0.995]"
            >
              <span className="w-6 shrink-0 text-center font-mono text-[0.65rem] font-medium tabular-nums text-muted-foreground">
                {idx + 1}
              </span>
              <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold tracking-tight text-foreground">${row.symbol || "—"}</p>
                <AlphaCell alpha={computeAlphaScore(row)} compact />
              </div>
              <ChangePill pct={row.priceChange24hPct} />
            </button>
          ))
        )}
      </div>
    </GlassCard>
  );
}
