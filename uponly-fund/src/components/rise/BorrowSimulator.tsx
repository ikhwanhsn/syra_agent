/**
 * Borrow simulator — POSTs to /uponly-rise-market/:addr/borrow-quote.
 * Read-only: shows the wallet's max borrow capacity, required deposit, and
 * borrow fee for a given borrow amount. No on-chain action.
 */
import { useEffect, useMemo, useState } from "react";
import { Banknote, ExternalLink, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiseBorrowQuote, useRiseDashboard } from "@/lib/RiseDashboardContext";
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

const ADDR_MIN = 32;
const ADDR_MAX = 50;

function isValidWallet(addr: string): boolean {
  return addr.length >= ADDR_MIN && addr.length <= ADDR_MAX && /^[a-zA-Z0-9]+$/.test(addr);
}

function buildMarketChoices(uponly: RiseMarketRow | null, others: RiseMarketRow[]): RiseMarketRow[] {
  const seen = new Set<string>();
  const out: RiseMarketRow[] = [];
  if (uponly) {
    seen.add(uponly.mint);
    out.push(uponly);
  }
  const floorOnly = others.filter((m) => (m.floorPriceUsd ?? 0) > 0);
  for (const m of floorOnly) {
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

export function BorrowSimulator() {
  const { aggregate, uponly } = useRiseDashboard();
  const data = aggregate.data;

  const choices = useMemo(() => {
    if (!data) return uponly ? [uponly] : [];
    return buildMarketChoices(uponly, [...data.largestByMcap, ...data.topVolume24h]);
  }, [data, uponly]);

  const [mint, setMint] = useState<string>(uponly?.mint || RISE_UPONLY_MINT);
  const selected = useMemo(() => choices.find((m) => m.mint === mint) ?? choices[0] ?? null, [choices, mint]);

  useEffect(() => {
    if (!mint && choices[0]) setMint(choices[0].mint);
  }, [choices, mint]);

  const [wallet, setWallet] = useState("");
  const [borrowStr, setBorrowStr] = useState<string>("0");

  const borrowAmount = useMemo(() => {
    const n = Number(borrowStr.replace(/,/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [borrowStr]);

  const debouncedBorrow = useDebounced(borrowAmount, 400);
  const validWallet = wallet.trim().length > 0 && isValidWallet(wallet.trim());

  const borrow = useRiseBorrowQuote({
    address: validWallet ? selected?.mint ?? null : null,
    wallet: validWallet ? wallet.trim() : null,
    amountToBorrow: debouncedBorrow,
  });
  const q = borrow.data?.quote;
  const tradeUrl = selected ? buildRiseTradeUrl(selected.mint) : null;

  const aggregatePending = aggregate.isPending;
  const quoteEnabled =
    Boolean(selected?.mint) &&
    validWallet &&
    typeof debouncedBorrow === "number" &&
    Number.isFinite(debouncedBorrow) &&
    debouncedBorrow >= 0;

  return (
    <section aria-labelledby="rise-borrow-heading">
      <h2 id="rise-borrow-heading" className="sr-only">
        Floor-backed borrow simulator
      </h2>

      <GlassCard
        padded={false}
        className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
      >
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-5 sm:px-6">
          <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
            Floor-backed borrow
          </p>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Paste a Solana wallet and pick a floor-eligible market. Quotes mirror RISE borrow math—use{" "}
            <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[0.7rem]">0</code> borrow to read capacity without sizing a draw.
          </p>
        </div>

        <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:items-start lg:gap-8 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5">
            <div>
              <Label
                htmlFor="borrow-wallet"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Wallet
              </Label>
              <Input
                id="borrow-wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Solana address (base58)"
                spellCheck={false}
                className={cn(
                  "h-12 rounded-xl border-border/55 bg-background/40 font-mono text-sm shadow-inner sm:text-sm",
                  wallet.length > 0 && !validWallet && "border-destructive/45",
                )}
                aria-invalid={wallet.length > 0 && !validWallet}
              />
              {wallet.length > 0 && !validWallet ? (
                <p className="mt-2 text-[0.72rem] text-destructive/90">Enter a valid base58 wallet ({ADDR_MIN}–{ADDR_MAX} chars).</p>
              ) : null}
            </div>

            <div>
              <Label
                htmlFor="borrow-amount"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Amount to borrow (raw units)
              </Label>
              <Input
                id="borrow-amount"
                value={borrowStr}
                onChange={(e) => setBorrowStr(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className={cn(
                  "h-12 max-w-md rounded-xl border-border/55 bg-background/40 font-mono text-base tabular-nums shadow-inner",
                  borrowAmount === null && borrowStr.trim() !== "" && "border-destructive/45",
                )}
                aria-invalid={borrowAmount === null && borrowStr.trim() !== ""}
              />
              <div className="mt-3 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-[0.72rem] leading-relaxed text-amber-100/95 sm:text-xs">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                <span>
                  Use <code className="font-mono text-[0.7rem]">0</code> to fetch max borrowable and deposits without specifying a draw size.
                  Numbers follow RISE raw collateral semantics—confirm decimals on{" "}
                  <span className="font-medium text-foreground/90">rise.rich</span> before execution.
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor="borrow-market"
                className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Floor-eligible market
              </Label>
              <Select value={mint || undefined} onValueChange={setMint} disabled={choices.length === 0}>
                <SelectTrigger id="borrow-market" className="h-11 rounded-xl border-border/55 bg-background/40 shadow-inner">
                  <SelectValue placeholder={aggregatePending ? "Loading markets…" : "Select a market"} />
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
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Market snapshot</p>
            {selected ? (
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 via-card/35 to-card/20 p-4 shadow-inner">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,hsl(215_80%_50%/0.12),transparent_68%)]"
                  aria-hidden
                />
                <div className="relative flex items-start gap-3">
                  <TokenAvatar imageUrl={selected.imageUrl} symbol={selected.symbol} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold tracking-tight text-foreground">${selected.symbol || "—"}</p>
                      <ChangePill pct={selected.priceChange24hPct} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{selected.name}</p>
                    <dl className="mt-4 space-y-2 text-[0.72rem] sm:text-xs">
                      <div className="flex justify-between gap-2 border-b border-border/30 pb-2">
                        <dt className="text-muted-foreground">Spot</dt>
                        <dd className="font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.priceUsd)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Floor</dt>
                        <dd className="font-semibold tabular-nums text-foreground">{formatPriceSmart(selected.floorPriceUsd)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/50 bg-muted/[0.08] p-6 text-center text-sm text-muted-foreground">
                Pick a market with floor data.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/45 bg-muted/[0.08] px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Output</p>
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">Borrow quote</h3>
            </div>
            {borrow.isFetching && quoteEnabled ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/40 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-uof" aria-hidden />
                Fetching…
              </span>
            ) : null}
          </div>

          {!validWallet || !selected ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.15] py-10 sm:py-12">
              <EmptyState
                icon={Banknote}
                title="Wallet & market required"
                description="Enter a valid Solana address and choose a floor-backed market to pull borrow capacity from RISE."
              />
            </div>
          ) : borrowAmount === null ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
              <EmptyState
                icon={Banknote}
                title="Invalid borrow amount"
                description="Use a non‑negative number (or 0 for capacity-only). Check for stray characters."
              />
            </div>
          ) : borrow.isError ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] py-8">
              <EmptyState
                icon={Banknote}
                title="Borrow quote failed"
                description={(borrow.error as Error)?.message ?? "RISE rejected the borrow quote."}
                action={
                  <Button size="sm" variant="secondary" onClick={() => borrow.refetch()}>
                    Retry
                  </Button>
                }
              />
            </div>
          ) : borrow.isFetching && !q ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
              ))}
            </div>
          ) : !q ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-background/[0.15] py-10">
              <EmptyState icon={Banknote} title="No quote yet" description="Awaiting RISE — adjust inputs or retry." />
            </div>
          ) : (
            <div className="relative">
              {borrow.isFetching ? (
                <div className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-background/40 backdrop-blur-[2px]" aria-hidden />
              ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile label="Wallet balance" value={formatUsd(q.walletBalance, { compact: true })} />
                <StatTile label="Deposited tokens" value={q.depositedTokens != null ? q.depositedTokens.toString() : "—"} />
                <StatTile label="Existing debt" value={formatUsd(q.debt, { compact: true })} />
                <StatTile label="Floor price" value={formatPriceSmart(q.floorPrice)} />
                <StatTile
                  label="Max borrowable"
                  value={formatUsd(q.maxBorrowableUsd, { compact: false })}
                  sub={q.maxBorrowable != null ? `${q.maxBorrowable} raw` : undefined}
                  accent
                />
                <StatTile label="If you deposit all" value={formatUsd(q.maxBorrowableIfDepositAllUsd, { compact: false })} />
                <StatTile label="Required deposit" value={q.requiredDeposit != null ? `${q.requiredDeposit}` : "—"} />
                <StatTile label="Gross borrow" value={formatUsd(q.grossBorrow, { compact: true })} />
                <StatTile label="Borrow fee" value={formatPct(q.borrowFeePercent)} />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-border/35 pt-5 text-[0.72rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p className="inline-flex max-w-xl items-start gap-2">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span>
                Figures come from the borrow quote API RISE exposes—always verify live protocol limits and docs before moving size.
              </span>
            </p>
            {tradeUrl ? (
              <Button asChild size="sm" variant="secondary" className="h-10 shrink-0 gap-2 rounded-xl border-border/55 px-4">
                <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open in RISE
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
