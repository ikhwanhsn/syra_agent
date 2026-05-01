import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePill, GlassCard, TokenAvatar, VerifiedBadge } from "@/components/rise/RiseShared";
import { computeRiskFlags, rankByRisk } from "./IntelligenceEngine";
import { RiskCell } from "./IntelligenceColumns";
import { TERMINAL_SIDEBAR_LIST_SIZE } from "./terminalSidebarConstants";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { cn } from "@/lib/utils";

export function RiskWatchlist({ onSelect }: { onSelect: (market: RiseMarketRow) => void }) {
  const allMarkets = useRiseMarketsAll(150);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  const rows = useMemo(
    () => rankByRisk(allMarkets.data ?? []).slice(0, TERMINAL_SIDEBAR_LIST_SIZE),
    [allMarkets.data],
  );

  const loading = allMarkets.isPending && rows.length === 0;

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
              <ShieldAlert className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground sm:text-[0.9375rem]">
                {copy.terminal.riskWatchlist}
              </h3>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{copy.terminal.highestFlags}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 border-border/45 bg-background/30 font-mono text-[0.65rem] font-normal tabular-nums">
            {loading ? TERMINAL_SIDEBAR_LIST_SIZE : rows.length}
          </Badge>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3.5 sm:p-4">
        {loading ? (
          Array.from({ length: TERMINAL_SIDEBAR_LIST_SIZE }, (_, i) => (
            <Skeleton key={`risk-sk-${i}`} className="min-h-[6.25rem] flex-1 basis-0 rounded-2xl" />
          ))
        ) : rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/[0.03] px-6 py-12 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">{copy.terminal.sidebarListsEmpty}</p>
          </div>
        ) : (
          rows.map((row) => {
            const flags = computeRiskFlags(row);
            const hasRisk = flags.length > 0;
            return (
              <button
                key={row.mint}
                type="button"
                onClick={() => onSelect(row)}
                className={cn(
                  "group relative w-full flex-1 basis-0 overflow-hidden rounded-2xl border text-left",
                  "min-h-[6rem] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.45)]",
                  "ring-1 ring-inset ring-black/[0.03] dark:ring-white/[0.05]",
                  "transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_rgba(0,0,0,0.18)] dark:hover:shadow-[0_18px_44px_-10px_rgba(0,0,0,0.65)]",
                  "active:translate-y-0 active:shadow-[0_4px_14px_-6px_rgba(0,0,0,0.15)] active:duration-150",
                  hasRisk
                    ? [
                        "border-border/45 bg-gradient-to-b from-card/85 via-card/55 to-rose-500/[0.06]",
                        "hover:border-rose-400/40 hover:from-card/95 hover:via-card/70 hover:to-rose-500/[0.12]",
                        "dark:to-rose-950/[0.28] dark:hover:border-rose-400/35",
                      ]
                    : [
                        "border-border/45 bg-gradient-to-b from-card/85 via-card/55 to-emerald-500/[0.05]",
                        "hover:border-emerald-400/35 hover:from-card/95 hover:via-card/70 hover:to-emerald-500/[0.1]",
                        "dark:to-emerald-950/[0.18] dark:hover:border-emerald-400/28",
                      ],
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    hasRisk
                      ? "bg-gradient-to-r from-transparent via-rose-400/35 to-transparent"
                      : "bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent",
                  )}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br to-transparent",
                      hasRisk ? "from-rose-500/[0.06]" : "from-emerald-500/[0.06]",
                    )}
                  />
                </div>

                <div className="relative flex h-full min-h-0 flex-col gap-4 px-4 py-4 sm:px-5 sm:py-[1.125rem]">
                  <div className="flex items-center gap-4">
                    <TokenAvatar
                      imageUrl={row.imageUrl}
                      symbol={row.symbol}
                      size="sm"
                      className="ring-2 ring-background shadow-md"
                    />
                    <div className="min-w-0 flex-1 space-y-1 pr-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground">
                          ${row.symbol || "—"}
                        </span>
                        <VerifiedBadge verified={Boolean(row.isVerified)} />
                      </div>
                      <p className="line-clamp-2 text-[0.6875rem] leading-relaxed text-muted-foreground sm:line-clamp-1">
                        {row.name || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 pl-2">
                      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {copy.terminal.h24}
                      </span>
                      <ChangePill pct={row.priceChange24hPct} className="rounded-lg px-2.5 py-1 text-[0.6875rem] font-semibold" />
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 border-t border-border/35 pt-4 sm:grid-cols-[1fr_minmax(5.5rem,auto)] sm:items-start">
                    <div className="min-w-0">
                      <RiskCell
                        presentation="watchlist"
                        flags={flags}
                        flagLabels={copy.terminal.riskLabel}
                        watchlistCopy={{
                          riskHeading: copy.terminal.risk,
                          clearState: copy.terminal.riskWatchlistClear,
                        }}
                      />
                    </div>
                    <div className="flex flex-col justify-start gap-1 border-border/30 pt-1 sm:border-l sm:pl-5 sm:pt-0">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {copy.terminal.vol24h}
                      </p>
                      <p className="font-mono text-[0.8125rem] font-semibold tabular-nums leading-snug tracking-tight text-foreground">
                        {formatUsd(row.volume24hUsd, { compact: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}
