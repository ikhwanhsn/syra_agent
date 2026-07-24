import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EarnTokenLogo } from "@/components/earn/EarnTokenLogo";
import { TokensOhlcvChart } from "@/components/dossier/TokensOhlcvChart";
import { EarnTokenDetailSkeleton } from "@/components/RouteFallback";
import { Button } from "@/components/ui/button";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useDelayedMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  collectEarnPumpfunFees,
  fetchEarnPumpfunTokenDetail,
  shortenMint,
  verifyEarnTokenOnSaid,
} from "@/lib/earnPumpfunApi";
import { siblingAnonymousId } from "@/lib/agentWalletPurpose";
import { formatPct } from "@/lib/dashboardOverviewAggregates";
import { formatPortfolioTokenAmount } from "@/lib/format";
import { DASHBOARD_CONTENT_SHELL } from "@/lib/layoutConstants";
import { fetchMintChart } from "@/lib/tokensDossierApi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

function formatTokenPriceUsd(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price) || price <= 0) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  return `$${formatPortfolioTokenAmount(price).display}`;
}

function formatDetailUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  if (abs >= 1) return `$${Math.round(n).toLocaleString()}`;
  if (abs > 0) return `$${n.toFixed(2)}`;
  return "—";
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function chartSourceLabel(source: string | undefined): string | null {
  if (!source || source === "tokens.xyz") return null;
  const labels: Record<string, string> = {
    pumpfun: "pump.fun",
    coingecko: "CoinGecko",
    binance: "Binance",
    geckoterminal: "GeckoTerminal",
  };
  return labels[source] ?? source;
}

function Metric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 truncate font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl",
          valueClassName,
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

