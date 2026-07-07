import { Zap } from "lucide-react";
import { ScalperDataSourcesFooter } from "@/components/experiment/scalper/ScalperDataSourcesFooter";
import { ScalperLearningPanel } from "@/components/experiment/scalper/ScalperLearningPanel";
import { ScalperOpenPositions } from "@/components/experiment/scalper/ScalperOpenPositions";
import { ScalperOpportunityFeed } from "@/components/experiment/scalper/ScalperOpportunityFeed";
import { ScalperPnlHeader } from "@/components/experiment/scalper/ScalperPnlHeader";
import { ScalperTradeHistory } from "@/components/experiment/scalper/ScalperTradeHistory";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { useScalperEquityHistory, useScalperLearning, useScalperOverview, useScalperRuns } from "@/hooks/useScalperState";

export default function ScalperExperiment({ embedded = false }: { embedded?: boolean }) {
  const overviewQ = useScalperOverview();
  const equityQ = useScalperEquityHistory();
  const learningQ = useScalperLearning();
  const historyQ = useScalperRuns({ limit: 30 });

  const overview = overviewQ.data;
  const closedRuns =
    historyQ.data?.runs.filter((r) => r.status !== "open") ??
    overview?.recentClosed ??
    [];

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{
          background:
            "radial-gradient(600px 240px at 50% 0%, hsl(38 92% 50% / 0.12), transparent 70%)",
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
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
              <Zap className="h-4 w-4 text-amber-400" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Scalper agent</h1>
              <p className="text-sm text-muted-foreground">
                Short-hold paper scalper across cbBTC + xStocks · hybrid opportunity feed · Jupiter-quote fills
              </p>
            </div>
          </div>
        </header>

        {overviewQ.isError ? (
          <article className={cn(overviewCardShell, "rounded-2xl border border-destructive/30 p-4 text-sm text-destructive")}>
            Failed to load scalper state: {overviewQ.error instanceof Error ? overviewQ.error.message : "Unknown error"}
          </article>
        ) : null}

        <ScalperPnlHeader
          ledger={overview?.ledger}
          todayTrades={overview?.today.trades ?? 0}
          todayPnlUsd={overview?.today.pnlUsd ?? 0}
          avgHoldMinutes={overview?.today.avgHoldMinutes ?? null}
          loading={overviewQ.isLoading}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <ScalperOpportunityFeed
            opportunities={overview?.opportunityFeed?.opportunities ?? []}
            scannedAt={overview?.opportunityFeed?.scannedAt ?? null}
            loading={overviewQ.isLoading}
          />
          <ScalperOpenPositions
            runs={overview?.openRuns ?? []}
            loading={overviewQ.isLoading}
          />
        </div>

        <ScalperLearningPanel
          learning={learningQ.data}
          loading={learningQ.isLoading}
        />

        <ScalperTradeHistory
          runs={closedRuns}
          equityPoints={equityQ.data?.points ?? []}
          startingBankUsd={equityQ.data?.startingBankUsd ?? overview?.simConfig.startingBankUsd ?? 1000}
          loading={overviewQ.isLoading || equityQ.isLoading}
        />

        <ScalperDataSourcesFooter dataSources={overview?.dataSources} />
      </div>
    </div>
  );
}
