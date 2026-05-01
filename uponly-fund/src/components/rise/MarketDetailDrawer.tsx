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
import { useLanguage } from "@/lib/LanguageContext";

type ChartTimeframe = RiseTimeframe | "all";

const TIMEFRAMES: ChartTimeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d", "all"];

const TF_LIMITS: Record<RiseTimeframe, number> = {
  "1m": 240,
  "5m": 288,
  "15m": 288,
  "1h": 336,
  "4h": 336,
  "1d": 365,
};

function normalizeOhlc(
  candles: { time: number | null; open: number | null; high: number | null; low: number | null; close: number | null }[],
) {
  return candles
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
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value?: number; payload?: { time?: number } }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0]?.value;
  const t = payload[0]?.payload?.time;
  const hasValidTimestamp = typeof t === "number" && Number.isFinite(t) && t >= Date.UTC(2000, 0, 1);
  return (
    <div className="rounded-md border border-border/60 bg-card/95 px-2 py-1.5 text-[0.7rem] shadow-md backdrop-blur-sm">
      <p className="font-medium text-foreground">{formatPriceSmart(typeof v === "number" ? v : null)}</p>
      {hasValidTimestamp ? (
        <p className="text-[0.65rem] text-muted-foreground">
          {new Date(t as number).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}

function PriceChart({ address, tf }: { address: string | null; tf: ChartTimeframe }) {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const gradientId = useId();
  const resolvedTimeframe: RiseTimeframe = tf === "all" ? "1d" : tf;
  const limit = tf === "all" ? 2000 : TF_LIMITS[resolvedTimeframe];
  const ohlc = useRiseOhlc(address, resolvedTimeframe, limit);
  const data = useMemo(() => normalizeOhlc(ohlc.data?.candles ?? []), [ohlc.data]);

  if (ohlc.isPending) {
    return <Skeleton className="h-44 w-full rounded-lg" />;
  }
  if (ohlc.isError || data.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border/40 bg-background/30 text-xs text-muted-foreground">
        {isZh ? "图表数据不可用：" : "No chart data for "} {tf === "all" ? (isZh ? "全周期" : "all time") : tf}
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
      <div className="mt-1 flex items-center justify-between gap-2 text-[0.65rem] text-muted-foreground">
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          {isZh ? "来源" : "Source"} {tf === "all" ? (isZh ? "全周期（1d K线）" : "all-time (1d candles)") : tf}
        </p>
        {ohlc.data?.updatedAt ? <p>{isZh ? "更新时间" : "Updated"} {new Date(ohlc.data.updatedAt).toLocaleTimeString()}</p> : null}
      </div>
    </div>
  );
}

function TransactionsList({ address }: { address: string | null }) {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const tx = useRiseTransactions(address, 1, 10);
  const feedUpdatedAt = tx.data?.updatedAt ? new Date(tx.data.updatedAt) : null;
  const rawRows = tx.data?.transactions ?? [];
  const rows = useMemo(() => {
    let prevPrice: number | null = null;
    return rawRows
      .map((row, idx) => {
        const price = typeof row.priceUsd === "number" && Number.isFinite(row.priceUsd) ? row.priceUsd : null;
        const amountTokens =
          typeof row.amountTokens === "number" && Number.isFinite(row.amountTokens)
            ? row.amountTokens
            : price && typeof row.amountUsd === "number" && Number.isFinite(row.amountUsd)
              ? row.amountUsd / price
              : null;
        const amountUsd =
          typeof row.amountUsd === "number" && Number.isFinite(row.amountUsd)
            ? row.amountUsd
            : price && amountTokens != null
              ? amountTokens * price
              : null;
        const whenTs =
          typeof row.ts === "number" && Number.isFinite(row.ts)
            ? row.ts > 1_000_000_000_000
              ? Math.floor(row.ts / 1000)
              : row.ts
            : null;
        const hasBuySignal =
          typeof row.kind === "string" &&
          /(buy|long|bid|in)/i.test(row.kind);
        const hasSellSignal =
          typeof row.kind === "string" &&
          /(sell|short|ask|out)/i.test(row.kind);
        const inferredFromPrice =
          price != null && prevPrice != null
            ? price > prevPrice
              ? "buy"
              : price < prevPrice
                ? "sell"
                : "flat"
            : null;
        const sideLabel = row.kind
          ? row.kind.toLowerCase()
          : inferredFromPrice || (amountTokens != null && amountTokens > 0 ? "trade" : "flat");
        const fallbackWallet =
          row.walletShort ||
          (row.txSig ? `tx:${row.txSig.slice(0, 6)}` : "aggregated");
        const fallbackTs =
          whenTs ??
          (feedUpdatedAt
            ? Math.floor((feedUpdatedAt.getTime() - idx * 30_000) / 1000)
            : null);
        if (price != null) prevPrice = price;
        return {
          ...row,
          kind: sideLabel,
          walletShort: fallbackWallet,
          amountTokens,
          amountUsd,
          ts: fallbackTs,
          _isBuy: hasBuySignal,
          _isSell: hasSellSignal,
          _isApproxTime: whenTs == null && fallbackTs != null,
        };
      })
      .filter((row) => {
        const hasUsefulDetail =
          row.priceUsd != null ||
          Boolean(row.kind) ||
          Boolean(row.walletShort) ||
          Boolean(row.txSig) ||
          row.amountTokens != null ||
          row.amountUsd != null ||
          row.ts != null;
        return hasUsefulDetail;
      });
  }, [rawRows, feedUpdatedAt]);
  if (tx.isPending) {
    return (
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full rounded-md" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title={isZh ? "暂无近期交易" : "No recent trades"}
        description={isZh ? "市场活跃后，交易会显示在这里。" : "Trades will appear here as soon as the market becomes active."}
      />
    );
  }
  const hasPartialRows = rows.some(
    (row) =>
      !row.kind ||
      !row.walletShort ||
      row.amountTokens == null ||
      row.amountUsd == null ||
      row.ts == null,
  );
  return (
    <div className="space-y-2">
      {hasPartialRows ? (
        <p className="rounded-md border border-border/45 bg-background/35 px-2.5 py-1.5 text-[0.65rem] text-muted-foreground">
          {isZh ? "数据源返回了部分不完整交易字段，缺失项以 — 显示。" : "Source returned partial trade metadata for some rows; missing fields are shown as —."}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-border/40">
      <Table className="text-xs tabular-nums">
        <TableHeader className="bg-muted/30">
          <TableRow className="border-border/40">
            <TableHead className="h-8 px-2 text-[0.65rem] uppercase tracking-wider">{isZh ? "方向" : "Side"}</TableHead>
            <TableHead className="h-8 px-2 text-[0.65rem] uppercase tracking-wider">{isZh ? "钱包" : "Wallet"}</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">{isZh ? "价格" : "Price"}</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">{isZh ? "数量" : "Amount"}</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">USD</TableHead>
            <TableHead className="h-8 px-2 text-right text-[0.65rem] uppercase tracking-wider">{isZh ? "时间" : "When"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => {
            const side = (r.kind || "—").toLowerCase();
            const isBuy = "_isBuy" in r ? Boolean((r as { _isBuy?: boolean })._isBuy) : side.includes("buy");
            const isSell = "_isSell" in r ? Boolean((r as { _isSell?: boolean })._isSell) : side.includes("sell");
            const isFlat = side.includes("flat");
            const sigUrl = buildSolscanTxUrl(r.txSig);
            const whenLabel = r.ts ? new Date(r.ts * 1000).toLocaleTimeString() : "—";
            const isApproxTime =
              "_isApproxTime" in r ? Boolean((r as { _isApproxTime?: boolean })._isApproxTime) : false;
            return (
              <TableRow key={`${r.txSig ?? i}-${i}`} className="border-border/25">
                <TableCell className="px-2 py-1.5">
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide",
                      isBuy && "border-success/40 bg-success/[0.08] text-success",
                      isSell && "border-destructive/40 bg-destructive/[0.08] text-destructive",
                      isFlat && "border-border/40 bg-muted/30 text-muted-foreground",
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
                      {isApproxTime ? `~${whenLabel}` : whenLabel}
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-[0.65rem] text-muted-foreground">{isApproxTime ? `~${whenLabel}` : whenLabel}</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
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
  const { language } = useLanguage();
  const isZh = language === "zh";
  const [tf, setTf] = useState<ChartTimeframe>("1h");

  const tradeUrl = market ? buildRiseTradeUrl(market.mint) : null;
  const tokenUrl = market ? buildSolscanTokenUrl(market.mint) : null;
  const creatorUrl = market ? buildSolscanAccountUrl(market.creator) : null;
  const marketDataAddress = market?.marketAddress || market?.mint || null;

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
                    <span>{market.name || (isZh ? "未命名市场" : "Untitled market")}</span>
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
                      {isZh ? "在 RISE 交易" : "Trade on RISE"}
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
                <StatTile label={isZh ? "市值" : "Market cap"} value={formatUsd(market.marketCapUsd, { compact: true })} />
                <StatTile label={isZh ? "底线市值" : "Floor mcap"} value={formatUsd(market.floorMarketCapUsd, { compact: true })} />
                <StatTile label={isZh ? "24h成交量" : "24h vol"} value={formatUsd(market.volume24hUsd, { compact: true })} />
                <StatTile label={isZh ? "底线价格" : "Floor price"} value={formatPriceSmart(market.floorPriceUsd)} sub={market.floorDeltaPct != null ? `Δ ${formatPct(market.floorDeltaPct)}` : undefined} />
                <StatTile label={isZh ? "持有人" : "Holders"} value={formatInt(market.holders)} />
                <StatTile label={isZh ? "锁仓" : "Locked"} value={market.lockedSupplyPct != null ? `${market.lockedSupplyPct.toFixed(0)}%` : "—"} />
                <StatTile label={isZh ? "创作者费率" : "Creator fee"} value={market.creatorFeePct != null ? `${market.creatorFeePct}%` : "—"} />
                <StatTile label={isZh ? "累计成交量" : "All-time vol"} value={formatUsd(market.volumeAllTimeUsd, { compact: true })} />
                <StatTile label={isZh ? "时长" : "Age"} value={formatRelativeAge(market.ageHours)} />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{isZh ? "价格图表" : "Price chart"}</h3>
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
                        {t === "all" ? (isZh ? "全部" : "ALL") : t}
                      </button>
                    ))}
                  </div>
                </div>
                <PriceChart address={marketDataAddress} tf={tf} />
              </div>

              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-foreground">{isZh ? "近期交易" : "Recent trades"}</h3>
                <TransactionsList address={marketDataAddress} />
              </div>

              <div className="mt-5 rounded-lg border border-border/40 bg-background/30 p-3 text-[0.7rem] leading-relaxed text-muted-foreground sm:text-xs">
                <p>
                  <strong className="font-medium text-foreground/85">{isZh ? "创建者" : "Creator"}</strong> ·{" "}
                  {creatorUrl ? (
                    <a href={creatorUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                      {shortenMint(market.creator, 4, 4)} <ExternalLink className="inline h-2.5 w-2.5" aria-hidden />
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                  {" · "}
                  <strong className="font-medium text-foreground/85">{isZh ? "Mint" : "Mint"}</strong>{" "}
                  <span className="font-mono">{shortenMint(market.mint, 4, 4)}</span>
                </p>
                <p className="mt-1">
                  {isZh
                    ? "数据通过只读 RISE 代理提供。交易按钮会跳转到 rise.rich；本看板不会进行签名。"
                    : "Read-only data via the RISE proxy. Trade actions deep-link to rise.rich; nothing is signed in this dashboard."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
