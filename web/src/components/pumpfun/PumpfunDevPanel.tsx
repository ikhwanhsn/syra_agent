import { ExternalLink, Loader2, UserCog } from "lucide-react";
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
import { useTokenDevInfo } from "@/hooks/usePumpfunTools";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";

function truncateWallet(wallet: string | null): string {
  if (!wallet) return "—";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

export interface PumpfunDevPanelProps {
  mint: string;
  enabled?: boolean;
  className?: string;
}

export function PumpfunDevPanel({ mint, enabled = true, className }: PumpfunDevPanelProps) {
  const devQ = useTokenDevInfo(mint, { enabled });

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <UserCog className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Dev wallet tracker</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            Creator wallet, launch history, and holding status
          </h3>
        </div>
      </div>

      {devQ.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dev wallet data…
        </div>
      ) : devQ.isError ? (
        <p className="text-sm text-destructive">
          {devQ.error instanceof Error ? devQ.error.message : "Dev info unavailable"}
        </p>
      ) : !devQ.data ? (
        <p className="text-sm text-muted-foreground">No dev data available.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dev wallet</p>
              {devQ.data.devWallet ? (
                <a
                  href={`https://solscan.io/account/${devQ.data.devWallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-sm tabular-nums text-primary hover:underline"
                >
                  {truncateWallet(devQ.data.devWallet)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="font-mono text-sm">Unknown</p>
              )}
            </div>
            {[
              {
                label: "Dev holding",
                value:
                  devQ.data.devHoldingPct != null ? `${devQ.data.devHoldingPct.toFixed(2)}%` : "—",
              },
              {
                label: "Dev sold",
                value: devQ.data.devSoldPct != null ? `${devQ.data.devSoldPct.toFixed(2)}%` : "—",
              },
              {
                label: "Tokens launched",
                value: String(devQ.data.summary.tokensLaunched),
              },
              {
                label: "Rug pulls",
                value: String(devQ.data.summary.rugHistoryCount),
              },
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

          <div className="flex flex-wrap gap-2">
            {devQ.data.summary.devStillHolding === true ? (
              <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Dev still holding
              </Badge>
            ) : devQ.data.summary.devFullySold ? (
              <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400">
                Dev fully sold
              </Badge>
            ) : null}
            {devQ.data.summary.rugHistoryCount > 0 ? (
              <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400">
                {devQ.data.summary.rugHistoryCount} rug pull
                {devQ.data.summary.rugHistoryCount !== 1 ? "s" : ""} on record
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                No rug pulls on record
              </Badge>
            )}
            {devQ.data.summary.migratedCount != null ? (
              <Badge variant="secondary">
                {devQ.data.summary.migratedCount} migrated
              </Badge>
            ) : null}
            {devQ.data.summary.goldenGemCount != null && devQ.data.summary.goldenGemCount > 0 ? (
              <Badge variant="secondary">
                {devQ.data.summary.goldenGemCount} golden gem
                {devQ.data.summary.goldenGemCount !== 1 ? "s" : ""}
              </Badge>
            ) : null}
            <Badge variant="secondary">Source: {devQ.data.source}</Badge>
          </div>

          {devQ.data.similarTokens.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Same creator tokens
              </p>
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead className="text-right">Market cap</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devQ.data.similarTokens.slice(0, 8).map((token) => (
                      <TableRow key={token.mint}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {token.imageUri ? (
                              <img src={token.imageUri} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : null}
                            <div>
                              <p className="font-medium">{token.symbol}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">
                                {truncateWallet(token.mint)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCompactUsd(token.marketCapUsd)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {token.complete ? "Graduated" : token.status ?? "Active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No other tokens from this creator found.</p>
          )}
        </div>
      )}
    </section>
  );
}
