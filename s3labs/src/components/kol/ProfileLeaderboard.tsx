import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  ChevronRight,
  Trophy,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchKols,
  fetchProjects,
  type KolProjectSummary,
  type KolSortKey,
  type KolSummary,
  type ProjectSortKey,
} from "@/lib/kolApi";
import { formatCompact, formatFollowers, formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

type LeaderboardVariant = "projects" | "kols";

function LeaderboardRankCell({ rank }: { rank: number }) {
  const tier = rank <= 3 ? rank : 0;
  return (
    <div className="flex items-center justify-center py-0.5">
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1 min-w-[2.5rem] h-10 px-2 rounded-xl font-bold tabular-nums text-sm transition-colors",
          tier === 1 &&
            "bg-gradient-to-b from-amber-400/90 to-amber-600/85 text-amber-950 shadow-[0_0_24px_rgba(245,158,11,0.35)] border border-amber-300/60",
          tier === 2 &&
            "bg-gradient-to-b from-slate-200/95 to-slate-400/85 text-slate-900 border border-slate-300/70",
          tier === 3 &&
            "bg-gradient-to-b from-orange-300/90 to-amber-800/75 text-orange-950 border border-orange-500/45",
          tier === 0 && "text-muted-foreground font-semibold bg-muted/40 border border-border/50",
        )}
      >
        {tier === 1 ? <Trophy className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
        {rank}
      </span>
    </div>
  );
}

function leaderboardRowClass(rank: number): string {
  if (rank === 1) return "bg-gradient-to-r from-amber-500/[0.07] via-primary/[0.04] to-transparent";
  if (rank === 2) return "bg-gradient-to-r from-slate-400/[0.08] via-transparent to-transparent";
  if (rank === 3) return "bg-gradient-to-r from-orange-600/[0.07] via-transparent to-transparent";
  return "hover:bg-muted/35";
}

function SortableHead({
  columnKey,
  sortKey,
  sortDir,
  onSort,
  className,
  label,
  children,
}: {
  columnKey: string;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const active = sortKey === columnKey;
  return (
    <TableHead className={className} aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors select-none -mx-2 px-2 py-1.5 rounded-md hover:bg-muted/60",
          active && "text-foreground",
        )}
        onClick={() => onSort(columnKey)}
        aria-label={active ? `${label}, sorted ${sortDir}` : `${label}, sort`}
      >
        <span>{children}</span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}

