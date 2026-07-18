import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Gift, Layers, Link2, Wallet } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import { GrowAnalysisSkeleton } from "@/components/pillars/PillarPageSkeletons";
import { GrowRecommendationCard } from "@/components/grow/GrowRecommendationCard";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewChartPanelShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchGrowPortfolio,
  fetchGrowRecommendations,
  type GrowAllocationItem,
} from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isLikelySolanaAddress(value: string): boolean {
  return SOLANA_ADDRESS_RE.test(value.trim());
}

function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function shortenAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function buildAllocationRows(allocation: GrowAllocationItem[]) {
  const sorted = [...allocation]
    .filter((a) => (a.valueUsd ?? 0) > 0)
    .sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0));
  const total = sorted.reduce((s, a) => s + (a.valueUsd ?? 0), 0);
  const top = sorted.slice(0, 6);
  const restUsd = sorted.slice(6).reduce((s, a) => s + (a.valueUsd ?? 0), 0);
  const rows = top.map((a) => ({
    name: a.symbol || "?",
    value: a.valueUsd ?? 0,
    pct: total > 0 ? ((a.valueUsd ?? 0) / total) * 100 : 0,
  }));
  if (restUsd > 0 && total > 0) {
    rows.push({ name: "Other", value: restUsd, pct: (restUsd / total) * 100 });
  }
  return rows;
}

