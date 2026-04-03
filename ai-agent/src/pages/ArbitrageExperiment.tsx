import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  Clock,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Scale,
  ShieldAlert,
  TrendingUp,
  Unplug,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL } from "@/lib/layoutConstants";
import {
  fetchArbitrageSnapshot,
  fetchCmcTop,
  type ArbitrageSnapshotData,
  type ArbitrageVenueOk,
  type ArbitrageVenueRow,
  type CmcTopAsset,
} from "@/lib/arbitrageExperimentApi";

type RankedArbitrage = {
  asset: CmcTopAsset;
  spreadPct: number;
  buyAt: ArbitrageVenueOk;
  sellAt: ArbitrageVenueOk;
  strategyNote: string;
};

/** Same order as API `SIGNAL_CEX_SOURCES` */
const EXCHANGE_COLUMNS = [
  { id: "binance", label: "Binance" },
  { id: "coinbase", label: "Coinbase" },
  { id: "okx", label: "OKX" },
  { id: "bybit", label: "Bybit" },
  { id: "kraken", label: "Kraken" },
  { id: "bitget", label: "Bitget" },
  { id: "kucoin", label: "KuCoin" },
  { id: "upbit", label: "Upbit" },
  { id: "cryptocom", label: "Crypto.com" },
] as const;

const TABLE_COL_COUNT = 2 + EXCHANGE_COLUMNS.length + 1;
const MERGED_PRICE_COLSPAN = EXCHANGE_COLUMNS.length + 1;

type VenueErrorKind = "isp" | "handshake" | "timeout" | "tls" | "network" | "other";

function classifyVenueError(raw: string): { kind: VenueErrorKind; label: string; userHint: string } {
  const lower = raw.toLowerCase();
  if (raw.includes("blocked by ISP") || lower.includes("blockpage") || lower.includes("internetpositif")) {
    return {
      kind: "isp",
      label: "Blocked",
      userHint: "Your network or ISP is blocking this exchange. Try a VPN or switch DNS (e.g. 1.1.1.1).",
    };
  }
  if (lower.includes("handshake has timed out") || lower.includes("unexpected server response")) {
    return {
      kind: "handshake",
      label: "No connect",
      userHint: "The WebSocket handshake did not complete in time. Often caused by firewalls, ISP filtering, or the exchange being unreachable.",
    };
  }
  if (
    lower.includes("websocket timeout") ||
    lower.includes("http request timeout") ||
    lower.includes("request timeout") ||
    lower.includes("opening handshake")
  ) {
    return {
      kind: "timeout",
      label: "Timeout",
      userHint: "No price arrived before the time limit. The venue may be slow, rate-limiting, or blocked on your network.",
    };
  }
  if (
    lower.includes("certificate") ||
    lower.includes("self-signed") ||
    lower.includes("tls") ||
    lower.includes("ssl") ||
    lower.includes("cert_authority_invalid")
  ) {
    return {
      kind: "tls",
      label: "TLS",
      userHint: "A secure connection could not be verified. Common with corporate proxies; your admin may need to trust a root CA.",
    };
  }
  if (
    lower.includes("fetch failed") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("network") ||
    lower.includes("getaddrinfo")
  ) {
    return {
      kind: "network",
      label: "Network",
      userHint: "Could not reach the exchange. Check your connection, firewall, or try again.",
    };
  }
  return {
    kind: "other",
    label: "Unavailable",
    userHint: "This venue did not return a live price. Details below are from the server.",
  };
}

const errorKindStyles: Record<VenueErrorKind, { pill: string; icon: LucideIcon }> = {
  isp: {
    pill: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: ShieldAlert,
  },
  handshake: {
    pill: "border-slate-500/35 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    icon: Unplug,
  },
  timeout: {
    pill: "border-orange-500/35 bg-orange-500/10 text-orange-800 dark:text-orange-300",
    icon: Clock,
  },
  tls: {
    pill: "border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-300",
    icon: LockKeyhole,
  },
  network: {
    pill: "border-sky-500/35 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    icon: WifiOff,
  },
  other: {
    pill: "border-border bg-muted/60 text-muted-foreground",
    icon: AlertCircle,
  },
};

function VenueErrorPill({ rawError }: { rawError: string }) {
  const { kind, label, userHint } = classifyVenueError(rawError);
  const { pill, icon: Icon } = errorKindStyles[kind];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-none transition-colors",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            pill,
          )}
        >
          <Icon className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-left">
        <p className="text-xs font-medium text-foreground">{userHint}</p>
        <p className="mt-1.5 font-mono text-[10px] leading-snug text-muted-foreground break-words border-t border-border pt-1.5">
          {rawError}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function isVenueOk(row: ArbitrageVenueRow): row is ArbitrageVenueOk {
  return row.ok === true;
}

