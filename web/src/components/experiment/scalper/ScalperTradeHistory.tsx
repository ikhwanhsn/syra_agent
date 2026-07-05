import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  type ScalperEquityPoint,
  type ScalperRun,
} from "@/lib/scalperApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

function statusBadge(status: ScalperRun["status"]) {
  if (status === "win") return <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">Win</Badge>;
  if (status === "loss") return <Badge className="bg-red-500/15 text-red-400 hover:bg-red-500/15">Loss</Badge>;
  if (status === "expired") return <Badge variant="secondary">Expired</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export interface ScalperTradeHistoryProps {
  runs: ScalperRun[];
  equityPoints: ScalperEquityPoint[];
  startingBankUsd: number;
  loading?: boolean;
  className?: string;
}

export function ScalperTradeHistory({
  runs,
  equityPoints,
  startingBankUsd,
  loading,
  className,
}: ScalperTradeHistoryProps) {
  const chartData = equityPoints.map((p) => ({
    ts: new Date(p.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    equityUsd: p.equityUsd,
  }));

  if (chartData.length === 0) {
    chartData.push(
      { ts: "Start", equityUsd: startingBankUsd },
      { ts: "Now", equityUsd: startingBankUsd },
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight">Equity curve</h2>
          <p className="text-xs text-muted-foreground">Paper P&L from Jupiter-quote fills</p>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scalperEquityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="ts" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                formatter={(value: number) => [formatScalperUsd(value), "Equity"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Area
                type="stepAfter"
                dataKey="equityUsd"
                stroke="hsl(38 92% 50%)"
                fill="url(#scalperEquityFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight">Trade history</h2>
          <p className="text-xs text-muted-foreground">Closed scalps with real fill impact</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading history…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No closed trades yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Entry → Exit</TableHead>
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
                      <TableCell className="font-medium">{run.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {SCALPER_SOURCE_LABELS[run.source]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatScalperUsd(run.entryPriceUsd)} → {formatScalperUsd(run.exitPriceUsd)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        in {run.entryImpactBps ?? "—"}bps · out {run.exitImpactBps ?? "—"}bps
                      </TableCell>
                      <TableCell className={pnlTone}>
                        {formatScalperUsd(run.simPnlUsd)}
                        <span className="block text-[10px]">{formatScalperPct(run.simPnlPct)}</span>
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
    </section>
  );
}
