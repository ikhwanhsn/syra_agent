import { Bookmark, RefreshCw, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useWatchlist } from "@/lib/useWatchlist";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  shortenMint,
} from "@/components/rise/RiseShared";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";

function StatMini({
  label,
  value,
  hint,
  gradientClass,
}: {
  label: string;
  value: string;
  hint: string;
  gradientClass: string;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br p-[1.125rem] shadow-[0_1px_0_0_hsl(0_0%_100%/0.05)_inset,0_18px_44px_-22px_hsl(0_0%_0%/0.45)] transition-[transform,box-shadow] duration-300",
        "from-card/90 via-card/45 to-card/25 hover:-translate-y-px hover:border-border/65",
        gradientClass,
      )}
    >
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
        {value}
      </p>
      <p className="mt-1.5 text-[0.76rem] leading-snug text-muted-foreground sm:text-xs">{hint}</p>
    </div>
  );
}

export default function WatchlistPage() {
  const { items, remove, clear } = useWatchlist();
  const markets = useRiseMarketsAll();
  const byMint = new Map((markets.data ?? []).map((row) => [row.mint, row]));
  const rows = items.map((mint) => byMint.get(mint)).filter((row): row is RiseMarketRow => row != null);
  const orphanMints = items.filter((mint) => !byMint.has(mint));

  const livePill =
    !markets.isPending && !markets.isError && (markets.data?.length ?? 0) > 0 ? (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1 text-[0.65rem] font-medium text-emerald-300/95">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/55 opacity-35" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Feed live · {formatInt(markets.data?.length ?? 0)} markets
      </span>
    ) : null;

  const totalPinned = items.length;
  const resolved = rows.length;

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow="Focus list"
          title="Watchlist"
          description="A curated lane for markets you star across Screener, Floor scanner, and Compare—hydrated from the live feed so prices and floors stay current."
          right={
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
              {items.length > 0 ? (
                <Button variant="outline" size="sm" onClick={clear} className="h-9 rounded-lg border-border/55">
                  Clear all
                </Button>
              ) : null}
              {livePill}
            </div>
          }
        />

        {!markets.isError && !markets.isPending && items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatMini
              label="Pinned"
              value={formatInt(totalPinned)}
              hint="Saved mints in this browser."
              gradientClass="from-amber-500/18 to-orange-900/10"
            />
            <StatMini
              label="Resolved"
              value={formatInt(resolved)}
              hint="Matched to the current market universe."
              gradientClass="from-emerald-500/22 to-teal-900/10"
            />
            <StatMini
              label="Awaiting feed"
              value={orphanMints.length === 0 ? "None" : formatInt(orphanMints.length)}
              hint={
                orphanMints.length === 0
                  ? "Every pin synced with the loaded feed."
                  : "Mint not present in this snapshot—may appear after refresh."
              }
              gradientClass="from-violet-500/20 to-fuchsia-900/10"
            />
          </div>
        ) : null}

        <GlassCard
          padded={false}
          className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
        >
          <div className="border-b border-border/45 bg-gradient-to-b from-card/50 to-transparent px-4 py-4 sm:px-6 sm:py-5">
            <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Bookmark className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
              Saved markets
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Rows hydrate when your starred mints appear in the aggregate feed. Remove anytime—changes persist locally.
            </p>
          </div>

          <div className="px-4 pb-4 pt-3 sm:px-6">
            {orphanMints.length > 0 && !markets.isPending ? (
              <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5 text-[0.78rem] text-amber-100/95 sm:text-xs">
                <span className="font-medium text-foreground">Some pins are not in this feed snapshot.</span>{" "}
                {orphanMints.slice(0, 3).map((m) => (
                  <code key={m} className="mr-1 rounded bg-background/30 px-1 py-0.5 font-mono text-[0.65rem]">
                    {shortenMint(m, 4, 4)}
                  </code>
                ))}
                {orphanMints.length > 3 ? <span className="text-muted-foreground">+{orphanMints.length - 3} more</span> : null}
              </div>
            ) : null}

            {markets.isError ? (
              <div className="py-6 sm:py-8">
                <EmptyState
                  icon={Star}
                  title="Could not load watchlist data"
                  description={(markets.error as Error)?.message || "Try refreshing the market feed."}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => markets.refetch()}>
                      Retry
                    </Button>
                  }
                />
              </div>
            ) : markets.isPending ? (
              <div className="flex flex-col gap-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border/35 bg-background/20 px-3 py-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-8 w-20 sm:block" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 && items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/55 bg-muted/[0.06] py-12 sm:py-14">
                <EmptyState
                  icon={Star}
                  title="Your watchlist is empty"
                  description="Star tokens from the Screener, Floor scanner, or Compare—they sync here automatically."
                />
              </div>
            ) : rows.length === 0 && items.length > 0 ? (
              <div className="rounded-xl border border-dashed border-border/55 bg-muted/[0.06] py-12 sm:py-14">
                <EmptyState
                  icon={Star}
                  title="No markets resolved yet"
                  description="Your pins don’t appear in the current feed snapshot. Refresh after listings update, or remove stale mints."
                  action={
                    <Button size="sm" variant="secondary" onClick={() => markets.refetch()}>
                      Refresh feed
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table className="text-[0.8125rem] tabular-nums">
                    <TableHeader>
                      <TableRow className="border-border/40 bg-muted/[0.12] hover:bg-transparent">
                        <TableHead className="h-11 min-w-[12rem] px-4 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Asset
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Price
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          24h Δ
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          MCap
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Floor Δ
                        </TableHead>
                        <TableHead className="h-11 px-3 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          24h vol
                        </TableHead>
                        <TableHead className="h-11 px-4 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.mint}
                          className="group border-border/30 transition-colors hover:bg-muted/[0.35]"
                        >
                          <TableCell className="border-l-2 border-l-transparent px-4 py-3 transition-colors group-hover:border-l-uof/50">
                            <div className="flex min-w-0 items-center gap-3">
                              <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="sm" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-foreground">${row.symbol || "—"}</span>
                                  <VerifiedBadge verified={row.isVerified} />
                                </div>
                                <p className="truncate text-[0.7rem] text-muted-foreground">{row.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right font-medium text-foreground">
                            {formatPriceSmart(row.priceUsd)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <ChangePill pct={row.priceChange24hPct} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-foreground">
                            {formatUsd(row.marketCapUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <ChangePill pct={row.floorDeltaPct} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right text-foreground">
                            {formatUsd(row.volume24hUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <RiseTradeButton mint={row.mint} />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg px-2 text-xs"
                                onClick={() => remove(row.mint)}
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile */}
                <ul className="flex flex-col gap-3 md:hidden">
                  {rows.map((row) => (
                    <li key={row.mint}>
                      <div className="overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-b from-card/50 to-card/[0.15] p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                                ${row.symbol || "—"}
                              </p>
                              <VerifiedBadge verified={row.isVerified} />
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{row.name}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <ChangePill pct={row.priceChange24hPct} />
                              <RiseTradeButton mint={row.mint} />
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => remove(row.mint)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/35 pt-4 text-[0.68rem] sm:grid-cols-4">
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Price
                            </dt>
                            <dd className="mt-1 font-semibold tabular-nums text-foreground">{formatPriceSmart(row.priceUsd)}</dd>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              MCap
                            </dt>
                            <dd className="mt-1 font-semibold tabular-nums text-foreground">
                              {formatUsd(row.marketCapUsd, { compact: true })}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              Floor Δ
                            </dt>
                            <dd className="mt-1">
                              <ChangePill pct={row.floorDeltaPct} />
                            </dd>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/[0.25] px-2.5 py-2">
                            <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                              24h vol
                            </dt>
                            <dd className="mt-1 font-semibold tabular-nums text-foreground">
                              {formatUsd(row.volume24hUsd, { compact: true })}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {rows.length > 0 ? (
            <div className="flex items-center justify-between border-t border-border/45 bg-muted/[0.12] px-4 py-3 text-[0.7rem] text-muted-foreground sm:px-6 sm:text-xs">
              <p className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
                <span>
                  Showing <strong className="font-medium text-foreground">{formatInt(rows.length)}</strong> resolved
                  {items.length !== rows.length ? (
                    <span className="text-muted-foreground/85">
                      {" "}
                      · {formatInt(items.length)} pinned total
                    </span>
                  ) : null}
                </span>
              </p>
              {markets.isFetching ? (
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Refreshing…
                </span>
              ) : (
                <span className="text-muted-foreground/85">Up to date</span>
              )}
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
