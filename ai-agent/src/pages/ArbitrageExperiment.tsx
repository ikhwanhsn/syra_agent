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
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletNav } from "@/components/chat/WalletNav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CoingeckoBatchImageProvider } from "@/contexts/CoingeckoBatchImageContext";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { swatchStyleFromKey } from "@/lib/cryptoIconCdn";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
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

type VenueErrorKind =
  | "isp"
  | "handshake"
  | "timeout"
  | "tls"
  | "network"
  | "other";

function classifyVenueError(raw: string): {
  kind: VenueErrorKind;
  label: string;
  userHint: string;
} {
  const lower = raw.toLowerCase();
  if (
    raw.includes("blocked by ISP") ||
    lower.includes("blockpage") ||
    lower.includes("internetpositif")
  ) {
    return {
      kind: "isp",
      label: "Blocked",
      userHint:
        "Your network or ISP is blocking this exchange. Try a VPN or switch DNS (e.g. 1.1.1.1).",
    };
  }
  if (
    lower.includes("handshake has timed out") ||
    lower.includes("unexpected server response")
  ) {
    return {
      kind: "handshake",
      label: "No connect",
      userHint:
        "The WebSocket handshake did not complete in time. Often caused by firewalls, ISP filtering, or the exchange being unreachable.",
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
      userHint:
        "No price arrived before the time limit. The venue may be slow, rate-limiting, or blocked on your network.",
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
      userHint:
        "A secure connection could not be verified. Common with corporate proxies; your admin may need to trust a root CA.",
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
      userHint:
        "Could not reach the exchange. Check your connection, firewall, or try again.",
    };
  }
  return {
    kind: "other",
    label: "Unavailable",
    userHint:
      "This venue did not return a live price. Details below are from the server.",
  };
}

const errorKindStyles: Record<
  VenueErrorKind,
  { pill: string; icon: LucideIcon }
> = {
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
            "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold leading-none transition-colors",
            "hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            pill,
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
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
  if (p >= 1000)
    return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return p.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function spreadToneClass(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct))
    return "text-muted-foreground font-medium";
  if (pct >= 0.05)
    return "text-emerald-600 dark:text-emerald-400 font-semibold";
  if (pct >= 0.025) return "text-foreground font-semibold";
  return "text-muted-foreground font-medium";
}

function venueBySource(
  snapshot: ArbitrageSnapshotData | undefined,
  source: string,
): ArbitrageVenueRow | undefined {
  return snapshot?.venues.find((v) => v.source === source);
}

