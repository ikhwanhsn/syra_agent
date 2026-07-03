import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { EarnPanelListSkeleton } from "@/components/earn/EarnSkeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchCampaigns,
  fetchWalletEarnings,
  getKolRewardSol,
  S3LABS_KOL_URL,
  type KolCampaign,
} from "@/lib/kolApi";
import { formatSol, formatTimeLeft } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

function KolCampaignRow({ campaign }: { campaign: KolCampaign }) {
  const rewardSol = getKolRewardSol(campaign);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{campaign.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatSol(rewardSol)} SOL · {formatTimeLeft(campaign.endAt)}
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={`${S3LABS_KOL_URL}?campaign=${encodeURIComponent(campaign.id)}`} target="_blank" rel="noreferrer">
          Join
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </li>
  );
}

type EarnKolPanelProps = {
  walletAddress: string | null;
  connected: boolean;
};

export function EarnKolPanel({ walletAddress, connected }: EarnKolPanelProps) {
  const campaignsQ = useQuery({
    queryKey: ["earn", "kol-campaigns", "active"],
    queryFn: () => fetchCampaigns("active"),
    staleTime: 60_000,
  });

  const earningsQ = useQuery({
    queryKey: ["earn", "kol-earnings", walletAddress],
    queryFn: () => fetchWalletEarnings(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
  });

  const campaigns = (campaignsQ.data?.campaigns ?? []).slice(0, 5);
  const showSkeleton = useMinimumSkeleton(campaignsQ.isLoading);

  return (
    <section className="space-y-4">
      <EarnPanelHeader
        title="Promote on X"
        action={
          <Button size="sm" variant="outline" asChild>
            <a href={S3LABS_KOL_URL} target="_blank" rel="noreferrer">
              Marketplace
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        }
      />

      <p className="text-sm text-muted-foreground">
        Post about funded campaigns and earn SOL when they end.
      </p>

      {connected && earningsQ.data ? (
        <div className={cn(overviewCardShell, "grid grid-cols-2 gap-4 p-4 text-sm")}>
          <div>
            <p className="text-muted-foreground">Projected</p>
            <p className="font-semibold tabular-nums">{formatSol(earningsQ.data.totals.projectedSol)} SOL</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="font-semibold tabular-nums">{formatSol(earningsQ.data.totals.paidSol)} SOL</p>
          </div>
        </div>
      ) : null}

      {showSkeleton ? (
        <EarnPanelListSkeleton rows={4} />
      ) : campaigns.length === 0 ? (
        <p className={cn(overviewCardShell, "p-4 text-sm text-muted-foreground")}>
          No active campaigns. Check the marketplace for new ones.
        </p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map((campaign) => (
            <KolCampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </ul>
      )}
    </section>
  );
}
