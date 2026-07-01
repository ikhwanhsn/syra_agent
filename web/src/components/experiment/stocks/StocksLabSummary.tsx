import { Medal, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatStocksUsd } from "@/lib/stocksExperimentApi";
import type { StocksAgentStats, StocksRunRow } from "@/lib/stocksExperimentApi";
import { ExperimentLeaderboardList } from "@/components/experiment/shared/ExperimentLeaderboardList";
import { ExperimentTradeFeed } from "@/components/experiment/shared/ExperimentTradeFeed";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

function pnlClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn(overviewCardShell, "flex items-center gap-4 rounded-2xl px-4 py-3.5")}>
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export interface StocksLabSummaryProps {
  agents: StocksAgentStats[];
  recentRuns: StocksRunRow[];
  loading?: boolean;
  selectedStrategyId?: number | null;
  onSelectStrategy?: (id: number) => void;
}

export function StocksLabSummary({
  agents,
  recentRuns,
  loading,
  selectedStrategyId,
  onSelectStrategy,
}: StocksLabSummaryProps) {
  const topAgents = [...agents]
    .sort((a, b) => (b.sumPnlUsd ?? 0) - (a.sumPnlUsd ?? 0))
    .slice(0, 8);
  const leader = topAgents[0];

  const leaderboardRows = topAgents.map((a, idx) => ({
    key: String(a.strategyId),
    rank: idx + 1,
    label: a.strategyName,
    equityLabel: formatStocksUsd(a.equityUsd ?? 1000),
    retPct: a.returnPct ?? 0,
    openCount: a.openPositions,
    badge:
      idx === 0 && (a.sumPnlUsd ?? 0) > 0
        ? { text: "Leader", className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300" }
        : null,
    selected: selectedStrategyId === a.strategyId,
  }));

  const tradeItems = recentRuns.slice(0, 8).map((r) => {
    const pnl = r.simPnlUsd ?? 0;
    const isOpen = r.status === "open";
    return {
      id: r.id,
      timeLabel: formatTime(isOpen ? r.openedAt : r.resolvedAt ?? r.createdAt),
      strategyLabel: r.strategyName,
      tokenLabel: r.symbol,
      reasonLabel: r.newsHeadline ?? (r.signalSnapshot ? "News signal triggered" : "—"),
      pnlLabel: isOpen ? "Open" : `${pnl >= 0 ? "+" : ""}${formatStocksUsd(pnl)}`,
      pnlPositive: !isOpen && pnl > 0,
      pnlNegative: !isOpen && pnl < 0,
    };
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-3">
        {loading && topAgents.length === 0 ? <LeaderboardSkeleton /> : null}

        {!loading && topAgents.length === 0 ? (
          <div
            className={cn(
              overviewCardShell,
              "flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-12 text-center",
            )}
          >
            <TrendingUp className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium text-foreground/90">Starting fresh</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Agents will appear here after the first news-driven paper trades.
            </p>
          </div>
        ) : null}

        {leader && !loading ? (
          <div
            className={cn(
              overviewCardShell,
              "relative overflow-hidden rounded-2xl ring-1 ring-amber-500/20",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(420px 120px at 0% 0%, hsl(45 93% 47% / 0.12), transparent 55%)",
              }}
              aria-hidden
            />
            <div className="relative flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/12">
                <Medal className="h-5 w-5 text-amber-700 dark:text-amber-200" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800/80 dark:text-amber-200/90">
                  Best profitable agent
                </p>
                <p className="mt-1 truncate text-base font-semibold text-foreground">{leader.strategyName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {leader.winRatePct != null ? `${leader.winRatePct.toFixed(0)}% win rate` : "No results yet"}
                  {" · "}
                  {leader.decided} trades
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("font-mono text-lg font-semibold tabular-nums", pnlClass(leader.sumPnlUsd ?? 0))}>
                  {(leader.sumPnlUsd ?? 0) >= 0 ? "+" : ""}
                  {formatStocksUsd(leader.sumPnlUsd ?? 0)}
                </p>
                {leader.returnPct != null ? (
                  <p className="text-xs text-muted-foreground">
                    {leader.returnPct >= 0 ? "+" : ""}
                    {leader.returnPct.toFixed(1)}% return
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <ExperimentLeaderboardList
          rows={leaderboardRows}
          emptyMessage="No agents ranked yet."
          accentRingClass="ring-sky-500/30 border-sky-500/35"
          onSelect={(key) => onSelectStrategy?.(Number(key))}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Recent activity</h3>
        <ExperimentTradeFeed
          items={tradeItems}
          emptyMessage="No paper trades yet — agents scan news every few minutes."
        />
      </div>
    </div>
  );
}
