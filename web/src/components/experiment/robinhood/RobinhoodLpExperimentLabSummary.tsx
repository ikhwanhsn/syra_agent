import { Medal, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRobinhoodLpUsd } from "@/lib/robinhoodLpExperimentApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { RobinhoodLpAgentStats, RobinhoodLpRunRow } from "@/lib/robinhoodLpExperimentApi";

function pnlClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

function runOutcomeLabel(status: string): { label: string; tone: string } {
  if (status === "win") {
    return {
      label: "Won",
      tone: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300",
    };
  }
  if (status === "loss" || status === "error") {
    return { label: "Lost", tone: "bg-red-500/12 text-red-700 ring-1 ring-red-500/20 dark:text-red-300" };
  }
  if (status === "open") {
    return { label: "Active", tone: "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300" };
  }
  return { label: status, tone: "bg-muted text-muted-foreground" };
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

export interface RobinhoodLpExperimentLabSummaryProps {
  agents: RobinhoodLpAgentStats[];
  recentRuns: RobinhoodLpRunRow[];
  loading?: boolean;
}

export function RobinhoodLpExperimentLabSummary({
  agents,
  recentRuns,
  loading,
}: RobinhoodLpExperimentLabSummaryProps) {
  const topAgents = [...agents]
    .sort((a, b) => (b.sumNetPnlUsd ?? 0) - (a.sumNetPnlUsd ?? 0))
    .slice(0, 5);
  const recent = recentRuns.slice(0, 6);
  const leader = topAgents[0];

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
              Strategies will appear here after a few practice rounds on Robinhood Chain pools.
            </p>
          </div>
        ) : null}

        {leader && !loading ? (
          <div
            className={cn(
              overviewCardShell,
              "rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3.5",
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Current leader
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{leader.strategyName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {leader.decided} settled · {(leader.winRatePct ?? 0).toFixed(1)}% win rate
            </p>
          </div>
        ) : null}

        {topAgents.map((agent, idx) => (
          <div
            key={agent.strategyId}
            className={cn(overviewCardShell, "flex items-center gap-4 rounded-2xl px-4 py-3.5")}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                idx === 0
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {idx === 0 ? <Medal className="h-4 w-4" aria-hidden /> : `#${idx + 1}`}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{agent.strategyName}</p>
              <p className="text-xs text-muted-foreground">
                {agent.decided} settled · {agent.openPositions} open
              </p>
            </div>
            <p className={cn("text-sm font-semibold tabular-nums", pnlClass(agent.sumNetPnlUsd ?? 0))}>
              {formatRobinhoodLpUsd(agent.sumNetPnlUsd ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent rounds</h3>
        {loading && recent.length === 0 ? (
          <LeaderboardSkeleton />
        ) : recent.length === 0 ? (
          <div className={cn(overviewCardShell, "rounded-2xl px-4 py-8 text-center text-xs text-muted-foreground")}>
            No rounds yet. Signal ticks will open paper positions when pools qualify.
          </div>
        ) : (
          recent.map((run) => {
            const outcome = runOutcomeLabel(run.status);
            return (
              <div
                key={run._id}
                className={cn(overviewCardShell, "flex items-start justify-between gap-3 rounded-2xl px-4 py-3")}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {run.poolName || `${run.baseSymbol}/${run.quoteSymbol}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{run.strategyName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase", outcome.tone)}>
                    {outcome.label}
                  </span>
                  <span className={cn("text-xs font-medium tabular-nums", pnlClass(run.simNetPnlUsd ?? 0))}>
                    {formatRobinhoodLpUsd(run.simNetPnlUsd ?? 0)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