function VenueCell({ venue }: { venue: ArbitrageVenueRow | undefined }) {
  if (!venue) {
    return (
      <div className="flex justify-center py-0.5" aria-label="Loading price">
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-muted-foreground/70"
          aria-hidden
        />
      </div>
    );
  }
  if (isVenueOk(venue)) {
    const showQuote =
      venue.quoteUnit !== "USDT" && venue.quoteUnit !== "unknown";
    return (
      <div className="min-w-[4.75rem] rounded-lg px-1.5 py-1 text-right transition-colors group-hover/venue:bg-muted/25">
        <div className="font-mono text-[13px] tabular-nums font-medium leading-tight text-foreground">
          {formatPrice(venue)}
        </div>
        {showQuote ? (
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
            {venue.quoteUnit}
          </div>
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

function RowSnapshotError({
  symbol,
  message,
}: {
  symbol: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 flex items-start gap-2.5 text-left">
      <AlertCircle
        className="h-4 w-4 shrink-0 text-destructive mt-0.5"
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground">
          Couldn&apos;t load {symbol} prices
        </p>
        <p className="text-xs text-muted-foreground">
          Refresh or try again in a moment.
        </p>
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
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-5 shadow-md dark:shadow-black/20 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-14 w-28 rounded-xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl sm:col-span-1" />
        </div>
      </section>
    );
  }

  if (!best) {
    return (
      <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/80">
          <TrendingUp className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">
          No USDT cross-venue spread yet
        </p>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          We need at least two live USDT books on the same asset row. Check
          status pills in the table — blocked or timed-out venues reduce
          coverage.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-muted/20 p-5 shadow-lg shadow-primary/5 dark:from-primary/[0.12] dark:via-card dark:to-muted/10 dark:shadow-black/30 sm:p-6">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Live snapshot
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <TrendingUp className="h-4 w-4" aria-hidden />
              </span>
              Best USDT spread
            </h3>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Gross only — before fees, slip, and transfer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-10 w-10 shrink-0 rounded-xl shadow-md ring-2 ring-background"
              style={swatchStyleFromKey(best.asset.cexToken)}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-semibold tabular-nums text-foreground">
                #{best.asset.cmcRank}{" "}
                <span className="text-primary">{best.asset.symbol}</span>
              </p>
              <p
                className="truncate text-sm text-muted-foreground"
                title={best.asset.name}
              >
                {best.asset.name}
              </p>
            </div>
          </div>
        </div>

        <div className="relative shrink-0 rounded-2xl border border-border/80 bg-background/80 px-5 py-4 text-right shadow-inner backdrop-blur-sm lg:min-w-[11rem]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Gross spread
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-primary sm:text-4xl">
            {best.spreadPct.toFixed(4)}
            <span className="text-xl font-semibold text-primary/80 sm:text-2xl">
              %
            </span>
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <div className="space-y-2 rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] to-background/80 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Buy (cheaper)
          </p>
          <p className="text-base font-semibold capitalize text-foreground">
            {best.buyAt.source}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {best.buyAt.instrument}
          </p>
          <p className="pt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
            {formatPrice(best.buyAt)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">
              {best.buyAt.quoteUnit}
            </span>
          </p>
        </div>

        <div className="flex items-center justify-center py-1 text-muted-foreground sm:py-0 lg:py-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-muted/40 shadow-sm">
            <ArrowRightLeft className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <div className="space-y-2 rounded-xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.07] to-background/80 px-4 py-3.5 shadow-sm sm:px-5 sm:py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            Sell (richer)
          </p>
          <p className="text-base font-semibold capitalize text-foreground">
            {best.sellAt.source}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {best.sellAt.instrument}
          </p>
          <p className="pt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
            {formatPrice(best.sellAt)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">
              {best.sellAt.quoteUnit}
            </span>
          </p>
        </div>
      </div>

      <div className="relative mt-5 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted-foreground backdrop-blur-sm sm:text-[13px]">
        {best.strategyNote}
      </div>

      {runnerUps.length > 0 ? (
        <div className="relative mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Also in play
          </p>
          <ul className="flex flex-wrap gap-2">
            {runnerUps.map((r) => (
              <li key={r.asset.cexToken}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs tabular-nums shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/40">
                  <CoinLogo
                    symbol={r.asset.symbol}
                    size="xs"
                    fallbackSeed={r.asset.cexToken}
                    className="ring-0 shadow-none"
                  />
                  <span className="font-bold text-foreground">
                    {r.asset.symbol}
                  </span>
                  <span className="font-semibold text-primary">
                    {r.spreadPct.toFixed(3)}%
                  </span>
                  <span className="hidden text-muted-foreground sm:inline">
                    {r.buyAt.source} → {r.sellAt.source}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default function ArbitrageExperiment({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const queryClient = useQueryClient();

  const cmcQuery = useQuery({
    queryKey: ["cmc-top", 10],
    queryFn: () => fetchCmcTop({ limit: 10 }),
    staleTime: 5 * 60_000,
  });

  const assets = cmcQuery.data?.assets ?? [];
  const arbCoinSymbols = useMemo(() => assets.map((a) => a.symbol), [assets]);

  const snapshotQueries = useQueries({
    queries: assets.map((a) => ({
      queryKey: ["arbitrage-snapshot", a.cexToken] as const,
      queryFn: () => fetchArbitrageSnapshot({ token: a.cexToken }),
      staleTime: 5_000,
      enabled: assets.length > 0,
    })),
  });

  const isRefreshing =
    cmcQuery.isFetching || snapshotQueries.some((q) => q.isFetching);

  const anyIspBlocked = useMemo(
    () =>
      snapshotQueries.some((q) =>
        q.data?.venues.some(
          (v) => !v.ok && "error" in v && v.error?.includes("blocked by ISP"),
        ),
      ),
    [snapshotQueries],
  );

  const latestFetchedAt = useMemo(() => {
    const times = snapshotQueries
      .map((q) => q.data?.fetchedAt)
      .filter(Boolean) as string[];
    if (!times.length) return null;
    return times.sort().at(-1) ?? null;
  }, [snapshotQueries]);

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["cmc-top", 10] });
    void queryClient.invalidateQueries({ queryKey: ["arbitrage-snapshot"] });
  };

  const tableLoading =
    cmcQuery.isLoading ||
    (assets.length > 0 && snapshotQueries.every((q) => q.isLoading));

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
    (assets.length > 0 &&
      rankedArbitrage.length === 0 &&
      snapshotQueries.some((q) => q.isLoading));

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={cn(
          "bg-background text-foreground",
          /* Dashboard `Outlet` sits in a flex+overflow-auto shell; avoid flex-1 here or `<main>` is
           viewport-capped and bottom padding does not extend scroll height (content stays flush). */
          embedded ? "w-full min-w-0" : "flex min-h-screen flex-col",
        )}
      >
        {!embedded && (
          <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] shrink-0 sticky top-0 z-20">
            <div
              className={cn(
                DASHBOARD_CONTENT_SHELL,
                "flex items-center justify-between gap-2 sm:gap-4",
              )}
            >
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
                  <Scale
                    className="w-5 h-5 text-primary shrink-0"
                    aria-hidden
                  />
                  <h1 className="text-sm font-bold text-foreground truncate">
                    Arbitrage experiment
                  </h1>
                </div>
              </div>
              <WalletNav />
            </div>
          </header>
        )}

        <main
          className={cn(
            DASHBOARD_CONTENT_SHELL,
            PAGE_PADDING_TOP_STANDARD,
            PAGE_SAFE_AREA_BOTTOM_COMPACT,
            "space-y-3",
            !embedded && "min-h-0 flex-1",
          )}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-5 shadow-sm dark:to-muted/10 sm:p-6">
            <div
              className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-primary/[0.08] blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/80 shadow-sm">
                  <Scale className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Cross-CEX spot
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {cmcQuery.data ? (
                      <>
                        <Badge
                          variant="secondary"
                          className="font-medium tabular-nums"
                        >
                          Top 10
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border font-medium",
                            cmcQuery.data.source === "coinmarketcap"
                              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                              : "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
                          )}
                        >
                          {cmcQuery.data.source === "coinmarketcap"
                            ? "CMC live"
                            : "Offline list"}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums sm:text-sm">
                          <Clock
                            className="mr-1 inline-block h-3.5 w-3.5 align-text-bottom opacity-70"
                            aria-hidden
                          />
                          {new Date(cmcQuery.data.fetchedAt).toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Loading universe…
                      </span>
                    )}
                  </div>
                  <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Compare top market-cap assets across major CEXes. Gross
                    spread is indicative — execution, fees, and transfer latency
                    are not modeled here.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 gap-2 border-border/80 bg-background/80 shadow-sm hover:bg-muted/60"
                disabled={isRefreshing}
                onClick={handleRefresh}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
                Refresh all
              </Button>
            </div>
          </div>

          {cmcQuery.isError && (
            <p className="text-sm text-destructive" role="alert">
              {cmcQuery.error instanceof Error
                ? cmcQuery.error.message
                : String(cmcQuery.error)}
            </p>
          )}

          <CoingeckoBatchImageProvider symbols={arbCoinSymbols}>
            <BestArbitragePanel
              best={bestArb}
              runnerUps={runnerUpArbs}
              loading={bestStrategyPanelLoading}
            />

            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/30 shadow-lg shadow-black/[0.04] backdrop-blur-sm dark:shadow-black/25">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="sticky left-0 z-20 min-w-[3rem] bg-muted/80 backdrop-blur-md supports-[backdrop-filter]:bg-muted/70">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          #
                        </span>
                      </TableHead>
                      <TableHead className="sticky left-12 z-20 min-w-[8.5rem] bg-muted/80 backdrop-blur-md supports-[backdrop-filter]:bg-muted/70">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Asset
                        </span>
                      </TableHead>
                      {EXCHANGE_COLUMNS.map((ex) => (
                        <TableHead
                          key={ex.id}
                          className="min-w-[6rem] whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                        >
                          {ex.label}
                        </TableHead>
                      ))}
                      <TableHead className="min-w-[5.5rem] whitespace-nowrap text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        USDT Δ%
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableLoading ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={TABLE_COL_COUNT}
                          className="py-16 text-center text-muted-foreground"
                        >
                          <span className="inline-flex flex-col items-center gap-3">
                            <Loader2
                              className="h-8 w-8 animate-spin text-primary/50"
                              aria-hidden
                            />
                            <span className="text-sm font-medium">
                              Pulling venue books…
                            </span>
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : assets.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={TABLE_COL_COUNT}
                          className="py-12 text-center"
                        >
                          <p className="text-sm font-medium text-foreground">
                            No assets in list
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Try refreshing after the market list loads.
                          </p>
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
                        const grossPct = snap?.strategy.grossSpreadPct ?? null;
                        const spread =
                          grossPct != null ? grossPct.toFixed(3) + "%" : "—";

                        const isBestArbRow =
                          bestArb != null &&
                          asset.cexToken === bestArb.asset.cexToken;
                        const stickyBg = isBestArbRow
                          ? "bg-primary/[0.08] dark:bg-primary/[0.12]"
                          : "bg-background/95 supports-[backdrop-filter]:bg-background/80";

                        return (
                          <TableRow
                            key={asset.cexToken}
                            className={cn(
                              "group border-border/40 transition-colors hover:bg-muted/30",
                              isBestArbRow &&
                                "bg-primary/[0.04] dark:bg-primary/[0.07]",
                            )}
                          >
                            <TableCell
                              className={cn(
                                "sticky left-0 z-10 border-r border-border/30 font-semibold tabular-nums backdrop-blur-sm transition-colors group-hover:bg-muted/40",
                                stickyBg,
                              )}
                            >
                              {asset.cmcRank}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "sticky left-12 z-10 border-r border-border/30 backdrop-blur-sm transition-colors group-hover:bg-muted/40",
                                stickyBg,
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <CoinLogo
                                  symbol={asset.symbol}
                                  size="md"
                                  fallbackSeed={asset.cexToken}
                                />
                                <div className="min-w-0">
                                  <div className="truncate font-semibold text-foreground">
                                    {asset.symbol}
                                  </div>
                                  <div
                                    className="truncate text-[11px] text-muted-foreground"
                                    title={asset.name}
                                  >
                                    {asset.name}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            {rowErr ? (
                              <TableCell
                                colSpan={MERGED_PRICE_COLSPAN}
                                className="py-3"
                              >
                                <RowSnapshotError
                                  symbol={asset.symbol}
                                  message={rowErr}
                                />
                              </TableCell>
                            ) : (
                              <>
                                {EXCHANGE_COLUMNS.map((ex) => (
                                  <TableCell
                                    key={ex.id}
                                    className="group/venue align-top py-2.5"
                                  >
                                    <VenueCell
                                      venue={venueBySource(snap, ex.id)}
                                    />
                                  </TableCell>
                                ))}
                                <TableCell
                                  className={cn(
                                    "text-right font-mono text-sm tabular-nums align-top py-2.5",
                                    spreadToneClass(grossPct),
                                  )}
                                >
                                  {spread}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CoingeckoBatchImageProvider>

          {snapshotQueries.some((q) => q.isError) && (
            <div
              className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-foreground flex items-start gap-2"
              role="status"
            >
              <AlertCircle
                className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
                aria-hidden
              />
              <div>
                <p className="font-medium">Some assets did not load</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use <span className="text-foreground/90">Refresh all</span> or
                  wait and retry. Hover a status pill in the table for details.
                </p>
              </div>
            </div>
          )}

          <footer className="space-y-4 pt-1">
            <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/25 to-card/40 px-4 py-5 text-xs text-muted-foreground shadow-sm sm:px-6 sm:py-6">
              <p className="mb-1 text-sm font-semibold text-foreground">
                Reading status pills
              </p>
              <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                Hover any pill in the grid for a plain-language hint and the raw
                server message. Blocks and timeouts are often network-specific,
                not Syra bugs.
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <li className="min-w-0 leading-relaxed break-words">
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    Blocked
                  </span>{" "}
                  — ISP or DNS filter; VPN or DNS like 1.1.1.1 often fixes it.
                </li>
                <li className="min-w-0 leading-relaxed break-words">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    No connect
                  </span>{" "}
                  — WebSocket handshake did not finish (firewall, filtering, or
                  unreachable host).
                </li>
                <li className="min-w-0 leading-relaxed break-words">
                  <span className="font-medium text-orange-800 dark:text-orange-300">
                    Timeout
                  </span>{" "}
                  — No price update before the time limit.
                </li>
                <li className="min-w-0 leading-relaxed break-words">
                  <span className="font-medium text-violet-800 dark:text-violet-300">
                    TLS
                  </span>{" "}
                  — Certificate or proxy trust issue (common on corporate
                  networks).
                </li>
                <li className="min-w-0 leading-relaxed break-words">
                  <span className="font-medium text-sky-800 dark:text-sky-300">
                    Network
                  </span>{" "}
                  — Could not reach the exchange host.
                </li>
                <li className="min-w-0 leading-relaxed break-words">
                  <span className="font-medium text-foreground/80">
                    Unavailable
                  </span>{" "}
                  — Other venue error; see tooltip for detail.
                </li>
              </ul>
            </section>

            <div className="space-y-3 text-xs text-muted-foreground px-0.5">
              {latestFetchedAt && (
                <p className="leading-relaxed">
                  Latest price snapshot:{" "}
                  {new Date(latestFetchedAt).toLocaleString()} · public
                  WebSocket tickers
                </p>
              )}
              {anyIspBlocked && (
                <div className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3.5 text-amber-900 dark:text-amber-100/95 flex items-start gap-3">
                  <ShieldAlert
                    className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                    aria-hidden
                  />
                  <p className="leading-relaxed min-w-0">
                    At least one exchange is{" "}
                    <span className="font-semibold text-amber-800 dark:text-amber-200">
                      Blocked
                    </span>{" "}
                    on your network.{" "}
                    <span className="text-amber-800/90 dark:text-amber-200/90">
                      KRW (Upbit)
                    </span>{" "}
                    prices are not directly comparable to USDT without an FX
                    rate.
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
