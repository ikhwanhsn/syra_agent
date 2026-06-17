import { ExternalLink, Users, Clock, Coins } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KolCampaign } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import { cn } from "@/lib/utils";

function formatSol(sol: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(sol);
}

function timeLeft(endAt: string | null): string {
  if (!endAt) return "—";
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

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

function kolPoolSol(campaign: KolCampaign): number {
  return getKolRewardSol(campaign);
}

export function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  return (
    <article className="card-premium-hover rounded-2xl border border-border/60 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">Campaign</p>
          <h3 className="font-semibold text-lg tracking-tight truncate">{campaign.title}</h3>
        </div>
        <Badge variant="outline" className={cn("shrink-0 capitalize", statusStyles[campaign.status])}>
          {campaign.status.replace("_", " ")}
        </Badge>
      </div>

      {campaign.sourceTweetText ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{campaign.sourceTweetText}</p>
      ) : null}

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Coins className="w-4 h-4 text-primary" />
          <span>{formatSol(kolPoolSol(campaign))} SOL reward</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4 text-primary" />
          <span>{campaign.submissionCount ?? 0} KOLs</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>{timeLeft(campaign.endAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onSelect?.(campaign.id)}
        >
          View details
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
      <div className="panel-glass rounded-2xl p-10 text-center text-muted-foreground">
        No campaigns yet. Projects can launch the first one from the For Projects tab.
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
