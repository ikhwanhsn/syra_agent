import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExperimentAgentBalancePanel } from "@/components/experiment/shared/ExperimentAgentBalancePanel";
import { LpExperimentBackdrop } from "@/components/experiment/lp/LpExperimentBackdrop";
import { LpSectionHeader } from "@/components/experiment/lp/LpSectionHeader";
import { RobinhoodLpExperimentHero } from "@/components/experiment/robinhood/RobinhoodLpExperimentHero";
import { RobinhoodLpExperimentLabSummary } from "@/components/experiment/robinhood/RobinhoodLpExperimentLabSummary";
import { RobinhoodLpLiveAgentPanel } from "@/components/experiment/robinhood/RobinhoodLpLiveAgentPanel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchRobinhoodLpGlobalOverview,
  fetchRobinhoodLpLabState,
  fetchRobinhoodLpRuns,
  fetchRobinhoodLpStats,
  formatRobinhoodLpUsd,
} from "@/lib/robinhoodLpExperimentApi";
import { buildEquityHistoryFromRuns, formatExperimentUsd } from "@/lib/experimentEquityHistory";

function RobinhoodGlobalStats({
  overview,
  loading,
}: {
  overview: Awaited<ReturnType<typeof fetchRobinhoodLpGlobalOverview>> | undefined;
  loading: boolean;
}) {
  const uni = overview?.uniswap;
  const sim = overview?.simulation;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Pools scanned", value: loading ? "…" : String(uni?.poolsScanned ?? 0) },
        {
          label: "Scan TVL",
          value: loading ? "…" : formatRobinhoodLpUsd(uni?.scanTvlUsd ?? 0),
        },
        {
          label: "24h volume",
          value: loading ? "…" : formatRobinhoodLpUsd(uni?.scanVolume24hUsd ?? 0),
        },
        {
          label: sim?.paperMetricsUntrusted === false ? "Lab net PnL" : "Lab net PnL (sim)",
          value: loading ? "…" : formatRobinhoodLpUsd(sim?.sumNetPnlUsd ?? 0),
        },
      ].map((tile) => (
        <div key={tile.label} className={cn(overviewCardShell, "rounded-2xl px-4 py-3.5")}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{tile.label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{tile.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function RobinhoodLpExperiment({ embedded = false }: { embedded?: boolean }) {
  const overviewQ = useQuery({
    queryKey: ["lp-robinhood", "overview"],
    queryFn: fetchRobinhoodLpGlobalOverview,
    refetchInterval: 60_000,
  });
  const labStateQ = useQuery({
    queryKey: ["lp-robinhood", "lab-state"],
    queryFn: fetchRobinhoodLpLabState,
    refetchInterval: 60_000,
  });
  const activeCohortId = labStateQ.data?.activeExperimentId ?? null;
  const statsQ = useQuery({
    queryKey: ["lp-robinhood", "stats", activeCohortId ?? "none"],
    queryFn: fetchRobinhoodLpStats,
    enabled: labStateQ.isFetched,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["lp-robinhood", "runs", activeCohortId ?? "none", "recent"],
    queryFn: () =>
      fetchRobinhoodLpRuns({
        limit: 8,
        offset: 0,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId),
    refetchInterval: 45_000,
  });

  const leaderStats = useMemo(() => statsQ.data?.agents?.[0] ?? null, [statsQ.data?.agents]);

  const leaderLab = useMemo(() => {
    if (!leaderStats) return null;
    return labStateQ.data?.agents.find((a) => a.strategyId === leaderStats.strategyId) ?? null;
  }, [labStateQ.data?.agents, leaderStats]);

  const leaderRunsQ = useQuery({
    queryKey: ["lp-robinhood", "runs", activeCohortId ?? "none", "leader", leaderStats?.strategyId ?? "none"],
    queryFn: () =>
      fetchRobinhoodLpRuns({
        limit: 50,
        offset: 0,
        strategyId: leaderStats!.strategyId,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId && leaderStats?.strategyId),
    refetchInterval: 45_000,
  });

  const startUsd = leaderLab?.startingBankUsd ?? labStateQ.data?.simConfig.startingBankUsd ?? 2000;
  const equityUsd = leaderLab?.equityUsd ?? startUsd;
  const retPct = startUsd > 0 ? (equityUsd / startUsd - 1) * 100 : 0;

  const leaderHistory = useMemo(
    () =>
      buildEquityHistoryFromRuns({
        startBalance: startUsd,
        currentBalance: equityUsd,
        runs: (leaderRunsQ.data?.runs ?? []).map((r) => ({
          status: r.status,
          resolvedAt: r.resolvedAt,
          pnl: r.simNetPnlUsd,
        })),
      }),
    [leaderRunsQ.data?.runs, startUsd, equityUsd],
  );

  const loading = overviewQ.isLoading || statsQ.isLoading || runsQ.isLoading || labStateQ.isLoading;
  const failed = overviewQ.isError || statsQ.isError || runsQ.isError || labStateQ.isError;

  const refreshAll = useCallback(() => {
    void overviewQ.refetch();
    void statsQ.refetch();
    void runsQ.refetch();
    void labStateQ.refetch();
  }, [overviewQ, statsQ, runsQ, labStateQ]);

  return (
    <>
      <LpExperimentBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative space-y-8",
        )}
      >
        <RobinhoodLpExperimentHero
          embedded={embedded}
          loading={loading}
          failed={failed}
          onRefresh={refreshAll}
        />

        <ExperimentAgentBalancePanel
          platformLabel="Robinhood LP lab"
          bankLabel="$2,000 paper bank"
          strategyLabel={leaderStats?.strategyName ?? "Warming up…"}
          startBalance={startUsd}
          currentBalance={equityUsd}
          retPct={retPct}
          closedCount={leaderStats?.decided ?? 0}
          openCount={leaderLab?.openPositions ?? leaderStats?.openPositions ?? 0}
          historyPoints={leaderHistory}
          formatBalance={formatExperimentUsd}
          formatAxis={(n) => `$${n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0)}`}
          accent="invest"
        />

        <RobinhoodGlobalStats overview={overviewQ.data} loading={overviewQ.isLoading} />

        <section id="simulation" className="scroll-mt-8 space-y-5">
          <LpSectionHeader
            kicker="Paper sim"
            title="Uniswap strategy lab"
            description="Strategies compete on Robinhood Chain Uniswap pools using real fee/volume/TVL observables. Paper PnL is simulated and marked untrusted for Earn unlock."
          />

          <RobinhoodLpExperimentLabSummary
            agents={statsQ.data?.agents ?? []}
            recentRuns={runsQ.data?.runs ?? []}
            loading={loading}
            paperMetricsUntrusted={statsQ.data?.paperMetricsUntrusted ?? true}
            paperMetricsDisclaimer={statsQ.data?.paperMetricsDisclaimer}
          />
        </section>

        <RobinhoodLpLiveAgentPanel />

        <div className={cn(overviewCardShell, "rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs text-muted-foreground")}>
          Paper sim remains the EV proof path. Live Autopilot stays behind the EV gate, pilot flag,
          dry-run default, tiny caps, and kill switch. Disable dry-run only after a dedicated
          security review.
        </div>
      </div>
    </>
  );
}
