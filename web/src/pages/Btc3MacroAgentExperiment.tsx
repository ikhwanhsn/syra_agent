import { BtcAgentExperimentPageSkeleton } from "@/components/experiment/btc/BtcExperimentSkeletons";
import { Btc3Backdrop } from "@/components/btc3-experiment/Btc3Backdrop";
import { Hero } from "@/components/btc3-experiment/Hero";
import { NewsPanel } from "@/components/btc3-experiment/NewsPanel";
import { MacroEventsPanel } from "@/components/btc3-experiment/MacroEventsPanel";
import { EntitiesPanel } from "@/components/btc3-experiment/EntitiesPanel";
import { HistoricalSimilarityPanel } from "@/components/btc3-experiment/HistoricalSimilarityPanel";
import { ReasoningPanel } from "@/components/btc3-experiment/ReasoningPanel";
import { PredictionsPanel } from "@/components/btc3-experiment/PredictionsPanel";
import { PaperTradingPanel } from "@/components/btc3-experiment/PaperTradingPanel";
import { Btc3LearningPanel } from "@/components/btc3-experiment/Btc3LearningPanel";
import { PortfolioPanel } from "@/components/btc3-experiment/PortfolioPanel";
import { ExecutionPanel } from "@/components/btc3-experiment/ExecutionPanel";
import { SystemLogsPanel } from "@/components/btc3-experiment/SystemLogsPanel";
import { SettingsPanel } from "@/components/btc3-experiment/SettingsPanel";
import { AgentSidebar } from "@/components/btc3-experiment/AgentSidebar";
import { Button } from "@/components/ui/button";
import { useBtc3MacroState } from "@/hooks/useBtc3MacroState";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export default function Btc3MacroAgentExperiment() {
  const { state, paused, togglePause, refresh, loading, error, isFetching } = useBtc3MacroState();

  return (
    <>
      <Btc3Backdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative",
        )}
      >
        {loading && !state ? (
          <BtcAgentExperimentPageSkeleton accent="blue" panelCount={8} />
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
              <NewsPanel news={state.news} total={state.newsTotal} />
              <MacroEventsPanel events={state.macroEvents} />
              <EntitiesPanel entities={state.entities} />
              <HistoricalSimilarityPanel
                items={state.similarity}
                currentEventTitle={state.currentEventTitle}
              />
              <ReasoningPanel reasoning={state.reasoning} />
              <PredictionsPanel predictions={state.predictions} />
              <PaperTradingPanel paper={state.paper} rebalances={state.paperRebalances} />
              <Btc3LearningPanel learning={state.learning} />
              <PortfolioPanel
                current={state.portfolio.current}
                target={state.portfolio.target}
                snapshots={state.portfolio.snapshots}
                latestDecision={state.portfolio.latestDecision}
              />
              <ExecutionPanel
                current={state.portfolio.current}
                target={state.portfolio.target}
                executions={state.executions}
              />
              <SystemLogsPanel logs={state.logs} />
              <SettingsPanel settings={state.settings} />

              <div className="xl:hidden">
                <AgentSidebar runtime={state.runtime} paper={state.paper} />
              </div>
            </div>
            <div className="hidden xl:block">
              <div className="sticky top-6">
                <AgentSidebar runtime={state.runtime} paper={state.paper} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
