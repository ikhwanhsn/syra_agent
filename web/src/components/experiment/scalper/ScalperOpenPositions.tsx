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
  formatScalperPct,
  formatScalperUsd,
  SCALPER_SOURCE_LABELS,
  type ScalperRun,
} from "@/lib/scalperApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

function formatHoldTime(openedAt: string | null): string {
  if (!openedAt) return "—";
  const ms = Date.now() - new Date(openedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export interface ScalperOpenPositionsProps {
  runs: ScalperRun[];
  loading?: boolean;
  className?: string;
}

export function ScalperOpenPositions({ runs, loading, className }: ScalperOpenPositionsProps) {
  return (
    <section className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5", className)}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-tight">Open positions</h2>
        <p className="text-xs text-muted-foreground">Live mark-to-market with Jupiter-quote entry fills</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading positions…</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open scalps.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Unrealized</TableHead>
                <TableHead>TP / SL</TableHead>
                <TableHead>Held</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const pnl = run.unrealizedPnlUsd ?? 0;
                const pnlTone = pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "";
                return (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {SCALPER_SOURCE_LABELS[run.source]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatScalperUsd(run.entryPriceUsd)}
                      {run.entryImpactBps != null ? (
                        <span className="block text-[10px] text-muted-foreground">
                          {run.entryFillSource} · {run.entryImpactBps}bps
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatScalperUsd(run.currentPriceUsd)}</TableCell>
                    <TableCell className={pnlTone}>
                      {formatScalperUsd(run.unrealizedPnlUsd)}
                      <span className="block text-[10px]">{formatScalperPct(run.unrealizedPnlPct)}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatScalperUsd(run.takeProfitPriceUsd)} / {formatScalperUsd(run.stopLossPriceUsd)}
                    </TableCell>
                    <TableCell className="text-xs">{formatHoldTime(run.openedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
