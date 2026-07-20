import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Sparkles, Trophy, Users } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import {
  LeaderboardRankCell,
  leaderboardRowClass,
} from "@/components/kol/leaderboardUi";
import { ProfileListToolbar } from "@/components/profile/ProfileListToolbar";
import { ProfileListPagination } from "@/components/profile/ProfileListPagination";
import {
  PROFILE_LIST_PAGE_SIZE,
  SKELETON_STAGGER_MS,
  paginateItems,
} from "@/components/profile/profileListUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPointsLeaderboard, type PointsLeaderboardEntry } from "@/lib/kolApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

type PointsFilter = "all" | "top3" | "with_handle" | "no_handle" | "joined";
type PointsSort =
  | "points_desc"
  | "points_asc"
  | "rank_asc"
  | "campaigns_desc"
  | "handle_asc";

const FILTER_OPTIONS: { value: PointsFilter; label: string }[] = [
  { value: "all", label: "All members" },
  { value: "top3", label: "Top 3 only" },
  { value: "with_handle", label: "Has X handle" },
  { value: "no_handle", label: "Wallet only" },
  { value: "joined", label: "Joined a campaign" },
];

const SORT_OPTIONS: { value: PointsSort; label: string }[] = [
  { value: "points_desc", label: "Points · high" },
  { value: "points_asc", label: "Points · low" },
  { value: "rank_asc", label: "Rank · best" },
  { value: "campaigns_desc", label: "Campaigns · most" },
  { value: "handle_asc", label: "Handle · A–Z" },
];

function Bone({ className }: { className?: string }) {
  return <div className={cn("skeleton-bone", className)} aria-hidden />;
}

function StaggerShell({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("animate-fade-in opacity-0", className)}
      style={{
        animationDelay: `${index * SKELETON_STAGGER_MS}ms`,
        animationFillMode: "forwards",
      }}
    >
      {children}
    </div>
  );
}

function PointsLeaderboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading points leaderboard…</span>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <StaggerShell key={`podium-${i}`} index={i}>
            <div className="overflow-hidden rounded-2xl border border-border/55 bg-card/50 p-4 sm:p-5 shadow-card">
              <Bone className="h-10 w-12 rounded-xl" />
              <Bone className="mt-4 h-4 w-[55%] rounded-md" />
              <Bone className="mt-2 h-3 w-[40%] rounded-md" />
              <Bone className="mt-4 h-7 w-24 rounded-md" />
            </div>
          </StaggerShell>
        ))}
      </div>
      <StaggerShell index={3}>
        <div className="rounded-2xl border border-border/55 bg-card/50 p-4 shadow-card space-y-3">
          <Bone className="h-11 w-full rounded-full" />
          <div className="flex flex-wrap gap-2">
            <Bone className="h-11 w-36 rounded-full" />
            <Bone className="h-11 w-36 rounded-full" />
          </div>
        </div>
      </StaggerShell>
      <div className="panel-glass overflow-hidden rounded-2xl border border-border/60">
        {Array.from({ length: 5 }, (_, i) => (
          <StaggerShell
            key={`row-${i}`}
            index={i + 4}
            className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5 last:border-0"
          >
            <Bone className="h-10 w-10 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3.5 w-[45%] rounded-md" />
              <Bone className="h-3 w-[30%] rounded-md" />
            </div>
            <Bone className="h-4 w-12 rounded-md shrink-0" />
          </StaggerShell>
        ))}
      </div>
    </div>
  );
}

function TopThreeSpotlight({ rows }: { rows: PointsLeaderboardEntry[] }) {
  const top = rows.filter((row) => row.rank <= 3).slice(0, 3);
  if (top.length === 0) return null;

  const orderClass: Record<number, string> = {
    1: "order-1 sm:order-2",
    2: "order-2 sm:order-1",
    3: "order-3",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
      {top.map((row) => {
        const isFirst = row.rank === 1;
        return (
          <article
            key={`${row.rank}-${row.wallet}`}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-4 sm:p-5 min-w-0",
              orderClass[row.rank] ?? "",
              isFirst
                ? "border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-primary/8 to-transparent sm:pb-6"
                : row.rank === 2
                  ? "border-slate-300/30 bg-gradient-to-br from-slate-400/10 via-transparent to-transparent"
                  : "border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <LeaderboardRankCell rank={row.rank} />
              {isFirst ? (
                <Badge
                  variant="outline"
                  className="border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0"
                >
                  Leader
                </Badge>
              ) : null}
            </div>
            <div className="mt-4 space-y-1 min-w-0">
              {row.handle ? (
                <Link
                  to={`/kol/${encodeURIComponent(row.handle)}`}
                  className="block font-semibold tracking-tight truncate hover:text-primary transition-colors"
                >
                  @{row.handle}
                </Link>
              ) : (
                <p className="font-mono text-sm font-medium truncate">
                  {shortenAddress(row.wallet, 6)}
                </p>
              )}
              <p className="font-mono text-[11px] text-muted-foreground truncate">
                {shortenAddress(row.wallet, 6)}
              </p>
            </div>
            <p
              className={cn(
                "mt-4 text-2xl font-semibold tabular-nums tracking-tight",
                isFirst ? "text-primary" : "text-foreground",
              )}
            >
              {formatPoints(row.totalPoints)}
              <span className="ml-1.5 text-sm font-medium text-muted-foreground">pts</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.campaignsParticipated} campaign
              {row.campaignsParticipated === 1 ? "" : "s"} joined
            </p>
          </article>
        );
      })}
    </div>
  );
}

