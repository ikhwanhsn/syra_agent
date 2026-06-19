import { useQuery } from "@tanstack/react-query";
import { Loader2, Rocket, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { fetchInvestOpportunities, fetchInvestPositions } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

export default function InvestPage() {
  const { anonymousId } = useAgentWallet();

  const opportunitiesQ = useQuery({
    queryKey: ["invest", "opportunities", anonymousId],
    queryFn: () => fetchInvestOpportunities(anonymousId ?? undefined),
    staleTime: 60_000,
  });

  const positionsQ = useQuery({
    queryKey: ["invest", "positions", anonymousId],
    queryFn: () => fetchInvestPositions(anonymousId ?? undefined),
    enabled: Boolean(anonymousId),
    staleTime: 60_000,
  });

  const opportunities = opportunitiesQ.data?.data?.opportunities ?? [];
  const positions = positionsQ.data?.data?.positions ?? [];

  return (
    <PillarLayout
      embedded
      title="Invest"
      tagline="Deploy capital autonomously"
      description="Unified surface for Giza yield, Meteora LP, Jupiter swaps, and RISE markets. Execution is policy-gated — probabilistic, not guaranteed."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/lp-experiment">LP lab</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cn(overviewCardShell, "p-6")}>
          <div className="mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">Opportunities</h2>
          </div>
          {opportunitiesQ.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <ul className="space-y-3">
              {opportunities.map((o: { adapter: string; label: string; description: string; status: string }) => (
                <li key={o.adapter} className="rounded-lg border border-border/50 bg-muted/20 p-4">
                  <p className="font-medium">{o.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{o.status}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn(overviewCardShell, "p-6")}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">Open positions</h2>
          </div>
          {!anonymousId ? (
            <p className="text-sm text-muted-foreground">Connect wallet to view LP-Real positions.</p>
          ) : positionsQ.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : positions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open positions yet.</p>
          ) : (
            <ul className="space-y-3">
              {positions.map((p: { id: string; adapter: string; pool?: string; status?: string }) => (
                <li key={p.id} className="rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
                  <span className="font-medium">{p.adapter}</span>
                  {p.pool ? <span className="text-muted-foreground"> · {p.pool}</span> : null}
                  {p.status ? <span className="block text-xs text-muted-foreground mt-1">{p.status}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PillarLayout>
  );
}
