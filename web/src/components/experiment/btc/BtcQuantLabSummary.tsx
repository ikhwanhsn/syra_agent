import { useMemo } from "react";
import { ExperimentLeaderboardList } from "@/components/experiment/shared/ExperimentLeaderboardList";
import { ExperimentTradeFeed } from "@/components/experiment/shared/ExperimentTradeFeed";
import { formatBtcUsd, type BtcAgentStats, type BtcRunRow } from "@/lib/btcQuantApi";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

export interface BtcQuantLabSummaryProps {
  agents: BtcAgentStats[];
  recentRuns: BtcRunRow[];
  loading?: boolean;
  selectedStrategyId?: number | null;
  onSelectStrategy?: (id: number) => void;
}

function formatRunTime(iso?: string | null): string {
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

export function BtcQuantLabSummary({
  agents,
  recentRuns,
  loading,
  selectedStrategyId,
  onSelectStrategy,
}: BtcQuantLabSummaryProps) {
  const leaderboardRows = useMemo(() => {
    const sorted = [...agents].sort((a, b) => (b.sumPnlUsd ?? 0) - (a.sumPnlUsd ?? 0));
    return sorted.map((a, idx) => ({
      key: String(a.strategyId),
      rank: idx + 1,
      label: a.strategyName,
      equityLabel: formatBtcUsd(a.equityUsd ?? 1000),
      retPct: a.returnPct ?? 0,
      openCount: a.openPositions,
      selected: selectedStrategyId === a.strategyId,
      badge:
        idx === 0 && (a.sumPnlUsd ?? 0) > 0
          ? { text: "Leader", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" }
          : null,
    }));
  }, [agents, selectedStrategyId]);

  const feedItems = useMemo(
    () =>
      recentRuns.map((r) => {
        const pnl = Number(r.simPnlUsd);
        const hasPnl = r.status !== "open" && Number.isFinite(pnl);
        return {
          id: r._id,
          timeLabel: formatRunTime(r.resolvedAt ?? r.createdAt),
          strategyLabel: r.strategyName,
          tokenLabel: `cbBTC · ${r.bar}`,
          reasonLabel: r.resolution ?? r.status,
          pnlLabel: hasPnl ? formatBtcUsd(pnl) : r.status === "open" ? "Open" : "—",
          pnlPositive: hasPnl && pnl > 0,
          pnlNegative: hasPnl && pnl < 0,
        };
      }),
    [recentRuns],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <div>
          <p className={cn(overviewKickerClass, "text-[10px] uppercase tracking-wider")}>Leaderboard</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Strategy cohort</h2>
        </div>
        <ExperimentLeaderboardList
          rows={leaderboardRows}
          emptyMessage={loading ? "Loading agents…" : "No agent stats yet — signal tick will populate runs."}
          accentRingClass="ring-amber-500/30 border-amber-500/35"
          onSelect={(key) => onSelectStrategy?.(Number(key))}
        />
      </section>

      <section className="space-y-4">
        <div>
          <p className={cn(overviewKickerClass, "text-[10px] uppercase tracking-wider")}>Activity</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Recent paper legs</h2>
        </div>
        <ExperimentTradeFeed
          items={feedItems}
          emptyMessage={loading ? "Loading runs…" : "No trades yet — agents scan BTC signals every 2 minutes."}
        />
      </section>
    </div>
  );
}
