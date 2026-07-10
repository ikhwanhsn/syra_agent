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
  formatMmUsd,
  MM_STRATEGY_LABELS,
  type MmMarketSnapshot,
  type MmQuoteBook,
  type MmRun,
} from "@/lib/mmApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface MmQuoteBookProps {
  quoteBook: MmQuoteBook | null | undefined;
  market: MmMarketSnapshot | null | undefined;
  restingRuns: MmRun[];
  inventoryDriftPct: number;
  loading?: boolean;
  className?: string;
}

function volBadge(regime: string | undefined) {
  if (regime === "high") return <Badge className="bg-red-500/15 text-red-400">High vol</Badge>;
  if (regime === "low") return <Badge className="bg-emerald-500/15 text-emerald-400">Low vol</Badge>;
  return <Badge variant="secondary">Normal</Badge>;
}

export function MmQuoteBookPanel({
  quoteBook,
  market,
  restingRuns,
  inventoryDriftPct,
  loading,
  className,
}: MmQuoteBookProps) {
  const orders = quoteBook?.orders ?? [];
  const bids = orders.filter((o) => o.side === "buy").sort((a, b) => b.priceUsd - a.priceUsd);
  const asks = orders.filter((o) => o.side === "sell").sort((a, b) => a.priceUsd - b.priceUsd);

  return (
    <section className={cn("space-y-4", className)}>
      <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Quote book</h2>
            <p className="text-xs text-muted-foreground">
              Reservation-price grid · Jupiter probe mid
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {volBadge(market?.volRegime ?? quoteBook?.volRegime)}
            {market?.midPriceUsd ? (
              <Badge variant="outline">Mid {formatMmUsd(market.midPriceUsd)}</Badge>
            ) : null}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading quotes…</p>
        ) : !quoteBook ? (
          <p className="text-sm text-muted-foreground">No quote cycle yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-400/90">
                Bids (buy SYRA)
              </p>
              {bids.length === 0 ? (
                <p className="text-xs text-muted-foreground">No resting bids</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((o, i) => (
                      <TableRow key={`bid-${i}`}>
                        <TableCell className="text-xs">{o.level}</TableCell>
                        <TableCell className="font-mono text-xs">{formatMmUsd(o.priceUsd)}</TableCell>
                        <TableCell className="text-xs">{formatMmUsd(o.notionalUsd)}</TableCell>
                        <TableCell className="text-[10px]">{MM_STRATEGY_LABELS[o.strategyId]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-red-400/90">
                Asks (sell SYRA)
              </p>
              {asks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No resting asks</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asks.map((o, i) => (
                      <TableRow key={`ask-${i}`}>
                        <TableCell className="text-xs">{o.level}</TableCell>
                        <TableCell className="font-mono text-xs">{formatMmUsd(o.priceUsd)}</TableCell>
                        <TableCell className="text-xs">{formatMmUsd(o.notionalUsd)}</TableCell>
                        <TableCell className="text-[10px]">{MM_STRATEGY_LABELS[o.strategyId]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border/50 bg-background/35 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Inventory drift from neutral</span>
            <span
              className={cn(
                "font-medium",
                inventoryDriftPct > 80 ? "text-red-400" : inventoryDriftPct > 50 ? "text-amber-400" : "text-emerald-400",
              )}
            >
              {inventoryDriftPct.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                inventoryDriftPct > 80 ? "bg-red-500/70" : inventoryDriftPct > 50 ? "bg-amber-500/70" : "bg-violet-500/70",
              )}
              style={{ width: `${Math.min(100, inventoryDriftPct)}%` }}
            />
          </div>
        </div>
      </article>

      {restingRuns.length > 0 ? (
        <article className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
          <h3 className="mb-3 text-sm font-semibold">Active resting orders</h3>
          <p className="text-xs text-muted-foreground">{restingRuns.length} orders awaiting fill</p>
        </article>
      ) : null}
    </section>
  );
}