function ProgressRow({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium tracking-tight">{label}</span>
        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-foreground/70 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(pct, 0))}%` }}
        />
      </div>
    </div>
  );
}

export default function GrowPage() {
  const { address, connected } = useWalletContext();
  const { anonymousId, agentAddress } = useAgentWallet();
  const connectedWallet = agentAddress ?? address ?? undefined;

  const [inputAddress, setInputAddress] = useState("");
  const [analyzedAddress, setAnalyzedAddress] = useState<string | null>(null);

  const activeAddress = analyzedAddress ?? (connected ? connectedWallet : undefined);

  const portfolioQ = useQuery({
    queryKey: ["grow", "portfolio", activeAddress],
    queryFn: () => fetchGrowPortfolio(activeAddress!),
    enabled: Boolean(activeAddress),
    staleTime: 60_000,
  });

  const recommendationsQ = useQuery({
    queryKey: ["grow", "recommendations", activeAddress, anonymousId],
    queryFn: () => fetchGrowRecommendations(activeAddress, anonymousId ?? undefined),
    enabled: Boolean(activeAddress),
    staleTime: 60_000,
  });

  const portfolio = portfolioQ.data?.data;
  const recommendations = recommendationsQ.data?.data?.recommendations ?? [];
  const disclaimer = recommendationsQ.data?.data?.disclaimer;
  const summary = portfolio?.summary;
  const defi = portfolio?.defi;

  const allocationRows = useMemo(
    () => buildAllocationRows(portfolio?.allocation ?? portfolio?.tokens ?? []),
    [portfolio],
  );

  const defiRows = useMemo(() => {
    const items = [
      { name: "Lending", value: defi?.lending?.netUsd ?? summary?.lendingNetUsd ?? 0 },
      { name: "LP", value: defi?.lp?.valueUsd ?? summary?.lpValueUsd ?? 0 },
      { name: "Staking", value: defi?.staking?.valueUsd ?? summary?.stakingValueUsd ?? 0 },
      { name: "Yield", value: defi?.yield?.valueUsd ?? summary?.yieldValueUsd ?? 0 },
      { name: "Rewards", value: defi?.rewards?.pendingUsd ?? summary?.pendingRewardsUsd ?? 0 },
      { name: "Perps", value: defi?.perps?.collateralUsd ?? summary?.perpsCollateralUsd ?? 0 },
    ].filter((r) => (r.value ?? 0) > 0);
    const max = Math.max(...items.map((r) => r.value), 1);
    return items.map((r) => ({ ...r, pct: (r.value / max) * 100 }));
  }, [defi, summary]);

  const addressError =
    inputAddress.trim().length > 0 && !isLikelySolanaAddress(inputAddress)
      ? "Invalid Solana address"
      : null;

  function runAnalysis() {
    const trimmed = inputAddress.trim();
    if (!isLikelySolanaAddress(trimmed)) return;
    setAnalyzedAddress(trimmed);
  }

  function useConnectedWallet() {
    if (connectedWallet) {
      setInputAddress(connectedWallet);
      setAnalyzedAddress(connectedWallet);
    }
  }

  const isLoading = Boolean(activeAddress) && (portfolioQ.isLoading || recommendationsQ.isLoading);
  const showSkeleton = useMinimumSkeleton(isLoading);
  const hasError =
    Boolean(activeAddress) &&
    !showSkeleton &&
    !isLoading &&
    (portfolioQ.isError || portfolioQ.data?.success === false);
  const hasData =
    Boolean(activeAddress) && !showSkeleton && !isLoading && !hasError && portfolio;

  return (
    <PillarLayout
      embedded
      title="Grow"
      tagline="Portfolio health"
      description="Analyze any wallet. Suggestions only — act through Invest."
      actions={
        <Button variant="outline" size="sm" className="h-9 w-full rounded-full px-4 sm:w-auto" asChild>
          <Link to="/invest">Invest</Link>
        </Button>
      }
    >
      <div className="w-full space-y-6 sm:space-y-8">
        <section className={cn(overviewCardShell, "relative overflow-hidden")}>
          <div
            className={overviewCardGlow}
            style={{ background: overviewAccentBackground("alpha") }}
            aria-hidden
          />
          <div className="relative z-[1] p-4 sm:p-5 lg:p-6">
            <p className={overviewKickerClass}>Analyze wallet</p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground leading-relaxed">
              Paste any Solana address for allocation, DeFi exposure, and suggestions.
            </p>
            <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runAnalysis();
                  }}
                  placeholder="Paste any Solana address"
                  className="h-11 w-full rounded-full border-border/40 bg-background/50 font-mono text-sm sm:h-12"
                  aria-invalid={Boolean(addressError)}
                />
                {addressError ? (
                  <p className="text-xs text-destructive">{addressError}</p>
                ) : activeAddress ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3 shrink-0" aria-hidden />
                    Analyzing {shortenAddress(activeAddress)}
                  </p>
                ) : null}
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Button
                  className="h-11 flex-1 rounded-full px-6 sm:h-12 sm:flex-none sm:min-w-[7rem]"
                  onClick={runAnalysis}
                  disabled={!isLikelySolanaAddress(inputAddress)}
                >
                  Analyze
                </Button>
                {connected && connectedWallet ? (
                  <Button
                    variant="outline"
                    className="h-11 flex-1 rounded-full px-4 sm:h-12 sm:flex-none"
                    onClick={useConnectedWallet}
                  >
                    <Wallet className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Mine
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {!activeAddress ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div
              className={cn(
                overviewCardShell,
                "relative overflow-hidden p-5 sm:p-6 sm:col-span-1 lg:col-span-8",
              )}
            >
              <div
                className={overviewCardGlow}
                style={{ background: overviewAccentBackground("neutral") }}
                aria-hidden
              />
              <div className="relative z-[1]">
                <p className={overviewKickerClass}>Get started</p>
                <p className="mt-2 text-base font-medium tracking-tight text-foreground">
                  See how capital is allocated
                </p>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground leading-relaxed">
                  Enter an address above to unlock net worth, token mix, DeFi exposure, and
                  actionable suggestions — then deploy through Invest.
                </p>
              </div>
            </div>
            {!connected ? (
              <div className="sm:col-span-1 lg:col-span-4">
                <PillarConnectCTA
                  variant="inline"
                  title="Or connect your wallet"
                  description="Track your agent treasury live."
                  hideWhenConnected={false}
                />
              </div>
            ) : (
              <div className="sm:col-span-1 lg:col-span-4">
                <PillarConnectCTA
                  title="Fund to act on suggestions"
                  fundHref="/wallet"
                  fundLabel="Fund wallet"
                />
              </div>
            )}
          </div>
        ) : null}

        {showSkeleton ? <GrowAnalysisSkeleton /> : null}

        {hasError ? (
          <div
            className={cn(
              overviewCardShell,
              "flex flex-col items-center justify-center px-6 py-14 text-center",
            )}
          >
            <p className="text-sm font-medium tracking-tight text-foreground">
              Could not load this portfolio
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {portfolioQ.data?.error ?? "Check the address and try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 h-9 rounded-full px-4"
              onClick={() => void portfolioQ.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {hasData ? (
          <>
            {!connected ? (
              <PillarConnectCTA title="Connect to track live" />
            ) : (
              <PillarConnectCTA
                title="Fund to act on suggestions"
                fundHref="/wallet"
                fundLabel="Fund wallet"
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
              <article
                className={cn(
                  overviewCardShell,
                  "relative overflow-hidden sm:col-span-2 lg:col-span-5",
                )}
              >
                <div
                  className={overviewCardGlow}
                  style={{ background: overviewAccentBackground("marketplace") }}
                  aria-hidden
                />
                <div className="relative z-[1] flex h-full flex-col justify-end p-4 sm:p-5 lg:p-6">
                  <p className={overviewKickerClass}>Net worth</p>
                  <p className="mt-2 break-all font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-none">
                    {formatUsd(summary?.totalValueUsd ?? portfolio?.totalValueUsd)}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground/85 leading-snug">
                    On-chain portfolio estimate
                  </p>
                </div>
              </article>

              <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-3 lg:col-span-7 lg:gap-4">
                <OverviewStatCard
                  compact
                  label="Tokens"
                  value={String(summary?.tokenCount ?? portfolio?.allocation?.length ?? 0)}
                  hint="Holdings with value"
                  icon={Coins}
                  accent="neutral"
                />
                <OverviewStatCard
                  compact
                  label="Protocols"
                  value={String(summary?.activeProtocols ?? 0)}
                  hint="Active DeFi venues"
                  icon={Layers}
                  accent="alpha"
                />
                <OverviewStatCard
                  compact
                  label="Rewards"
                  value={formatUsd(summary?.pendingRewardsUsd ?? defi?.rewards?.pendingUsd)}
                  hint="Pending claimable"
                  icon={Gift}
                  accent="marketplace"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
              <section className={cn(overviewCardShell, "relative overflow-hidden")}>
                <div
                  className={overviewCardGlow}
                  style={{ background: overviewAccentBackground("neutral") }}
                  aria-hidden
                />
                <div className="relative z-[1] p-4 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-base font-medium tracking-tight text-foreground">
                      Allocation
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {allocationRows.length > 0
                        ? `${allocationRows.length} positions by value`
                        : "Token mix"}
                    </p>
                  </div>
                  {allocationRows.length === 0 ? (
                    <div className={cn(overviewChartPanelShell, "px-4 py-8 text-center")}>
                      <p className="text-sm text-muted-foreground">No balances.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allocationRows.map((row) => (
                        <ProgressRow
                          key={row.name}
                          label={row.name}
                          value={formatUsd(row.value)}
                          pct={row.pct}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className={cn(overviewCardShell, "relative overflow-hidden")}>
                <div
                  className={overviewCardGlow}
                  style={{ background: overviewAccentBackground("alpha") }}
                  aria-hidden
                />
                <div className="relative z-[1] p-4 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-base font-medium tracking-tight text-foreground">DeFi</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {defiRows.length > 0
                        ? `${defiRows.length} exposure categories`
                        : "Protocol exposure"}
                    </p>
                  </div>
                  {defiRows.length === 0 ? (
                    <div className={cn(overviewChartPanelShell, "px-4 py-8 text-center")}>
                      <p className="text-sm text-muted-foreground">No positions.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {defiRows.map((row) => (
                        <ProgressRow
                          key={row.name}
                          label={row.name}
                          value={formatUsd(row.value)}
                          pct={row.pct}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section>
              <div className="mb-3 sm:mb-4">
                <h2 className="text-base font-medium tracking-tight text-foreground sm:text-lg">
                  Suggestions
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {recommendations.length === 0
                    ? "Guidance based on portfolio health"
                    : `${recommendations.length} recommendation${recommendations.length === 1 ? "" : "s"} · act via Invest`}
                </p>
                {disclaimer ? (
                  <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">
                    {disclaimer}
                  </p>
                ) : null}
              </div>
              {recommendations.length === 0 ? (
                <div
                  className={cn(
                    overviewCardShell,
                    "flex flex-col items-center justify-center px-6 py-12 text-center",
                  )}
                >
                  <p className="text-sm font-medium tracking-tight text-foreground">
                    No suggestions right now
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    This portfolio looks balanced — check Invest for deployment options.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 h-9 rounded-full px-4"
                    asChild
                  >
                    <Link to="/invest">Browse Invest</Link>
                  </Button>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {recommendations.map((r, index) => (
                    <GrowRecommendationCard key={r.id} rec={r} staggerIndex={index} />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </PillarLayout>
  );
}
