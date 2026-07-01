import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExperimentAgentBalancePanel } from "@/components/experiment/shared/ExperimentAgentBalancePanel";
import { ExperimentTabShell, type ExperimentTabId } from "@/components/experiment/shared/ExperimentTabShell";
import { StocksExperimentBackdrop } from "@/components/experiment/stocks/StocksExperimentBackdrop";
import { StocksExperimentHero } from "@/components/experiment/stocks/StocksExperimentHero";
import { StocksGlobalStats } from "@/components/experiment/stocks/StocksGlobalStats";
import { StocksLabSummary } from "@/components/experiment/stocks/StocksLabSummary";
import { StocksNewsPanel } from "@/components/experiment/stocks/StocksNewsPanel";
import { StocksUniversePanel } from "@/components/experiment/stocks/StocksUniversePanel";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchStocksLabState,
  fetchStocksNews,
  fetchStocksOverview,
  fetchStocksRuns,
  fetchStocksStats,
  fetchStocksStrategies,
  fetchStocksUniverse,
} from "@/lib/stocksExperimentApi";
import { buildEquityHistoryFromRuns, formatExperimentUsd } from "@/lib/experimentEquityHistory";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export default function StocksNewsExperiment({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<ExperimentTabId>("results");
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);

  const overviewQ = useQuery({
    queryKey: ["stocks-experiment", "overview"],
    queryFn: fetchStocksOverview,
    refetchInterval: 60_000,
  });
  const labStateQ = useQuery({
    queryKey: ["stocks-experiment", "lab-state"],
    queryFn: fetchStocksLabState,
    refetchInterval: 60_000,
  });
  const strategiesQ = useQuery({
    queryKey: ["stocks-experiment", "strategies"],
    queryFn: fetchStocksStrategies,
    staleTime: 300_000,
  });
  const universeQ = useQuery({
    queryKey: ["stocks-experiment", "universe"],
    queryFn: fetchStocksUniverse,
    refetchInterval: 60_000,
  });
  const newsQ = useQuery({
    queryKey: ["stocks-experiment", "news"],
    queryFn: () => fetchStocksNews(12),
    refetchInterval: 90_000,
  });

  const activeCohortId = labStateQ.data?.activeExperimentId ?? null;
  const statsQ = useQuery({
    queryKey: ["stocks-experiment", "stats", activeCohortId ?? "none"],
    queryFn: fetchStocksStats,
    enabled: labStateQ.isFetched,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["stocks-experiment", "runs", activeCohortId ?? "none", "recent"],
    queryFn: () =>
      fetchStocksRuns({
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

  const displayRunsQ = useQuery({
    queryKey: [
      "stocks-experiment",
      "runs",
      activeCohortId ?? "none",
      "display",
      displayStats?.strategyId ?? "none",
    ],
    queryFn: () =>
      fetchStocksRuns({
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
        runs: (displayRunsQ.data?.runs ?? []).map((r) => ({
          status: r.status,
          resolvedAt: r.resolvedAt,
          pnl: r.simPnlUsd,
        })),
      }),
    [displayRunsQ.data?.runs, startUsd, equityUsd],
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
    void universeQ.refetch();
    void newsQ.refetch();
    void displayRunsQ.refetch();
  }, [overviewQ, statsQ, runsQ, labStateQ, strategiesQ, universeQ, newsQ, displayRunsQ]);

  return (
    <>
      <StocksExperimentBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative space-y-8",
        )}
      >
        <StocksExperimentHero embedded={embedded} loading={loading} failed={failed} onRefresh={refreshAll} />

        <ExperimentAgentBalancePanel
          platformLabel="Stocks news lab"
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

        <StocksGlobalStats overview={overviewQ.data} loading={overviewQ.isLoading} />

        <ExperimentTabShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentClass="data-[state=active]:bg-background data-[state=active]:text-foreground"
          startContent={
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Fifteen news-driven agents compete on tokenized xStocks (TSLAx, AAPLx, NVDAx, SPYx,
                  SPCXx). Each agent scores live headlines and sentiment, opens paper positions priced via
                  Jupiter, and evolves daily — worst performers are culled, elite strategies spawn smarter
                  offspring.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Scan news",
                    body: "Agents ingest headlines, sentiment, and event signals for each xStock symbol.",
                  },
                  {
                    step: "02",
                    title: "Paper trade",
                    body: "When gates pass, agents open $1,000-notional positions at Jupiter prices.",
                  },
                  {
                    step: "03",
                    title: "Evolve",
                    body: "Daily evolution culls losers and mutates winners into smarter strategies.",
                  },
                ].map((item) => (
                  <div key={item.step} className={cn(overviewCardShell, "rounded-2xl p-5")}>
                    <p className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {item.step}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">xStocks universe</h3>
                <p className="mt-1 text-xs text-muted-foreground">Live Jupiter prices on Solana</p>
                <div className="mt-3">
                  <StocksUniversePanel universe={universeQ.data?.universe ?? []} loading={universeQ.isLoading} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">Strategy roster</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(strategiesQ.data?.strategies ?? []).length} agents with unique news gates
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(strategiesQ.data?.strategies ?? []).map((s) => (
                    <li key={s.id} className={cn(overviewCardShell, "rounded-2xl p-4")}>
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.notes}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground/80">
                        Hold {s.maxHoldHours}h · SL {s.exit?.stopLossPct ?? -5}% · TP{" "}
                        {s.exit?.takeProfitPct ?? 8}%
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          }
          resultsContent={
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Live leaderboard</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Best profitable agent rises to the top. Click any row to inspect equity curve.
                </p>
              </div>
              <StocksLabSummary
                agents={statsQ.data?.agents ?? []}
                recentRuns={runsQ.data?.runs ?? []}
                loading={loading}
                selectedStrategyId={selectedStrategyId ?? leaderStats?.strategyId}
                onSelectStrategy={setSelectedStrategyId}
              />
            </div>
          }
          activityContent={
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">News driving trades</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live sentiment and headlines per xStock — the signal layer behind agent decisions.
                </p>
              </div>
              <StocksNewsPanel news={newsQ.data?.news ?? []} loading={newsQ.isLoading} />
            </div>
          }
        />
      </div>
    </>
  );
}
