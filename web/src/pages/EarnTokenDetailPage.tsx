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
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EarnTokenLogo } from "@/components/earn/EarnTokenLogo";
import { TokensOhlcvChart } from "@/components/dossier/TokensOhlcvChart";
import { playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { Bone } from "@/components/ui/bone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  if (price == null || !Number.isFinite(price) || price <= 0) return "-";
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  return `$${formatPortfolioTokenAmount(price).display}`;
}

function formatDetailUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "-";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  if (abs >= 1) return `$${Math.round(n).toLocaleString()}`;
  if (abs > 0) return `$${n.toFixed(2)}`;
  return "-";
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "-";
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

const surfaceClass = cn(
  "rounded-[1.35rem] border border-border/40 bg-card/40",
  "shadow-[0_1px_0_0_hsl(var(--border)/0.35)]",
);

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className="mt-1 truncate font-mono text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-lg"
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
        const profile =
          data.saidProfileUrl?.trim() ||
          (data.saidAgentWallet
            ? `https://www.saidprotocol.com/agents/${data.saidAgentWallet}`
            : null);
        if (data.directoryListed === false) {
          notify.error(
            "Verified on-chain, profile missing",
            data.directoryError?.trim() ||
              "SAID directory sync failed. Try Open SAID profile again in a moment.",
          );
        } else {
          notify.success(
            data.alreadyVerified ? "SAID profile ready" : "Verified on SAID",
            "Your Earn wallet is listed on saidprotocol.com.",
          );
          if (profile) window.open(profile, "_blank", "noopener,noreferrer");
        }
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
  const showOwnerTools = isOwner && syraAuthenticated;

  const openSaidProfile = () => {
    if (showOwnerTools) {
      // Re-run verify to heal directory listing (idempotent), then open profile.
      verifySaidMutation.mutate();
      return;
    }
    if (saidProfileUrl) window.open(saidProfileUrl, "_blank", "noopener,noreferrer");
  };

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
          "relative z-10 space-y-6 py-4 pb-10 sm:space-y-8 sm:py-6 sm:pb-12",
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
          <div className={cn(surfaceClass, "flex flex-col items-center justify-center px-6 py-20 text-center")}>
            <p className="font-display text-lg font-semibold tracking-tight">Missing mint</p>
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link to="/earn?track=token">Back to tokens</Link>
            </Button>
          </div>
        ) : (
          <Bone name="earn-token-detail" loading={detailQ.isLoading}>
        {detailQ.isError || !launch ? (
          <div className={cn(surfaceClass, "flex flex-col items-center justify-center px-6 py-20 text-center")}>
            <p className="font-display text-lg font-semibold tracking-tight">Token not found</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This mint isn’t in the catalog, or the link is invalid.
            </p>
            <Button asChild className="mt-6 rounded-full" variant="outline">
              <Link to="/earn?track=token">Back to tokens</Link>
            </Button>
          </div>
        ) : (
          <div className={cn("space-y-6 sm:space-y-8", playgroundTabPanelEnter)}>
            {/* Identity */}
            <header className={cn(surfaceClass, "p-5 sm:p-7")}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                  <EarnTokenLogo
                    src={launch.imageUri}
                    alt={launch.name}
                    className="h-16 w-16 rounded-2xl border-border/30 shadow-sm ring-1 ring-black/[0.04] sm:h-20 sm:w-20 dark:ring-white/[0.06]"
                    iconClassName="h-7 w-7"
                  />
                  <div className="min-w-0 space-y-2.5 pt-0.5">
                    <div className="space-y-1">
                      <h1 className="font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-[2rem]">
                        {launch.name}
                      </h1>
                      <p className="text-[14px] font-medium tracking-wide text-muted-foreground">
                        ${launch.symbol}
                        <span className="mx-2 text-muted-foreground/35">·</span>
                        <span className="text-muted-foreground/80">pump.fun</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isSaidVerified && saidProfileUrl ? (
                        showOwnerTools ? (
                          <button
                            type="button"
                            onClick={openSaidProfile}
                            disabled={verifySaidMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-60"
                          >
                            {verifySaidMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            ) : (
                              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                            )}
                            Verified on SAID
                            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                          </button>
                        ) : (
                          <a
                            href={saidProfileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2.5 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-muted/50"
                          >
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                            Verified on SAID
                            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
                          </a>
                        )
                      ) : null}
                      {showOwnerTools ? (
                        <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
                          Your launch
                        </span>
                      ) : null}
                    </div>
                    {launch.description ? (
                      <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                        {launch.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                  <Button
                    className="h-11 flex-1 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm lg:flex-none"
                    asChild
                  >
                    <a href={pumpUrl!} target="_blank" rel="noreferrer">
                      Trade on pump.fun
                      <ArrowUpRight className="h-4 w-4 opacity-80" />
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 flex-1 gap-2 rounded-full px-5 text-[13px] font-medium shadow-none lg:flex-none"
                    asChild
                  >
                    <a href={solscanUrl!} target="_blank" rel="noreferrer">
                      Solscan
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  </Button>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start lg:gap-8">
              {/* Chart leads on desktop */}
              <section className={cn(surfaceClass, "order-2 overflow-hidden p-3 sm:p-4 lg:order-1")}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-4 sm:px-2">
                  <h2 className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
                    Price
                  </h2>
                  {chartSource ? (
                    <p className="text-[12px] text-muted-foreground">{chartSource}</p>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">
                      {chartQ.data?.ohlcv.interval || "5m"}
                    </p>
                  )}
                </div>

                {showChartSkeleton ? (
                  <Skeleton className="h-[280px] w-full rounded-[1.1rem] sm:h-[360px]" />
                ) : chartQ.isError && !chartQ.data ? (
                  <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[1.1rem] border border-dashed border-border/40 bg-muted/10 px-4 text-center sm:h-[360px]">
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
                  <TokensOhlcvChart
                    candles={candles}
                    symbol={launch.symbol}
                    intervalLabel={chartQ.data?.ohlcv.interval || "5m"}
                    height={340}
                    lowTimeframe
                    defaultRange="6H"
                  />
                ) : (
                  <div className="flex h-[240px] items-center justify-center rounded-[1.1rem] border border-dashed border-border/40 bg-muted/10 px-4 text-center text-sm text-muted-foreground sm:h-[320px]">
                    {chartQ.data?.ohlcv.error?.trim() ||
                      "No chart data available for this token yet."}
                  </div>
                )}
              </section>

              {/* Market + meta sidebar */}
              <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:gap-5">
                <section className={cn(surfaceClass, "p-5 sm:p-6")}>
                  <div className="space-y-1">
                    <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
                      {formatTokenPriceUsd(launch.priceUsd)}
                    </p>
                    {hasChange ? (
                      <p
                        className={cn(
                          "inline-flex items-center gap-1.5 font-mono text-[15px] font-medium tabular-nums",
                          changeUp && "text-emerald-600 dark:text-emerald-400",
                          changeDown && "text-rose-600 dark:text-rose-400",
                          !changeUp && !changeDown && "text-muted-foreground",
                        )}
                      >
                        {changeUp ? <TrendingUp className="h-4 w-4" aria-hidden /> : null}
                        {changeDown ? <TrendingDown className="h-4 w-4" aria-hidden /> : null}
                        <span>{formatPct(change24)} 24h</span>
                      </p>
                    ) : (
                      <p className="font-mono text-[15px] tabular-nums text-muted-foreground/60">
                        - 24h
                      </p>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/30 pt-5">
                    <Metric label="Mcap" value={formatDetailUsd(launch.marketCapUsd)} />
                    <Metric label="Vol 24h" value={formatDetailUsd(launch.volume24hUsd)} />
                    <Metric label="Liq" value={formatDetailUsd(launch.liquidityUsd)} />
                  </div>
                </section>

                <section className={cn(surfaceClass, "space-y-4 p-5 sm:p-6")}>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">Launched</p>
                    <p className="mt-1 text-[15px] font-medium text-foreground">
                      {formatDate(launch.createdAt)}
                    </p>
                  </div>
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-muted-foreground">Mint</p>
                        <p
                          className="mt-1 break-all font-mono text-[12px] leading-relaxed text-foreground/90 sm:text-[13px]"
                          title={launch.mint}
                        >
                          {shortenMint(launch.mint)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-[13px]"
                        onClick={() => void copyMint()}
                      >
                        <Copy className="h-3.5 w-3.5 opacity-60" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </section>

                {showOwnerTools ? (
                  <section className={cn(surfaceClass, "space-y-4 p-5 sm:p-6")}>
                    <div>
                      <h2 className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground">
                        Creator tools
                      </h2>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        Claim pump.fun creator fees, or verify this Earn wallet on SAID.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
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
                      {isSaidVerified ? (
                        <Button
                          variant="outline"
                          className="h-11 gap-2 rounded-full px-5 text-[13px] font-medium shadow-none"
                          disabled={verifySaidMutation.isPending}
                          onClick={openSaidProfile}
                        >
                          {verifySaidMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="h-4 w-4 opacity-70" />
                          )}
                          Open SAID profile
                        </Button>
                      ) : (
                        <>
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
                          <p className="text-[12px] leading-relaxed text-muted-foreground">
                            Pays ~0.012 SOL from your Earn wallet. Applies to all your Earn tokens.
                          </p>
                        </>
                      )}
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>
          </div>
        )}
          </Bone>
        )}
      </div>
    </div>
  );
}
