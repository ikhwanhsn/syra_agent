import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  Coins,
  ExternalLink,
  MessageSquare,
  Quote,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  KolCampaign,
  KolLeaderboardEntry,
  KolViewerClaimEligibility,
} from "@/lib/kolApi";
import {
  DEFAULT_KOL_CONFIG,
  fetchKolConfig,
  fetchWalletVerification,
  getKolRewardSol,
} from "@/lib/kolApi";
import {
  getCampaignDisplayLabel,
  getCampaignDisplayPhase,
  getCampaignDisplayStyle,
  isCampaignFinalizing,
  isCampaignLive,
} from "@/lib/kolCampaignStatus";
import { formatSol, formatRelativePast, formatTimeLeft } from "@/lib/kolFormat";
import { KOL_CREATE_CAMPAIGN_LEADERBOARD_INTRO } from "@/lib/kolRewardEligibility";
import { cn } from "@/lib/utils";
import { AddRewardForm } from "./AddRewardForm";
import { CampaignClaimCard } from "./CampaignClaimCard";
import { CampaignFundDepositCard } from "./CampaignFundDepositCard";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { CampaignParticipationGateCard } from "./CampaignParticipationGateCard";
import { KolCampaignEarnShareAction } from "./KolCampaignEarnShareAction";
import { KolMyRankShareAction } from "./KolMyRankShareBar";
import { SourceTweetCard } from "./SourceTweetCard";
import { VerifyXAccountCard } from "./VerifyXAccountCard";

