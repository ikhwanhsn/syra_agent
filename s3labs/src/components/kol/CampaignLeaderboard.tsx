import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Eye, Heart, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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

type LeaderboardFilter = "all" | "reply" | "quote" | "eligible" | "locked";

const CONTROL_DEBOUNCE_MS = 450;

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

function matchesSearch(query: string, entry: KolLeaderboardEntry): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const handle = (entry.authorHandleKey ?? entry.authorHandle)
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const wallet = (entry.kolWallet ?? "").toLowerCase();
  return handle.includes(q) || wallet.includes(q) || entry.authorHandle.toLowerCase().includes(q);
}

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("skeleton-bone", className)} style={style} aria-hidden />;
}

function CampaignLeaderboardSkeleton({
  showEligibilityColumn,
}: {
  showEligibilityColumn: boolean;
}) {
  const rowCount = 8;

  return (
    <div
      className="panel-glass rounded-2xl border border-border/60 overflow-hidden min-w-0"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Filtering leaderboard…</span>

      <div className="md:hidden divide-y divide-border/50">
        {Array.from({ length: rowCount }, (_, i) => (
          <div
            key={i}
            className="flex gap-3 p-4 animate-fade-in opacity-0"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}
          >
            <Bone className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-[55%] rounded-md" />
                  <Bone className="h-3 w-[38%] rounded-md" />
                </div>
                <Bone className="h-8 w-16 shrink-0 rounded-lg" />
              </div>
              <Bone className="h-3 w-[70%] rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="flex items-center gap-4 border-b border-border/60 bg-muted/30 px-4 py-3">
          <Bone className="h-3 w-8 rounded" />
          <Bone className="h-3 w-20 rounded" />
          <Bone className="h-3 w-12 rounded" />
          <Bone className="ml-auto h-3 w-14 rounded" />
          <Bone className="hidden h-3 w-16 rounded lg:block" />
          {showEligibilityColumn ? <Bone className="h-3 w-12 rounded" /> : null}
          <Bone className="h-3 w-14 rounded" />
        </div>
        <div className="divide-y divide-border/50">
          {Array.from({ length: rowCount }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3.5 animate-fade-in opacity-0"
              style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}
            >
              <Bone className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Bone className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone
                    className="h-4 rounded-md"
                    style={{ width: `${48 + ((i * 11) % 28)}%` }}
                  />
                  <Bone
                    className="h-3 rounded-md"
                    style={{ width: `${30 + ((i * 7) % 22)}%` }}
                  />
                </div>
              </div>
              <Bone className="h-6 w-14 shrink-0 rounded-full" />
              <Bone className="h-4 w-16 shrink-0 rounded-md" />
              <Bone className="hidden h-4 w-12 shrink-0 rounded-md lg:block" />
              {showEligibilityColumn ? (
                <Bone className="h-5 w-14 shrink-0 rounded-full" />
              ) : null}
              <Bone className="h-8 w-16 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "outline"}
      className={cn(
        "rounded-full h-8 px-3 text-xs font-medium shrink-0",
        active && "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20",
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
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

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LeaderboardFilter>("all");

  const debouncedSearch = useDebouncedValue(search.trim(), CONTROL_DEBOUNCE_MS);
  const debouncedFilter = useDebouncedValue(filter, CONTROL_DEBOUNCE_MS);
  const isControlsPending =
    search.trim() !== debouncedSearch || filter !== debouncedFilter;

  const payoutLabelDefault = campaignStatus === "completed" ? "Paid" : "Projected";
  const showEligibilityColumn = requireCreatedOneCampaign;

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

  const rankedEntries = useMemo(
    () => entries.map((entry, index) => ({ entry, rank: index + 1 })),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    return rankedEntries.filter(({ entry }) => {
      if (!matchesSearch(debouncedSearch, entry)) return false;

      switch (debouncedFilter) {
        case "reply":
          return entry.mode === "reply";
        case "quote":
          return entry.mode === "quote";
        case "eligible":
          return isEntryRewardEligible(entry, requireCreatedOneCampaign);
        case "locked":
          return !isEntryRewardEligible(entry, requireCreatedOneCampaign);
        case "all":
        default:
          return true;
      }
    });
  }, [rankedEntries, debouncedSearch, debouncedFilter, requireCreatedOneCampaign]);

  const maxScore = Math.max(...entries.map((e) => e.latestScore), 1);
  const hasActiveControls = Boolean(debouncedSearch) || debouncedFilter !== "all";

  if (entries.length === 0) {
    return (
      <div className="panel-glass rounded-2xl p-10 sm:p-12 text-center space-y-3 border border-border/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <p className="font-semibold text-base">No one on the board yet</p>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          Be the first — verify your X account, reply or quote the campaign post,
          then paste your link above. Limit: 1 post per campaign from your
          verified handle. Engagement updates about every 6 hours; rewards
          require engagement (likes, retweets, replies, or quotes).
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
    <div className="space-y-3 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="campaign-leaderboard-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by @handle or wallet…"
            className="h-11 w-full rounded-xl border-border/60 bg-background/80 pl-10 pr-10 shadow-sm"
            autoComplete="off"
            aria-label="Search leaderboard"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          <FilterChip active={filter === "reply"} onClick={() => setFilter("reply")}>
            Replies
          </FilterChip>
          <FilterChip active={filter === "quote"} onClick={() => setFilter("quote")}>
            Quotes
          </FilterChip>
          {showEligibilityColumn ? (
            <>
              <FilterChip
                active={filter === "eligible"}
                onClick={() => setFilter("eligible")}
              >
                Eligible
              </FilterChip>
              <FilterChip active={filter === "locked"} onClick={() => setFilter("locked")}>
                Locked
              </FilterChip>
            </>
          ) : null}
        </div>
      </div>

      {!isControlsPending && hasActiveControls ? (
        <p className="text-xs text-muted-foreground px-0.5">
          Showing {filteredEntries.length} of {entries.length}
          {debouncedSearch ? (
            <>
              {" "}
              for “{debouncedSearch}”
            </>
          ) : null}
        </p>
      ) : null}

      {isControlsPending ? (
        <CampaignLeaderboardSkeleton showEligibilityColumn={showEligibilityColumn} />
      ) : filteredEntries.length === 0 ? (
        <div className="panel-glass rounded-2xl border border-border/60 px-6 py-10 text-center space-y-2">
          <p className="font-medium text-foreground">No matches</p>
          <p className="text-sm text-muted-foreground">
            {debouncedSearch
              ? `Nothing found for “${debouncedSearch}”. Try another handle or clear filters.`
              : "No entries match this filter. Try All, Replies, or Quotes."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full mt-2"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="panel-glass rounded-2xl border border-border/60 overflow-hidden min-w-0 shadow-[var(--shadow-card)]">
          {!hasActiveControls && entries.length >= 1 ? (
            <LeaderboardPodium entries={podiumEntries} payoutLabel={payoutLabelDefault} />
          ) : null}

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-border/50">
            {filteredEntries.map(({ entry, rank }) => {
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
                {filteredEntries.map(({ entry, rank }) => {
                  const rewardEligible = isEntryRewardEligible(
                    entry,
                    requireCreatedOneCampaign,
                  );
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
      )}
    </div>
  );
}
