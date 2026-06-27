import { BtcAgentExperimentPageSkeleton } from "@/components/experiment/btc/BtcExperimentSkeletons";
import { Btc2Backdrop } from "@/components/btc2-experiment/Btc2Backdrop";
import { Hero } from "@/components/btc2-experiment/Hero";
import { MarketOverview } from "@/components/btc2-experiment/MarketOverview";
import { SignalEngine } from "@/components/btc2-experiment/SignalEngine";
import { FeatureTable } from "@/components/btc2-experiment/FeatureTable";
import { PredictionPanel } from "@/components/btc2-experiment/PredictionPanel";
import { RiskDashboard } from "@/components/btc2-experiment/RiskDashboard";
import { ExecutionTimeline } from "@/components/btc2-experiment/ExecutionTimeline";
import { Portfolio } from "@/components/btc2-experiment/Portfolio";
import { Transparency } from "@/components/btc2-experiment/Transparency";
import { Architecture } from "@/components/btc2-experiment/Architecture";
import { Performance } from "@/components/btc2-experiment/Performance";
import { RecentTrades } from "@/components/btc2-experiment/RecentTrades";
import { SystemLogs } from "@/components/btc2-experiment/SystemLogs";
import { AgentSidebar } from "@/components/btc2-experiment/AgentSidebar";
import { Button } from "@/components/ui/button";
import { useBtc2AgentState } from "@/hooks/useBtc2AgentState";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export default function Btc2QuantAgentExperiment() {
  const { state, paused, togglePause, refresh, loading, error, isFetching } = useBtc2AgentState();

  return (
    <>
      <Btc2Backdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative",
        )}
      >
        {loading && !state ? (
          <BtcAgentExperimentPageSkeleton accent="amber" panelCount={6} />
        ) : error && !state ? (
          <div className={cn(overviewCardShell, "space-y-4 rounded-2xl p-8 text-center")}>
            <p className="text-sm text-red-500">{error}</p>
            <Button type="button" variant="outline" onClick={refresh}>
              Retry
            </Button>
          </div>
        ) : state ? (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-8">
              <Hero
                hero={state.hero}
                paused={paused}
                onTogglePause={togglePause}
                onRefresh={refresh}
              />
              {isFetching && !loading ? (
                <p className="text-center text-xs text-muted-foreground">Syncing live data…</p>
              ) : null}
              <MarketOverview metrics={state.marketMetrics} />
              <SignalEngine factors={state.factors} />
              <FeatureTable features={state.features} />
              <PredictionPanel prediction={state.prediction} />
              <RiskDashboard risk={state.risk} />
              <ExecutionTimeline executions={state.executions} />
              <Portfolio portfolio={state.portfolio} />
              <Transparency predictions={state.onchainPredictions} />
              <Architecture />
              <Performance performance={state.performance} />
              <RecentTrades trades={state.recentTrades} />
              <SystemLogs logs={state.logs} />

              <div className="xl:hidden">
                <AgentSidebar runtime={state.runtime} priceHistory={state.priceHistory} />
              </div>
            </div>

            <div className="hidden xl:block">
              <div className="sticky top-6">
                <AgentSidebar runtime={state.runtime} priceHistory={state.priceHistory} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
