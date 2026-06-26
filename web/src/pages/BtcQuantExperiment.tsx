import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExperimentAgentBalancePanel } from "@/components/experiment/shared/ExperimentAgentBalancePanel";
import { ExperimentTabShell, type ExperimentTabId } from "@/components/experiment/shared/ExperimentTabShell";
import { BtcExperimentBackdrop } from "@/components/experiment/btc/BtcExperimentBackdrop";
import { BtcExperimentGlobalStats } from "@/components/experiment/btc/BtcExperimentGlobalStats";
import { BtcExperimentHero } from "@/components/experiment/btc/BtcExperimentHero";
import { BtcQuantLabSummary } from "@/components/experiment/btc/BtcQuantLabSummary";
import { BtcQuantRealSection } from "@/components/experiment/btc/BtcQuantRealSection";
import { BtcStrategyCards } from "@/components/experiment/btc/BtcStrategyCards";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchBtcLabState,
  fetchBtcOverview,
  fetchBtcRuns,
  fetchBtcStats,
  fetchBtcStrategies,
} from "@/lib/btcQuantApi";
import { buildEquityHistoryFromRuns, formatExperimentUsd } from "@/lib/experimentEquityHistory";

export default function BtcQuantExperiment({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<ExperimentTabId>("results");
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);

  const overviewQ = useQuery({
    queryKey: ["btc-quant", "overview"],
    queryFn: fetchBtcOverview,
    refetchInterval: 60_000,
  });
  const labStateQ = useQuery({
    queryKey: ["btc-quant", "lab-state"],
    queryFn: fetchBtcLabState,
    refetchInterval: 60_000,
  });
  const strategiesQ = useQuery({
    queryKey: ["btc-quant", "strategies"],
    queryFn: fetchBtcStrategies,
    staleTime: 300_000,
  });
  const activeCohortId = labStateQ.data?.activeExperimentId ?? null;
  const statsQ = useQuery({
    queryKey: ["btc-quant", "stats", activeCohortId ?? "none"],
    queryFn: fetchBtcStats,
    enabled: labStateQ.isFetched,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["btc-quant", "runs", activeCohortId ?? "none", "recent"],
    queryFn: () =>
      fetchBtcRuns({
        limit: 12,
        offset: 0,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId),
    refetchInterval: 45_000,
  });

  const leaderStats = useMemo(() => {
    const agents = statsQ.data?.agents ?? [];
    return [...agents].sort((a, b) => (b.sumPnlUsd ?? 0) - (a.sumPnlUsd ?? 0))[0] ?? null;
  }, [statsQ.data?.agents]);

  const displayStats = useMemo(() => {
    if (selectedStrategyId == null) return leaderStats;
    return statsQ.data?.agents.find((a) => a.strategyId === selectedStrategyId) ?? leaderStats;
  }, [leaderStats, selectedStrategyId, statsQ.data?.agents]);

  const displayLab = useMemo(() => {
    if (!displayStats) return null;
    return labStateQ.data?.agents.find((a) => a.strategyId === displayStats.strategyId) ?? null;
  }, [displayStats, labStateQ.data?.agents]);

  const leaderRunsQ = useQuery({
    queryKey: [
      "btc-quant",
      "runs",
      activeCohortId ?? "none",
      "display",
      displayStats?.strategyId ?? "none",
    ],
    queryFn: () =>
      fetchBtcRuns({
        limit: 50,
        offset: 0,
        strategyId: displayStats!.strategyId,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId && displayStats?.strategyId != null),
    refetchInterval: 45_000,
  });

  const startUsd = displayLab?.startingBankUsd ?? labStateQ.data?.simConfig.startingBankUsd ?? 1000;
  const equityUsd = displayLab?.equityUsd ?? startUsd;
  const retPct = displayLab?.returnPct ?? (startUsd > 0 ? (equityUsd / startUsd - 1) * 100 : 0);

  const equityHistory = useMemo(
    () =>
      buildEquityHistoryFromRuns({
        startBalance: startUsd,
        currentBalance: equityUsd,
        runs: (leaderRunsQ.data?.runs ?? []).map((r) => ({
          status: r.status,
          resolvedAt: r.resolvedAt,
          pnl: r.simPnlUsd,
        })),
      }),
    [leaderRunsQ.data?.runs, startUsd, equityUsd],
  );

  const loading =
    overviewQ.isLoading ||
    statsQ.isLoading ||
    runsQ.isLoading ||
    labStateQ.isLoading ||
    strategiesQ.isLoading;
  const failed = overviewQ.isError || statsQ.isError || runsQ.isError || labStateQ.isError;

  const refreshAll = useCallback(() => {
    void overviewQ.refetch();
    void statsQ.refetch();
    void runsQ.refetch();
    void labStateQ.refetch();
    void strategiesQ.refetch();
    void leaderRunsQ.refetch();
  }, [overviewQ, statsQ, runsQ, labStateQ, strategiesQ, leaderRunsQ]);

  return (
    <>
      <BtcExperimentBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative space-y-8",
        )}
      >
        <BtcExperimentHero
          embedded={embedded}
          loading={loading}
          failed={failed}
          btcPriceUsd={overviewQ.data?.btcSpotPriceUsd}
          onRefresh={refreshAll}
        />

        <ExperimentAgentBalancePanel
          platformLabel="BTC quant lab"
          bankLabel="$1,000 paper agent"
          strategyLabel={displayStats?.strategyName ?? "Warming up…"}
          startBalance={startUsd}
          currentBalance={equityUsd}
          retPct={retPct}
          closedCount={displayStats?.decided ?? 0}
          openCount={displayLab?.openPositions ?? displayStats?.openPositions ?? 0}
          historyPoints={equityHistory}
          formatBalance={formatExperimentUsd}
          formatAxis={(n) => `$${Math.round(n)}`}
          accent="experiment"
        />

        <BtcExperimentGlobalStats overview={overviewQ.data} loading={overviewQ.isLoading} />

        <ExperimentTabShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentClass="data-[state=active]:bg-background data-[state=active]:text-foreground"
          startContent={
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Strategy roster</h2>
                <p className="mt-1 text-sm text-muted-foreground">
          Fifteen quant agents — each with unique signal gates on cbBTC/USDC Solana DEX data (Birdeye OHLCV).
          Execution target: cbBTC on Solana via Jupiter.
                </p>
              </div>
              <BtcStrategyCards strategies={strategiesQ.data ?? []} loading={strategiesQ.isLoading} />
            </div>
          }
          resultsContent={
            <BtcQuantLabSummary
              agents={statsQ.data?.agents ?? []}
              recentRuns={runsQ.data?.runs ?? []}
              loading={loading}
              selectedStrategyId={selectedStrategyId ?? leaderStats?.strategyId ?? null}
              onSelectStrategy={(id) => {
                setSelectedStrategyId(id);
                setActiveTab("results");
              }}
            />
          }
          activityContent={
            <BtcQuantLabSummary
              agents={statsQ.data?.agents ?? []}
              recentRuns={runsQ.data?.runs ?? []}
              loading={loading}
              selectedStrategyId={selectedStrategyId ?? leaderStats?.strategyId ?? null}
              onSelectStrategy={setSelectedStrategyId}
            />
          }
        />

        <BtcQuantRealSection />
      </div>
    </>
  );
}
