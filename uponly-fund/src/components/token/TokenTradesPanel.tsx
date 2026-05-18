import { useMemo } from "react";
import { Activity, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  GlassCard,
  SectionHeader,
  formatPriceSmart,
  shortenMint,
} from "@/components/rise/RiseShared";
import { buildSolscanAccountUrl, buildSolscanTxUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow, RiseTransactionRow } from "@/lib/riseDashboardTypes";
import { useRiseTransactions } from "@/lib/RiseDashboardContext";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import {
  classifyTradeSide,
  computeTradeAggregates,
  decodeTokenAmount,
  deriveTradePriceUsd,
  type NormalizedTradeSide,
} from "@/lib/marketIntel";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY, type DashboardDictionary } from "@/lib/dashboardI18n";

/** Single fetch — scroll inside the panel instead of paging (balances load vs 100 rows). */
const RECENT_TRADES_LIMIT = 50;

type DerivedTrade = {
  raw: RiseTransactionRow;
  side: NormalizedTradeSide;
  walletDisplay: string;
  walletUrl: string | null;
  priceUsd: number | null;
  amountTokens: number | null;
  amountUsd: number | null;
  whenLabel: string;
  ts: number | null;
  txUrl: string | null;
  txSig: string | null;
  isAggregated: boolean;
};

const SIDE_STYLES: Record<NormalizedTradeSide, string> = {
  buy: "border-emerald-500/35 bg-emerald-500/12 text-emerald-400",
  sell: "border-red-500/35 bg-red-500/12 text-red-400",
  borrow: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  repay: "border-sky-400/35 bg-sky-400/10 text-sky-300",
  create: "border-violet-400/35 bg-violet-400/10 text-violet-300",
  other: "border-border/40 bg-muted/25 text-muted-foreground",
};

function sideLabel(
  side: NormalizedTradeSide,
  rawKind: string | null,
  t: DashboardDictionary["tokenDetail"],
): string {
  switch (side) {
    case "buy":
      return t.tradesSideBuy;
    case "sell":
      return t.tradesSideSell;
    case "borrow":
      return t.tradesSideBorrow;
    case "repay":
      return t.tradesSideRepay;
    case "create":
      return t.tradesSideCreate;
    default:
      return (rawKind ?? "").toUpperCase() || "—";
  }
}

function relativeWhen(
  ts: number | null,
  nowSec: number,
  t: DashboardDictionary["tokenDetail"],
): string {
  if (ts === null || !Number.isFinite(ts)) return "—";
  const diff = nowSec - ts;
  if (diff < 5) return t.tradesJustNow;
  if (diff < 60) return `${Math.round(diff)}s ${t.tradesAgoUnit}`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ${t.tradesAgoUnit}`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ${t.tradesAgoUnit}`;
  if (diff < 86400 * 30) return `${Math.round(diff / 86400)}d ${t.tradesAgoUnit}`;
  return new Date(ts * 1000).toLocaleDateString();
}

function FlowStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-[4.5rem] flex-col gap-0.5 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground",
          accent && "text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function TokenTradesPanel({
  market,
  className,
  embedded = false,
  fillHeight = false,
}: {
  market: RiseMarketRow | null;
  className?: string;
  embedded?: boolean;
  fillHeight?: boolean;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;

  const address = market?.marketAddress || market?.mint || null;
  const tx = useRiseTransactions(address, 1, RECENT_TRADES_LIMIT);
  const decimals = market?.tokenDecimals ?? null;

  const rawRows = useMemo(() => tx.data?.transactions ?? [], [tx.data?.transactions]);

  const rows = useMemo<DerivedTrade[]>(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    return rawRows.map((row): DerivedTrade => {
      const side = classifyTradeSide(row.kind);
      const decodedAmount = decodeTokenAmount(row.amountTokensRaw, decimals);
      const amountTokens =
        decodedAmount !== null
          ? decodedAmount
          : typeof row.amountTokens === "number" && Number.isFinite(row.amountTokens)
            ? row.amountTokens
            : null;

      const amountUsd =
        typeof row.amountUsd === "number" && Number.isFinite(row.amountUsd) ? row.amountUsd : null;

      const priceUsd =
        typeof row.priceUsd === "number" && Number.isFinite(row.priceUsd)
          ? row.priceUsd
          : deriveTradePriceUsd(amountUsd, amountTokens);

      const wallet = row.wallet ?? null;
      const walletDisplay = wallet
        ? shortenMint(wallet, 4, 4)
        : (row.walletShort ?? t.tradesAggregated);
      const walletUrl = wallet ? buildSolscanAccountUrl(wallet) : null;
      const ts = typeof row.ts === "number" && Number.isFinite(row.ts) ? row.ts : null;

      return {
        raw: row,
        side,
        walletDisplay,
        walletUrl,
        priceUsd,
        amountTokens,
        amountUsd,
        whenLabel: relativeWhen(ts, nowSec, t),
        ts,
        txUrl: buildSolscanTxUrl(row.txSig),
        txSig: row.txSig,
        isAggregated: !wallet,
      };
    });
  }, [rawRows, decimals, t]);

  const agg = useMemo(() => computeTradeAggregates(rawRows), [rawRows]);

  if (!market) return null;

  const buyPct = agg.buySellRatio !== null ? agg.buySellRatio * 100 : null;
  const hasPartial = rows.some(
    (row) =>
      row.priceUsd === null ||
      row.amountTokens === null ||
      row.amountUsd === null ||
      row.ts === null,
  );

  return (
    <GlassCard
      padded={false}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        fillHeight ? "h-full" : "max-h-[28rem]",
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0 border-b border-border/40 px-4 py-3 sm:px-5",
          !embedded && "sm:py-4",
        )}
      >
        {embedded ? (
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/45 bg-background/40">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {t.tradesTitle}
              </h3>
              <p className="text-[0.65rem] text-muted-foreground">{t.sectionTrades}</p>
            </div>
          </div>
        ) : (
          <SectionHeader eyebrow={t.sectionTrades} title={t.tradesTitle} />
        )}

        <div className="flex flex-wrap gap-2">
          <div className="flex min-w-[5.5rem] flex-col gap-1 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {t.tradesBuySell}
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500/90 to-emerald-400/50 transition-[width] duration-500"
                style={{ width: `${buyPct !== null ? Math.min(100, Math.max(4, buyPct)) : 50}%` }}
              />
            </div>
          </div>
          <FlowStat label={t.tradesUniqueWallets} value={String(agg.uniqueWallets)} />
          <FlowStat label={t.tradesAvg} value={formatUsd(agg.avgTradeUsd, { compact: true })} />
          <FlowStat label={t.tradesLargest} value={formatUsd(agg.largestTradeUsd, { compact: true })} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3 pt-2 sm:px-5 sm:pb-4">
        {tx.isPending ? (
          <div className="flex flex-1 flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full shrink-0 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <EmptyState title={t.chartNoData} />
          </div>
        ) : (
          <>
            {hasPartial ? (
              <p className="mb-2 shrink-0 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 text-[0.65rem] text-muted-foreground">
                {t.tradesPartial}
              </p>
            ) : null}

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/45 bg-background/20",
                "[scrollbar-gutter:stable] [scrollbar-width:thin]",
                fillHeight ? "basis-0" : "max-h-[min(18rem,42vh)] sm:max-h-[20rem]",
              )}
            >
                <Table className="text-xs tabular-nums">
                  <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="h-9 px-3 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.tradesSide}
                      </TableHead>
                      <TableHead className="h-9 px-3 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.tradesWallet}
                      </TableHead>
                      <TableHead className="h-9 px-3 text-right text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.tradesPrice}
                      </TableHead>
                      <TableHead className="hidden h-9 px-3 text-right text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                        {t.tradesAmount}
                      </TableHead>
                      <TableHead className="h-9 px-3 text-right text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.tradesUsd}
                      </TableHead>
                      <TableHead className="h-9 px-3 text-right text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.tradesWhen}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow
                        key={`${r.txSig ?? i}-${i}`}
                        className="border-border/20 transition-colors hover:bg-muted/15"
                      >
                        <TableCell className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide",
                              SIDE_STYLES[r.side],
                            )}
                          >
                            {sideLabel(r.side, r.raw.kind, t)}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2.5 font-mono text-[0.65rem] text-muted-foreground">
                          {r.walletUrl ? (
                            <a
                              href={r.walletUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-foreground hover:underline"
                              title={r.raw.wallet ?? undefined}
                            >
                              {r.walletDisplay}
                            </a>
                          ) : (
                            <span title={r.raw.wallet ?? undefined}>{r.walletDisplay}</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right font-medium text-foreground">
                          {formatPriceSmart(r.priceUsd)}
                        </TableCell>
                        <TableCell className="hidden px-3 py-2.5 text-right text-muted-foreground sm:table-cell">
                          {r.amountTokens !== null ? formatInt(r.amountTokens) : "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right font-medium">
                          {formatUsd(r.amountUsd, { compact: true })}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right">
                          {r.txUrl ? (
                            <a
                              href={r.txUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                              title={r.ts ? new Date(r.ts * 1000).toLocaleString() : undefined}
                            >
                              {r.whenLabel}
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </a>
                          ) : (
                            <span
                              className="text-[0.65rem] text-muted-foreground"
                              title={r.ts ? new Date(r.ts * 1000).toLocaleString() : undefined}
                            >
                              {r.whenLabel}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>

            <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/35 pt-3 text-[0.62rem] text-muted-foreground">
              <span>{t.tradesLatestFootnote}</span>
              <span className="font-mono tabular-nums">
                {tx.data?.updatedAt ? new Date(tx.data.updatedAt).toLocaleString() : "—"}
              </span>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
