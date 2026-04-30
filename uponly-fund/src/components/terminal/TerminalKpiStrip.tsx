import { Activity } from "lucide-react";
import { FUND_STATS } from "@/data/fundStats";
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

  const items = [
    { label: copy.terminal.markets, value: formatInt(aggregate.data?.ecosystem.marketCount ?? rows.length ?? 0) },
    { label: copy.terminal.vol24h, value: formatUsd(aggregate.data?.ecosystem.totalVolume24hUsd ?? null, { compact: true }) },
    { label: copy.terminal.mcap, value: formatUsd(aggregate.data?.ecosystem.totalMarketCapUsd ?? null, { compact: true }) },
    { label: copy.terminal.alphaPicks, value: formatInt(alphaPicks) },
    { label: copy.terminal.agentsOnline, value: formatInt(FUND_STATS.agentsOnline) },
    { label: copy.terminal.feed, value: aggregate.data?.degraded ? copy.terminal.feedPartial : copy.terminal.feedHealthy },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          {copy.terminal.liveRiseTerminal}
        </p>
        <p className="inline-flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
          <Activity className="h-3 w-3" aria-hidden />
          {copy.terminal.asOf} {asOfLabel(aggregate.data?.updatedAt ?? null)}
        </p>
      </div>
      <div className="grid gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 bg-background/35 px-3 py-2">
            <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
