import { Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function truncateWallet(wallet: string | null): string {
  if (!wallet) return "—";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

export interface PumpfunHoldersPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunHoldersPanel({ data, className }: PumpfunHoldersPanelProps) {
  const holders = data.holders.ok ? data.holders.data : null;
  const concentration = holders?.top10ConcentrationPct;

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Holder concentration</p>
          <h3 className="text-sm font-medium text-muted-foreground">On-chain top holders via Solana RPC</h3>
        </div>
      </div>

      {!holders ? (
        <p className="text-sm text-muted-foreground">
          Holder data unavailable
          {data.holders.error ? `: ${data.holders.error.replace(/\{"jsonrpc".*$/, "Solana RPC temporarily unavailable")}` : ""}
        </p>
      ) : holders.holders.length === 0 && holders.holderCountEstimate != null ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Top holder breakdown is temporarily unavailable (Solana RPC busy).
          </p>
          <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Estimated holders (pump.fun)</span>
            <span className="font-mono font-semibold tabular-nums">
              {holders.holderCountEstimate.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {concentration != null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Top 10 concentration</span>
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    concentration >= 60
                      ? "text-red-500"
                      : concentration >= 40
                        ? "text-amber-500"
                        : "text-emerald-500",
                  )}
                >
                  {concentration.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(100, concentration)} className="h-2" />
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holders.holders.slice(0, 10).map((row) => (
                  <TableRow key={row.tokenAccount}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.rank}</TableCell>
                    <TableCell className="font-mono text-xs">{truncateWallet(row.wallet)}</TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {row.balanceHuman != null
                        ? row.balanceHuman.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {row.sharePct != null ? `${row.sharePct.toFixed(2)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
