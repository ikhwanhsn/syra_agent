import { ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KolCampaign, KolLeaderboardEntry } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { SubmitEngagementForm } from "./SubmitEngagementForm";

interface CampaignDetailProps {
  campaign: KolCampaign;
  leaderboard: KolLeaderboardEntry[];
  onClose: () => void;
  onRefresh?: () => void;
}

function formatSol(sol: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(sol);
}

export function CampaignDetail({ campaign, leaderboard, onClose, onRefresh }: CampaignDetailProps) {
  return (
    <div className="space-y-6">
      <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow mb-2">Campaign detail</p>
            <h2 className="heading-section">{campaign.title}</h2>
            {campaign.description ? (
              <p className="text-sm text-muted-foreground mt-2">{campaign.description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="outline" className="capitalize">
            {campaign.status.replace("_", " ")}
          </Badge>
          {campaign.sourceAuthorHandle ? (
            <Badge variant="outline" asChild>
              <Link to={`/kol/${encodeURIComponent(campaign.sourceAuthorHandle)}`}>
                @{campaign.sourceAuthorHandle}
              </Link>
            </Badge>
          ) : null}
          <Badge variant="outline">
            {formatSol(getKolRewardSol(campaign))} SOL reward
          </Badge>
          <Badge variant="outline">{campaign.durationDays} days</Badge>
        </div>

        {campaign.sourceTweetText ? (
          <blockquote className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
            {campaign.sourceTweetText}
          </blockquote>
        ) : null}

        <a
          href={campaign.sourceTweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary mt-4 hover:underline"
        >
          View source post on X
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {campaign.status === "active" ? (
        <SubmitEngagementForm
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          onSubmitted={onRefresh}
        />
      ) : null}

      <div className="space-y-3">
        <h3 className="font-semibold">Leaderboard</h3>
        <CampaignLeaderboard entries={leaderboard} campaignStatus={campaign.status} />
      </div>
    </div>
  );
}