function formatPrice(row: ArbitrageVenueOk): string {
  const p = row.price;
  if (!Number.isFinite(p)) return "—";
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return p.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function venueBySource(snapshot: ArbitrageSnapshotData | undefined, source: string): ArbitrageVenueRow | undefined {
  return snapshot?.venues.find((v) => v.source === source);
}

function VenueCell({ venue }: { venue: ArbitrageVenueRow | undefined }) {
  if (!venue) {
    return (
      <div className="flex justify-center py-0.5" aria-label="Loading price">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/70" aria-hidden />
      </div>
    );
  }
  if (isVenueOk(venue)) {
    const showQuote = venue.quoteUnit !== "USDT" && venue.quoteUnit !== "unknown";
    return (
      <div className="text-right min-w-[4.5rem]">
        <div className="font-mono text-xs tabular-nums leading-tight">{formatPrice(venue)}</div>
        {showQuote ? (
          <div className="text-[10px] text-muted-foreground leading-tight">{venue.quoteUnit}</div>
        ) : null}
      </div>
    );
  }
  const raw = "error" in venue ? venue.error : "Unknown error";
  return (
    <div className="flex justify-center">
      <VenueErrorPill rawError={raw} />
    </div>
  );
}

function RowSnapshotError({ symbol, message }: { symbol: string; message: string }) {
  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 flex items-start gap-2.5 text-left">
      <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground">Couldn&apos;t load {symbol} prices</p>
        <p className="text-xs text-muted-foreground">Refresh or try again in a moment.</p>
        <p className="font-mono text-[10px] text-muted-foreground/90 break-words pt-1 border-t border-border/60 mt-1.5">
          {message}
        </p>
      </div>
    </div>
  );
}

