import { Link } from "@/lib/navigation";
import { ChevronRight, Medal, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { LpAgentStats, LpRunRow } from "@/lib/lpAgentExperimentApi";

function pnlClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

function runOutcomeLabel(status: string): { label: string; tone: string } {
  if (status === "win" || status === "closed_win") {
    return { label: "Won", tone: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300" };
  }
  if (status === "loss" || status === "closed_loss" || status === "error") {
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

export interface LpExperimentLabSummaryProps {
  agents: LpAgentStats[];
  recentRuns: LpRunRow[];
  refSolUsd?: number | null;
  loading?: boolean;
}

export function LpExperimentLabSummary({ agents, recentRuns, refSolUsd, loading }: LpExperimentLabSummaryProps) {
  const topAgents = [...agents]
    .filter((a) => a.strategyId !== 98)
    .sort((a, b) => (b.sumNetPnlSol ?? 0) - (a.sumNetPnlSol ?? 0))
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
              Strategies will appear here after a few practice rounds.
            </p>
          </div>
        ) : null}

        {leader && !loading ? (
          <Link
            to={`/lp-experiment/agent/${leader.strategyId}`}
            className={cn(
              overviewCardShell,
              "group relative block overflow-hidden rounded-2xl ring-1 ring-amber-500/20 transition-[transform,box-shadow] duration-200",
              "hover:-translate-y-0.5 hover:shadow-lg hover:ring-amber-500/35",
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
                  Best strategy
                </p>
                <p className="mt-1 truncate text-base font-semibold text-foreground">{leader.strategyName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {leader.winRatePct != null ? `${leader.winRatePct.toFixed(0)}% win rate` : "No results yet"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("font-mono text-lg font-semibold tabular-nums", pnlClass(leader.sumNetPnlSol ?? 0))}>
                  {(leader.sumNetPnlSol ?? 0) >= 0 ? "+" : ""}
                  {(leader.sumNetPnlSol ?? 0).toFixed(3)} SOL
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
          </Link>
        ) : null}

        <div className="space-y-2">
          {topAgents.slice(leader ? 1 : 0).map((row, index) => {
            const rank = leader ? index + 2 : index + 1;
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
                to={`/lp-experiment/agent/${row.strategyId}`}
                className={cn(
                  overviewCardShell,
                  "group flex items-center gap-4 rounded-2xl px-4 py-3 transition-[border-color,transform,box-shadow] duration-200",
                  "hover:-translate-y-px hover:border-violet-500/25 hover:shadow-md",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/25 text-sm font-semibold tabular-nums text-muted-foreground">
                  {rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{row.strategyName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.winRatePct != null ? `${row.winRatePct.toFixed(0)}% win` : "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("font-mono text-sm font-semibold tabular-nums", pnlClass(pnl))}>
                    {pnl >= 0 ? "+" : ""}
                    {pnl.toFixed(3)} SOL
                  </p>
                  {usd != null ? (
                    <p className={cn("text-xs tabular-nums text-muted-foreground", pnlClass(usd))}>
                      {formatLpUsd(usd)}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Recent practice trades</h3>
          <p className="mt-1 text-sm text-muted-foreground">No real money — same pools and rules as live.</p>
        </div>
        <div className={cn(overviewCardShell, "divide-y divide-border/35 overflow-hidden rounded-2xl")}>
          {loading && recent.length === 0 ? (
            <div className="space-y-0 divide-y divide-border/35">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : null}
          {!loading && recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No trades yet.</p>
          ) : null}
          {recent.map((run) => {
            const outcome = runOutcomeLabel(run.status);
            const pnl = run.simNetPnlSol ?? 0;
            return (
              <div
                key={run._id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-500/[0.03] sm:px-5"
              >
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", outcome.tone)}>
                  {outcome.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {(run.baseSymbol || "?")}/{(run.quoteSymbol || "?")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{run.strategyName}</p>
                </div>
                <p className={cn("shrink-0 font-mono text-sm font-medium tabular-nums", pnlClass(pnl))}>
                  {pnl >= 0 ? "+" : ""}
                  {pnl.toFixed(3)} SOL
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
