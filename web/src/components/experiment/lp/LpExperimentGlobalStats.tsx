import {
  Activity,
  Droplets,
  FlaskConical,
  Layers,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import type { LpGlobalOverview } from "@/lib/lpAgentExperimentApi";
import { LpSectionHeader } from "./LpSectionHeader";
import { LpStatTile } from "./LpStatTile";
import { overviewAccentBackground, overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

function formatCompactUsd(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return formatLpUsd(n);
}

function pctLabel(rate: number | null) {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export interface LpExperimentGlobalStatsProps {
  overview: LpGlobalOverview | undefined;
  loading?: boolean;
  className?: string;
}

export function LpExperimentGlobalStats({ overview, loading, className }: LpExperimentGlobalStatsProps) {
  const sim = overview?.simulation;
  const real = overview?.realAgent;
  const meteora = overview?.meteora;
  const candidates = overview?.candidates;
  const simPnlTone =
    (sim?.sumNetPnlSol ?? 0) > 0 ? "positive" : (sim?.sumNetPnlSol ?? 0) < 0 ? "negative" : "default";
  const realPnlTone =
    (real?.realizedNetPnlSol ?? 0) > 0
      ? "positive"
      : (real?.realizedNetPnlSol ?? 0) < 0
        ? "negative"
        : "default";

  return (
    <section className={cn("space-y-4", className)}>
      <LpSectionHeader
        kicker="At a glance"
        title="How the lab is doing"
        description="Market depth on Meteora, paper-trading cohort performance, and real agents deployed by users — unified in one view."
      />

      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-violet-500/12")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{ background: overviewAccentBackground("experiment") }}
          aria-hidden
        />

        <div className="relative space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-2">
            <LpStatTile
              label="Sim net PnL"
              value={
                loading ? "…" : `${(sim?.sumNetPnlSol ?? 0) >= 0 ? "+" : ""}${formatSol(sim?.sumNetPnlSol ?? 0)} SOL`
              }
              subValue={
                loading || sim?.leaderStrategyId == null
                  ? undefined
                  : `Cohort leader #${sim.leaderStrategyId} · ${pctLabel(sim.leaderWinRate)} win rate`
              }
              icon={TrendingUp}
              tone={simPnlTone}
              highlight
            />
            <LpStatTile
              label="Realized PnL (live)"
              value={
                loading
                  ? "…"
                  : `${(real?.realizedNetPnlSol ?? 0) >= 0 ? "+" : ""}${formatSol(real?.realizedNetPnlSol ?? 0)} SOL`
              }
              subValue={
                loading
                  ? undefined
                  : `${real?.realWins ?? 0}W / ${real?.realLosses ?? 0}L · ${pctLabel(real?.realWinRate ?? null)}`
              }
              icon={Wallet}
              tone={realPnlTone}
              highlight
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LpStatTile
              label="Meteora scan TVL"
              value={loading ? "…" : formatCompactUsd(meteora?.scanTvlUsd ?? 0)}
              subValue={
                loading
                  ? undefined
                  : `${meteora?.poolsScanned ?? 0} pools · ${formatCompactUsd(meteora?.scanVolume24hUsd ?? 0)} vol`
              }
              icon={Layers}
              tone="accent"
            />
            <LpStatTile
              label="Candidate TVL"
              value={loading ? "…" : formatCompactUsd(candidates?.trackedTvlUsd ?? 0)}
              subValue={loading ? undefined : `${candidates?.poolCount ?? 0} gated pools`}
              icon={Droplets}
            />
            <LpStatTile
              label="Sim equity"
              value={loading ? "…" : `${formatSol(sim?.sumEquitySol ?? 0)} SOL`}
              subValue={
                loading ? undefined : `${sim?.openPositions ?? 0} open · ${sim?.settledRuns ?? 0} settled`
              }
              icon={FlaskConical}
            />
            <LpStatTile
              label="Strategies"
              value={loading ? "…" : String(sim?.strategyCount ?? 0)}
              subValue={
                loading || sim?.topWinRateStrategyId == null
                  ? undefined
                  : `Best #${sim.topWinRateStrategyId} · ${sim.topWinRatePct?.toFixed(1) ?? "—"}% win`
              }
              icon={FlaskConical}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <LpStatTile
              label="Live agents"
              value={loading ? "…" : String(real?.enabledAgents ?? 0)}
              subValue={loading ? undefined : `${real?.openPositions ?? 0} on-chain positions`}
              icon={Users}
            />
            <LpStatTile
              label="Real deployed"
              value={loading ? "…" : `${formatSol(real?.deployedSol ?? 0)} SOL`}
              subValue={
                loading || !overview?.solPriceUsd
                  ? undefined
                  : formatLpUsd((real?.deployedSol ?? 0) * overview.solPriceUsd)
              }
              icon={Wallet}
              tone="accent"
            />
            <LpStatTile
              label="Fees claimed"
              value={loading ? "…" : `${formatSol(real?.totalFeesClaimedSol ?? 0)} SOL`}
              subValue={loading ? undefined : `${real?.totalPositions ?? 0} total runs`}
              icon={Activity}
            />
          </div>
        </div>
      </article>
    </section>
  );
}
