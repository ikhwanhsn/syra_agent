/**
 * Quote calculator — POSTs to /uponly-rise-market/:addr/quote.
 *
 * Read-only: no signing, no transactions. Useful to size a hypothetical buy or
 * sell against the bonding curve and visualize the price impact before opening
 * rise.rich for the actual swap.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Calculator, Loader2, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRiseDashboard, useRiseQuote } from "@/lib/RiseDashboardContext";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RISE_UPONLY_MINT,
  SectionHeader,
  StatTile,
  TokenAvatar,
  formatPriceSmart,
} from "./RiseShared";

type Direction = "buy" | "sell";

function buildMarketChoices(uponly: RiseMarketRow | null, others: RiseMarketRow[]): RiseMarketRow[] {
  const seen = new Set<string>();
  const out: RiseMarketRow[] = [];
  if (uponly) {
    seen.add(uponly.mint);
    out.push(uponly);
  }
  for (const m of others) {
    if (!m.mint || seen.has(m.mint)) continue;
    seen.add(m.mint);
    out.push(m);
    if (out.length >= 30) break;
  }
  return out;
}

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function QuoteCalculator() {
  const { aggregate, uponly } = useRiseDashboard();
  const data = aggregate.data;

  const choices = useMemo(() => {
    if (!data) return uponly ? [uponly] : [];
    return buildMarketChoices(uponly, [...data.topVolume24h, ...data.largestByMcap]);
  }, [data, uponly]);

  const [mint, setMint] = useState<string>(uponly?.mint || RISE_UPONLY_MINT);
  const selected = useMemo(() => choices.find((m) => m.mint === mint) ?? choices[0] ?? null, [choices, mint]);

  useEffect(() => {
    if (!mint && choices[0]) setMint(choices[0].mint);
  }, [choices, mint]);

  const [direction, setDirection] = useState<Direction>("buy");
  const [amountStr, setAmountStr] = useState<string>("0.1");

  const amount = useMemo(() => {
    const n = Number(amountStr.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amountStr]);

  const debouncedAmount = useDebounced(amount, 400);

  const quote = useRiseQuote({ address: selected?.mint ?? null, amount: debouncedAmount, direction });
  const q = quote.data?.quote;

  const tradeUrl = selected ? buildRiseTradeUrl(selected.mint) : null;

  return (
    <section aria-labelledby="rise-quote-heading">
      <SectionHeader
        eyebrow="Tools"
        title="Quote calculator"
        description="Simulate a buy or sell against any RISE bonding curve. Inputs are read-only — nothing is signed."
      />

      <GlassCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-end sm:gap-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <Label htmlFor="quote-market" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Market
            </Label>
            <Select value={mint} onValueChange={setMint}>
              <SelectTrigger id="quote-market" className="h-10">
                <SelectValue placeholder="Pick a market" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {choices.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    Loading…
                  </SelectItem>
                ) : (
                  choices.map((m) => (
                    <SelectItem key={m.mint} value={m.mint}>
                      <div className="flex min-w-0 items-center gap-2">
                        <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="xs" />
                        <span className="truncate">${m.symbol || "—"}</span>
                        <span className="truncate text-xs text-muted-foreground">{m.name || ""}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <Button
              type="button"
              variant={direction === "buy" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDirection("buy")}
              className={cn("h-10 gap-1.5", direction !== "buy" && "border border-border/55 bg-background/30")}
            >
              <TrendingUp className="h-3.5 w-3.5" /> Buy
            </Button>
            <Button
              type="button"
              variant={direction === "sell" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDirection("sell")}
              className={cn("h-10 gap-1.5", direction !== "sell" && "border border-border/55 bg-background/30")}
            >
              <TrendingDown className="h-3.5 w-3.5" /> Sell
            </Button>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-4 md:grid-cols-2 sm:px-5">
          <div>
            <Label htmlFor="quote-amount" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              {direction === "buy" ? "Collateral amount (USDC / SOL units)" : "Token amount"}
            </Label>
            <div className="relative">
              <Input
                id="quote-amount"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                inputMode="decimal"
                placeholder={direction === "buy" ? "0.1" : "1000"}
                className="h-10 pr-12 font-mono text-sm tabular-nums"
                aria-invalid={amount === null}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                {direction === "buy" ? "in" : "qty"}
              </span>
            </div>
            <p className="mt-1.5 text-[0.65rem] text-muted-foreground sm:text-xs">
              Amounts are passed as raw numbers to RISE. For exact decimals, prefer the rise.rich UI for the live swap.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">Selected market</p>
            {selected ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2.5 rounded-lg border border-border/40 bg-background/30 p-2.5">
                <TokenAvatar imageUrl={selected.imageUrl} symbol={selected.symbol} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
                    ${selected.symbol || "—"}
                    <ChangePill pct={selected.priceChange24hPct} />
                  </p>
                  <p className="truncate text-[0.7rem] text-muted-foreground">{selected.name}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.priceUsd)}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/40 bg-background/20 p-3 text-xs text-muted-foreground">
                Pick a market to start a quote.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/40 px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Result</h3>
            {quote.isFetching ? (
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching quote…
              </span>
            ) : null}
          </div>

          {!debouncedAmount || !selected ? (
            <EmptyState
              icon={Calculator}
              title="Awaiting input"
              description="Enter a positive amount and pick a market — quote refreshes automatically."
            />
          ) : quote.isError ? (
            <EmptyState
              icon={Calculator}
              title="Quote failed"
              description={(quote.error as Error)?.message ?? "RISE quote API rejected the request."}
              action={<Button size="sm" variant="secondary" onClick={() => quote.refetch()}>Retry</Button>}
            />
          ) : !q ? (
            <EmptyState icon={Calculator} title="No quote yet" description="Try adjusting the amount or refreshing." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatTile label="Amount in" value={formatUsd(q.amountInUsd, { compact: false })} sub={q.amountInHuman != null ? `${q.amountInHuman}` : undefined} />
              <StatTile label="Amount out" value={formatUsd(q.amountOutUsd, { compact: false })} sub={q.amountOutHuman != null ? `${q.amountOutHuman}` : undefined} />
              <StatTile label="Fee" value={formatUsd(q.feeAmountUsd, { compact: false })} sub={q.feeRate != null ? `Rate ${formatPct(q.feeRate * 100)}` : undefined} />
              <StatTile label="Avg fill" value={formatPriceSmart(q.averageFillPrice)} />
              <StatTile label="Current price" value={formatPriceSmart(q.currentPrice)} />
              <StatTile label="New price" value={formatPriceSmart(q.newPrice)} />
              <StatTile
                label="Price impact"
                value={q.priceImpact != null ? `${(q.priceImpact * 100).toFixed(2)}%` : "—"}
                accent={(q.priceImpact ?? 0) > 0.05}
              />
              <StatTile label="Direction" value={(q.direction || direction).toUpperCase()} />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-border/30 pt-3 text-[0.7rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p className="inline-flex items-center gap-1.5">
              <ArrowDownUp className="h-3 w-3 opacity-70" aria-hidden />
              Quotes refresh on input change. We never broadcast — execute on rise.rich.
            </p>
            {tradeUrl ? (
              <Button asChild size="sm" className="h-8 gap-1.5 self-end">
                <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="h-3 w-3" /> Open in RISE
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