function ProfileCell({
  handle,
  name,
  verified,
  followers,
}: {
  handle: string;
  name: string;
  verified?: boolean;
  followers?: number | null;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0 ring-1 ring-border uppercase"
        aria-hidden
      >
        {handle.slice(0, 1)}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
          <span className="truncate">{name}</span>
          {verified ? <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" /> : null}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>@{handle}</span>
          {followers != null ? (
            <>
              <span className="text-border">·</span>
              <span>{formatFollowers(followers)} followers</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ProfileLeaderboardProps {
  variant: LeaderboardVariant;
}

export function ProfileLeaderboard({ variant }: ProfileLeaderboardProps) {
  const defaultSort = variant === "projects" ? "funded" : "earned";
  const [sortKey, setSortKey] = useState<string>(defaultSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const projectsQuery = useQuery({
    queryKey: ["kol-projects", sortKey],
    queryFn: () => fetchProjects({ limit: 50, sort: sortKey as ProjectSortKey }),
    enabled: variant === "projects",
    staleTime: 60_000,
    retry: 1,
  });

  const kolsQuery = useQuery({
    queryKey: ["kol-kols", sortKey],
    queryFn: () => fetchKols({ limit: 50, sort: sortKey as KolSortKey }),
    enabled: variant === "kols",
    staleTime: 60_000,
    retry: 1,
  });

  const isLoading = variant === "projects" ? projectsQuery.isLoading : kolsQuery.isLoading;
  const isError = variant === "projects" ? projectsQuery.isError : kolsQuery.isError;
  const projects = projectsQuery.data?.projects ?? [];
  const kols = kolsQuery.data?.kols ?? [];

  const handleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const sortedProjects = useMemo(() => {
    if (variant !== "projects") return [];
    const rows = [...projects];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (r: KolProjectSummary): number | string => {
        switch (sortKey) {
          case "campaigns":
            return r.campaignCount;
          case "kols":
            return r.kolsReached;
          case "recent":
            return new Date(r.lastActivityAt ?? 0).getTime();
          case "funded":
          default:
            return r.totalFundedSol;
        }
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir;
      return ((va as number) - (vb as number)) * dir;
    });
    return rows;
  }, [projects, sortDir, sortKey, variant]);

  const sortedKols = useMemo(() => {
    if (variant !== "kols") return [];
    const rows = [...kols];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const getVal = (r: KolSummary): number => {
        switch (sortKey) {
          case "score":
            return r.totalScore;
          case "engagement":
            return r.engagement.total;
          case "campaigns":
            return r.campaignCount;
          case "recent":
            return new Date(r.lastActivityAt ?? 0).getTime();
          case "earned":
          default:
            return r.earnedSol;
        }
      };
      return (getVal(a) - getVal(b)) * dir;
    });
    return rows;
  }, [kols, sortDir, sortKey, variant]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel-glass rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Could not load {variant === "projects" ? "project" : "KOL"} leaderboard. Try again later.
      </div>
    );
  }

  if (variant === "projects" && sortedProjects.length === 0) {
    return (
      <div className="panel-glass rounded-2xl p-10 text-center text-muted-foreground text-sm">
        No projects yet. Launch a campaign from the For Projects tab.
      </div>
    );
  }

  if (variant === "kols" && sortedKols.length === 0) {
    return (
      <div className="panel-glass rounded-2xl p-10 text-center text-muted-foreground text-sm">
        No KOL submissions yet. Join an active campaign to appear here.
      </div>
    );
  }

  if (variant === "projects") {
    return (
      <div className="panel-glass rounded-2xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60 bg-muted/30">
              <TableHead className="w-[4.5rem] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                #
              </TableHead>
              <TableHead className="min-w-[200px]">Project</TableHead>
              <SortableHead columnKey="campaigns" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Campaigns">
                Campaigns
              </SortableHead>
              <SortableHead columnKey="funded" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Funded">
                Funded
              </SortableHead>
              <SortableHead columnKey="kols" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="KOLs reached" className="hidden md:table-cell">
                KOLs
              </SortableHead>
              <SortableHead columnKey="recent" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Recent" className="hidden lg:table-cell">
                Last active
              </SortableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project, index) => {
              const rank = index + 1;
              return (
                <TableRow key={project.handle} className={cn("border-border/60", leaderboardRowClass(rank))}>
                  <TableCell className="w-[4.5rem] align-middle">
                    <LeaderboardRankCell rank={rank} />
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <Link
                      to={`/kol/${encodeURIComponent(project.handle)}`}
                      className="flex items-center gap-2 -m-2 p-2 rounded-xl hover:bg-muted/60 transition-colors group"
                    >
                      <ProfileCell
                        handle={project.handle}
                        name={project.name}
                        verified={project.verified}
                        followers={project.followers}
                      />
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity ml-auto" />
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className="font-medium">{project.campaignCount}</span>
                    <span className="text-muted-foreground text-xs ml-1">({project.activeCampaignCount} live)</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums whitespace-nowrap">
                    {formatSol(project.totalFundedSol)} SOL
                  </TableCell>
                  <TableCell className="hidden md:table-cell tabular-nums">{project.kolsReached}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {project.lastActivityAt
                      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                          new Date(project.lastActivityAt),
                        )
                      : "—"}
                  </TableCell>
                  <TableCell />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="panel-glass rounded-2xl border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/60 bg-muted/30">
            <TableHead className="w-[4.5rem] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              #
            </TableHead>
            <TableHead className="min-w-[200px]">KOL</TableHead>
            <SortableHead columnKey="campaigns" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Campaigns">
              Campaigns
            </SortableHead>
            <SortableHead columnKey="score" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Reputation score">
              Reputation
            </SortableHead>
            <SortableHead columnKey="engagement" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Engagement" className="hidden md:table-cell">
              Engagement
            </SortableHead>
            <SortableHead columnKey="earned" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} label="Earned">
              Earned
            </SortableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedKols.map((kol, index) => {
            const rank = index + 1;
            return (
              <TableRow key={kol.handle} className={cn("border-border/60", leaderboardRowClass(rank))}>
                <TableCell className="w-[4.5rem] align-middle">
                  <LeaderboardRankCell rank={rank} />
                </TableCell>
                <TableCell className="max-w-[280px]">
                  <Link
                    to={`/kol/${encodeURIComponent(kol.handle)}`}
                    className="flex items-center gap-2 -m-2 p-2 rounded-xl hover:bg-muted/60 transition-colors group"
                  >
                    <ProfileCell handle={kol.handle} name={kol.handle} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity ml-auto" />
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{kol.campaignCount}</TableCell>
                <TableCell className="font-mono text-sm tabular-nums">
                  <span className="font-medium">{kol.totalScore.toFixed(1)}</span>
                  {kol.reputationScore > 0 ? (
                    <span className="block text-xs text-muted-foreground">
                      {kol.reputationScore.toFixed(1)} earned · {kol.campaignsCompleted} done
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="hidden md:table-cell tabular-nums text-sm">
                  {formatCompact(kol.engagement.total)}
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-primary whitespace-nowrap">
                  {formatSol(kol.earnedSol)} SOL
                </TableCell>
                <TableCell />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
