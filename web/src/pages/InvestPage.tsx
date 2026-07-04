import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/navigation";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { PillarConnectCTA } from "@/components/pillars/PillarConnectCTA";
import { InvestPageSkeleton } from "@/components/pillars/PillarPageSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/contexts/WalletContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { fetchInvestOpportunities } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

function opportunityCta(adapter: string): { href: string; label: string } {
  if (adapter === "jupiter") return { href: "/swap", label: "Open swap" };
  return { href: "/wallet", label: "Fund" };
}

export default function InvestPage() {
  const { connected } = useWalletContext();

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
      description="Swap tokens on Solana via Jupiter. More strategies will appear here as they ship."
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
              title="Connect to fund and swap"
              description="Browse freely. Connect when you're ready to act."
            />
          ) : (
            <PillarConnectCTA title="Fund your treasury to swap" />
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
                  {opportunities.map((o) => {
                    const cta = opportunityCta(o.adapter);
                    return (
                      <li key={o.adapter} className={cn(overviewCardShell, "min-w-0")}>
                        <Link
                          to={cta.href}
                          className="group flex h-full flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/15 sm:p-5"
                        >
                          <div className="min-w-0">
                            <p className="font-medium tracking-tight text-foreground">{o.label}</p>
                            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                              {o.description}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 text-sm font-medium text-foreground/80 group-hover:text-foreground">
                            {cta.label}
                            <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
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
                  Swap any supported Solana token through Jupiter. Fund your agent wallet, then open
                  swap to trade.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button className="h-10 w-full rounded-full sm:h-9" asChild>
                    <Link to="/swap">
                      Open swap
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-10 w-full rounded-full sm:h-9" asChild>
                    <Link to="/wallet">Fund wallet</Link>
                  </Button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}
    </PillarLayout>
  );
}