function LeaderboardRowMobile({ row }: { row: PointsLeaderboardEntry }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 sm:px-5 min-w-0",
        leaderboardRowClass(row.rank),
      )}
    >
      <LeaderboardRankCell rank={row.rank} />
      <div className="min-w-0 flex-1 space-y-0.5">
        {row.handle ? (
          <Link
            to={`/kol/${encodeURIComponent(row.handle)}`}
            className="block font-medium truncate hover:text-primary transition-colors"
          >
            @{row.handle}
          </Link>
        ) : (
          <p className="font-mono text-sm font-medium truncate">
            {shortenAddress(row.wallet, 6)}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground truncate">
          <span className="font-mono">{shortenAddress(row.wallet, 4)}</span>
          <span className="mx-1.5 text-border">·</span>
          {row.campaignsParticipated} joined
        </p>
      </div>
      <p className="shrink-0 text-right">
        <span className="block text-base font-semibold tabular-nums text-primary">
          {formatPoints(row.totalPoints)}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          pts
        </span>
      </p>
    </li>
  );
}

function matchesPointsSearch(row: PointsLeaderboardEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    row.wallet.toLowerCase().includes(q) ||
    (row.handle?.toLowerCase().includes(q) ?? false)
  );
}

function filterPointsRows(
  rows: PointsLeaderboardEntry[],
  filter: PointsFilter,
): PointsLeaderboardEntry[] {
  switch (filter) {
    case "top3":
      return rows.filter((row) => row.rank <= 3);
    case "with_handle":
      return rows.filter((row) => Boolean(row.handle));
    case "no_handle":
      return rows.filter((row) => !row.handle);
    case "joined":
      return rows.filter((row) => row.campaignsParticipated > 0);
    default:
      return rows;
  }
}

function sortPointsRows(
  rows: PointsLeaderboardEntry[],
  sort: PointsSort,
): PointsLeaderboardEntry[] {
  const next = [...rows];
  next.sort((a, b) => {
    switch (sort) {
      case "points_asc":
        return a.totalPoints - b.totalPoints || a.rank - b.rank;
      case "rank_asc":
        return a.rank - b.rank;
      case "campaigns_desc":
        return (
          b.campaignsParticipated - a.campaignsParticipated ||
          b.totalPoints - a.totalPoints
        );
      case "handle_asc": {
        const ah = (a.handle ?? "").toLowerCase();
        const bh = (b.handle ?? "").toLowerCase();
        if (!ah && bh) return 1;
        if (ah && !bh) return -1;
        return ah.localeCompare(bh) || a.rank - b.rank;
      }
      case "points_desc":
      default:
        return b.totalPoints - a.totalPoints || a.rank - b.rank;
    }
  });
  return next;
}

