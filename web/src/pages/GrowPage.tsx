import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wallet } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import { GrowAnalysisSkeleton } from "@/components/pillars/PillarPageSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchGrowPortfolio,
  fetchGrowRecommendations,
  type GrowAllocationItem,
  type GrowRecommendation,
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

function adapterHref(adapter?: string): string {
  if (adapter === "jupiter") return "/swap";
  return "/invest";
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
      <div className="h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full bg-foreground/70 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(pct, 0))}%` }}
        />
      </div>
    </div>
  );
}

function RecommendationRow({ rec }: { rec: GrowRecommendation }) {
  return (
    <li className="flex h-full flex-col justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            {rec.priority}
          </span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground/70">{rec.type}</span>
        </div>
        <p className="mt-1.5 font-medium tracking-tight">{rec.title}</p>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{rec.rationale}</p>
      </div>
      {rec.suggestedAdapter ? (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-2 rounded-full text-xs"
            asChild
          >
            <Link to={adapterHref(rec.suggestedAdapter)}>
              Invest
              <ArrowRight className="ml-1 h-3 w-3" aria-hidden />
            </Link>
          </Button>
        </div>
      ) : null}
    </li>
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
    >
      <div className="w-full space-y-6 sm:space-y-8">
        <section className={cn(overviewCardShell, "p-4 sm:p-5 lg:p-6")}>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <Input
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runAnalysis();
                }}
                placeholder="Paste any Solana address"
                className="h-11 w-full rounded-xl border-border/40 bg-background/50 font-mono text-sm sm:h-12"
                aria-invalid={Boolean(addressError)}
              />
              {addressError ? (
                <p className="text-xs text-destructive">{addressError}</p>
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
        </section>

        {!activeAddress ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <p className="text-sm text-muted-foreground sm:col-span-1 lg:col-span-2">
              Enter an address to see allocation, DeFi exposure, and suggestions.
            </p>
            {!connected ? (
              <PillarConnectCTA
                variant="inline"
                title="Or connect your wallet"
                description="Track your agent treasury live."
                hideWhenConnected={false}
              />
            ) : null}
          </div>
        ) : null}

        {showSkeleton ? <GrowAnalysisSkeleton /> : null}

        {hasError ? (
          <p className="text-sm text-muted-foreground">
            {portfolioQ.data?.error ?? "Could not load this portfolio."}
          </p>
        ) : null}

        {hasData ? (
          <>
            {!connected ? (
              <PillarConnectCTA title="Connect to track live" />
            ) : (
              <PillarConnectCTA title="Fund to act on suggestions" />
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-8">
              <div className="min-w-0 lg:col-span-5">
                <p className={overviewKickerClass}>Net worth</p>
                <p className="mt-1 break-all font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl lg:text-5xl">
                  {formatUsd(summary?.totalValueUsd ?? portfolio?.totalValueUsd)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:col-span-7">
                <div className="min-w-0">
                  <p className={overviewKickerClass}>Tokens</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl">
                    {summary?.tokenCount ?? portfolio?.allocation?.length ?? 0}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className={overviewKickerClass}>Protocols</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl">
                    {summary?.activeProtocols ?? 0}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className={overviewKickerClass}>Rewards</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl">
                    {formatUsd(summary?.pendingRewardsUsd ?? defi?.rewards?.pendingUsd)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
              <section className={cn(overviewCardShell, "p-4 sm:p-6")}>
                <h2 className="mb-4 text-sm font-medium text-muted-foreground">Allocation</h2>
                {allocationRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No balances.</p>
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
              </section>

              <section className={cn(overviewCardShell, "p-4 sm:p-6")}>
                <h2 className="mb-4 text-sm font-medium text-muted-foreground">DeFi</h2>
                {defiRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No positions.</p>
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
              </section>
            </div>

            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground sm:mb-4">
                Suggestions
              </h2>
              {disclaimer ? (
                <p className="mb-3 text-xs text-muted-foreground/80 leading-relaxed">{disclaimer}</p>
              ) : null}
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No suggestions.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {recommendations.map((r) => (
                    <li key={r.id} className={cn(overviewCardShell, "min-w-0")}>
                      <RecommendationRow rec={r} />
                    </li>
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
