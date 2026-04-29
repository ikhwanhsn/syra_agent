/**
 * Quote calculator — POSTs to /uponly-rise-market/:addr/quote.
 *
 * Read-only: no signing, no transactions. Useful to size a hypothetical buy or
 * sell against the bonding curve and visualize the price impact before opening
 * rise.rich for the actual swap.
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  Calculator,
  Loader2,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
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

  const aggregatePending = aggregate.isPending;

  return (
    <section aria-labelledby="rise-quote-heading">
      <h2 id="rise-quote-heading" className="sr-only">
        Bonding curve quote calculator
      </h2>

      <GlassCard
        padded={false}
        className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
      >
        {/* Toolbar */}
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-5 sm:px-6">
          <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
            Curve simulation
          </p>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Inputs hit the read-only quote API—nothing is signed. Debounced refresh mirrors how you’d iterate before sending a trade on{" "}
            <span className="font-medium text-foreground/85">rise.rich</span>.
          </p>
        </div>

        <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:items-start lg:gap-8 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5">
            <div>
              <Label
                htmlFor="quote-market"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Market
              </Label>
              <Select value={mint || undefined} onValueChange={setMint} disabled={choices.length === 0}>
                <SelectTrigger
                  id="quote-market"
                  className="h-11 rounded-xl border-border/55 bg-background/40 shadow-inner"
                >
                  <SelectValue placeholder={aggregatePending ? "Loading markets…" : "Pick a market"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {choices.length === 0 ? (
                    <SelectItem value="__loading__" disabled>
                      Loading…
                    </SelectItem>
                  ) : (
                    choices.map((m) => (
                      <SelectItem key={m.mint} value={m.mint}>
                        <div className="flex min-w-0 items-center gap-2">
                          <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="xs" />
                          <span className="truncate font-medium">${m.symbol || "—"}</span>
                          <span className="truncate text-xs text-muted-foreground">{m.name || ""}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Side
              </span>
              <ToggleGroup
                type="single"
                value={direction}
                onValueChange={(v) => {
                  if (v === "buy" || v === "sell") setDirection(v);
                }}
                className="inline-flex w-full max-w-md rounded-xl border border-border/55 bg-muted/25 p-1 shadow-inner sm:w-auto"
                aria-label="Trade direction"
              >
                <ToggleGroupItem
                  value="buy"
                  className="flex-1 gap-1.5 rounded-lg py-2.5 text-xs font-semibold data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm sm:flex-none sm:px-6"
                >
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  Buy
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="sell"
                  className="flex-1 gap-1.5 rounded-lg py-2.5 text-xs font-semibold data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm sm:flex-none sm:px-6"
                >
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  Sell
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label
                htmlFor="quote-amount"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {direction === "buy" ? "Collateral size" : "Token quantity"}
              </Label>
              <div className="relative">
                <Input
                  id="quote-amount"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  inputMode="decimal"
                  placeholder={direction === "buy" ? "0.1" : "1000"}
                  className={cn(
                    "h-12 rounded-xl border-border/55 bg-background/40 pr-14 font-mono text-base tabular-nums shadow-inner",
                    amount === null && amountStr.length > 0 && "border-destructive/50",
                  )}
                  aria-invalid={amount === null && amountStr.length > 0}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-muted/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {direction === "buy" ? "in" : "qty"}
                </span>
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-muted-foreground sm:text-xs">
                Values are passed numerically to RISE. For production precision and decimals, execute on{" "}
                <span className="font-medium text-foreground/80">rise.rich</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Spot snapshot</p>
            {selected ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 via-card/35 to-card/20 p-4 shadow-inner">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,hsl(var(--uof)_/_0.12),transparent_65%)]" aria-hidden />
                <div className="relative flex items-start gap-3">
                  <TokenAvatar imageUrl={selected.imageUrl} symbol={selected.symbol} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold tracking-tight text-foreground">${selected.symbol || "—"}</p>
                      <ChangePill pct={selected.priceChange24hPct} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{selected.name}</p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Last price</p>
                    <p className="font-display text-xl font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.priceUsd)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/50 bg-muted/[0.08] p-6 text-center text-sm text-muted-foreground">
                Select a market to anchor the quote.
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-border/45 bg-muted/[0.08] px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Output</p>
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">Quote breakdown</h3>
            </div>
            {quote.isFetching && debouncedAmount && selected ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/40 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-uof" aria-hidden />
                Updating…
              </span>
            ) : null}
          </div>

          {!debouncedAmount || !selected ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.15] py-10 sm:py-12">
              <EmptyState
                icon={Calculator}
                title="Awaiting input"
                description="Choose a market and enter a positive amount—the curve quote streams in automatically."
              />
            </div>
          ) : quote.isError ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
              <EmptyState
                icon={Calculator}
                title="Quote failed"
                description={(quote.error as Error)?.message ?? "RISE quote API rejected the request."}
                action={
                  <Button size="sm" variant="secondary" onClick={() => quote.refetch()}>
                    Retry
                  </Button>
                }
              />
            </div>
          ) : quote.isFetching && !q ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
              ))}
            </div>
          ) : !q ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.15] py-10">
              <EmptyState icon={Calculator} title="No quote yet" description="Try adjusting the amount or direction." />
            </div>
          ) : (
            <div className="relative">
              {quote.isFetching ? (
                <div className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-background/40 backdrop-blur-[2px]" aria-hidden />
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Amount in" value={formatUsd(q.amountInUsd, { compact: false })} sub={q.amountInHuman != null ? `${q.amountInHuman}` : undefined} />
                <StatTile label="Amount out" value={formatUsd(q.amountOutUsd, { compact: false })} sub={q.amountOutHuman != null ? `${q.amountOutHuman}` : undefined} />
                <StatTile
                  label="Fee"
                  value={formatUsd(q.feeAmountUsd, { compact: false })}
                  sub={q.feeRate != null ? `Rate ${formatPct(q.feeRate * 100)}` : undefined}
                />
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
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border/35 pt-5 text-[0.72rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p className="inline-flex max-w-xl items-start gap-2">
              <ArrowDownUp className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span>
                Quotes track your inputs with a short debounce. Nothing is broadcast from this page—open RISE when you are ready to execute.
              </span>
            </p>
            {tradeUrl ? (
              <Button asChild size="sm" className="h-10 shrink-0 gap-2 rounded-xl px-4">
                <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                  Trade on RISE
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
