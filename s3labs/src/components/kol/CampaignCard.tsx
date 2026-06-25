import { ExternalLink, Users, Clock, Coins, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KolCampaign } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import { formatSol, formatTimeLeft } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

const statusStyles: Record<KolCampaign["status"], string> = {
  active: "bg-primary/15 text-primary border-primary/30",
  pending_deposit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

interface CampaignCardProps {
  campaign: KolCampaign;
  onSelect?: (id: string) => void;
}

export function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  const rewardSol = getKolRewardSol(campaign);
  const isActive = campaign.status === "active";
  const timeLeft = formatTimeLeft(campaign.endAt);

  return (
    <article className="card-premium-hover rounded-2xl border border-border/60 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">{isActive ? "Earn SOL" : "Campaign"}</p>
          <h3 className="font-semibold text-lg tracking-tight truncate">{campaign.title}</h3>
        </div>
        <Badge variant="outline" className={cn("shrink-0 capitalize", statusStyles[campaign.status])}>
          {campaign.status.replace("_", " ")}
        </Badge>
      </div>

      {campaign.sourceAuthorHandle ? (
        <Link
          to={`/kol/${encodeURIComponent(campaign.sourceAuthorHandle)}`}
          className="text-xs text-primary hover:underline w-fit"
        >
          by @{campaign.sourceAuthorHandle}
          {campaign.sourceAuthorVerified ? " ✓" : ""}
        </Link>
      ) : null}

      {campaign.sourceTweetText ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{campaign.sourceTweetText}</p>
      ) : null}

      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary shrink-0" />
          <span className="text-lg font-semibold tabular-nums text-primary">
            {formatSol(rewardSol)} SOL
          </span>
          <span className="text-xs text-muted-foreground">reward pool</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span>{campaign.submissionCount ?? 0} KOLs joined</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>{isActive ? timeLeft : timeLeft === "Ended" ? "Ended" : `${campaign.durationDays} days`}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        <Button
          variant={isActive ? "hero" : "outline"}
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => onSelect?.(campaign.id)}
        >
          {isActive ? "Join & earn" : "View results"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <a
          href={campaign.sourceTweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary ml-auto"
        >
          Source post
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}

interface CampaignGridProps {
  campaigns: KolCampaign[];
  onSelect?: (id: string) => void;
}

export function CampaignGrid({ campaigns, onSelect }: CampaignGridProps) {
  if (campaigns.length === 0) {
    return (
      <div className="panel-glass rounded-2xl p-10 text-center space-y-2">
        <p className="font-medium">No campaigns here yet</p>
        <p className="text-sm text-muted-foreground">
          Projects can launch the first campaign from the{" "}
          <span className="text-foreground">For Projects</span> tab — or check back soon for new
          earning opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function CampaignBrowseLink({ id }: { id: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="rounded-full">
      <Link to={`/kol?campaign=${id}`}>Open</Link>
    </Button>
  );
}
