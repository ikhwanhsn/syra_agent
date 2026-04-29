/**
 * Right-side drawer that opens when the user picks a market from the rails or
 * the screener. Shows: header (logo, name, price, change), KPI grid, OHLC
 * chart with selectable timeframe, recent trades table, social/external links.
 *
 * Data is fetched on demand (the queries are gated by `enabled = open && address`)
 * to keep the global cache small.
 */
import { useId, useMemo, useState } from "react";
import { ArrowUpRight, ExternalLink, MessageCircle, Twitter } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRiseOhlc, useRiseTransactions } from "@/lib/RiseDashboardContext";
import {
  buildRiseTradeUrl,
  buildSolscanAccountUrl,
  buildSolscanTokenUrl,
  buildSolscanTxUrl,
} from "@/lib/riseDashboardApi";
import type { RiseMarketRow, RiseTimeframe } from "@/lib/riseDashboardTypes";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  LevelChip,
  StatTile,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  formatRelativeAge,
  shortenMint,
} from "./RiseShared";

const TIMEFRAMES: RiseTimeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value?: number; payload?: { time?: number } }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0]?.value;
  const t = payload[0]?.payload?.time;
  return (
    <div className="rounded-md border border-border/60 bg-card/95 px-2 py-1.5 text-[0.7rem] shadow-md backdrop-blur-sm">
      <p className="font-medium text-foreground">{formatPriceSmart(typeof v === "number" ? v : null)}</p>
      {t ? (
        <p className="text-[0.65rem] text-muted-foreground">
          {new Date(t).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}

function PriceChart({ address, tf }: { address: string; tf: RiseTimeframe }) {
  const gradientId = useId();
  const ohlc = useRiseOhlc(address, tf, 168);
  const data = useMemo(() => {
    const c = ohlc.data?.candles ?? [];
    return c
      .map((row, idx) => {
        const rawTime = typeof row.time === "number" && Number.isFinite(row.time) ? row.time : null;
        const closeCandidate =
          typeof row.close === "number" && Number.isFinite(row.close)
            ? row.close
            : typeof row.open === "number" && Number.isFinite(row.open)
              ? row.open
              : typeof row.high === "number" && Number.isFinite(row.high)
                ? row.high
                : typeof row.low === "number" && Number.isFinite(row.low)
                  ? row.low
                  : null;
        if (closeCandidate === null) return null;
        const tsMs =
          rawTime === null
            ? idx * 3_600_000
            : rawTime > 1_000_000_000_000
              ? rawTime
              : rawTime * 1000;
        return { time: tsMs, value: closeCandidate };
      })
      .filter((r): r is { time: number; value: number } => r !== null)
      .sort((a, b) => a.time - b.time);
  }, [ohlc.data]);

  if (ohlc.isPending) return <Skeleton className="h-44 w-full rounded-lg" />;
  if (ohlc.isError || data.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border/40 bg-background/30 text-xs text-muted-foreground">
        No chart data for {tf}
      </div>
    );
  }
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis dataKey="value" hide domain={["auto", "auto"]} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--success))"
            strokeWidth={1.6}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TransactionsList({ address }: { address: string }) {
  const tx = useRiseTransactions(address, 1, 10);
  if (tx.isPending) {
    return (
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full rounded-md" />
        ))}
      </div>
    );
  }
  const rows = tx.data?.transactions ?? [];
  if (rows.length === 0) {
    return <EmptyState title="No recent trades" description="Trades will appear here as soon as the market becomes active." />;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border/40">
      <Table className="text-xs tabular-nums">
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border/40">
            <TableHead className="h-8 px-2 text-[0.65rem] uppercase tracking-wider">Side</TableHead>
            <TableHead className="h-8 px-2 text-[0.65rem] uppercase tracking-wider">Wallet</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">Price</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">Amount</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">USD</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => {
            const side = (r.kind || "—").toLowerCase();
            const isBuy = side.includes("buy");
            const isSell = side.includes("sell");
            const sigUrl = buildSolscanTxUrl(r.txSig);
            return (
              <TableRow key={`${r.txSig ?? i}-${i}`} className="border-border/25">
                <TableCell className="px-2 py-1.5">
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide",
                      isBuy && "border-success/40 bg-success/[0.08] text-success",
                      isSell && "border-destructive/40 bg-destructive/[0.08] text-destructive",
                      !isBuy && !isSell && "border-border/40 bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {side}
                  </span>
                </TableCell>
                <TableCell className="px-2 py-1.5 font-mono text-[0.65rem] text-muted-foreground">
                  {r.walletShort || "—"}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right text-foreground/90">{formatPriceSmart(r.priceUsd)}</TableCell>
                <TableCell className="px-2 py-1.5 text-right text-foreground/90">{formatInt(r.amountTokens)}</TableCell>
                <TableCell className="px-2 py-1.5 text-right text-foreground">{formatUsd(r.amountUsd, { compact: true })}</TableCell>
                <TableCell className="px-2 py-1.5 text-right">
                  {sigUrl ? (
                    <a
                      href={sigUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {r.ts ? new Date(r.ts * 1000).toLocaleTimeString() : "—"}
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-[0.65rem] text-muted-foreground">{r.ts ? new Date(r.ts * 1000).toLocaleTimeString() : "—"}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function MarketDetailDrawer({
  market,
  open,
  onOpenChange,
}: {
  market: RiseMarketRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [tf, setTf] = useState<RiseTimeframe>("1h");

  const tradeUrl = market ? buildRiseTradeUrl(market.mint) : null;
  const tokenUrl = market ? buildSolscanTokenUrl(market.mint) : null;
  const creatorUrl = market ? buildSolscanAccountUrl(market.creator) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="z-[10020] flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {market ? (
          <>
            <header className="flex flex-col gap-3 border-b border-border/40 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="lg" />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-balance text-lg leading-tight">
                    <span>{market.name || "Untitled market"}</span>
                    <span className="font-mono text-sm text-muted-foreground">${market.symbol || "—"}</span>
                    <VerifiedBadge verified={market.isVerified} />
                    <LevelChip level={market.level} />
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 break-all font-mono text-[0.65rem]">
                    {shortenMint(market.mint, 6, 6)}
                  </SheetDescription>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xl font-bold tabular-nums text-foreground">{formatPriceSmart(market.priceUsd)}</span>
                    <ChangePill pct={market.priceChange24hPct} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tradeUrl ? (
                  <Button asChild size="sm" className="h-8 gap-1.5">
                    <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                      Trade on RISE
                      <ArrowUpRight className="h-3 w-3 opacity-80" aria-hidden />
                    </a>
                  </Button>
                ) : null}
                {tokenUrl ? (
                  <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 border border-border/55 bg-background/30">
                    <a href={tokenUrl} target="_blank" rel="noopener noreferrer">
                      Solscan
                      <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
                    </a>
                  </Button>
                ) : null}
                {market.twitterUrl ? (
                  <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 border border-border/55 bg-background/30">
                    <a href={market.twitterUrl} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-3 w-3" aria-hidden /> X
                    </a>
                  </Button>
                ) : null}
                {market.telegramUrl ? (
                  <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 border border-border/55 bg-background/30">
                    <a href={market.telegramUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3 w-3" aria-hidden /> Telegram
                    </a>
                  </Button>
                ) : null}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <StatTile label="Market cap" value={formatUsd(market.marketCapUsd, { compact: true })} />
                <StatTile label="Floor mcap" value={formatUsd(market.floorMarketCapUsd, { compact: true })} />
                <StatTile label="24h vol" value={formatUsd(market.volume24hUsd, { compact: true })} />
                <StatTile label="Floor price" value={formatPriceSmart(market.floorPriceUsd)} sub={market.floorDeltaPct != null ? `Δ ${formatPct(market.floorDeltaPct)}` : undefined} />
                <StatTile label="Holders" value={formatInt(market.holders)} />
                <StatTile label="Locked" value={market.lockedSupplyPct != null ? `${market.lockedSupplyPct.toFixed(0)}%` : "—"} />
                <StatTile label="Creator fee" value={market.creatorFeePct != null ? `${market.creatorFeePct}%` : "—"} />
                <StatTile label="All-time vol" value={formatUsd(market.volumeAllTimeUsd, { compact: true })} />
                <StatTile label="Age" value={formatRelativeAge(market.ageHours)} />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Price chart</h3>
                  <div className="flex flex-wrap gap-1">
                    {TIMEFRAMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTf(t)}
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 font-mono text-[0.65rem] tabular-nums transition-colors",
                          tf === t
                            ? "border-foreground/60 bg-foreground/[0.08] text-foreground"
                            : "border-border/45 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                        aria-pressed={tf === t}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <PriceChart address={market.mint} tf={tf} />
              </div>

              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Recent trades</h3>
                <TransactionsList address={market.mint} />
              </div>

              <div className="mt-5 rounded-lg border border-border/40 bg-background/30 p-3 text-[0.7rem] leading-relaxed text-muted-foreground sm:text-xs">
                <p>
                  <strong className="font-medium text-foreground/85">Creator</strong> ·{" "}
                  {creatorUrl ? (
                    <a href={creatorUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                      {shortenMint(market.creator, 4, 4)} <ExternalLink className="inline h-2.5 w-2.5" aria-hidden />
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                  {" · "}
                  <strong className="font-medium text-foreground/85">Mint</strong>{" "}
                  <span className="font-mono">{shortenMint(market.mint, 4, 4)}</span>
                </p>
                <p className="mt-1">
                  Read-only data via the Syra → RISE proxy. Trade actions deep-link to rise.rich; nothing is signed in
                  this dashboard.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
