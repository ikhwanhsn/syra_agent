import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import { InvestPageSkeleton } from "@/components/pillars/PillarPageSkeletons";
import { InvestDepositModal } from "@/components/invest/InvestDepositModal";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchInvestOpportunities,
  type InvestOpportunity,
} from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

const tvlFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const apyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function kindLabel(kind?: string): string {
  if (kind === "liquid_staking") return "Liquid staking";
  if (kind === "lending") return "Lending";
  if (kind === "lp") return "Liquidity";
  return "Onchain";
}

function OpportunityCard({
  opportunity,
  onDeposit,
}: {
  opportunity: InvestOpportunity;
  onDeposit: (o: InvestOpportunity) => void;
}) {
  const executable = Boolean(opportunity.executable);
  const deepLink = opportunity.deepLinkUrl?.trim() || null;

  return (
    <li className={cn(overviewCardShell, "min-w-0 flex flex-col")}>
      <div className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium tracking-tight text-foreground">{opportunity.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{kindLabel(opportunity.kind)} · Solana</p>
            </div>
            {opportunity.apyPct != null ? (
              <span className="shrink-0 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
                {apyFmt.format(opportunity.apyPct)}% APY
              </span>
            ) : (
              <span className="shrink-0 rounded-full border border-border/40 px-2 py-0.5 text-xs text-muted-foreground">
                APY —
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{opportunity.description}</p>
          <p className="text-xs text-muted-foreground/90">
            TVL{" "}
            {opportunity.tvlUsd != null ? tvlFmt.format(opportunity.tvlUsd) : "—"}
            {opportunity.yieldSource ? (
              <span className="text-muted-foreground/70"> · {opportunity.yieldSource}</span>
            ) : null}
          </p>
        </div>

        {executable ? (
          <Button
            className="h-9 w-full rounded-full sm:w-auto"
            onClick={() => onDeposit(opportunity)}
          >
            Deposit
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : deepLink ? (
          <Button variant="outline" className="h-9 w-full rounded-full sm:w-auto" asChild>
            <a href={deepLink} target="_blank" rel="noopener noreferrer">
              Invest on {opportunity.label}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="h-9 w-full rounded-full sm:w-auto" asChild>
            <Link to="/wallet">Fund</Link>
          </Button>
        )}
      </div>
    </li>
  );
}

export default function InvestPage() {
  const { connected } = useWalletContext();
  const [depositTarget, setDepositTarget] = useState<InvestOpportunity | null>(null);

  const opportunitiesQ = useQuery({
    queryKey: ["invest", "opportunities"],
    queryFn: () => fetchInvestOpportunities(),
    staleTime: 60_000,
  });

  const showSkeleton = useMinimumSkeleton(opportunitiesQ.isLoading && !opportunitiesQ.data);

  const opportunities = useMemo(
    () => opportunitiesQ.data?.data?.opportunities ?? [],
    [opportunitiesQ.data],
  );

  return (
    <PillarLayout
      embedded
      title="Invest"
      tagline="Deploy capital"
      description="Onchain Solana protocols with live APY/TVL. Liquid stake via Marinade or Jito from your invest wallet, or open Kamino, marginfi, and Meteora to deploy."
      actions={
        <Button variant="outline" size="sm" className="h-9 w-full rounded-full px-4 sm:w-auto" asChild>
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
            <PillarConnectCTA title="Fund your invest treasury to deposit" />
          )}

          <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
            <section className="min-w-0 lg:col-span-8">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground sm:mb-4">
                Opportunities
              </h2>
              {opportunitiesQ.isError ? (
                <p className="text-sm text-muted-foreground">Could not load opportunities.</p>
              ) : opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No opportunities available.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {opportunities.map((o) => (
                    <OpportunityCard
                      key={o.adapter}
                      opportunity={o}
                      onDeposit={setDepositTarget}
                    />
                  ))}
                </ul>
              )}
              {opportunitiesQ.data?.data?.disclaimer ? (
                <p className="mt-3 text-xs text-muted-foreground/80 leading-relaxed">
                  {opportunitiesQ.data.data.disclaimer}
                </p>
              ) : null}
            </section>

            <aside className="min-w-0 lg:col-span-4">
              <section className={cn(overviewCardShell, "p-4 sm:p-6")}>
                <p className={overviewKickerClass}>Get started</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Fund your invest agent wallet, then deposit SOL into Marinade or Jito in-app.
                  For lending and LP, open the protocol dApp from each card.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button className="h-10 w-full rounded-full sm:h-9" asChild>
                    <Link to="/wallet">
                      Fund invest wallet
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-10 w-full rounded-full sm:h-9" asChild>
                    <Link to="/swap">Open swap</Link>
                  </Button>
                </div>
              </section>
            </aside>
          </div>

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
