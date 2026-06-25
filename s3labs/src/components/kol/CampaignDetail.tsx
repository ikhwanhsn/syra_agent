import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Coins,
  MessageSquare,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KolCampaign, KolLeaderboardEntry } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import { formatSol, formatTimeLeft } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { SourceTweetCard } from "./SourceTweetCard";
import { SubmitEngagementForm } from "./SubmitEngagementForm";

interface CampaignDetailProps {
  campaign: KolCampaign;
  leaderboard: KolLeaderboardEntry[];
  onClose: () => void;
  onRefresh?: () => void;
}

const statusStyles: Record<KolCampaign["status"], string> = {
  active: "bg-primary/15 text-primary border-primary/30",
  pending_deposit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusMessages: Record<KolCampaign["status"], string> = {
  active: "This campaign is live — reply or quote the post below, then submit your URL to start earning.",
  pending_deposit: "Waiting for the project to fund this campaign.",
  completed: "Campaign ended. Final payouts have been calculated based on engagement at snapshot.",
  cancelled: "This campaign was cancelled and is no longer accepting submissions.",
};

const earnSteps = [
  { step: 1, text: "Read the source post and craft your reply or quote tweet on X." },
  { step: 2, text: "Paste your tweet URL below and connect your Solana wallet." },
  { step: 3, text: "Climb the leaderboard — rewards split automatically when time runs out." },
] as const;

export function CampaignDetail({ campaign, leaderboard, onClose, onRefresh }: CampaignDetailProps) {
  const rewardSol = getKolRewardSol(campaign);
  const isActive = campaign.status === "active";
  const timeLeft = formatTimeLeft(campaign.endAt);
  const participantCount = campaign.submissionCount ?? leaderboard.length;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={onClose}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to campaigns
      </Button>

      {/* Reward hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={`capitalize ${statusStyles[campaign.status]}`}>
            {campaign.status.replace("_", " ")}
          </Badge>
          {isActive && timeLeft !== "Ended" ? (
            <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-400">
              <Clock className="w-3 h-3" />
              {timeLeft}
            </Badge>
          ) : null}
        </div>

        <p className="eyebrow mb-2">{isActive ? "Earn now" : "Campaign"}</p>
        <h2 className="heading-section text-2xl sm:text-3xl max-w-2xl">{campaign.title}</h2>
        {campaign.description ? (
          <p className="text-muted-foreground mt-2 max-w-2xl">{campaign.description}</p>
        ) : null}

        <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{statusMessages[campaign.status]}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 max-w-lg">
          <div className="rounded-xl border border-primary/20 bg-background/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Coins className="w-3.5 h-3.5 text-primary" />
              Reward pool
            </div>
            <p className="text-2xl font-semibold tabular-nums text-primary">
              {formatSol(rewardSol)} <span className="text-base font-medium">SOL</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              KOLs joined
            </div>
            <p className="text-2xl font-semibold tabular-nums">{participantCount}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 backdrop-blur-sm p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Duration
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {isActive ? timeLeft : `${campaign.durationDays}d`}
            </p>
          </div>
        </div>

        {campaign.sourceAuthorHandle ? (
          <div className="mt-4">
            <Link
              to={`/kol/${encodeURIComponent(campaign.sourceAuthorHandle)}`}
              className={cn(
                badgeVariants({ variant: "outline" }),
                "inline-flex items-center gap-1.5 w-fit hover:bg-muted/50 transition-colors",
              )}
            >
              <span>@{campaign.sourceAuthorHandle}</span>
              {campaign.sourceAuthorVerified ? (
                <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Verified" />
              ) : null}
            </Link>
          </div>
        ) : null}
      </div>

      {/* Source post */}
      <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Post to amplify</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Reply to or quote this post on X. Your engagement on your submission determines your share of
          the {formatSol(rewardSol)} SOL pool.
        </p>

        <SourceTweetCard
          text={campaign.sourceTweetText}
          tweetUrl={campaign.sourceTweetUrl}
          authorHandle={campaign.sourceAuthorHandle}
          authorName={campaign.sourceAuthorName}
          authorVerified={campaign.sourceAuthorVerified}
          media={campaign.sourceTweetMedia}
        />
      </div>

      {/* How to earn — active campaigns */}
      {isActive ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8">
          <p className="eyebrow mb-2">Your path to rewards</p>
          <h3 className="font-semibold text-lg mb-4">How to claim your share</h3>
          <ol className="space-y-3">
            {earnSteps.map((item) => (
              <li key={item.step} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  {item.step}
                </span>
                <span className="text-muted-foreground pt-0.5 leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {isActive ? (
        <SubmitEngagementForm
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          rewardSol={rewardSol}
          onSubmitted={onRefresh}
        />
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-lg">Live leaderboard</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {campaign.status === "completed"
                ? "Final rankings and confirmed payouts."
                : "Rankings update daily. Higher score = larger projected payout."}
            </p>
          </div>
          {leaderboard.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {leaderboard.length} submission{leaderboard.length !== 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
        <CampaignLeaderboard entries={leaderboard} campaignStatus={campaign.status} />
      </div>
    </div>
  );
}