export default function EarnTokenDetailPage() {
  const { mint: mintParam } = useParams<{ mint: string }>();
  const mint = mintParam ? decodeURIComponent(mintParam).trim() : "";
  const { anonymousId } = useAgentWallet();
  const { syraAuthenticated } = useSyraAuth();
  const queryClient = useQueryClient();

  const detailQ = useQuery({
    queryKey: ["earn", "token-detail", mint],
    queryFn: () => fetchEarnPumpfunTokenDetail(mint),
    enabled: Boolean(mint),
    staleTime: 30_000,
  });

  const chartQ = useQuery({
    queryKey: ["earn", "token-chart", mint],
    queryFn: ({ signal }) => fetchMintChart(mint, { signal }),
    enabled: Boolean(mint),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });

  const launch = detailQ.data;
  const earnId = anonymousId ? siblingAnonymousId(anonymousId, "earn") : null;
  const isOwner = Boolean(
    launch?.earnAnonymousId && earnId && launch.earnAnonymousId === earnId,
  );
  const pumpUrl = mint ? `https://pump.fun/coin/${mint}` : null;
  const solscanUrl = mint ? `https://solscan.io/token/${mint}` : null;

  const candles = chartQ.data?.ohlcv.candles ?? [];
  const chartReady = candles.length >= 2;
  const chartLoading = chartQ.isFetching && !chartQ.data;
  const showChartSkeleton = useDelayedMinimumSkeleton(chartLoading);
  const chartSource = chartSourceLabel(chartQ.data?.ohlcv.source);

  const change24 = launch?.priceChange24hPercent;
  const hasChange = change24 != null && Number.isFinite(change24);
  const changeUp = hasChange && change24 > 0;
  const changeDown = hasChange && change24 < 0;

  const collectMutation = useMutation({
    mutationFn: () => collectEarnPumpfunFees(mint),
    onSuccess: (data) => {
      if (data.submitError) {
        notify.error("Fee claim issue", data.submitError);
      } else {
        notify.success("Creator fees claimed");
      }
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-detail", mint] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-launches"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-marketplace"] });
    },
    onError: (e: Error) => {
      notify.error("Claim failed", e.message || "Could not claim fees");
    },
  });

  const verifySaidMutation = useMutation({
    mutationFn: () => verifyEarnTokenOnSaid(mint),
    onSuccess: (data) => {
      if (data.saidVerified) {
        notify.success(
          data.alreadyVerified ? "Already verified on SAID" : "Verified on SAID",
          "Your token’s earn wallet is now a verified SAID agent.",
        );
      } else {
        notify.error("Verification incomplete", "SAID registration ran but verification did not confirm.");
      }
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-detail", mint] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-launches"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "token-marketplace"] });
    },
    onError: (e: Error) => {
      notify.error("SAID verify failed", e.message || "Could not verify on SAID");
    },
  });

  const saidProfileUrl =
    launch?.saidProfileUrl?.trim() ||
    (launch?.saidAgentWallet
      ? `https://www.saidprotocol.com/agents/${launch.saidAgentWallet}`
      : null);
  const isSaidVerified = launch?.saidVerified === true;

  const copyMint = async () => {
    if (!mint) return;
    try {
      await navigator.clipboard.writeText(mint);
      notify.success("Mint copied");
    } catch {
      notify.error("Copy failed", "Could not copy mint to clipboard");
    }
  };

  return (
    <div className="relative flex min-h-0 flex-col">
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative z-10 space-y-8 py-4 pb-10 sm:py-6 sm:pb-12",
        )}
      >
        <Link
          to="/earn?track=token"
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-1 py-1.5 text-[13px] font-medium text-muted-foreground",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Tokens
        </Link>

        {!mint ? (
          <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
            <p className="font-display text-lg font-semibold tracking-tight">Missing mint</p>
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link to="/earn?track=token">Back to tokens</Link>
            </Button>
          </div>
        ) : detailQ.isLoading ? (
          <EarnTokenDetailSkeleton />
        ) : detailQ.isError || !launch ? (
          <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
            <p className="font-display text-lg font-semibold tracking-tight">Token not found</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This mint isn’t in the catalog, or the link is invalid.
            </p>
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link to="/earn?track=token">Back to tokens</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            <header className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
              <div className="flex min-w-0 items-start gap-5 sm:gap-6">
                <EarnTokenLogo
                  src={launch.imageUri}
                  alt={launch.name}
                  className="h-20 w-20 rounded-[1.25rem] border-border/30 shadow-sm ring-1 ring-black/[0.04] sm:h-24 sm:w-24 dark:ring-white/[0.06]"
                  iconClassName="h-8 w-8"
                />
                <div className="min-w-0 space-y-2 pt-0.5">
                  <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2.15rem]">
                    {launch.name}
                  </h1>
                  <p className="text-[15px] font-medium tracking-wide text-muted-foreground">
                    ${launch.symbol}
                    <span className="mx-2 text-muted-foreground/35">·</span>
                    <span className="text-muted-foreground/80">pump.fun</span>
                  </p>
                  {isSaidVerified && saidProfileUrl ? (
                    <a
                      href={saidProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[12px] font-medium text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      Verified on SAID
                      <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                    </a>
                  ) : null}
                  {launch.description ? (
                    <p className="max-w-xl pt-1 text-[15px] leading-relaxed text-muted-foreground">
                      {launch.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button
                    className="h-11 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm"
                    asChild
                  >
                    <a href={pumpUrl!} target="_blank" rel="noreferrer">
                      Trade
                      <ArrowUpRight className="h-4 w-4 opacity-80" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 gap-2 rounded-full px-5 text-[13px] font-medium shadow-none"
                    asChild
                  >
                    <a href={solscanUrl!} target="_blank" rel="noreferrer">
                      Solscan
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  </Button>
                  {isOwner && syraAuthenticated ? (
                    <Button
                      variant="secondary"
                      className="h-11 gap-2 rounded-full px-5 text-[13px] font-medium shadow-none"
                      disabled={collectMutation.isPending}
                      onClick={() => collectMutation.mutate()}
                    >
                      {collectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4 opacity-70" />
                      )}
                      Claim fees
                    </Button>
                  ) : null}
                  {isOwner && syraAuthenticated && !isSaidVerified ? (
                    <Button
                      variant="outline"
                      className="h-11 gap-2 rounded-full px-5 text-[13px] font-medium shadow-none"
                      disabled={verifySaidMutation.isPending}
                      onClick={() => verifySaidMutation.mutate()}
                    >
                      {verifySaidMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 opacity-70" />
                      )}
                      Verify on SAID
                    </Button>
                  ) : null}
                </div>
                {isOwner && syraAuthenticated && !isSaidVerified ? (
                  <p className="max-w-xs text-right text-[11px] leading-relaxed text-muted-foreground/80">
                    Pays ~0.012 SOL from your Earn wallet for on-chain SAID registration + verified badge.
                  </p>
                ) : null}
              </div>
            </header>

            <section className="space-y-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-mono text-4xl font-semibold tracking-tight tabular-nums text-foreground sm:text-5xl">
                  {formatTokenPriceUsd(launch.priceUsd)}
                </p>
                {hasChange ? (
                  <p
                    className={cn(
                      "font-mono text-lg font-medium tabular-nums sm:text-xl",
                      changeUp && "text-emerald-600 dark:text-emerald-400",
                      changeDown && "text-rose-600 dark:text-rose-400",
                      !changeUp && !changeDown && "text-muted-foreground",
                    )}
                  >
                    {formatPct(change24)}
                  </p>
                ) : (
                  <p className="font-mono text-lg tabular-nums text-muted-foreground/50 sm:text-xl">—</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-border/30 pt-6 sm:gap-8">
                <Metric label="Mcap" value={formatDetailUsd(launch.marketCapUsd)} />
                <Metric label="Vol 24h" value={formatDetailUsd(launch.volume24hUsd)} />
                <Metric label="Liq" value={formatDetailUsd(launch.liquidityUsd)} />
              </div>
            </section>

            <section className="space-y-3 border-t border-border/30 pt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                  Chart
                </p>
                {chartSource ? (
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
                    {chartSource}
                  </p>
                ) : null}
              </div>

              {showChartSkeleton ? (
                <div className="h-[280px] w-full animate-pulse rounded-[1.25rem] border border-border/30 bg-muted/15 sm:h-[340px]" />
              ) : chartQ.isError && !chartQ.data ? (
                <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-border/40 bg-muted/10 px-4 text-center sm:h-[340px]">
                  <p className="text-sm text-muted-foreground">
                    {chartQ.error instanceof Error
                      ? chartQ.error.message
                      : "Could not load chart for this token."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => void chartQ.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : chartReady ? (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/40 bg-card/30 p-2 sm:p-3">
                  <TokensOhlcvChart
                    candles={candles}
                    symbol={launch.symbol}
                    intervalLabel={chartQ.data?.ohlcv.interval || "5m"}
                    height={320}
                    lowTimeframe
                    defaultRange="6H"
                  />
                </div>
              ) : (
                <div className="flex h-[220px] items-center justify-center rounded-[1.25rem] border border-dashed border-border/40 bg-muted/10 px-4 text-center text-sm text-muted-foreground sm:h-[280px]">
                  {chartQ.data?.ohlcv.error?.trim() ||
                    "No chart data available for this token yet."}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 border-t border-border/30 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                  Launched
                </p>
                <p className="mt-1 text-[15px] font-medium text-foreground">
                  {formatDate(launch.createdAt)}
                </p>
              </div>
              <div className="flex min-w-0 items-center gap-3 sm:justify-end">
                <div className="min-w-0 text-left sm:text-right">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                    Mint
                  </p>
                  <p className="mt-1 truncate font-mono text-[13px] text-foreground/90" title={launch.mint}>
                    {shortenMint(launch.mint)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-[13px] text-muted-foreground hover:text-foreground"
                  onClick={() => void copyMint()}
                >
                  <Copy className="h-3.5 w-3.5 opacity-60" />
                  Copy
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
