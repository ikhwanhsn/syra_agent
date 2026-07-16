import { ExternalLink, Users, Clock, Coins, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignTweetPreview } from "@/components/kol/SourceTweetMedia";
import type { KolCampaign } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import {
  getCampaignDisplayLabel,
  getCampaignDisplayPhase,
  getCampaignDisplayStyle,
  isCampaignLive,
} from "@/lib/kolCampaignStatus";
import { formatSol, formatTimeLeft } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  campaign: KolCampaign;
  onSelect?: (id: string) => void;
}

export function CampaignCard({ campaign, onSelect }: CampaignCardProps) {
  const rewardSol = getKolRewardSol(campaign);
  const displayPhase = getCampaignDisplayPhase(campaign);
  const isLive = isCampaignLive(campaign);
  const timeLeft = formatTimeLeft(campaign.endAt);
  const participated = campaign.participated === true;

  return (
    <article className="card-premium-hover rounded-2xl border border-border/60 p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">
            {isLive
              ? "Earn SOL"
              : displayPhase === "pending_deposit"
                ? "Needs payment"
                : "Campaign"}
          </p>
          <h3 className="font-semibold text-lg tracking-tight truncate">{campaign.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant="outline" className={cn("shrink-0", getCampaignDisplayStyle(displayPhase))}>
            {getCampaignDisplayLabel(displayPhase)}
          </Badge>
          {participated ? (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
            >
              <Check className="w-3 h-3" aria-hidden />
              Participated
            </Badge>
          ) : null}
        </div>
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

      <CampaignTweetPreview
        media={campaign.sourceTweetMedia}
        tweetUrl={campaign.sourceTweetUrl}
      />

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

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{campaign.submissionCount ?? 0} KOLs joined</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{isLive ? timeLeft : timeLeft === "Ended" ? "Ended" : `${campaign.durationDays} days`}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto pt-1 sm:flex-row sm:items-center sm:gap-2">
        <Button
          variant={isLive && !participated ? "hero" : "outline"}
          size="sm"
          className="rounded-full gap-1.5 w-full sm:w-auto shrink-0"
          onClick={() => onSelect?.(campaign.id)}
        >
          {participated
            ? isLive
              ? "View your rank"
              : "View results"
            : isLive
              ? "Join & earn"
              : displayPhase === "pending_deposit"
                ? "Continue & pay"
                : displayPhase === "finalizing"
                  ? "View status"
                  : "View results"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <a
          href={campaign.sourceTweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary sm:ml-auto py-1.5 sm:py-0"
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
