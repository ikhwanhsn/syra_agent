import { useQuery } from "@tanstack/react-query";
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
import { DEFAULT_KOL_CONFIG, fetchKolConfig, getKolRewardSol } from "@/lib/kolApi";
import {
  getCampaignDisplayLabel,
  getCampaignDisplayPhase,
  getCampaignDisplayStyle,
  isCampaignFinalizing,
  isCampaignLive,
} from "@/lib/kolCampaignStatus";
import { formatSol, formatTimeLeft } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";
import { AddRewardForm } from "./AddRewardForm";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { KolCampaignEarnShareAction } from "./KolCampaignEarnShareAction";
import { KolMyRankShareAction } from "./KolMyRankShareBar";
import { SourceTweetCard } from "./SourceTweetCard";
import { SubmitEngagementForm } from "./SubmitEngagementForm";

interface CampaignDetailProps {
  campaign: KolCampaign;
  leaderboard: KolLeaderboardEntry[];
  onClose: () => void;
  onRefresh?: () => void;
}

const statusMessages: Record<
  ReturnType<typeof getCampaignDisplayPhase>,
  string
> = {
  live: "This campaign is live — reply or quote the post below, then submit your URL to start earning.",
  finalizing:
    "This campaign has ended. Final engagement snapshots are being processed and SOL rewards will be distributed shortly.",
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
  const configQuery = useQuery({
    queryKey: ["kol-config"],
    queryFn: fetchKolConfig,
    staleTime: 5 * 60 * 1000,
  });
  const config = configQuery.data ?? DEFAULT_KOL_CONFIG;

  const rewardSol = getKolRewardSol(campaign);
  const displayPhase = getCampaignDisplayPhase(campaign);
  const isLive = isCampaignLive(campaign);
  const isFinalizing = isCampaignFinalizing(campaign);
  const timeLeft = formatTimeLeft(campaign.endAt);
  const participantCount = campaign.submissionCount ?? leaderboard.length;

  return (
    <div className="space-y-6 min-w-0">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        onClick={onClose}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to campaigns
      </Button>

      {/* Campaign hero — full-width dashboard layout */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
          aria-hidden
        />

        {/* Top bar */}
        <div className="relative flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className={getCampaignDisplayStyle(displayPhase)}>
              {getCampaignDisplayLabel(displayPhase)}
            </Badge>
            {isLive && timeLeft !== "Ended" ? (
              <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-400">
                <Clock className="w-3 h-3" />
                {timeLeft}
              </Badge>
            ) : null}
            {campaign.sourceAuthorHandle ? (
              <Link
                to={`/kol/${encodeURIComponent(campaign.sourceAuthorHandle)}`}
                className={cn(
                  badgeVariants({ variant: "outline" }),
                  "hidden sm:inline-flex items-center gap-1.5 hover:bg-muted/50 transition-colors",
                )}
              >
                <span>@{campaign.sourceAuthorHandle}</span>
                {campaign.sourceAuthorVerified ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Verified" />
                ) : null}
              </Link>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 h-8 w-8 sm:h-9 sm:w-9"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Title block */}
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <p className="eyebrow mb-3">{isLive ? "Earn now" : "Campaign"}</p>
          <h2 className="heading-section text-xl sm:text-2xl lg:text-3xl">{campaign.title}</h2>
          {campaign.description ? (
            <p className="mt-2 text-base text-muted-foreground leading-relaxed">{campaign.description}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{statusMessages[displayPhase]}</p>

          {campaign.sourceAuthorHandle ? (
            <Link
              to={`/kol/${encodeURIComponent(campaign.sourceAuthorHandle)}`}
              className={cn(
                badgeVariants({ variant: "outline" }),
                "mt-4 inline-flex sm:hidden items-center gap-1.5 hover:bg-muted/50 transition-colors",
              )}
            >
              <span>@{campaign.sourceAuthorHandle}</span>
              {campaign.sourceAuthorVerified ? (
                <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Verified" />
              ) : null}
            </Link>
          ) : null}
        </div>

        {/* Metrics rail — spans full width, no dead space */}
        <div className="relative border-t border-border/50 bg-muted/15">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
            <div className="flex flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-5 lg:col-span-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Coins className="w-3.5 h-3.5 text-primary" />
                Reward pool
              </div>
              <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-primary">
                {formatSol(rewardSol)}
                <span className="ml-1.5 text-base sm:text-lg font-medium text-primary/80">SOL</span>
              </p>
            </div>

            <div className="flex flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Users className="w-3.5 h-3.5 text-primary" />
                KOLs joined
              </div>
              <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
                {participantCount}
              </p>
            </div>

            <div className="flex flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {isLive ? "Time left" : "Duration"}
              </div>
              <p className="text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight">
                {isLive ? timeLeft : isFinalizing ? "Ended" : `${campaign.durationDays}d`}
              </p>
            </div>

            <div className="col-span-2 w-full px-4 py-4 sm:px-6 sm:py-5 lg:col-span-1 lg:flex lg:items-center">
              <KolCampaignEarnShareAction
                campaign={campaign}
                rewardSol={rewardSol}
                timeLeft={timeLeft}
                participantCount={participantCount}
                leaderboard={leaderboard}
                prominent
              />
            </div>
          </div>
        </div>
      </div>

      {isLive ? (
        <AddRewardForm
          campaign={campaign}
          currentPoolSol={rewardSol}
          platformFeeSol={config.platformFeeSol}
          minTopUpKolRewardSol={config.minTopUpKolRewardSol}
          onAdded={onRefresh}
        />
      ) : null}

      {/* Source post */}
      <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-8 space-y-4 min-w-0">
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
      {isLive ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-8">
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

      {isLive ? (
        <SubmitEngagementForm
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          rewardSol={rewardSol}
          requireFollowS3Labs={campaign.requireFollowS3Labs === true}
          onSubmitted={onRefresh}
        />
      ) : null}

      <div className="space-y-4 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg tracking-tight">
                {isFinalizing ? "Final leaderboard" : "Live leaderboard"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              {campaign.status === "completed"
                ? "Final rankings and confirmed payouts."
                : isFinalizing
                  ? "Final rankings based on last snapshot. Payouts are being processed."
                  : "Rankings update daily. Higher score = larger projected payout."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {leaderboard.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {leaderboard.length} submission{leaderboard.length !== 1 ? "s" : ""}
              </div>
            ) : null}
            <KolMyRankShareAction
              entries={leaderboard}
              campaignId={campaign.id}
              campaignTitle={campaign.title}
              campaignStatus={campaign.status}
              rewardSol={rewardSol}
            />
          </div>
        </div>
        <CampaignLeaderboard entries={leaderboard} campaignStatus={campaign.status} />
      </div>
    </div>
  );
}
