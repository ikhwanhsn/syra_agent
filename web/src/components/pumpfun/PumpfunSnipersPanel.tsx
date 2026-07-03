import { Crosshair, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useTokenSnipers } from "@/hooks/usePumpfunTools";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";

function walletTypeLabel(label: string | null): string | null {
  if (!label) return null;
  return label.replace(/_/g, " ");
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function toneClass(tone: string): string {
  if (tone === "danger") return "border-red-500/30 text-red-600 dark:text-red-400";
  if (tone === "warning") return "border-amber-500/30 text-amber-700 dark:text-amber-400";
  return "border-border/50 text-muted-foreground";
}

export interface PumpfunSnipersPanelProps {
  mint: string;
  enabled?: boolean;
  className?: string;
}

export function PumpfunSnipersPanel({ mint, enabled = true, className }: PumpfunSnipersPanelProps) {
  const snipersQ = useTokenSnipers(mint, { enabled });

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Crosshair className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Sniper detection</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            First-block buyers, bundle wallets, and current holdings
          </h3>
        </div>
      </div>

      {snipersQ.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning sniper wallets…
        </div>
      ) : snipersQ.isError ? (
        <p className="text-sm text-destructive">
          {snipersQ.error instanceof Error ? snipersQ.error.message : "Sniper data unavailable"}
        </p>
      ) : !snipersQ.data ? (
        <p className="text-sm text-muted-foreground">No sniper data available.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn(toneClass(snipersQ.data.summary.tone))}>
              {snipersQ.data.summary.verdict}
            </Badge>
            {snipersQ.data.summary.sniperSupplyPct != null ? (
              <Badge variant="secondary" className="font-mono tabular-nums">
                {snipersQ.data.summary.sniperSupplyPct.toFixed(2)}% sniper supply
              </Badge>
            ) : null}
            {snipersQ.data.summary.bundleSupplyPct != null ? (
              <Badge variant="secondary" className="font-mono tabular-nums">
                {snipersQ.data.summary.bundleSupplyPct.toFixed(2)}% bundler supply
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total snipers", value: String(snipersQ.data.summary.totalSnipers) },
              { label: "First block", value: String(snipersQ.data.summary.firstBlockBuyerCount) },
              { label: "Still holding", value: String(snipersQ.data.summary.stillHolding) },
              { label: "Fully sold", value: String(snipersQ.data.summary.fullySold) },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-center"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</p>
                <p className="font-mono text-sm font-semibold tabular-nums">{row.value}</p>
              </div>
            ))}
          </div>

          {snipersQ.data.snipers.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead className="text-right">Holding</TableHead>
                    <TableHead className="text-right">Bought</TableHead>
                    <TableHead>Block</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snipersQ.data.snipers.slice(0, 15).map((row) => (
                    <TableRow key={row.wallet}>
                      <TableCell className="font-mono text-xs tabular-nums">{row.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{truncateWallet(row.wallet)}</span>
                          {row.label ? (
                            <Badge variant="outline" className="text-[9px] capitalize">
                              {walletTypeLabel(row.label)}
                            </Badge>
                          ) : null}
                          {row.isFirstBlock ? (
                            <Badge variant="outline" className="text-[9px] border-amber-500/30">
                              1st block
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs">
                        {row.holdingPct != null ? `${row.holdingPct.toFixed(2)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs">
                        {formatCompactUsd(row.boughtUsd) || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {row.blockIndex != null ? `#${row.blockIndex}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No significant sniper/bundle activity detected for this token.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
