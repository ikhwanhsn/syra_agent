import { Badge } from "@/components/ui/badge";
import { ExperimentAgentBalancePanel } from "@/components/experiment/shared/ExperimentAgentBalancePanel";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3PaperRebalance, Btc3PaperTrading } from "@/lib/btc3/types";
import { formatPct, formatReturn, formatUsd } from "@/lib/btc3/format";
import { buildEquityHistoryFromRuns, formatExperimentUsd } from "@/lib/experimentEquityHistory";
import { useMemo } from "react";

export function PaperTradingPanel({
  paper,
  rebalances,
}: {
  paper: Btc3PaperTrading | null;
  rebalances: Btc3PaperRebalance[];
}) {
  const equityHistory = useMemo(() => {
    if (!paper) return [];
    return buildEquityHistoryFromRuns({
      startBalance: paper.startingBankUsd,
      currentBalance: paper.equityUsd,
      runs: rebalances
        .filter((r) => r.status === "executed")
        .map((r) => ({
          status: "win",
          resolvedAt: r.createdAt,
          pnl: r.equityUsd - paper.startingBankUsd,
        })),
    });
  }, [paper, rebalances]);

  if (!paper) {
    return (
      <PanelShell
        kicker="Paper Trading"
        title="Macro Paper Sim"
        description="$1,000 paper bank — auto-rebalances on macro allocation decisions."
      >
        <EmptyState message="Paper trading initializes on first pipeline run." />
      </PanelShell>
    );
  }

  const retPct = paper.returnPct ?? 0;

  return (
    <PanelShell
      kicker="Paper Trading"
      title="Macro Paper Sim"
      description="Spot-only USDC ↔ BTC paper rebalances at onchain cbBTC prices. Real execution remains disabled."
    >
      <ExperimentAgentBalancePanel
        platformLabel="Macro Intelligence"
        bankLabel={`$${paper.startingBankUsd.toLocaleString()} paper agent`}
        strategyLabel="Macro allocation rebalancer"
        startBalance={paper.startingBankUsd}
        currentBalance={paper.equityUsd}
        retPct={retPct}
        closedCount={paper.executedRebalances}
        openCount={0}
        historyPoints={equityHistory}
        formatBalance={formatExperimentUsd}
        formatAxis={(n) => formatExperimentUsd(n)}
        closedStatLabel="Rebalances"
        openStatLabel="Open"
        openStatSuffix={null}
        accent="internal"
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/40 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Holdings</p>
          <p className="mt-1 font-mono">{formatUsd(paper.holdings.usdcAmount)} USDC</p>
          <p className="font-mono">{paper.holdings.btcAmount.toFixed(6)} BTC</p>
        </div>
        <div className="rounded-xl border border-border/40 p-3 text-sm">
          <p className="text-xs text-muted-foreground">BTC Mark</p>
          <p className="mt-1 font-semibold">{formatUsd(paper.btcSpotPriceUsd)}</p>
          <p className="text-xs text-muted-foreground">Onchain cbBTC spot</p>
        </div>
        <div className="rounded-xl border border-border/40 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Allocation</p>
          <p className="mt-1 font-semibold">
            {formatPct(paper.allocation.btcPct)} BTC / {formatPct(paper.allocation.usdcPct)} USDC
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent paper rebalances
        </p>
        {rebalances.length === 0 ? (
          <EmptyState message="No paper rebalances yet — pipeline auto-executes when target allocation shifts." />
        ) : (
          <ul className="space-y-2">
            {rebalances.slice(0, 8).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.headline || "Allocation rebalance"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPct(r.beforeAllocation.btcPct)} → {formatPct(r.afterAllocation.btcPct)} BTC
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.direction.replace(/_/g, " ")}
                  </Badge>
                  <span className="font-mono text-xs">{formatReturn(r.returnPct != null ? r.returnPct / 100 : null)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelShell>
  );
}
