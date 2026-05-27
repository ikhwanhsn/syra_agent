import { Trophy, TrendingUp, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLpUsd, type LpGlobalOverview } from "@/lib/lpAgentExperimentApi";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { LpStatTile } from "./LpStatTile";
import { overviewAccentBackground, overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

export interface LpExperimentSimpleOverviewProps {
  overview: LpGlobalOverview | undefined;
  loading?: boolean;
  className?: string;
}

export function LpExperimentSimpleOverview({ overview, loading, className }: LpExperimentSimpleOverviewProps) {
  const sim = overview?.simulation;
  const real = overview?.realAgent;
  const simPnl = sim?.sumNetPnlSol ?? 0;
  const realPnl = real?.realizedNetPnlSol ?? 0;

  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <p className={overviewKickerClass}>At a glance</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">How the lab is doing</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          AI agents test liquidity strategies in simulation. Your wallet section below is where real money can deploy.
        </p>
      </div>

      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-violet-500/12")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{ background: overviewAccentBackground("experiment") }}
          aria-hidden
        />
        <div className="relative grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <LpStatTile
            label="Best strategy profit"
            value={loading ? "…" : `${simPnl >= 0 ? "+" : ""}${formatSol(simPnl)} SOL`}
            subValue={
              loading || sim?.leaderStrategyId == null
                ? "Paper trading · no wallet risk"
                : `Leader agent #${sim.leaderStrategyId}`
            }
            icon={Trophy}
            tone={simPnl > 0 ? "positive" : simPnl < 0 ? "negative" : "default"}
          />
          <LpStatTile
            label="Open paper positions"
            value={loading ? "…" : String(sim?.openPositions ?? 0)}
            subValue={loading ? undefined : `${sim?.settledRuns ?? 0} finished runs`}
            icon={TrendingUp}
          />
          <LpStatTile
            label="Live user agents"
            value={loading ? "…" : String(real?.enabledAgents ?? 0)}
            subValue={loading ? undefined : `${real?.openPositions ?? 0} active on-chain`}
            icon={Users}
            tone="accent"
          />
          <LpStatTile
            label="Real money profit"
            value={loading ? "…" : `${realPnl >= 0 ? "+" : ""}${formatSol(realPnl)} SOL`}
            subValue={
              loading || !overview?.solPriceUsd
                ? undefined
                : formatLpUsd(realPnl * overview.solPriceUsd)
            }
            icon={Wallet}
            tone={realPnl > 0 ? "positive" : realPnl < 0 ? "negative" : "default"}
          />
        </div>
      </article>
    </section>
  );
}