function BestArbitragePanel({
  best,
  runnerUps,
  loading,
}: {
  best: RankedArbitrage | undefined;
  runnerUps: RankedArbitrage[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card/40 p-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
        Loading…
      </section>
    );
  }

  if (!best) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="font-medium text-foreground">Best USDT spread</span> — none yet (need 2+ live USDT venues
            on a row).
          </span>
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/8 via-background to-background p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" aria-hidden />
            Best USDT spread
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Gross only · before fees & transfer</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gross spread</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-primary leading-tight">
            {best.spreadPct.toFixed(4)}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-background/80 border border-border px-2 py-1 font-semibold tabular-nums">
          #{best.asset.cmcRank} {best.asset.symbol}
        </span>
        <span className="text-muted-foreground truncate max-w-[12rem] sm:max-w-none" title={best.asset.name}>
          {best.asset.name}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Buy (cheaper)
          </p>
          <p className="font-medium capitalize">{best.buyAt.source}</p>
          <p className="font-mono text-xs text-muted-foreground">{best.buyAt.instrument}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(best.buyAt)} <span className="text-sm font-normal text-muted-foreground">{best.buyAt.quoteUnit}</span>
          </p>
        </div>

        <div className="hidden lg:flex justify-center text-muted-foreground">
          <ArrowRightLeft className="h-5 w-5" aria-hidden />
        </div>

        <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-rose-600 dark:text-rose-400">
            Sell (richer)
          </p>
          <p className="font-medium capitalize">{best.sellAt.source}</p>
          <p className="font-mono text-xs text-muted-foreground">{best.sellAt.instrument}</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(best.sellAt)} <span className="text-sm font-normal text-muted-foreground">{best.sellAt.quoteUnit}</span>
          </p>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/60 pt-3">{best.strategyNote}</p>

      {runnerUps.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground">Also</p>
          <ul className="flex flex-wrap gap-2">
            {runnerUps.map((r) => (
              <li
                key={r.asset.cexToken}
                className="rounded-md border border-border/80 bg-muted/30 px-2 py-1 text-[11px] tabular-nums"
              >
                <span className="font-medium">{r.asset.symbol}</span>{" "}
                <span className="text-muted-foreground">{r.spreadPct.toFixed(3)}%</span>
                <span className="text-muted-foreground/80">
                  {" "}
                  ({r.buyAt.source} → {r.sellAt.source})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default function ArbitrageExperiment({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();

  const cmcQuery = useQuery({
    queryKey: ["cmc-top", 10],
    queryFn: () => fetchCmcTop({ limit: 10 }),
    staleTime: 5 * 60_000,
  });

  const assets = cmcQuery.data?.assets ?? [];

  const snapshotQueries = useQueries({
    queries: assets.map((a) => ({
      queryKey: ["arbitrage-snapshot", a.cexToken] as const,
      queryFn: () => fetchArbitrageSnapshot({ token: a.cexToken }),
      staleTime: 5_000,
      enabled: assets.length > 0,
    })),
  });

  const isRefreshing = cmcQuery.isFetching || snapshotQueries.some((q) => q.isFetching);

  const anyIspBlocked = useMemo(
    () =>
      snapshotQueries.some((q) =>
        q.data?.venues.some((v) => !v.ok && "error" in v && v.error?.includes("blocked by ISP")),
      ),
    [snapshotQueries],
  );

  const latestFetchedAt = useMemo(() => {
    const times = snapshotQueries.map((q) => q.data?.fetchedAt).filter(Boolean) as string[];
    if (!times.length) return null;
    return times.sort().at(-1) ?? null;
  }, [snapshotQueries]);

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["cmc-top", 10] });
    void queryClient.invalidateQueries({ queryKey: ["arbitrage-snapshot"] });
  };

  const tableLoading = cmcQuery.isLoading || (assets.length > 0 && snapshotQueries.every((q) => q.isLoading));

  const rankedArbitrage = useMemo((): RankedArbitrage[] => {
    const out: RankedArbitrage[] = [];
    assets.forEach((asset, i) => {
      const snap = snapshotQueries[i]?.data;
      if (!snap) return;
      const { grossSpreadPct, buyAt, sellAt, note } = snap.strategy;
      if (grossSpreadPct == null || !buyAt || !sellAt) return;
      if (buyAt.source === sellAt.source) return;
      out.push({
        asset,
        spreadPct: grossSpreadPct,
        buyAt,
        sellAt,
        strategyNote: note,
      });
    });
    out.sort((a, b) => b.spreadPct - a.spreadPct);
    return out;
  }, [assets, snapshotQueries]);

  const bestArb = rankedArbitrage[0];
  const runnerUpArbs = rankedArbitrage.slice(1, 4);

  const bestStrategyPanelLoading =
    cmcQuery.isLoading ||
    (assets.length > 0 && rankedArbitrage.length === 0 && snapshotQueries.some((q) => q.isLoading));

  return (
    <TooltipProvider delayDuration={250}>
    <div
      className={cn(
        "bg-background text-foreground",
        embedded ? "flex flex-col flex-1 min-h-0" : "min-h-screen",
      )}
    >
      {!embedded && (
        <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] shrink-0 sticky top-0 z-20">
          <div className={cn(DASHBOARD_CONTENT_SHELL, "flex items-center justify-between gap-2 sm:gap-4")}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title="Back to chat"
                  aria-label="Back to chat"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                <Scale className="w-5 h-5 text-primary shrink-0" aria-hidden />
                <h1 className="text-sm font-bold text-foreground truncate">Arbitrage experiment</h1>
              </div>
            </div>
            <WalletNav />
          </div>
        </header>
      )}

      <main
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "pt-4 sm:pt-5 lg:pt-6 space-y-5 flex-1 min-h-0",
          "pb-[max(3rem,env(safe-area-inset-bottom,0px))] sm:pb-16 lg:pb-20",
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Scale className="w-5 h-5 text-primary shrink-0" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight">Cross-CEX spot</h2>
              {cmcQuery.data ? (
                <p className="text-[11px] sm:text-xs text-muted-foreground tabular-nums">
                  Top 10 · {cmcQuery.data.source === "coinmarketcap" ? "CMC" : "offline"} ·{" "}
                  {new Date(cmcQuery.data.fetchedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
          <Button type="button" variant="secondary" className="gap-2 shrink-0" disabled={isRefreshing} onClick={handleRefresh}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
            Refresh all
          </Button>
        </div>

        {cmcQuery.isError && (
          <p className="text-sm text-destructive" role="alert">
            {cmcQuery.error instanceof Error ? cmcQuery.error.message : String(cmcQuery.error)}
          </p>
        )}

        <BestArbitragePanel best={bestArb} runnerUps={runnerUpArbs} loading={bestStrategyPanelLoading} />

        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-card min-w-[3rem]">#</TableHead>
                <TableHead className="sticky left-10 z-10 bg-card min-w-[7rem]">Asset</TableHead>
                {EXCHANGE_COLUMNS.map((ex) => (
                  <TableHead key={ex.id} className="text-right whitespace-nowrap min-w-[5.5rem]">
                    {ex.label}
                  </TableHead>
                ))}
                <TableHead className="text-right whitespace-nowrap min-w-[5rem]">USDT Δ%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableLoading ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COL_COUNT} className="text-center text-muted-foreground py-12">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Loading prices…
                    </span>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COL_COUNT} className="text-center text-muted-foreground py-8">
                    No assets in list.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset, i) => {
                  const snapQ = snapshotQueries[i];
                  const snap = snapQ?.data;
                  const rowErr =
                    snapQ?.isError && !snap
                      ? snapQ.error instanceof Error
                        ? snapQ.error.message
                        : String(snapQ.error ?? "Failed")
                      : null;
                  const spread =
                    snap?.strategy.grossSpreadPct != null ? snap.strategy.grossSpreadPct.toFixed(3) + "%" : "—";

                  const isBestArbRow = bestArb != null && asset.cexToken === bestArb.asset.cexToken;

                  return (
                    <TableRow
                      key={asset.cexToken}
                      className={cn(
                        isBestArbRow && "bg-primary/[0.06] dark:bg-primary/10 border-l-2 border-l-primary",
                      )}
                    >
                      <TableCell
                        className={cn(
                          "sticky left-0 z-10 font-medium tabular-nums",
                          isBestArbRow ? "bg-primary/[0.06] dark:bg-primary/10" : "bg-background",
                        )}
                      >
                        {asset.cmcRank}
                      </TableCell>
                      <TableCell
                        className={cn("sticky left-10 z-10", isBestArbRow ? "bg-primary/[0.06] dark:bg-primary/10" : "bg-background")}
                      >
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[8rem]" title={asset.name}>
                          {asset.name}
                        </div>
                      </TableCell>
                      {rowErr ? (
                        <TableCell colSpan={MERGED_PRICE_COLSPAN} className="py-2">
                          <RowSnapshotError symbol={asset.symbol} message={rowErr} />
                        </TableCell>
                      ) : (
                        <>
                          {EXCHANGE_COLUMNS.map((ex) => (
                            <TableCell key={ex.id} className="align-top py-2">
                              <VenueCell venue={venueBySource(snap, ex.id)} />
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-mono text-xs tabular-nums align-top py-2">{spread}</TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {snapshotQueries.some((q) => q.isError) && (
          <div
            className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-foreground flex items-start gap-2"
            role="status"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
            <div>
              <p className="font-medium">Some assets did not load</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use <span className="text-foreground/90">Refresh all</span> or wait and retry. Hover a status pill in the table for details.
              </p>
            </div>
          </div>
        )}

        <footer className="space-y-4 pt-1">
          <section className="rounded-xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5 sm:py-5 text-xs text-muted-foreground shadow-sm">
            <p className="font-medium text-foreground text-sm mb-3">Status pills</p>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Hover any pill in the table for a short explanation and the raw technical message.
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <li className="min-w-0 leading-relaxed break-words">
                <span className="font-medium text-amber-700 dark:text-amber-300">Blocked</span> — ISP or DNS filter;
                VPN or DNS like 1.1.1.1 often fixes it.
              </li>
              <li className="min-w-0 leading-relaxed break-words">
                <span className="font-medium text-slate-700 dark:text-slate-300">No connect</span> — WebSocket
                handshake did not finish (firewall, filtering, or unreachable host).
              </li>
              <li className="min-w-0 leading-relaxed break-words">
                <span className="font-medium text-orange-800 dark:text-orange-300">Timeout</span> — No price update
                before the time limit.
              </li>
              <li className="min-w-0 leading-relaxed break-words">
                <span className="font-medium text-violet-800 dark:text-violet-300">TLS</span> — Certificate or proxy
                trust issue (common on corporate networks).
              </li>
              <li className="min-w-0 leading-relaxed break-words">
                <span className="font-medium text-sky-800 dark:text-sky-300">Network</span> — Could not reach the
                exchange host.
              </li>
              <li className="min-w-0 leading-relaxed break-words">
                <span className="font-medium text-foreground/80">Unavailable</span> — Other venue error; see tooltip for
                detail.
              </li>
            </ul>
          </section>

          <div className="space-y-3 text-xs text-muted-foreground px-0.5">
            {latestFetchedAt && (
              <p className="leading-relaxed">
                Latest price snapshot: {new Date(latestFetchedAt).toLocaleString()} · public WebSocket tickers
              </p>
            )}
            {anyIspBlocked && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3.5 text-amber-900 dark:text-amber-100/95 flex items-start gap-3">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden />
                <p className="leading-relaxed min-w-0">
                  At least one exchange is <span className="font-semibold text-amber-800 dark:text-amber-200">Blocked</span>{" "}
                  on your network. <span className="text-amber-800/90 dark:text-amber-200/90">KRW (Upbit)</span> prices
                  are not directly comparable to USDT without an FX rate.
                </p>
              </div>
            )}
          </div>
        </footer>
      </main>
    </div>
    </TooltipProvider>
  );
}
