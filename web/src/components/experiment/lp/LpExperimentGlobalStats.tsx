import { Droplets, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import type { LpGlobalOverview } from "@/lib/lpAgentExperimentApi";
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

  return (
    <section className={cn("space-y-4", className)}>
      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-violet-500/12")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{ background: overviewAccentBackground("experiment") }}
          aria-hidden
        />

        <div className="relative grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <LpStatTile
            label="Best practice result"
            value={loading ? "…" : `${simPnl >= 0 ? "+" : ""}${formatSol(simPnl)} SOL`}
            subValue={
              loading || sim?.leaderStrategyId == null
                ? "Strategies are competing now"
                : `Top strategy #${sim.leaderStrategyId}`
            }
            icon={TrendingUp}
            tone={simPnlTone}
            highlight
          />
          <LpStatTile
            label="Your live earnings"
            value={loading ? "…" : `${realPnl >= 0 ? "+" : ""}${formatSol(realPnl)} SOL`}
            subValue={
              loading
                ? undefined
                : real?.enabledAgents
                  ? `${real.enabledAgents} agent${real.enabledAgents === 1 ? "" : "s"} active`
                  : "Turn on your agent below"
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
