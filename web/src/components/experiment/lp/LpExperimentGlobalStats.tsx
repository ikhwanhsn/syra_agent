import { Droplets, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import type { LpGlobalOverview } from "@/lib/lpAgentExperimentApi";
import {
  LP_LAB_LIVE_EARNINGS_LABEL,
  LP_LAB_LIVE_EARNINGS_NOT_COMPARABLE,
  LP_LAB_PAPER_BANNER_BODY,
  LP_LAB_PAPER_BANNER_TITLE,
  getLpLabCohortStatPresentation,
} from "@/lib/lpLabStatsCopy";
import { LpStatTile } from "./LpStatTile";
import { overviewAccentBackground, overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface LpExperimentGlobalStatsProps {
  overview: LpGlobalOverview | undefined;
  loading?: boolean;
  className?: string;
}

export function LpExperimentGlobalStats({ overview, loading, className }: LpExperimentGlobalStatsProps) {
  const sim = overview?.simulation;
  const real = overview?.realAgent;
  const meteora = overview?.meteora;
  const simPnl = sim?.sumNetPnlSol ?? 0;
  const realPnl = real?.realizedNetPnlSol ?? 0;
  const simPnlTone = simPnl > 0 ? "positive" : simPnl < 0 ? "negative" : "default";
  const realPnlTone = realPnl > 0 ? "positive" : realPnl < 0 ? "negative" : "default";
  const cohortStat = getLpLabCohortStatPresentation(sim, formatSol);

  return (
    <section className={cn("space-y-3", className)}>
      <div
        role="status"
        className={cn(
          overviewCardShell,
          "rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
          {LP_LAB_PAPER_BANNER_TITLE}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{LP_LAB_PAPER_BANNER_BODY}</p>
      </div>

      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-violet-500/12")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{ background: overviewAccentBackground("experiment") }}
          aria-hidden
        />

        <div className="relative grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <LpStatTile
            label={cohortStat.label}
            value={loading ? "…" : `${simPnl >= 0 ? "+" : ""}${formatSol(simPnl)} SOL`}
            subValue={loading ? "Loading paper cohort…" : cohortStat.subValue}
            icon={TrendingUp}
            tone={simPnlTone}
            highlight
          />
          <LpStatTile
            label={LP_LAB_LIVE_EARNINGS_LABEL}
            value={loading ? "…" : `${realPnl >= 0 ? "+" : ""}${formatSol(realPnl)} SOL`}
            subValue={
              loading
                ? undefined
                : real?.enabledAgents
                  ? `${real.enabledAgents} agent${real.enabledAgents === 1 ? "" : "s"} active · ${LP_LAB_LIVE_EARNINGS_NOT_COMPARABLE}`
                  : LP_LAB_LIVE_EARNINGS_NOT_COMPARABLE
            }
            icon={Wallet}
            tone={realPnlTone}
            highlight
          />
          <LpStatTile
            label="Pools available"
            value={loading ? "…" : String(meteora?.poolsScanned ?? 0)}
            subValue={loading ? undefined : "Live Meteora pools scanned"}
            icon={Droplets}
            tone="accent"
          />
        </div>
      </article>
    </section>
  );
}
