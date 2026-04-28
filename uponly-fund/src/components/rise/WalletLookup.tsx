/**
 * Wallet lookup — drop in any Solana wallet and see its RISE portfolio
 * (summary + positions). URL-syncs `?wallet=…` so the result is shareable.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpRight, Briefcase, Search, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useRisePortfolioPositions,
  useRisePortfolioSummary,
} from "@/lib/RiseDashboardContext";
import { buildRiseTradeUrl, buildSolscanAccountUrl } from "@/lib/riseDashboardApi";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  SectionHeader,
  StatTile,
  TokenAvatar,
  formatPriceSmart,
  shortenMint,
} from "./RiseShared";

const ADDR_MIN = 32;
const ADDR_MAX = 50;

function isValidAddress(addr: string): boolean {
  return addr.length >= ADDR_MIN && addr.length <= ADDR_MAX && /^[a-zA-Z0-9]+$/.test(addr);
}

export function WalletLookup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const walletFromUrl = searchParams.get("wallet") || "";
  const initial = walletFromUrl;
  const [input, setInput] = useState(initial);
  const [submitted, setSubmitted] = useState<string | null>(initial && isValidAddress(initial) ? initial : null);

  useEffect(() => {
    setSubmitted(isValidAddress(walletFromUrl) ? walletFromUrl : null);
    setInput(walletFromUrl);
  }, [walletFromUrl]);

  const summary = useRisePortfolioSummary(submitted);
  const positions = useRisePortfolioPositions(submitted, 1, 50);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!isValidAddress(trimmed)) {
      setSubmitted(null);
      return;
    }
    setSubmitted(trimmed);
    const next = new URLSearchParams(searchParams);
    next.set("wallet", trimmed);
    setSearchParams(next, { replace: true });
  };

  const onClear = () => {
    setInput("");
    setSubmitted(null);
    const next = new URLSearchParams(searchParams);
    next.delete("wallet");
    setSearchParams(next, { replace: true });
  };

  const inputInvalid = input.length > 0 && !isValidAddress(input);
  const sumData = summary.data?.summary;
  const isError = summary.isError || positions.isError;
  const errMsg =
    (summary.error as Error)?.message || (positions.error as Error)?.message || "";

  return (
    <section aria-labelledby="rise-wallet-heading">
      <SectionHeader
        eyebrow="Tools"
        title="Wallet lookup"
        description="Inspect any Solana wallet's RISE portfolio — totals, P&amp;L, and held positions."
      />

      <GlassCard padded={false} className="overflow-visible">
        <form onSubmit={onSubmit} className="flex flex-col gap-2 border-b border-border/40 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="relative min-w-0 flex-1">
            <Wallet className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Solana wallet address (base58, 32–44 chars)…"
              className={cn("h-10 pl-9 pr-9 font-mono text-xs sm:text-sm", inputInvalid && "border-destructive/50")}
              aria-invalid={inputInvalid}
              aria-label="Solana wallet address"
              spellCheck={false}
            />
            {input ? (
              <button
                type="button"
                onClick={onClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear wallet"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button type="submit" disabled={!isValidAddress(input.trim())} className="h-10 gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Look up
          </Button>
        </form>

        <div className="px-4 py-4 sm:px-5">
          {!submitted ? (
            <EmptyState
              icon={Briefcase}
              title="Enter a wallet to inspect"
              description="We'll fetch its summary and positions from the RISE portfolio APIs. Nothing is signed."
            />
          ) : isError ? (
            <EmptyState
              icon={Briefcase}
              title="Lookup failed"
              description={errMsg || "RISE portfolio API did not return a result for this wallet."}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    summary.refetch();
                    positions.refetch();
                  }}
                >
                  Retry
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-muted-foreground sm:text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-3 w-3 opacity-80" aria-hidden />
                  <span className="font-mono">{shortenMint(submitted, 6, 6)}</span>
                  {(() => {
                    const u = buildSolscanAccountUrl(submitted);
                    if (!u) return null;
                    return (
                      <a href={u} target="_blank" rel="noopener noreferrer" className="text-foreground/80 underline-offset-2 hover:underline">
                        Solscan <ArrowUpRight className="inline h-2.5 w-2.5" aria-hidden />
                      </a>
                    );
                  })()}
                </span>
                <span>{summary.isFetching || positions.isFetching ? "Refreshing…" : "Up to date"}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {summary.isPending ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[5.25rem] rounded-xl" />)
                ) : sumData ? (
                  <>
                    <StatTile label="Total value" value={formatUsd(sumData.totalValueUsd, { compact: false })} />
                    <StatTile
                      label="Total P&L"
                      value={formatUsd(sumData.totalPnlUsd, { compact: false })}
                      sub={
                        sumData.totalValueUsd > 0
                          ? `${((sumData.totalPnlUsd / sumData.totalValueUsd) * 100).toFixed(1)}%`
                          : undefined
                      }
                    />
                    <StatTile label="Tokens held" value={formatInt(sumData.tokensHeld)} />
                    <StatTile label="Created" value={formatInt(sumData.tokensCreatedCount)} />
                    <StatTile label="Tx count" value={formatInt(sumData.totalTransactions)} />
                  </>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-lg border border-border/40">
                <div className="overflow-x-auto">
                <Table className="min-w-[44rem] text-xs tabular-nums">
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/40">
                      <TableHead className="h-9 px-3 text-[0.65rem] uppercase tracking-wider">Token</TableHead>
                      <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">Balance</TableHead>
                      <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">USD value</TableHead>
                      <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">Avg entry</TableHead>
                      <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">P&L</TableHead>
                      <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">Trade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.isPending ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={`sk-${i}`} className="border-border/30">
                          <TableCell colSpan={6} className="px-3 py-3">
                            <Skeleton className="h-7 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (positions.data?.positions.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                          No RISE positions found for this wallet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      positions.data?.positions.map((p) => {
                        const url = buildRiseTradeUrl(p.mint);
                        return (
                          <TableRow key={p.mint} className="border-border/25">
                            <TableCell className="px-3 py-2">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <TokenAvatar imageUrl={p.imageUrl} symbol={p.symbol ?? "—"} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-foreground">${p.symbol || "—"}</p>
                                  <p className="truncate text-[0.65rem] text-muted-foreground">{p.name || shortenMint(p.mint)}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right text-foreground">{formatInt(p.balance)}</TableCell>
                            <TableCell className="px-2 py-2 text-right font-medium text-foreground">{formatUsd(p.balanceUsd, { compact: true })}</TableCell>
                            <TableCell className="px-2 py-2 text-right text-muted-foreground">{formatPriceSmart(p.avgEntryUsd)}</TableCell>
                            <TableCell className="px-2 py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <span className={cn("tabular-nums", typeof p.pnlUsd === "number" && p.pnlUsd > 0 && "text-success", typeof p.pnlUsd === "number" && p.pnlUsd < 0 && "text-destructive")}>
                                  {formatUsd(p.pnlUsd, { compact: true })}
                                </span>
                                <ChangePill pct={p.pnlPct ?? null} />
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2 text-right">
                              {url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[0.7rem] text-foreground/85 underline-offset-2 hover:underline">
                                  Open <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                                </a>
                              ) : (
                                <span className="text-[0.65rem] text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </section>
  );
}

export { isValidAddress as isValidWalletAddress };
