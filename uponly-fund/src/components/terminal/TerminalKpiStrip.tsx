import { Activity } from "lucide-react";
import { FUND_STATS } from "@/data/fundStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiseDashboard, useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { computeAlphaScore } from "./IntelligenceEngine";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

function asOfLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TerminalKpiStrip() {
  const { aggregate } = useRiseDashboard();
  const allMarkets = useRiseMarketsAll(150);
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const rows = allMarkets.data ?? [];
  const alphaPicks = rows.filter((row) => computeAlphaScore(row).score >= 70).length;
  const marketsListPending = allMarkets.isPending && !allMarkets.data;

  const items = [
    { label: copy.terminal.markets, value: formatInt(aggregate.data?.ecosystem.marketCount ?? rows.length ?? 0) },
    { label: copy.terminal.vol24h, value: formatUsd(aggregate.data?.ecosystem.totalVolume24hUsd ?? null, { compact: true }) },
    { label: copy.terminal.mcap, value: formatUsd(aggregate.data?.ecosystem.totalMarketCapUsd ?? null, { compact: true }) },
    {
      label: copy.terminal.alphaPicks,
      value: marketsListPending ? null : formatInt(alphaPicks),
    },
    { label: copy.terminal.agentsOnline, value: formatInt(FUND_STATS.agentsOnline) },
    { label: copy.terminal.feed, value: aggregate.data?.degraded ? copy.terminal.feedPartial : copy.terminal.feedHealthy },
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card/90 via-card/50 to-muted/10 p-4 shadow-[0_20px_48px_-28px_hsl(0_0%_0%/0.45),inset_0_1px_0_hsl(0_0%_100%/0.06)] backdrop-blur-xl sm:p-5 dark:shadow-[0_24px_56px_-28px_hsl(0_0%_0%/0.65),inset_0_1px_0_hsl(0_0%_100%/0.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-3">
        <p className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span
            className="relative flex h-2 w-2"
            aria-hidden
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success shadow-[0_0_10px_hsl(var(--success)/0.55)]" />
          </span>
          {copy.terminal.liveRiseTerminal}
        </p>
        <p className="inline-flex items-center gap-2 rounded-full border border-border/35 bg-background/30 px-3 py-1 text-[0.65rem] tabular-nums text-muted-foreground backdrop-blur-sm">
          <Activity className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
          <span>
            {copy.terminal.asOf} {asOfLabel(aggregate.data?.updatedAt ?? null)}
          </span>
        </p>
      </div>
      <div className="grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.label}
            className="group relative rounded-xl border border-border/35 bg-background/25 px-3.5 py-3 transition-colors duration-200 hover:border-border/55 hover:bg-background/40 sm:px-4 sm:py-3.5"
          >
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">{item.label}</p>
            <p className="mt-1.5 text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.0625rem]">
              {item.value === null ? (
                <Skeleton className="inline-block h-[1.35em] w-[2.25rem] rounded-md align-middle" aria-hidden />
              ) : (
                item.value
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
