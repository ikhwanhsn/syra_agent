import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Layers, Percent, Wallet } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import { InvestPageSkeleton } from "@/components/pillars/PillarPageSkeletons";
import { InvestDepositModal } from "@/components/invest/InvestDepositModal";
import {
  InvestOpportunityCard,
  kindLabel,
} from "@/components/invest/InvestOpportunityCard";
import { InvestPositionsPanel } from "@/components/invest/InvestPositionsPanel";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import {
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchInvestOpportunities,
  fetchInvestPositions,
  type InvestOpportunity,
} from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

type KindFilter = "All" | "liquid_staking" | "lending" | "lp";

const KIND_FILTERS: Array<{ id: KindFilter; label: string }> = [
  { id: "All", label: "All" },
  { id: "liquid_staking", label: "Liquid staking" },
  { id: "lending", label: "Lending" },
  { id: "lp", label: "Liquidity" },
];

const apyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const solFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatBestApy(opportunities: InvestOpportunity[]): string {
  let best: number | null = null;
  for (const o of opportunities) {
    if (o.apyPct != null && Number.isFinite(o.apyPct)) {
      if (best == null || o.apyPct > best) best = o.apyPct;
    }
  }
  return best == null ? "—" : `${apyFmt.format(best)}%`;
}

export default function InvestPage() {
  const { connected } = useWalletContext();
  const [depositTarget, setDepositTarget] = useState<InvestOpportunity | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("All");

  const opportunitiesQ = useQuery({
    queryKey: ["invest", "opportunities"],
    queryFn: () => fetchInvestOpportunities(),
    staleTime: 60_000,
  });

  const positionsQ = useQuery({
    queryKey: ["invest", "positions"],
    queryFn: () => fetchInvestPositions(),
    enabled: connected,
    staleTime: 30_000,
  });

  const showSkeleton = useMinimumSkeleton(
    opportunitiesQ.isLoading && !opportunitiesQ.data,
  );

  const opportunities = useMemo(
    () => opportunitiesQ.data?.data?.opportunities ?? [],
    [opportunitiesQ.data],
  );

  const positions = useMemo(
    () => positionsQ.data?.data?.positions ?? [],
    [positionsQ.data],
  );

  const filtered = useMemo(() => {
    if (kindFilter === "All") return opportunities;
    return opportunities.filter((o) => o.kind === kindFilter);
  }, [opportunities, kindFilter]);

  const executableCount = useMemo(
    () => opportunities.filter((o) => o.executable).length,
    [opportunities],
  );

  const firstExecutable = useMemo(
    () => opportunities.find((o) => o.executable) ?? null,
    [opportunities],
  );

  const deployedSol = useMemo(() => {
    if (connected && positions.length > 0) {
      const sum = positions.reduce((acc, p) => {
        if (p.deployedSol != null && Number.isFinite(p.deployedSol)) {
          return acc + p.deployedSol;
        }
        return acc;
      }, 0);
      return sum > 0 ? `${solFmt.format(sum)} SOL` : "0 SOL";
    }
    let fromSummary: number | null = null;
    for (const o of opportunities) {
      const d = o.summary?.deployedSol;
      if (d != null && Number.isFinite(d)) {
        fromSummary = (fromSummary ?? 0) + d;
      }
    }
    if (fromSummary != null && fromSummary > 0) {
      return `${solFmt.format(fromSummary)} SOL`;
    }
    return connected ? "0 SOL" : "—";
  }, [connected, positions, opportunities]);

  const hasActiveFilter = kindFilter !== "All";

  return (
    <PillarLayout
      embedded
      title="Invest"
      tagline="Deploy capital"
      description="Live Solana yields. Stake in-app via Marinade or Jito, or open lending and LP protocols."
      actions={
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full rounded-full px-4 sm:w-auto"
          asChild
        >
          <Link to="/swap">Swap</Link>
        </Button>
      }
    >
      {showSkeleton ? (
        <InvestPageSkeleton />
      ) : (
        <div className="w-full space-y-6 sm:space-y-8">
          {!connected ? (
            <PillarConnectCTA
              title="Connect to fund and invest"
              description="Browse freely. Connect when you're ready to deposit from your invest agent wallet."
            />
          ) : (
            <PillarConnectCTA
              title="Fund your invest treasury to deposit"
              description="Keep SOL in your invest agent wallet, then deposit into Marinade or Jito in-app."
              fundHref="/wallet"
              fundLabel="Fund wallet"
            />
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <OverviewStatCard
              compact
              label="Best APY"
              value={formatBestApy(opportunities)}
              hint="Across listed protocols"
              icon={Percent}
              accent="marketplace"
              error={opportunitiesQ.isError}
            />
            <OverviewStatCard
              compact
              label="In-app"
              value={String(executableCount)}
              hint="Deposit without leaving Syra"
              icon={Layers}
              accent="neutral"
              error={opportunitiesQ.isError}
            />
            <OverviewStatCard
              compact
              label="Deployed"
              value={deployedSol}
              hint={connected ? "From invest positions" : "Connect to track"}
              icon={Wallet}
              accent="alpha"
              isLoading={connected && positionsQ.isLoading && !positionsQ.data}
              error={connected && positionsQ.isError}
            />
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
            <section className="min-w-0 lg:col-span-8">
              <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Opportunities
                </h2>
                <div
                  className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label="Filter by kind"
                >
                  {KIND_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setKindFilter(f.id)}
                      className={cn(
                        "h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors duration-200",
                        kindFilter === f.id
                          ? "border-foreground/10 bg-foreground text-background shadow-sm"
                          : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {opportunitiesQ.isError ? (
                <div
                  className={cn(
                    overviewCardShell,
                    "flex flex-col items-start gap-3 px-5 py-8 sm:items-center sm:text-center",
                  )}
                >
                  <p className="text-sm font-medium tracking-tight text-foreground">
                    Could not load opportunities
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                    Check your connection and try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full"
                    onClick={() => void opportunitiesQ.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className={cn(
                    overviewCardShell,
                    "flex flex-col items-start gap-3 px-5 py-8 sm:items-center sm:text-center",
                  )}
                >
                  <p className="text-sm font-medium tracking-tight text-foreground">
                    {hasActiveFilter
                      ? `No ${kindLabel(kindFilter).toLowerCase()} opportunities`
                      : "No opportunities available"}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                    {hasActiveFilter
                      ? "Try another filter, or clear to see the full list."
                      : "Check back soon for live Solana yield opportunities."}
                  </p>
                  {hasActiveFilter ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-full"
                      onClick={() => setKindFilter("All")}
                    >
                      Clear filter
                    </Button>
                  ) : null}
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {filtered.map((o) => (
                    <InvestOpportunityCard
                      key={o.adapter}
                      opportunity={o}
                      onDeposit={setDepositTarget}
                    />
                  ))}
                </ul>
              )}
            </section>

            <aside className="min-w-0 lg:col-span-4">
              {connected ? (
                <InvestPositionsPanel
                  positions={positions}
                  isLoading={positionsQ.isLoading && !positionsQ.data}
                  isError={positionsQ.isError}
                  onRetry={() => void positionsQ.refetch()}
                  onDepositFirst={
                    firstExecutable
                      ? () => setDepositTarget(firstExecutable)
                      : undefined
                  }
                />
              ) : (
                <section className={cn(overviewCardShell, "p-4 sm:p-6")}>
                  <p className={overviewKickerClass}>Get started</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Connect and fund your invest agent wallet, then deposit SOL into
                    Marinade or Jito in-app. Lending and LP open in the protocol dApp.
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <Button className="h-10 w-full rounded-full sm:h-9" asChild>
                      <Link to="/wallet">
                        Fund invest wallet
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Need SOL?{" "}
                      <Link
                        to="/swap"
                        className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Open swap
                      </Link>
                    </p>
                  </div>
                </section>
              )}
            </aside>
          </div>

          {opportunitiesQ.data?.data?.disclaimer ? (
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {opportunitiesQ.data.data.disclaimer}
            </p>
          ) : null}

          <InvestDepositModal
            open={depositTarget != null}
            opportunity={depositTarget}
            onOpenChange={(open) => {
              if (!open) setDepositTarget(null);
            }}
          />
        </div>
      )}
    </PillarLayout>
  );
}
