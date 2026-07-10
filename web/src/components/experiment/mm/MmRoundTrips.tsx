import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  formatMmPct,
  formatMmUsd,
  MM_STRATEGY_LABELS,
  type MmRun,
} from "@/lib/mmApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface MmRoundTripsProps {
  runs: MmRun[];
  loading?: boolean;
  className?: string;
}

function statusBadge(status: MmRun["status"]) {
  if (status === "closed") return <Badge className="bg-emerald-500/15 text-emerald-400">Closed</Badge>;
  if (status === "filled") return <Badge className="bg-violet-500/15 text-violet-400">Filled</Badge>;
  if (status === "resting") return <Badge variant="secondary">Resting</Badge>;
  if (status === "cancelled") return <Badge variant="outline">Cancelled</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function MmRoundTrips({ runs, loading, className }: MmRoundTripsProps) {
  return (
    <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5", className)}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-tight">Round trips & fills</h2>
        <p className="text-xs text-muted-foreground">Buy → sell pairs with Jupiter-quote impact</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No runs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Side</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Limit → Fill</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const pnl = run.simPnlUsd ?? 0;
                const pnlTone = pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "";
                return (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium capitalize">{run.side}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {MM_STRATEGY_LABELS[run.strategyId]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {formatMmUsd(run.limitPriceUsd)} → {formatMmUsd(run.fillPriceUsd)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {run.volumeUsd > 0 ? formatMmUsd(run.volumeUsd) : formatMmUsd(run.notionalUsd)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {run.impactBps != null ? `${run.impactBps} bps` : "—"}
                    </TableCell>
                    <TableCell className={pnlTone}>
                      {run.simPnlUsd != null ? (
                        <>
                          {formatMmUsd(run.simPnlUsd)}
                          <span className="block text-[10px]">{formatMmPct(run.simPnlPct)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(run.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </article>
  );
}
