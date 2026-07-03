import { ArrowDownLeft, ArrowUpRight, DollarSign, Loader2, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useTokenTrades } from "@/hooks/usePumpfunTools";
import { formatRelativeTime } from "@/lib/agentWalletUi";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";

function truncateWallet(wallet: string | null): string {
  if (!wallet) return "—";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function toneClass(tone: string): string {
  if (tone === "safe") return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
  if (tone === "danger") return "border-red-500/30 text-red-600 dark:text-red-400";
  return "border-amber-500/30 text-amber-700 dark:text-amber-400";
}

export interface PumpfunTradeTapePanelProps {
  mint: string;
  enabled?: boolean;
  className?: string;
}

export function PumpfunTradeTapePanel({ mint, enabled = true, className }: PumpfunTradeTapePanelProps) {
  const tradesQ = useTokenTrades(mint, { enabled, limit: 50 });

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Radio className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Live trade tape</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent buys and sells with buy/sell pressure ratio
          </h3>
        </div>
      </div>

      {tradesQ.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading trade tape…
        </div>
      ) : tradesQ.isError ? (
        <p className="text-sm text-destructive">
          {tradesQ.error instanceof Error ? tradesQ.error.message : "Trade tape unavailable"}
        </p>
      ) : !tradesQ.data ? (
        <p className="text-sm text-muted-foreground">No trade data available.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn(toneClass(tradesQ.data.summary.tone))}>
              {tradesQ.data.summary.verdict}
            </Badge>
            {tradesQ.data.summary.buyPressurePct != null ? (
              <Badge variant="secondary" className="font-mono tabular-nums">
                {tradesQ.data.summary.buyPressurePct.toFixed(0)}% buy pressure
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { label: "Buys", value: String(tradesQ.data.summary.buyCount), icon: ArrowUpRight },
                { label: "Sells", value: String(tradesQ.data.summary.sellCount), icon: ArrowDownLeft },
                {
                  label: "Buy volume",
                  value: formatCompactUsd(tradesQ.data.summary.buyVolumeUsd),
                  icon: DollarSign,
                },
                {
                  label: "Sell volume",
                  value: formatCompactUsd(tradesQ.data.summary.sellVolumeUsd),
                  icon: DollarSign,
                },
              ] as const
            ).map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-border/40 bg-background/30 px-3 py-2"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <row.icon className="h-3 w-3" />
                  {row.label}
                </div>
                <p className="font-mono text-sm font-semibold tabular-nums">{row.value}</p>
              </div>
            ))}
          </div>

          {tradesQ.data.summary.buyPressurePct != null ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Buy pressure</span>
                <span className="font-mono tabular-nums">
                  {tradesQ.data.summary.buyPressurePct.toFixed(0)}%
                </span>
              </div>
              <Progress value={tradesQ.data.summary.buyPressurePct} className="h-2" />
            </div>
          ) : null}

          {tradesQ.data.trades.length > 0 ? (
            <ScrollArea className="h-[360px] rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Side</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesQ.data.trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        {trade.side === "buy" ? (
                          <Badge className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="h-3 w-3" />
                            Buy
                          </Badge>
                        ) : trade.side === "sell" ? (
                          <Badge className="gap-1 border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400">
                            <ArrowDownLeft className="h-3 w-3" />
                            Sell
                          </Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs">
                        {formatCompactUsd(trade.amountUsd) || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {trade.txHash ? (
                          <a
                            href={`https://solscan.io/tx/${trade.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {truncateWallet(trade.wallet)}
                          </a>
                        ) : (
                          truncateWallet(trade.wallet)
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {trade.at ? formatRelativeTime(trade.at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No recent trades found for this token.</p>
          )}
        </div>
      )}
    </section>
  );
}
