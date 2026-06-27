import { Activity, Bitcoin, Layers, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBtcUsd, type BtcGlobalOverview } from "@/lib/btcQuantApi";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { BtcQuantExperimentStatsSkeleton } from "@/components/experiment/btc/BtcExperimentSkeletons";

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Bitcoin;
}) {
  return (
    <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn(overviewKickerClass, "text-[10px] uppercase tracking-wider")}>{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden />
      </div>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export interface BtcExperimentGlobalStatsProps {
  overview?: BtcGlobalOverview | null;
  loading?: boolean;
}

export function BtcExperimentGlobalStats({ overview, loading }: BtcExperimentGlobalStatsProps) {
  const sim = overview?.simulation;
  const real = overview?.realAgent;

  if (loading && !overview) {
    return <BtcQuantExperimentStatsSkeleton />;
  }

  const leaderId = sim?.leaderStrategyId;
  const leaderPnl = sim?.leaderSumPnlUsd;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Cohort P/L"
        value={formatBtcUsd(sim?.sumPnlUsd ?? 0)}
        sub={`${sim?.strategyCount ?? 15} agents · paper USD`}
        icon={TrendingUp}
      />
      <StatTile
        label="Settled runs"
        value={String(sim?.settledRuns ?? 0)}
        sub={`${sim?.openPositions ?? 0} open positions`}
        icon={Activity}
      />
      <StatTile
        label="Sim leader"
        value={leaderId != null ? `#${leaderId}` : "—"}
        sub={leaderPnl != null ? formatBtcUsd(leaderPnl) : "Warming up"}
        icon={Bitcoin}
      />
      <StatTile
        label="Real agent"
        value={real?.enabled ? "Live" : "Paper only"}
        sub={
          real?.enabled
            ? `${real.realWins}W / ${real.realLosses}L · ${formatBtcUsd(real.realizedNetPnlUsd)}`
            : "Enable when sim cohort stabilizes"
        }
        icon={Layers}
      />
    </div>
  );
}
