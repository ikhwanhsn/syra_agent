import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { AllocationPct, Btc3Execution } from "@/lib/btc3/types";
import { formatPct, formatUsd } from "@/lib/btc3/format";

export function ExecutionPanel({
  current,
  target,
  executions,
}: {
  current: AllocationPct;
  target: AllocationPct;
  executions: Btc3Execution[];
}) {
  const diffBtc = target.btcPct - current.btcPct;
  const latest = executions[0];

  return (
    <PanelShell
      kicker="Execution"
      title="Jupiter Swap Preparation"
      description="Jupiter quote preview for real execution. Paper sim auto-rebalances separately."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="font-semibold">
            {formatPct(current.btcPct)} BTC / {formatPct(current.usdcPct)} USDC
          </p>
        </div>
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Target</p>
          <p className="font-semibold">
            {formatPct(target.btcPct)} BTC / {formatPct(target.usdcPct)} USDC
          </p>
        </div>
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Difference</p>
          <p className="font-semibold">
            {diffBtc >= 0 ? "+" : ""}
            {diffBtc.toFixed(1)}% BTC
          </p>
        </div>
      </div>

      {latest ? (
        <div className="mt-4 space-y-2 rounded-xl border border-border/40 p-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{latest.status}</Badge>
            {latest.route ? <Badge variant="secondary">{latest.route}</Badge> : null}
          </div>
          {latest.estimatedFeeUsd != null ? (
            <p>Estimated fee: {formatUsd(latest.estimatedFeeUsd)}</p>
          ) : null}
          {latest.error ? <p className="text-red-500">{latest.error}</p> : null}
        </div>
      ) : (
        <EmptyState message="No execution quotes yet. Pipeline generates quotes when allocation differs." />
      )}

      <Button type="button" className="mt-4" disabled title="Real onchain execution not enabled — paper sim auto-rebalances">
        Execute on Jupiter (real — disabled)
      </Button>
    </PanelShell>
  );
}