interface CampaignDetailProps {
  campaign: KolCampaign;
  leaderboard: KolLeaderboardEntry[];
  viewerClaimEligibility?: KolViewerClaimEligibility | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const statusMessages: Record<
  ReturnType<typeof getCampaignDisplayPhase>,
  string
> = {
  live: "Open now — reply or quote the post below on X. Nothing to submit on this page.",
  finalizing:
    "Time’s up. We’re finishing the final rankings — verify your X account so rewards can reach your wallet.",
  pending_deposit:
    "Draft saved — deposit SOL to open the reward pool. Only the creator can complete payment.",
  completed:
    "This campaign is over. Verified wallets get SOL automatically — claim manually only if yours didn’t arrive.",
  cancelled: "This campaign was cancelled. No rewards will be paid.",
};

const joinSteps = [
  {
    step: 1,
    title: "Reply or quote the post on X",
    text: "Use the buttons below. Write your own take — likes, replies, and views on your post decide how much you earn.",
  },
  {
    step: 2,
    title: "We find you automatically",
    text: "About every 6 hours we scan replies and quotes. When we see yours, you appear on the leaderboard. No link to paste here.",
  },
  {
    step: 3,
    title: "Verify X to get paid",
    text: "Connect your Solana wallet and link your X handle once. When the campaign ends, your share of the pool goes to that wallet (min 0.01 SOL).",
  },
] as const;

function walletsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function extractTweetId(tweetUrl: string): string | null {
  const match = tweetUrl.match(/status(?:es)?\/(\d+)/i);
  return match?.[1] ?? null;
}

function buildReplyIntentUrl(tweetUrl: string): string | null {
  const id = extractTweetId(tweetUrl);
  if (!id) return null;
  return `https://twitter.com/intent/tweet?in_reply_to=${id}`;
}

function buildQuoteIntentUrl(tweetUrl: string): string {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(tweetUrl)}`;
}

export function CampaignDetail({
  campaign,
  leaderboard,
  viewerClaimEligibility,
  onClose,
  onRefresh,
}: CampaignDetailProps) {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58();

  const configQuery = useQuery({
    queryKey: ["kol-config"],
    queryFn: fetchKolConfig,
    staleTime: 5 * 60 * 1000,
  });
  const config = configQuery.data ?? DEFAULT_KOL_CONFIG;

  const verificationQuery = useQuery({
    queryKey: ["kol-x-verification", address],
    queryFn: () => fetchWalletVerification(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60 * 1000,
  });

  const verifiedHandleKey =
    verificationQuery.data?.xHandleKey ??
    verificationQuery.data?.xHandle?.replace(/^@/, "").toLowerCase() ??
    null;

  const rewardSol = getKolRewardSol(campaign);
  const displayPhase = getCampaignDisplayPhase(campaign);
  const isLive = isCampaignLive(campaign);
  const isFinalizing = isCampaignFinalizing(campaign);
  const timeLeft = formatTimeLeft(campaign.endAt);
  const participantCount = campaign.submissionCount ?? leaderboard.length;

  const replyUrl = useMemo(
    () => buildReplyIntentUrl(campaign.sourceTweetUrl),
    [campaign.sourceTweetUrl],
  );
  const quoteUrl = useMemo(
    () => buildQuoteIntentUrl(campaign.sourceTweetUrl),
    [campaign.sourceTweetUrl],
  );

  const ownEntry = useMemo(() => {
    if (!address && !verifiedHandleKey) return null;
    return (
      leaderboard.find((entry) => {
        if (address && entry.kolWallet && walletsMatch(entry.kolWallet, address)) {
          return true;
        }
        if (verifiedHandleKey) {
          const entryKey = (entry.authorHandleKey ?? entry.authorHandle)
            .trim()
            .replace(/^@/, "")
            .toLowerCase();
          return entryKey === verifiedHandleKey.toLowerCase();
        }
        return false;
      }) ?? null
    );
  }, [address, leaderboard, verifiedHandleKey]);

  const showParticipationGate =
    campaign.requireCreatedOneCampaign === true &&
    viewerClaimEligibility != null &&
    ownEntry != null;

  const isPendingDeposit = campaign.status === "pending_deposit";

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

      {/* Campaign hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
          aria-hidden
        />

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

        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <p className="eyebrow mb-3">{isLive ? "Earn SOL" : "Campaign"}</p>
          <h2 className="heading-section text-xl sm:text-2xl lg:text-3xl">{campaign.title}</h2>
          {campaign.description ? (
            <p className="mt-2 text-base text-muted-foreground leading-relaxed">
              {campaign.description}
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-border/50 bg-background/40 px-4 py-3 sm:px-5 sm:py-4 space-y-2">
            <p className="text-sm sm:text-[15px] text-foreground leading-relaxed">
              A project put{" "}
              <span className="font-semibold text-primary tabular-nums">
                {formatSol(rewardSol)} SOL
              </span>{" "}
              in a reward pool. People who{" "}
              <span className="font-medium text-foreground">reply or quote</span> their X post
              share that pool — more engagement on your post usually means a bigger cut.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {statusMessages[displayPhase]}
            </p>
          </div>

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
                People joined
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

      {isPendingDeposit ? (
        <CampaignFundDepositCard campaign={campaign} onFunded={() => onRefresh?.()} />
      ) : null}

      {/* How to join — first for newcomers */}
      {isLive ? (
        <div className="panel-glass rounded-2xl border border-primary/25 p-5 sm:p-8 space-y-5">
          <div>
            <p className="eyebrow mb-2">New here?</p>
            <h3 className="font-semibold text-lg sm:text-xl tracking-tight">
              How to join this campaign
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              You don’t apply or fill a form. Post on X, we track engagement, then you get paid in
              SOL when it ends.
            </p>
          </div>

          <ol className="space-y-4">
            {joinSteps.map((item) => (
              <li key={item.step} className="flex gap-3 sm:gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-semibold">
                  {item.step}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-medium text-foreground leading-snug">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {campaign.requireCreatedOneCampaign ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Extra rule on this campaign: </span>
              to receive SOL you must also create and fund at least one campaign on S3 Labs before
              this one ends. Pending deposits don’t count.
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
            {replyUrl ? (
              <Button variant="hero" className="rounded-full gap-2" asChild>
                <a href={replyUrl} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4" />
                  Reply on X
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </Button>
            ) : null}
            <Button
              variant={replyUrl ? "outline" : "hero"}
              className="rounded-full gap-2"
              asChild
            >
              <a href={quoteUrl} target="_blank" rel="noopener noreferrer">
                <Quote className="w-4 h-4" />
                Quote on X
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </Button>
            <Button variant="ghost" className="rounded-full gap-2 text-muted-foreground" asChild>
              <a href={campaign.sourceTweetUrl} target="_blank" rel="noopener noreferrer">
                View original post
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Source post */}
      <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-8 space-y-4 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="w-4 h-4 text-primary shrink-0" />
              <h3 className="font-semibold">
                {isLive ? "The post to reply or quote" : "Campaign post"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isLive
                ? `This is the project’s X post. Reply to it or quote it — then grow engagement. Your share of the ${formatSol(rewardSol)} SOL pool is based on how your post performs vs everyone else.`
                : "The original X post this campaign was built around."}
            </p>
          </div>
          {isLive ? (
            <div className="flex flex-wrap gap-2 shrink-0">
              {replyUrl ? (
                <Button size="sm" variant="hero" className="rounded-full gap-1.5" asChild>
                  <a href={replyUrl} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reply
                  </a>
                </Button>
              ) : null}
              <Button
                size="sm"
                variant={replyUrl ? "outline" : "hero"}
                className="rounded-full gap-1.5"
                asChild
              >
                <a href={quoteUrl} target="_blank" rel="noopener noreferrer">
                  <Quote className="w-3.5 h-3.5" />
                  Quote
                </a>
              </Button>
            </div>
          ) : null}
        </div>

        <SourceTweetCard
          text={campaign.sourceTweetText}
          tweetUrl={campaign.sourceTweetUrl}
          authorHandle={campaign.sourceAuthorHandle}
          authorName={campaign.sourceAuthorName}
          authorVerified={campaign.sourceAuthorVerified}
          media={campaign.sourceTweetMedia}
        />
      </div>

      {isLive || campaign.status === "completed" ? (
        <div className="space-y-2">
          {isLive ? (
            <p className="text-sm text-muted-foreground px-1">
              You can post on X first — verify anytime before the campaign ends so we know which
              wallet should receive your SOL.
            </p>
          ) : null}
          <VerifyXAccountCard compactWhenVerified onVerified={onRefresh} />
        </div>
      ) : null}

      {showParticipationGate ? (
        <CampaignParticipationGateCard
          ownEntry={ownEntry}
          viewerClaimEligibility={viewerClaimEligibility}
        />
      ) : null}

      {campaign.status === "completed" ? (
        <CampaignClaimCard
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          leaderboard={leaderboard}
          viewerClaimEligibility={viewerClaimEligibility}
          onClaimed={onRefresh}
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
              {campaign.requireCreatedOneCampaign
                ? KOL_CREATE_CAMPAIGN_LEADERBOARD_INTRO
                : campaign.status === "completed"
                  ? "Final rankings — claim after verifying X if your reward didn’t auto-send."
                  : isFinalizing
                    ? "Final rankings from the last scan. Verify X so payouts can reach you."
                    : "Updates about every 6 hours. Higher score = larger projected payout."}
              {isLive && campaign.lastSnapshotAt ? (
                <span className="block mt-1 text-xs text-muted-foreground/80">
                  Last update: {formatRelativePast(campaign.lastSnapshotAt)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {leaderboard.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {leaderboard.length} on the board
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
        <CampaignLeaderboard
          entries={leaderboard}
          campaignStatus={campaign.status}
          requireCreatedOneCampaign={campaign.requireCreatedOneCampaign === true}
          verifiedHandleKey={verifiedHandleKey}
          viewerClaimEligibility={viewerClaimEligibility}
        />
      </div>

      {/* Creator-only top-up — after participate flow so newcomers aren’t distracted */}
      {isLive ? (
        <AddRewardForm
          campaign={campaign}
          currentPoolSol={rewardSol}
          platformFeeSol={config.platformFeeSol}
          minTopUpKolRewardSol={config.minTopUpKolRewardSol}
          onAdded={onRefresh}
        />
      ) : null}
    </div>
  );
}
