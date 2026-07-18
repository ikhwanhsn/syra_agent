import { ExternalLink, Users, Clock, Coins, ArrowRight, Check, Crown, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveCountdown } from "@/components/ui/LiveCountdown";
import { CampaignTweetPreview } from "@/components/kol/SourceTweetMedia";
import type { KolCampaign } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import {
  getCampaignDisplayLabel,
  getCampaignDisplayPhase,
  getCampaignDisplayStyle,
  isCampaignLive,
} from "@/lib/kolCampaignStatus";
import { formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

type RewardTier = 1 | 2 | 3;

const REWARD_TIER_META: Record<
  RewardTier,
  { label: string; icon: typeof Crown; badgeClass: string }
> = {
  1: {
    label: "Top reward",
    icon: Crown,
    badgeClass:
      "border-amber-400/45 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  2: {
    label: "High reward",
    icon: Medal,
    badgeClass:
      "border-slate-300/50 bg-slate-400/15 text-slate-700 dark:text-slate-200",
  },
  3: {
    label: "Top 3",
    icon: Medal,
    badgeClass:
      "border-orange-400/45 bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
};

/** Highest reward → tier 1–3 among the given campaigns. */
function getTopRewardTiersMap(campaigns: KolCampaign[]): Map<string, RewardTier> {
  const ranked = [...campaigns]
    .map((campaign) => ({
      id: campaign.id,
      reward: getKolRewardSol(campaign),
    }))
    .sort((a, b) => {
      if (b.reward !== a.reward) return b.reward - a.reward;
      return a.id.localeCompare(b.id);
    });

  const map = new Map<string, RewardTier>();
  for (let i = 0; i < Math.min(3, ranked.length); i++) {
    if (ranked[i].reward <= 0) continue;
    map.set(ranked[i].id, (i + 1) as RewardTier);
  }
  return map;
}

function Bone({ className }: { className?: string }) {
  return <div className={cn("skeleton-bone", className)} aria-hidden />;
}

export function CampaignCardSkeleton() {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-3 w-16 rounded-full" />
          <Bone className="h-5 w-[70%] rounded-md" />
        </div>
        <Bone className="h-6 w-16 shrink-0 rounded-full" />
      </div>
      <Bone className="h-3 w-28 rounded-md" />
      <Bone className="aspect-[1.91/1] w-full rounded-xl" />
      <div className="space-y-2">
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-[85%] rounded-md" />
      </div>
      <Bone className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-4 w-24 rounded-md" />
        <Bone className="h-4 w-20 rounded-md" />
      </div>
      <Bone className="h-9 w-32 rounded-full" />
    </article>
  );
}

export function CampaignBrowseSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Updating campaign list…</span>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-fade-in opacity-0"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
        >
          <CampaignCardSkeleton />
        </div>
      ))}
    </div>
  );
}

interface CampaignCardProps {
  campaign: KolCampaign;
  onSelect?: (id: string) => void;
  /** 1 = gold, 2 = silver, 3 = bronze — top reward pool ranks. */
  rewardTier?: RewardTier;
}

export function CampaignCard({ campaign, onSelect, rewardTier }: CampaignCardProps) {
  const rewardSol = getKolRewardSol(campaign);
  const displayPhase = getCampaignDisplayPhase(campaign);
  const isLive = isCampaignLive(campaign);
  const participated = campaign.participated === true;
  const tierMeta = rewardTier ? REWARD_TIER_META[rewardTier] : null;
  const TierIcon = tierMeta?.icon;

  return (
    <article
      className={cn(
        "card-premium-hover flex min-w-0 flex-col gap-4 rounded-2xl border border-border/60 p-4 sm:p-5",
        rewardTier && "campaign-tier-card",
        rewardTier === 1 && "campaign-tier-1",
        rewardTier === 2 && "campaign-tier-2",
        rewardTier === 3 && "campaign-tier-3",
      )}
    >
      {rewardTier ? <span className="campaign-tier-sheen" aria-hidden /> : null}

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
          {tierMeta && TierIcon ? (
            <Badge
              variant="outline"
              className={cn("gap-1 shrink-0 font-semibold", tierMeta.badgeClass)}
            >
              <TierIcon className="w-3 h-3" aria-hidden />
              {tierMeta.label}
            </Badge>
          ) : null}
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
          {isLive ? (
            <LiveCountdown
              endAt={campaign.endAt}
              compact
              showIcon={false}
              className="min-w-0 truncate text-muted-foreground"
            />
          ) : (
            <span className="truncate">
              {displayPhase === "finalizing" || displayPhase === "completed"
                ? "Ended"
                : `${campaign.durationDays} days`}
            </span>
          )}
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
  /** Highlight the 3 highest reward pools in this list. */
  highlightTopRewards?: boolean;
}

export function CampaignGrid({
  campaigns,
  onSelect,
  highlightTopRewards = false,
}: CampaignGridProps) {
  const topRewardTiers = useMemo(
    () => (highlightTopRewards ? getTopRewardTiersMap(campaigns) : new Map<string, RewardTier>()),
    [campaigns, highlightTopRewards],
  );

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
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onSelect={onSelect}
          rewardTier={topRewardTiers.get(campaign.id)}
        />
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
