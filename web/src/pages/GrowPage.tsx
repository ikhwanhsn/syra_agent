import { useQuery } from "@tanstack/react-query";
import { Loader2, Sprout } from "lucide-react";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { fetchGrowRecommendations } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

export default function GrowPage() {
  const { address, connected } = useWalletContext();
  const { anonymousId, agentAddress } = useAgentWallet();
  const walletAddress = agentAddress ?? address ?? undefined;

  const recommendationsQ = useQuery({
    queryKey: ["grow", "recommendations", walletAddress, anonymousId],
    queryFn: () => fetchGrowRecommendations(walletAddress, anonymousId ?? undefined),
    enabled: Boolean(walletAddress),
    staleTime: 60_000,
  });

  const recommendations = recommendationsQ.data?.data?.recommendations ?? [];
  const disclaimer = recommendationsQ.data?.data?.disclaimer;

  return (
    <PillarLayout
      embedded
      title="Grow"
      tagline="Yield + portfolio optimization"
      description="Deterministic rebalance and yield suggestions — analysis first. Apply routes through Invest with explicit confirmation."
    >
      {!connected && !walletAddress ? (
        <div className={cn(overviewCardShell, "p-8 text-center text-sm text-muted-foreground")}>
          Connect wallet to load portfolio recommendations.
        </div>
      ) : recommendationsQ.isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-4">
          {disclaimer ? (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-muted-foreground">
              {disclaimer}
            </p>
          ) : null}
          <ul className="grid gap-4 md:grid-cols-2">
            {recommendations.map(
              (r: {
                id: string;
                title: string;
                rationale: string;
                priority: string;
                type: string;
                suggestedAdapter?: string;
              }) => (
                <li key={r.id} className={cn(overviewCardShell, "p-5")}>
                  <div className="mb-2 flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{r.priority}</span>
                  </div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.rationale}</p>
                  {r.suggestedAdapter ? (
                    <p className="mt-3 text-xs text-primary">Suggested: {r.suggestedAdapter}</p>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </PillarLayout>
  );
}
