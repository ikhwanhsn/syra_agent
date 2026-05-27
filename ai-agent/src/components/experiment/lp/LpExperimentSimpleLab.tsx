import { Link } from "react-router-dom";
import { ChevronRight, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import { AgentBackgroundLiveIndicator } from "@/components/experiment/AgentBackgroundLiveIndicator";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { LpAgentStats, LpRunRow } from "@/lib/lpAgentExperimentApi";

function pnlClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

function runOutcomeLabel(status: string): { label: string; tone: string } {
  if (status === "win" || status === "closed_win") {
    return { label: "Won", tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" };
  }
  if (status === "loss" || status === "closed_loss" || status === "error") {
    return { label: "Lost", tone: "bg-red-500/12 text-red-700 dark:text-red-300" };
  }
  if (status === "open") {
    return { label: "Active", tone: "bg-sky-500/12 text-sky-700 dark:text-sky-300" };
  }
  return { label: status, tone: "bg-muted text-muted-foreground" };
}

export interface LpExperimentSimpleLabProps {
  agents: LpAgentStats[];
  recentRuns: LpRunRow[];
  refSolUsd?: number | null;
  loading?: boolean;
}

export function LpExperimentSimpleLab({ agents, recentRuns, refSolUsd, loading }: LpExperimentSimpleLabProps) {
  const topAgents = [...agents]
    .sort((a, b) => (b.sumNetPnlSol ?? 0) - (a.sumNetPnlSol ?? 0))
    .slice(0, 5);
  const recent = recentRuns.slice(0, 6);

  return (
    <section className="space-y-6">
      <div>
        <p className={overviewKickerClass}>Paper trading</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">Top strategies</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Fifteen AI strategies compete on live pool data — no real funds. The leader may guide your live agent.
        </p>
      </div>

      <div className="space-y-2.5">
        {loading && topAgents.length === 0 ? (
          <div className={cn(overviewCardShell, "rounded-2xl px-5 py-8 text-center text-sm text-muted-foreground")}>
            Loading strategies…
          </div>
        ) : null}
        {!loading && topAgents.length === 0 ? (
          <div className={cn(overviewCardShell, "rounded-2xl px-5 py-8 text-center text-sm text-muted-foreground")}>
            No results yet. Check back after the lab runs a few cycles.
          </div>
        ) : null}
        {topAgents.map((row, index) => {
          const pnl = row.sumNetPnlSol ?? 0;
          const usd =
            row.sumNetPnlUsd != null && Number.isFinite(row.sumNetPnlUsd)
              ? row.sumNetPnlUsd
              : refSolUsd != null && refSolUsd > 0
                ? pnl * refSolUsd
                : null;
          return (
            <Link
              key={row.strategyId}
              to={`/dashboard/lp-experiment/agent/${row.strategyId}`}
              className={cn(
                overviewCardShell,
                "group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-[border-color,transform,box-shadow] duration-200",
                "hover:-translate-y-px hover:border-violet-500/25 hover:shadow-md",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold tabular-nums",
                  index === 0
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    : "border-border/50 bg-muted/30 text-muted-foreground",
                )}
              >
                {index === 0 ? <Medal className="h-4 w-4" aria-hidden /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{row.strategyName}</p>
                  <AgentBackgroundLiveIndicator openPositions={row.openPositions} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.winRatePct != null ? `${row.winRatePct.toFixed(0)}% win rate` : "No settled runs"} ·{" "}
                  {row.wins}W / {row.losses}L
                  {row.openPositions > 0 ? ` · ${row.openPositions} active` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("text-sm font-semibold tabular-nums", pnlClass(pnl))}>
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(3)} SOL
                </p>
                {usd != null ? (
                  <p className={cn("text-xs tabular-nums text-muted-foreground", pnlClass(usd))}>
                    {formatLpUsd(usd)}
                  </p>
                ) : null}
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Recent activity</h3>
          <p className="mt-1 text-sm text-muted-foreground">Latest paper trades across all strategies.</p>
        </div>
        <div className={cn(overviewCardShell, "divide-y divide-border/40 overflow-hidden rounded-2xl")}>
          {loading && recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading activity…</p>
          ) : null}
          {!loading && recent.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No trades yet.</p>
          ) : null}
          {recent.map((run) => {
            const outcome = runOutcomeLabel(run.status);
            const pnl = run.simNetPnlSol ?? 0;
            return (
              <div key={run._id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", outcome.tone)}>
                  {outcome.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {(run.baseSymbol || "?")}/{(run.quoteSymbol || "?")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{run.strategyName}</p>
                </div>
                <p className={cn("shrink-0 text-sm font-medium tabular-nums", pnlClass(pnl))}>
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(3)} SOL
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
