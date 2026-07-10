import { Waves } from "lucide-react";
import { MmDataSourcesFooter } from "@/components/experiment/mm/MmDataSourcesFooter";
import { MmLearningPanel } from "@/components/experiment/mm/MmLearningPanel";
import { MmPnlHeader } from "@/components/experiment/mm/MmPnlHeader";
import { MmQuoteBookPanel } from "@/components/experiment/mm/MmQuoteBook";
import { MmRoundTrips } from "@/components/experiment/mm/MmRoundTrips";
import { MmVolumeChart } from "@/components/experiment/mm/MmVolumeChart";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import {
  useMmEquityHistory,
  useMmLearning,
  useMmOverview,
  useMmRuns,
  useMmVolumeHistory,
} from "@/hooks/useMmState";

export default function MmExperiment({ embedded = false }: { embedded?: boolean }) {
  const overviewQ = useMmOverview();
  const equityQ = useMmEquityHistory();
  const volumeQ = useMmVolumeHistory();
  const learningQ = useMmLearning();
  const historyQ = useMmRuns({ limit: 40 });

  const overview = overviewQ.data;
  const allRuns =
    historyQ.data?.runs ??
    [...(overview?.restingRuns ?? []), ...(overview?.recentClosed ?? [])];

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{
          background:
            "radial-gradient(600px 240px at 50% 0%, hsl(270 70% 55% / 0.12), transparent 70%)",
        }}
        aria-hidden
      />

      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative flex-1 space-y-6",
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
        )}
      >
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/25">
              <Waves className="h-4 w-4 text-violet-400" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">SYRA market maker</h1>
              <p className="text-sm text-muted-foreground">
                Paper MM agent · maximize volume · PnL ≥ 0 · Jupiter quotes · daily learning
              </p>
            </div>
          </div>
        </header>

        {overviewQ.isError ? (
          <article
            className={cn(
              overviewCardShell,
              "rounded-2xl border border-destructive/30 p-4 text-sm text-destructive",
            )}
          >
            Failed to load MM state:{" "}
            {overviewQ.error instanceof Error ? overviewQ.error.message : "Unknown error"}
          </article>
        ) : null}

        <MmPnlHeader
          ledger={overview?.ledger}
          creatorFeeBps={overview?.simConfig.creatorFeeBps ?? learningQ.data?.creatorFeeBps ?? 100}
          loading={overviewQ.isLoading}
        />

        <MmQuoteBookPanel
          quoteBook={overview?.quoteBook}
          market={overview?.market}
          restingRuns={overview?.restingRuns ?? []}
          inventoryDriftPct={overview?.ledger.inventoryDriftPct ?? 0}
          loading={overviewQ.isLoading}
        />

        <MmVolumeChart
          volumePoints={volumeQ.data?.points ?? []}
          equityPoints={equityQ.data?.points ?? []}
          startingBankUsd={equityQ.data?.startingBankUsd ?? overview?.simConfig.startingBankUsd ?? 1000}
          creatorFeeBps={volumeQ.data?.creatorFeeBps ?? overview?.simConfig.creatorFeeBps ?? 100}
          loading={overviewQ.isLoading || volumeQ.isLoading || equityQ.isLoading}
        />

        <MmLearningPanel learning={learningQ.data} loading={learningQ.isLoading} />

        <MmRoundTrips runs={allRuns} loading={overviewQ.isLoading || historyQ.isLoading} />

        <MmDataSourcesFooter dataSources={overview?.dataSources} />
      </div>
    </div>
  );
}
