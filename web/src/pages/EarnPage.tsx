import { useQuery } from "@tanstack/react-query";
import { Coins, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { fetchEarnSummary } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

export default function EarnPage() {
  const { address } = useWalletContext();
  const { anonymousId } = useAgentWallet();
  const key = anonymousId ?? address ?? "";

  const summaryQ = useQuery({
    queryKey: ["earn", "summary", key],
    queryFn: () => fetchEarnSummary(key),
    enabled: Boolean(key),
    staleTime: 60_000,
  });

  const data = summaryQ.data?.data;
  const earnings = data?.earnings ?? [];

  return (
    <PillarLayout
      embedded
      title="Earn"
      tagline="Agents monetize skills"
      description="Creator attribution on paid skill/prompt usage. KOL marketplace and 8004 registry complement the earn rail."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/overview">Prompt marketplace</Link>
        </Button>
      }
    >
      {!key ? (
        <div className={cn(overviewCardShell, "p-8 text-center text-sm text-muted-foreground")}>
          Connect wallet to view earnings.
        </div>
      ) : summaryQ.isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className={cn(overviewCardShell, "p-6 lg:col-span-1")}>
            <Coins className="mb-3 h-6 w-6 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-semibold">${(data?.pendingUsd ?? 0).toFixed(4)}</p>
            <p className="mt-4 text-sm text-muted-foreground">Paid out</p>
            <p className="text-xl font-semibold">${(data?.paidUsd ?? 0).toFixed(4)}</p>
          </div>
          <div className={cn(overviewCardShell, "p-6 lg:col-span-2")}>
            <h2 className="mb-4 text-lg font-semibold">Recent attributions</h2>
            {earnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No skill earnings yet. Publish prompts in the marketplace to earn when others use paid tools with your skills.
              </p>
            ) : (
              <ul className="space-y-2">
                {earnings.map((e: { id: string; paidPath: string; creatorShareUsd: number; status: string }) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-muted-foreground">{e.paidPath}</span>
                    <span className="shrink-0 font-medium">${e.creatorShareUsd.toFixed(4)}</span>
                    <span className="shrink-0 text-xs uppercase text-muted-foreground">{e.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </PillarLayout>
  );
}
