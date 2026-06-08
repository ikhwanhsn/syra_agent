import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExperimentAgentBalancePanel } from "@/components/experiment/shared/ExperimentAgentBalancePanel";
import { LpExperimentRiskAgreementDialog } from "@/components/experiment/LpExperimentRiskAgreementDialog";
import { LpExperimentBackdrop } from "@/components/experiment/lp/LpExperimentBackdrop";
import { LpExperimentGlobalStats } from "@/components/experiment/lp/LpExperimentGlobalStats";
import { LpExperimentHero } from "@/components/experiment/lp/LpExperimentHero";
import { LpExperimentLabSummary } from "@/components/experiment/lp/LpExperimentLabSummary";
import { LpSectionHeader } from "@/components/experiment/lp/LpSectionHeader";
import { LpRealSection } from "@/components/experiment/LpRealSection";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchLpGlobalOverview,
  fetchLpLabState,
  fetchLpRuns,
  fetchLpStats,
} from "@/lib/lpAgentExperimentApi";
import { buildEquityHistoryFromRuns, formatExperimentSol } from "@/lib/experimentEquityHistory";

export default function LpAgentExperiment({ embedded = false }: { embedded?: boolean }) {
  const overviewQ = useQuery({
    queryKey: ["lp-agent", "overview"],
    queryFn: fetchLpGlobalOverview,
    refetchInterval: 60_000,
  });
  const labStateQ = useQuery({
    queryKey: ["lp-agent", "lab-state"],
    queryFn: fetchLpLabState,
    refetchInterval: 60_000,
  });
  const activeCohortId = labStateQ.data?.activeExperimentId ?? null;
  const statsQ = useQuery({
    queryKey: ["lp-agent", "stats", activeCohortId ?? "none"],
    queryFn: fetchLpStats,
    enabled: labStateQ.isFetched,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["lp-agent", "runs", activeCohortId ?? "none", "recent"],
    queryFn: () =>
      fetchLpRuns({
        limit: 8,
        offset: 0,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId),
    refetchInterval: 45_000,
  });

  const leaderStats = useMemo(() => {
    const agents = statsQ.data?.agents ?? [];
    return (
      [...agents]
        .filter((a) => a.strategyId !== 98)
        .sort((a, b) => (b.sumNetPnlSol ?? 0) - (a.sumNetPnlSol ?? 0))[0] ?? null
    );
  }, [statsQ.data?.agents]);

  const leaderLab = useMemo(() => {
    if (!leaderStats) return null;
    return labStateQ.data?.agents.find((a) => a.strategyId === leaderStats.strategyId) ?? null;
  }, [labStateQ.data?.agents, leaderStats]);

  const leaderRunsQ = useQuery({
    queryKey: ["lp-agent", "runs", activeCohortId ?? "none", "leader", leaderStats?.strategyId ?? "none"],
    queryFn: () =>
      fetchLpRuns({
        limit: 50,
        offset: 0,
        strategyId: leaderStats!.strategyId,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId && leaderStats?.strategyId),
    refetchInterval: 45_000,
  });

  const startSol = leaderLab?.startingBankSol ?? labStateQ.data?.simConfig.startingBankSol ?? 10;
  const equitySol = leaderLab?.equitySol ?? startSol;
  const retPct = startSol > 0 ? (equitySol / startSol - 1) * 100 : 0;

  const leaderHistory = useMemo(
    () =>
      buildEquityHistoryFromRuns({
        startBalance: startSol,
        currentBalance: equitySol,
        runs: (leaderRunsQ.data?.runs ?? []).map((r) => ({
          status: r.status,
          resolvedAt: r.resolvedAt,
          pnl: r.simNetPnlSol,
        })),
      }),
    [leaderRunsQ.data?.runs, startSol, equitySol],
  );

  const refSolUsd = labStateQ.data?.referenceSolPriceUsd;
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
        <LpExperimentRiskAgreementDialog />

        <LpExperimentHero embedded={embedded} loading={loading} failed={failed} onRefresh={refreshAll} />

        <ExperimentAgentBalancePanel
          platformLabel="LP lab"
          bankLabel="10 SOL paper agent"
          strategyLabel={leaderStats?.strategyName ?? "Warming up…"}
          startBalance={startSol}
          currentBalance={equitySol}
          retPct={retPct}
          closedCount={leaderStats?.decided ?? 0}
          openCount={leaderLab?.openPositions ?? leaderStats?.openPositions ?? 0}
          historyPoints={leaderHistory}
          formatBalance={formatExperimentSol}
          formatAxis={(n) => `${n.toFixed(1)}`}
          accent="experiment"
        />

        <LpExperimentGlobalStats overview={overviewQ.data} loading={overviewQ.isLoading} />

        <section id="simulation" className="scroll-mt-8 space-y-5">
          <LpSectionHeader
            kicker="Practice mode"
            title="Paper trading lab"
            description="AI strategies compete on live Meteora pools with no wallet risk. The best performer guides your live agent."
          />

          <LpExperimentLabSummary
            agents={statsQ.data?.agents ?? []}
            recentRuns={runsQ.data?.runs ?? []}
            refSolUsd={refSolUsd}
            loading={loading}
          />
        </section>

        <LpRealSection />
      </div>
    </>
  );
}
