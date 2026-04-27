/**
 * Borrow simulator — POSTs to /uponly-rise-market/:addr/borrow-quote.
 * Read-only: shows the wallet's max borrow capacity, required deposit, and
 * borrow fee for a given borrow amount. No on-chain action.
 */
import { useEffect, useMemo, useState } from "react";
import { Banknote, ExternalLink, Loader2, ShieldAlert } from "lucide-react";
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
import { useRiseBorrowQuote, useRiseDashboard } from "@/lib/RiseDashboardContext";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import {
  EmptyState,
  GlassCard,
  RISE_UPONLY_MINT,
  SectionHeader,
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

  return (
    <section aria-labelledby="rise-borrow-heading">
      <SectionHeader
        eyebrow="Tools"
        title="Borrow simulator"
        description="See how much a wallet can borrow against floor-eligible RISE collateral, the deposit needed, and the borrow fee."
      />

      <GlassCard padded={false}>
        <div className="grid gap-3 border-b border-border/40 px-4 py-4 sm:grid-cols-3 sm:px-5">
          <div className="min-w-0 sm:col-span-2">
            <Label htmlFor="borrow-wallet" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Wallet
            </Label>
            <Input
              id="borrow-wallet"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Solana wallet address"
              spellCheck={false}
              className="h-10 font-mono text-xs sm:text-sm"
              aria-invalid={wallet.length > 0 && !validWallet}
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="borrow-market" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Market
            </Label>
            <Select value={mint} onValueChange={setMint}>
              <SelectTrigger id="borrow-market" className="h-10">
                <SelectValue placeholder="Pick a floor-eligible market" />
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
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <Label htmlFor="borrow-amount" className="mb-1.5 block text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            Amount to borrow (raw RISE collateral units)
          </Label>
          <Input
            id="borrow-amount"
            value={borrowStr}
            onChange={(e) => setBorrowStr(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="h-10 max-w-sm font-mono text-sm tabular-nums"
          />
          <p className="mt-1.5 inline-flex flex-wrap items-center gap-1.5 text-[0.65rem] text-muted-foreground sm:text-xs">
            <ShieldAlert className="h-3 w-3 opacity-70" aria-hidden />
            Pass <code className="font-mono">0</code> to read max-borrowable without quoting a specific amount.
          </p>
        </div>

        <div className="border-t border-border/40 px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Result</h3>
            {borrow.isFetching ? (
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching quote…
              </span>
            ) : null}
          </div>

          {!validWallet || !selected ? (
            <EmptyState
              icon={Banknote}
              title="Enter a wallet and market"
              description="Borrow capacity comes from the wallet's floor-deposited tokens against the chosen RISE market."
            />
          ) : borrow.isError ? (
            <EmptyState
              icon={Banknote}
              title="Borrow quote failed"
              description={(borrow.error as Error)?.message ?? "RISE rejected the borrow quote."}
              action={<Button size="sm" variant="secondary" onClick={() => borrow.refetch()}>Retry</Button>}
            />
          ) : !q ? (
            <EmptyState icon={Banknote} title="No quote yet" description="Awaiting RISE response — try again in a moment." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <StatTile label="Wallet balance" value={formatUsd(q.walletBalance, { compact: true })} />
              <StatTile label="Deposited tokens" value={q.depositedTokens != null ? q.depositedTokens.toString() : "—"} />
              <StatTile label="Existing debt" value={formatUsd(q.debt, { compact: true })} />
              <StatTile label="Floor price" value={formatPriceSmart(q.floorPrice)} />
              <StatTile label="Max borrowable" value={formatUsd(q.maxBorrowableUsd, { compact: false })} sub={q.maxBorrowable != null ? `${q.maxBorrowable} raw` : undefined} accent />
              <StatTile label="If you deposit all" value={formatUsd(q.maxBorrowableIfDepositAllUsd, { compact: false })} />
              <StatTile label="Required deposit" value={q.requiredDeposit != null ? `${q.requiredDeposit}` : "—"} />
              <StatTile label="Gross borrow" value={formatUsd(q.grossBorrow, { compact: true })} />
              <StatTile label="Borrow fee" value={formatPct(q.borrowFeePercent)} />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-border/30 pt-3 text-[0.7rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <p>
              Floor mechanics &amp; borrow loops are documented by RISE; numbers above come from the same quote API the
              app uses.
            </p>
            {tradeUrl ? (
              <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 self-end border border-border/55 bg-background/30">
                <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" /> Open in RISE
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
