import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { AllocationPct, Btc3AllocationDecision, Btc3PortfolioSnapshot } from "@/lib/btc3/types";
import { formatPct, formatUsd } from "@/lib/btc3/format";

export function PortfolioPanel({
  current,
  target,
  snapshots,
  latestDecision,
}: {
  current: AllocationPct & { totalUsd?: number };
  target: AllocationPct;
  snapshots: Btc3PortfolioSnapshot[];
  latestDecision: Btc3AllocationDecision | null;
}) {
  const chartData = snapshots
    .slice()
    .reverse()
    .map((s) => ({
      t: new Date(s.createdAt).toLocaleDateString(),
      btcPct: s.btcPct,
    }));

  return (
    <PanelShell
      kicker="Portfolio"
      title="Spot Allocation"
      description="Paper sim allocation vs macro target. Rebalances auto-execute in paper mode."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Current BTC</p>
          <p className="text-xl font-semibold">{formatPct(current.btcPct)}</p>
        </div>
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Current USDC</p>
          <p className="text-xl font-semibold">{formatPct(current.usdcPct)}</p>
        </div>
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Target BTC</p>
          <p className="text-xl font-semibold text-blue-500">{formatPct(target.btcPct)}</p>
        </div>
        <div className="rounded-xl border border-border/40 p-4">
          <p className="text-xs text-muted-foreground">Portfolio Value</p>
          <p className="text-xl font-semibold">{formatUsd(current.totalUsd)}</p>
        </div>
      </div>

      {latestDecision ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Latest decision: {latestDecision.headline || "Allocation update"} — status{" "}
          <span className="font-medium text-foreground">{latestDecision.status}</span>
        </p>
      ) : null}

      {chartData.length > 1 ? (
        <div className="mt-6 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="t" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="btcPct" stroke="hsl(var(--primary))" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState message="Portfolio history will populate after pipeline runs." />
      )}
    </PanelShell>
  );
}
