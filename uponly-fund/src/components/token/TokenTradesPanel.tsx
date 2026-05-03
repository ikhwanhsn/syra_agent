import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 15;

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
  buy: "border-success/40 bg-success/[0.08] text-success",
  sell: "border-destructive/40 bg-destructive/[0.08] text-destructive",
  borrow: "border-amber-400/40 bg-amber-400/[0.08] text-amber-300",
  repay: "border-sky-400/40 bg-sky-400/[0.08] text-sky-300",
  create: "border-violet-400/40 bg-violet-400/[0.08] text-violet-300",
  other: "border-border/40 bg-muted/30 text-muted-foreground",
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

export function TokenTradesPanel({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const dict = DASHBOARD_COPY[language];
  const t = dict.tokenDetail;
  const [page, setPage] = useState(1);

  const address = market?.marketAddress || market?.mint || null;
  const tx = useRiseTransactions(address, page, PAGE_SIZE);
  const decimals = market?.tokenDecimals ?? null;

  const rawRows = useMemo(() => tx.data?.transactions ?? [], [tx.data?.transactions]);

  const rows = useMemo<DerivedTrade[]>(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    return rawRows.map((row): DerivedTrade => {
      const side = classifyTradeSide(row.kind);

      // Token amount: prefer raw base units + market decimals so we get a real
      // value instead of relying on upstream having sent a decoded `amount`.
      const decodedAmount = decodeTokenAmount(row.amountTokensRaw, decimals);
      const amountTokens =
        decodedAmount !== null
          ? decodedAmount
          : typeof row.amountTokens === "number" && Number.isFinite(row.amountTokens)
            ? row.amountTokens
            : null;

      const amountUsd =
        typeof row.amountUsd === "number" && Number.isFinite(row.amountUsd)
          ? row.amountUsd
          : null;

      const priceUsd =
        typeof row.priceUsd === "number" && Number.isFinite(row.priceUsd)
          ? row.priceUsd
          : deriveTradePriceUsd(amountUsd, amountTokens);

      const wallet = row.wallet ?? null;
      const walletDisplay = wallet
        ? shortenMint(wallet, 4, 4)
        : row.walletShort ?? t.tradesAggregated;
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
  const totalPages = useMemo(() => {
    const d = tx.data;
    if (!d) return 1;
    if (d.totalPages != null && Number.isFinite(d.totalPages)) return Math.max(1, d.totalPages);
    if (typeof d.total === "number" && d.total > 0) return Math.max(1, Math.ceil(d.total / PAGE_SIZE));
    return 1;
  }, [tx.data]);

  useEffect(() => {
    setPage(1);
  }, [address]);

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
    <GlassCard padded={false} className={className}>
      <div className="border-b border-border/40 px-4 py-4 sm:px-6">
        <SectionHeader eyebrow={t.sectionTrades} title={t.tradesTitle} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.tradesBuySell}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-emerald-500/85 transition-[width]"
                style={{ width: `${buyPct !== null ? Math.min(100, Math.max(4, buyPct)) : 50}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[0.7rem] tabular-nums text-foreground">
              {buyPct !== null ? `${buyPct.toFixed(0)}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.tradesUniqueWallets}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums">{agg.uniqueWallets}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.tradesAvg}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums">
              {formatUsd(agg.avgTradeUsd, { compact: true })}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/30 p-3">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.tradesLargest}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums">
              {formatUsd(agg.largestTradeUsd, { compact: true })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {tx.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={t.chartNoData} />
        ) : (
          <>
            {hasPartial ? (
              <p className="mb-3 rounded-md border border-border/45 bg-background/35 px-2.5 py-1.5 text-[0.65rem] text-muted-foreground">
                {t.tradesPartial}
              </p>
            ) : null}
            <div className="overflow-hidden rounded-xl border border-border/40">
              <Table className="text-xs tabular-nums">
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40">
                    <TableHead className="h-9 px-2 text-[0.65rem] uppercase tracking-wider">{t.tradesSide}</TableHead>
                    <TableHead className="h-9 px-2 text-[0.65rem] uppercase tracking-wider">{t.tradesWallet}</TableHead>
                    <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">
                      {t.tradesPrice}
                    </TableHead>
                    <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">
                      {t.tradesAmount}
                    </TableHead>
                    <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">
                      {t.tradesUsd}
                    </TableHead>
                    <TableHead className="h-9 px-2 text-right text-[0.65rem] uppercase tracking-wider">
                      {t.tradesWhen}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.txSig ?? i}-${i}`} className="border-border/25">
                      <TableCell className="px-2 py-2">
                        <span
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide",
                            SIDE_STYLES[r.side],
                          )}
                        >
                          {sideLabel(r.side, r.raw.kind, t)}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2 font-mono text-[0.65rem] text-muted-foreground">
                        {r.walletUrl ? (
                          <a
                            href={r.walletUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                            title={r.raw.wallet ?? undefined}
                          >
                            {r.walletDisplay}
                          </a>
                        ) : (
                          <span title={r.raw.wallet ?? undefined}>{r.walletDisplay}</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">{formatPriceSmart(r.priceUsd)}</TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        {r.amountTokens !== null ? formatInt(r.amountTokens) : "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        {formatUsd(r.amountUsd, { compact: true })}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        {r.txUrl ? (
                          <a
                            href={r.txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[0.65rem] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            title={r.ts ? new Date(r.ts * 1000).toLocaleString() : undefined}
                          >
                            {r.whenLabel}
                            <ExternalLink className="h-2.5 w-2.5" />
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
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[0.65rem] text-muted-foreground">
                {t.chartUpdated}: {tx.data?.updatedAt ? new Date(tx.data.updatedAt).toLocaleString() : "—"}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {dict.terminal.prev}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {dict.terminal.next}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
