import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Eye, Heart, Sparkles } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { KolLeaderboardEntry, KolViewerClaimEligibility } from "@/lib/kolApi";
import { formatCompact } from "@/lib/kolFormat";
import { KOL_CREATE_CAMPAIGN_OWN_NOTE } from "@/lib/kolRewardEligibility";
import { shortenAddress } from "@/lib/solanaKol";
import { cn } from "@/lib/utils";
import {
  LeaderboardEligibilityBadge,
  LeaderboardKolCell,
  LeaderboardModeBadge,
  LeaderboardPayoutCell,
  LeaderboardPodium,
  type PodiumEntry,
  LeaderboardRankCell,
  LeaderboardRowChevron,
  LeaderboardScoreBar,
  leaderboardRowClass,
} from "@/components/kol/leaderboardUi";
import { ScoreBreakdownTooltip } from "@/components/kol/ScoreBreakdownTooltip";

interface CampaignLeaderboardProps {
  entries: KolLeaderboardEntry[];
  campaignStatus: string;
  requireCreatedOneCampaign?: boolean;
  verifiedHandleKey?: string | null;
  viewerClaimEligibility?: KolViewerClaimEligibility | null;
}

function LeaderboardEligibilityNote({ message }: { message: string }) {
  return (
    <p className="text-[11px] leading-snug text-amber-400/95 mt-1.5">{message}</p>
  );
}

function getDisplayPayoutSol(entry: KolLeaderboardEntry): number {
  if (entry.earnedSol != null && entry.earnedSol > 0) return entry.earnedSol;
  if (entry.payout?.sol != null && entry.payout.sol > 0) return entry.payout.sol;

  const projected = entry.projectedSol ?? 0;
  const potential = entry.potentialProjectedSol ?? 0;

  // Locked rows show potential share. After unlock, projected may still be stale 0
  // until refresh — fall back to potential so eligible users don't see 0 SOL.
  if (entry.rewardEligible === false) {
    return potential > 0 ? potential : projected;
  }
  if (projected > 0) return projected;
  if (potential > 0) return potential;
  return projected;
}

function getPayoutLabel(entry: KolLeaderboardEntry, campaignStatus: string): string {
  if (entry.payout?.status === "pending_minimum") return "Held";
  if (entry.claimStatus === "claimed" || entry.payout?.status === "confirmed") {
    return "Sent";
  }
  if (entry.claimStatus === "claimable") return "Claimable";
  return campaignStatus === "completed" ? "Final" : "Projected";
}

function isEntryRewardEligible(
  entry: KolLeaderboardEntry,
  requireCreatedOneCampaign: boolean,
): boolean {
  if (!requireCreatedOneCampaign) return true;
  return entry.rewardEligible === true;
}

function getWalletLabel(entry: KolLeaderboardEntry): string {
  if (entry.kolWallet) return shortenAddress(entry.kolWallet, 6);
  return `@${entry.authorHandle}`;
}

function walletsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function CampaignLeaderboard({
  entries,
  campaignStatus,
  requireCreatedOneCampaign = false,
  verifiedHandleKey,
  viewerClaimEligibility,
}: CampaignLeaderboardProps) {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  const payoutLabelDefault = campaignStatus === "completed" ? "Paid" : "Projected";
  const maxScore = Math.max(...entries.map((e) => e.latestScore), 1);

  const ownWallet = walletAddress;

  const isOwnEntry = useMemo(
    () => (entry: KolLeaderboardEntry) => {
      if (ownWallet != null && entry.kolWallet && walletsMatch(entry.kolWallet, ownWallet)) {
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
    },
    [ownWallet, verifiedHandleKey],
  );

  const claimGateMessage =
    viewerClaimEligibility?.requireCreatedOneCampaign &&
    !viewerClaimEligibility.hasCreatedCampaign
      ? viewerClaimEligibility.message ?? KOL_CREATE_CAMPAIGN_OWN_NOTE
      : null;

  const showEligibilityColumn = requireCreatedOneCampaign;

  if (entries.length === 0) {
    return (
      <div className="panel-glass rounded-2xl p-10 sm:p-12 text-center space-y-3 border border-border/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <p className="font-semibold text-base">No one on the board yet</p>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          Be the first to reply or quote the post on X. We scan for new posts about every 24 hours —
          no link to submit here. All replies and quotes appear here; rewards require engagement
          (likes, retweets, replies, or quotes). Multiple posts from you are combined (top 3 by score).
        </p>
      </div>
    );
  }

  const podiumEntries: PodiumEntry[] = entries.slice(0, 3).map((entry, index) => {
    const rewardEligible = isEntryRewardEligible(entry, requireCreatedOneCampaign);
    return {
      rank: (index + 1) as 1 | 2 | 3,
      handle: entry.authorHandle,
      verified: entry.verified,
      score: entry.latestScore,
      payoutSol: getDisplayPayoutSol(entry),
      payoutLocked: requireCreatedOneCampaign && !rewardEligible,
      likes: entry.latestMetrics.likeCount,
      views: entry.latestMetrics.viewCount,
    };
  });

  return (
    <div className="panel-glass rounded-2xl border border-border/60 overflow-hidden min-w-0 shadow-[var(--shadow-card)]">
      {entries.length >= 1 ? (
        <LeaderboardPodium entries={podiumEntries} payoutLabel={payoutLabelDefault} />
      ) : null}

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-border/50">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const rewardEligible = isEntryRewardEligible(entry, requireCreatedOneCampaign);
          const payoutSol = getDisplayPayoutSol(entry);
          const payoutLabel = getPayoutLabel(entry, campaignStatus);
          const payoutLocked = requireCreatedOneCampaign && !rewardEligible;
          const own = isOwnEntry(entry);
          const showOwnGateNote = own && !rewardEligible && claimGateMessage != null;
          return (
            <Link
              key={entry.id}
              to={`/kol/${encodeURIComponent(entry.authorHandle)}`}
              className={cn(
                "group flex gap-3 p-4 transition-colors",
                leaderboardRowClass(rank),
                own && "ring-1 ring-inset ring-primary/25",
              )}
            >
              <LeaderboardRankCell rank={rank} />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <LeaderboardKolCell
                    handle={entry.authorHandle}
                    verified={entry.verified}
                    walletShort={getWalletLabel(entry)}
                  />
                  <LeaderboardPayoutCell
                    payoutSol={payoutSol}
                    payoutLabel={payoutLabel}
                    isTop={rank <= 3}
                    locked={payoutLocked}
                  />
                </div>
                {showEligibilityColumn ? (
                  <LeaderboardEligibilityBadge eligible={rewardEligible} />
                ) : null}
                {showOwnGateNote ? (
                  <LeaderboardEligibilityNote message={claimGateMessage} />
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <LeaderboardModeBadge mode={entry.mode} postCount={entry.postCount} />
                  <ScoreBreakdownTooltip
                    score={entry.latestScore}
                    breakdown={entry.scoreBreakdown}
                  />
                  <span className="text-border">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Heart className="h-3 w-3" aria-hidden />
                    {formatCompact(entry.latestMetrics.likeCount)}
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Eye className="h-3 w-3" aria-hidden />
                    {formatCompact(entry.latestMetrics.viewCount)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60 bg-muted/30">
              <TableHead className="w-[4.5rem] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rank
              </TableHead>
              <TableHead className="min-w-[220px]">KOL</TableHead>
              <TableHead className="w-[5.5rem]">Mode</TableHead>
              <TableHead className="text-right w-[7rem]">Score</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Engagement</TableHead>
              {showEligibilityColumn ? (
                <TableHead className="w-[4.5rem]">Status</TableHead>
              ) : null}
              <TableHead className="text-right w-[8rem]">{payoutLabelDefault}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => {
              const rank = index + 1;
              const rewardEligible = isEntryRewardEligible(entry, requireCreatedOneCampaign);
              const payoutSol = getDisplayPayoutSol(entry);
              const payoutLabel = getPayoutLabel(entry, campaignStatus);
              const payoutLocked = requireCreatedOneCampaign && !rewardEligible;
              const own = isOwnEntry(entry);
              const showOwnGateNote = own && !rewardEligible && claimGateMessage != null;
              return (
                <TableRow
                  key={entry.id}
                  className={cn(
                    "border-border/60 group",
                    leaderboardRowClass(rank),
                    own && "ring-1 ring-inset ring-primary/20",
                  )}
                >
                  <TableCell className="w-[4.5rem] align-middle">
                    <LeaderboardRankCell rank={rank} />
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <Link
                      to={`/kol/${encodeURIComponent(entry.authorHandle)}`}
                      className="flex items-center gap-2 -m-2 p-2 rounded-xl hover:bg-muted/60 transition-colors"
                    >
                      <LeaderboardKolCell
                        handle={entry.authorHandle}
                        verified={entry.verified}
                        walletShort={getWalletLabel(entry)}
                      />
                      <span className="ml-auto">
                        <LeaderboardRowChevron />
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <LeaderboardModeBadge mode={entry.mode} postCount={entry.postCount} />
                  </TableCell>
                  <TableCell className="text-right align-middle">
                    <div className="flex flex-col items-end gap-1">
                      <LeaderboardScoreBar score={entry.latestScore} maxScore={maxScore} />
                      <ScoreBreakdownTooltip
                        score={entry.latestScore}
                        breakdown={entry.scoreBreakdown}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right align-middle">
                    <div className="inline-flex flex-col items-end gap-0.5 text-sm tabular-nums">
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <Heart className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        {formatCompact(entry.latestMetrics.likeCount)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Eye className="h-3 w-3" aria-hidden />
                        {formatCompact(entry.latestMetrics.viewCount)} views
                      </span>
                    </div>
                  </TableCell>
                  {showEligibilityColumn ? (
                    <TableCell className="align-middle">
                      <LeaderboardEligibilityBadge eligible={rewardEligible} />
                      {showOwnGateNote ? (
                        <LeaderboardEligibilityNote message={claimGateMessage} />
                      ) : null}
                    </TableCell>
                  ) : null}
                  <TableCell className="align-middle">
                    <LeaderboardPayoutCell
                      payoutSol={payoutSol}
                      payoutLabel={payoutLabel}
                      isTop={rank <= 3}
                      locked={payoutLocked}
                    />
                  </TableCell>
                  <TableCell />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