function PointsLeaderboardContent() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PointsFilter>("all");
  const [sort, setSort] = useState<PointsSort>("points_desc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const leaderboardQuery = useQuery({
    queryKey: ["points-leaderboard"],
    queryFn: () => fetchPointsLeaderboard({ limit: 100 }),
    staleTime: 60_000,
  });

  const rows = useMemo(
    () => leaderboardQuery.data?.leaderboard ?? [],
    [leaderboardQuery.data?.leaderboard],
  );
  const topPoints = rows[0]?.totalPoints ?? 0;
  const rankedCount = rows.length;

  const filteredSorted = useMemo(() => {
    const searched = rows.filter((row) => matchesPointsSearch(row, debouncedSearch));
    return sortPointsRows(filterPointsRows(searched, filter), sort);
  }, [rows, debouncedSearch, filter, sort]);

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredSorted, page, PROFILE_LIST_PAGE_SIZE),
    [filteredSorted, page],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, sort]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return (
    <div className={cn(pageContent, "space-y-8 sm:space-y-10 pb-20 min-w-0")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/profile">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl min-w-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
          aria-hidden
        />
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-5">
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">S3Labs Points</p>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <h1 className="heading-section text-xl min-[400px]:text-2xl sm:text-3xl">
                Points leaderboard
              </h1>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Ranked by total S3Labs points from campaigns, daily claims, missions, and
              referrals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-lg">
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden />
                Ranked
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {leaderboardQuery.isLoading ? "—" : rankedCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Top score
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
                {leaderboardQuery.isLoading ? "—" : formatPoints(topPoints)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {leaderboardQuery.isLoading ? (
        <PointsLeaderboardSkeleton />
      ) : rows.length === 0 ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-8 sm:p-10 text-center space-y-3 min-w-0">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Award className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <p className="font-medium">No points yet</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Claim daily rewards, join campaigns, or complete missions — then climb the board.
          </p>
          <Button asChild variant="hero" className="rounded-full mt-2">
            <Link to="/profile">Go to profile</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 min-w-0">
          <TopThreeSpotlight rows={rows} />

          <section className="space-y-4 min-w-0" aria-labelledby="points-full-board-heading">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="points-full-board-heading"
                className="font-semibold text-base sm:text-lg tracking-tight"
              >
                Full rankings
              </h2>
            </div>

            <ProfileListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search handle or wallet…"
              searchLabel="Search leaderboard"
              filter={filter}
              onFilterChange={setFilter}
              filterOptions={FILTER_OPTIONS}
              sort={sort}
              onSortChange={setSort}
              sortOptions={SORT_OPTIONS}
              resultCount={filteredSorted.length}
            />

            {filteredSorted.length === 0 ? (
              <div className="panel-glass rounded-2xl border border-border/60 p-8 text-center space-y-2">
                <p className="font-medium">No matches</p>
                <p className="text-sm text-muted-foreground">
                  Try a different search, filter, or sort.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full mt-2"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                    setSort("points_desc");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <>
                <div className="md:hidden panel-glass overflow-hidden rounded-2xl border border-border/60">
                  <ul className="divide-y divide-border/50">
                    {pageItems.map((row) => (
                      <LeaderboardRowMobile key={`${row.rank}-${row.wallet}`} row={row} />
                    ))}
                  </ul>
                  <ProfileListPagination
                    page={safePage}
                    totalPages={totalPages}
                    totalCount={filteredSorted.length}
                    onPageChange={setPage}
                    label="Points leaderboard pagination"
                  />
                </div>

                <div className="hidden md:block panel-glass overflow-hidden rounded-2xl border border-border/60 min-w-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/15">
                          <th className="px-4 py-3.5 font-medium sm:px-5 w-20">Rank</th>
                          <th className="px-4 py-3.5 font-medium sm:px-5">Member</th>
                          <th className="px-4 py-3.5 font-medium text-right sm:px-5">
                            Campaigns
                          </th>
                          <th className="px-4 py-3.5 font-medium text-right sm:px-5">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {pageItems.map((row) => (
                          <tr
                            key={`${row.rank}-${row.wallet}`}
                            className={cn("transition-colors", leaderboardRowClass(row.rank))}
                          >
                            <td className="px-4 py-3 sm:px-5">
                              <LeaderboardRankCell rank={row.rank} />
                            </td>
                            <td className="px-4 py-3 sm:px-5 min-w-[180px]">
                              <div className="min-w-0 space-y-0.5">
                                {row.handle ? (
                                  <Link
                                    to={`/kol/${encodeURIComponent(row.handle)}`}
                                    className="font-medium hover:text-primary transition-colors"
                                  >
                                    @{row.handle}
                                  </Link>
                                ) : (
                                  <span className="font-mono text-sm font-medium">
                                    {shortenAddress(row.wallet, 6)}
                                  </span>
                                )}
                                <p className="font-mono text-[11px] text-muted-foreground">
                                  {shortenAddress(row.wallet, 6)}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground sm:px-5">
                              {row.campaignsParticipated}
                            </td>
                            <td className="px-4 py-3 text-right sm:px-5">
                              <span className="font-semibold tabular-nums text-primary">
                                {formatPoints(row.totalPoints)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ProfileListPagination
                    page={safePage}
                    totalPages={totalPages}
                    totalCount={filteredSorted.length}
                    onPageChange={setPage}
                    label="Points leaderboard pagination"
                  />
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function PointsLeaderboardPage() {
  return (
    <SitePageShell>
      <PointsLeaderboardContent />
    </SitePageShell>
  );
}
