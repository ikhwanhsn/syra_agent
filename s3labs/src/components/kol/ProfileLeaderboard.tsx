import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { KolProfileAvatar } from "@/components/kol/KolProfileAvatar";
import { LeaderboardRankCell, leaderboardRowClass } from "@/components/kol/leaderboardUi";

type LeaderboardVariant = "projects" | "kols";

const PAGE_SIZE = 15;
const FETCH_LIMIT = 100;

function getVisiblePageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

function matchesSearch(query: string, handle: string, name: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return handle.toLowerCase().includes(q) || name.toLowerCase().includes(q);
}

function Bone({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("skeleton-bone", className)} style={style} aria-hidden />;
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
  profilePicture,
}: {
  handle: string;
  name: string;
  verified?: boolean;
  followers?: number | null;
  profilePicture?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <KolProfileAvatar handle={handle} name={name} profilePicture={profilePicture} size="md" />
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

function LeaderboardSearch({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id: string;
}) {
  return (
    <div className="relative min-w-0 w-full">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border-border/60 bg-background/80 pl-10 pr-10 shadow-sm"
        autoComplete="off"
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function LeaderboardPagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  if (totalCount === 0) return null;

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);
  const visible = getVisiblePageNumbers(page, totalPages);

  return (
    <div
      className="flex flex-col gap-4 border-t border-border/60 bg-muted/15 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4"
      role="navigation"
      aria-label="Leaderboard pagination"
    >
      <p className="order-2 text-center text-sm tabular-nums text-muted-foreground sm:order-1 sm:text-left">
        Showing {from}–{to} of {totalCount}
      </p>
      {totalPages > 1 ? (
        <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1 px-2.5"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Prev</span>
          </Button>
          <div className="mx-1 flex items-center gap-0.5">
            {visible.map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                  aria-hidden
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === page ? "default" : "ghost"}
                  size="icon"
                  className={cn("h-9 w-9", item === page && "pointer-events-none")}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Button>
              ),
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1 px-2.5"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ProfileLeaderboardSkeleton({
  variant,
  hideSearch = false,
}: {
  variant: LeaderboardVariant;
  /** Keep the real search input mounted during search transitions. */
  hideSearch?: boolean;
}) {
  const rowCount = 8;
  const profileLabel = variant === "projects" ? "Project" : "KOL";

  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">
        {hideSearch
          ? `Searching ${profileLabel.toLowerCase()} leaderboard…`
          : `Loading ${profileLabel.toLowerCase()} leaderboard…`}
      </span>
      {hideSearch ? null : <Bone className="h-11 w-full rounded-xl" />}
      <div className="panel-glass min-w-0 overflow-hidden rounded-2xl border border-border/60">
        <div className="md:hidden divide-y divide-border/50">
          {Array.from({ length: rowCount }, (_, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 animate-fade-in opacity-0"
              style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}
            >
              <Bone className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Bone className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-4 w-[55%] rounded-md" />
                  <Bone className="h-3 w-[38%] rounded-md" />
                  <Bone className="mt-1 h-3 w-[70%] rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block">
          <div className="flex items-center gap-4 border-b border-border/60 bg-muted/30 px-4 py-3">
            <Bone className="h-3 w-8 rounded" />
            <Bone className="h-3 w-20 rounded" />
            <Bone className="ml-auto h-3 w-16 rounded" />
            <Bone className="h-3 w-14 rounded" />
            <Bone className="hidden h-3 w-16 rounded lg:block" />
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
                <Bone className="h-4 w-12 shrink-0 rounded-md" />
                <Bone className="h-4 w-16 shrink-0 rounded-md" />
                <Bone className="hidden h-4 w-12 shrink-0 rounded-md lg:block" />
                <Bone className="h-4 w-14 shrink-0 rounded-md" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/15 px-4 py-4">
            <Bone className="h-4 w-36 rounded-md" />
            <div className="flex gap-1">
              <Bone className="h-9 w-16 rounded-lg" />
              <Bone className="h-9 w-9 rounded-lg" />
              <Bone className="h-9 w-9 rounded-lg" />
              <Bone className="h-9 w-16 rounded-lg" />
            </div>
          </div>
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), 450);
  const isSearchPending = search.trim() !== debouncedSearch;

  const projectsQuery = useQuery({
    queryKey: ["kol-projects", sortKey],
    queryFn: () => fetchProjects({ limit: FETCH_LIMIT, sort: sortKey as ProjectSortKey }),
    enabled: variant === "projects",
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const kolsQuery = useQuery({
    queryKey: ["kol-kols", sortKey],
    queryFn: () => fetchKols({ limit: FETCH_LIMIT, sort: sortKey as KolSortKey }),
    enabled: variant === "kols",
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const isLoading = variant === "projects" ? projectsQuery.isLoading : kolsQuery.isLoading;
  const isError = variant === "projects" ? projectsQuery.isError : kolsQuery.isError;
  const projects = projectsQuery.data?.projects ?? [];
  const kols = kolsQuery.data?.kols ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey, sortDir, variant]);

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

  const filteredProjects = useMemo(
    () =>
      sortedProjects.filter((p) =>
        matchesSearch(debouncedSearch, p.handle, p.name || p.handle),
      ),
    [sortedProjects, debouncedSearch],
  );

  const filteredKols = useMemo(
    () =>
      sortedKols.filter((k) =>
        matchesSearch(debouncedSearch, k.handle, k.name ?? k.handle),
      ),
    [sortedKols, debouncedSearch],
  );

  const filteredRows = variant === "projects" ? filteredProjects : filteredKols;
  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageProjects = filteredProjects.slice(pageStart, pageStart + PAGE_SIZE);
  const pageKols = filteredKols.slice(pageStart, pageStart + PAGE_SIZE);

  const searchPlaceholder =
    variant === "projects" ? "Search projects by name or @handle…" : "Search KOLs by name or @handle…";

  if (isLoading) {
    return <ProfileLeaderboardSkeleton variant={variant} />;
  }

  if (isError) {
    return (
      <div className="panel-glass rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Could not load {variant === "projects" ? "project" : "KOL"} leaderboard. Try again later.
      </div>
    );
  }

  const hasSourceData =
    variant === "projects" ? sortedProjects.length > 0 : sortedKols.length > 0;

  if (!hasSourceData) {
    return (
      <div className="panel-glass rounded-2xl p-10 text-center text-muted-foreground text-sm">
        {variant === "projects"
          ? "No projects yet. Launch a campaign from the For Projects tab."
          : "No KOL submissions yet. Join an active campaign to appear here."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <LeaderboardSearch
        id={`leaderboard-search-${variant}`}
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
      />

      {isSearchPending ? (
        <ProfileLeaderboardSkeleton variant={variant} hideSearch />
      ) : totalCount === 0 ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-10 text-center text-sm text-muted-foreground">
          No results for “{debouncedSearch}”. Try another name or handle.
        </div>
      ) : variant === "projects" ? (
        <div className="panel-glass min-w-0 overflow-hidden rounded-2xl border border-border/60">
          <div className="md:hidden divide-y divide-border/50">
            {pageProjects.map((project, index) => {
              const rank = pageStart + index + 1;
              return (
                <Link
                  key={project.handle}
                  to={`/kol/${encodeURIComponent(project.handle)}`}
                  className={cn("flex gap-3 p-4 transition-colors", leaderboardRowClass(rank))}
                >
                  <LeaderboardRankCell rank={rank} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <ProfileCell
                      handle={project.handle}
                      name={project.name}
                      verified={project.verified}
                      followers={project.followers}
                      profilePicture={project.profilePicture}
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium tabular-nums text-foreground">
                          {project.campaignCount}
                        </span>{" "}
                        campaigns
                        <span className="mx-1 text-border">·</span>
                        {project.activeCampaignCount} live
                      </span>
                      <span className="whitespace-nowrap font-mono font-medium tabular-nums text-primary">
                        {formatSol(project.totalFundedSol)} SOL
                      </span>
                      <span className="tabular-nums">{project.kolsReached} KOLs</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground opacity-60" />
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/30 hover:bg-transparent">
                  <TableHead className="w-[4.5rem] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="min-w-[200px]">Project</TableHead>
                  <SortableHead
                    columnKey="campaigns"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Campaigns"
                  >
                    Campaigns
                  </SortableHead>
                  <SortableHead
                    columnKey="funded"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Funded"
                  >
                    Funded
                  </SortableHead>
                  <SortableHead
                    columnKey="kols"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="KOLs reached"
                    className="hidden md:table-cell"
                  >
                    KOLs
                  </SortableHead>
                  <SortableHead
                    columnKey="recent"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Recent"
                    className="hidden lg:table-cell"
                  >
                    Last active
                  </SortableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageProjects.map((project, index) => {
                  const rank = pageStart + index + 1;
                  return (
                    <TableRow
                      key={project.handle}
                      className={cn("border-border/60", leaderboardRowClass(rank))}
                    >
                      <TableCell className="w-[4.5rem] align-middle">
                        <LeaderboardRankCell rank={rank} />
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <Link
                          to={`/kol/${encodeURIComponent(project.handle)}`}
                          className="group -m-2 flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-muted/60"
                        >
                          <ProfileCell
                            handle={project.handle}
                            name={project.name}
                            verified={project.verified}
                            followers={project.followers}
                            profilePicture={project.profilePicture}
                          />
                          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className="font-medium">{project.campaignCount}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({project.activeCampaignCount} live)
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums">
                        {formatSol(project.totalFundedSol)} SOL
                      </TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">
                        {project.kolsReached}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
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

          <LeaderboardPagination
            page={safePage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <div className="panel-glass min-w-0 overflow-hidden rounded-2xl border border-border/60">
          <div className="md:hidden divide-y divide-border/50">
            {pageKols.map((kol, index) => {
              const rank = pageStart + index + 1;
              return (
                <Link
                  key={kol.handle}
                  to={`/kol/${encodeURIComponent(kol.handle)}`}
                  className={cn("flex gap-3 p-4 transition-colors", leaderboardRowClass(rank))}
                >
                  <LeaderboardRankCell rank={rank} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <ProfileCell
                      handle={kol.handle}
                      name={kol.name ?? kol.handle}
                      verified={kol.verified}
                      profilePicture={kol.profilePicture}
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium tabular-nums text-foreground">
                          {kol.campaignCount}
                        </span>{" "}
                        campaigns
                      </span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {kol.totalScore.toFixed(1)} rep
                      </span>
                      <span className="tabular-nums">
                        {formatCompact(kol.engagement.total)} engagement
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 self-center text-right">
                    <p className="whitespace-nowrap font-mono text-sm font-semibold tabular-nums text-primary">
                      {formatSol(kol.earnedSol)} SOL
                    </p>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground opacity-60" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/30 hover:bg-transparent">
                  <TableHead className="w-[4.5rem] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="min-w-[200px]">KOL</TableHead>
                  <SortableHead
                    columnKey="campaigns"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Campaigns"
                  >
                    Campaigns
                  </SortableHead>
                  <SortableHead
                    columnKey="score"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Reputation score"
                  >
                    Reputation
                  </SortableHead>
                  <SortableHead
                    columnKey="engagement"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Engagement"
                    className="hidden md:table-cell"
                  >
                    Engagement
                  </SortableHead>
                  <SortableHead
                    columnKey="earned"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    label="Earned"
                  >
                    Earned
                  </SortableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageKols.map((kol, index) => {
                  const rank = pageStart + index + 1;
                  return (
                    <TableRow
                      key={kol.handle}
                      className={cn("border-border/60", leaderboardRowClass(rank))}
                    >
                      <TableCell className="w-[4.5rem] align-middle">
                        <LeaderboardRankCell rank={rank} />
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <Link
                          to={`/kol/${encodeURIComponent(kol.handle)}`}
                          className="group -m-2 flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-muted/60"
                        >
                          <ProfileCell
                            handle={kol.handle}
                            name={kol.name ?? kol.handle}
                            verified={kol.verified}
                            profilePicture={kol.profilePicture}
                          />
                          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
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
                      <TableCell className="hidden text-sm tabular-nums md:table-cell">
                        {formatCompact(kol.engagement.total)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-primary">
                        {formatSol(kol.earnedSol)} SOL
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <LeaderboardPagination
            page={safePage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
