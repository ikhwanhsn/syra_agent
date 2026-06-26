import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  MapPin,
  Search,
  Star,
  EyeOff,
} from "lucide-react";

import { DISCOVERY_PAGE_SIZE } from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoveryFilterPills } from "@/components/discovery/DiscoveryFilterPills";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { faviconFromPageUrl } from "@/lib/imageUrl";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useJobFlags } from "@/hooks/useJobFlags";
import { fetchJobs, type JobCategory, type JobListing } from "@/lib/jobsApi";

type JobQuickFilter = "all" | JobCategory | "remote";
type JobView = "all" | "saved";

const JOB_FILTERS: { value: JobQuickFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "web3", label: "Web3" },
  { value: "crypto", label: "Crypto" },
  { value: "tech", label: "Tech" },
  { value: "remote", label: "Remote" },
];

const CATEGORY_LABEL: Record<JobCategory, string> = {
  web3: "Web3",
  crypto: "Crypto",
  tech: "Tech",
};

function filterToParams(filter: JobQuickFilter) {
  if (filter === "remote") return { category: "all" as const, remote: true };
  if (filter === "all") return { category: "all" as const, remote: false };
  return { category: filter, remote: false };
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function JobListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border/40 px-5 py-4 last:border-b-0"
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 max-w-xs" />
            <Skeleton className="h-3 w-2/5 max-w-[10rem]" />
          </div>
          <Skeleton className="hidden h-3 w-12 sm:block" />
        </div>
      ))}
    </div>
  );
}

interface JobRowProps {
  job: JobListing;
  isInteresting: boolean;
  isApplied: boolean;
  onSelect: () => void;
  onToggleFlag: (
    key: string,
    flag: "interesting" | "applied" | "hidden",
  ) => void;
}

function JobRow({
  job,
  isInteresting,
  isApplied,
  onSelect,
  onToggleFlag,
}: JobRowProps) {
  const company = job.company || "Company not listed";
  const location = job.remote ? "Remote" : job.location || "Location TBD";

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-4 px-4 py-4 transition-colors sm:px-5",
          "hover:bg-muted/40",
          isInteresting && "bg-primary/[0.03]",
          isApplied &&
            "border-l-2 border-l-emerald-500/60 pl-[calc(1rem-2px)] sm:pl-[calc(1.25rem-2px)]",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          <DiscoveryListThumb
            imageUrl={faviconFromPageUrl(job.url)}
            label={company}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold leading-snug text-foreground sm:text-base">
                {job.title}
              </h2>
              {isApplied ? (
                <Badge
                  variant="outline"
                  className="h-5 shrink-0 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-400"
                >
                  Applied
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {company}
              <span className="mx-1.5 text-border" aria-hidden>
                ·
              </span>
              {location}
              {job.salaryLabel ? (
                <>
                  <span className="mx-1.5 text-border" aria-hidden>
                    ·
                  </span>
                  {job.salaryLabel}
                </>
              ) : null}
            </p>
          </div>

          <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block">
            {formatRelativeDate(job.lastSeenAt ?? job.publishedAt)}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "h-9 w-9 rounded-lg text-muted-foreground",
              isInteresting && "text-primary",
            )}
            onClick={() => onToggleFlag(job.jobIdentityKey, "interesting")}
            aria-label={isInteresting ? "Remove from saved" : "Save job"}
            aria-pressed={isInteresting}
          >
            <Star className={cn("h-4 w-4", isInteresting && "fill-current")} />
          </Button>
          <Button
            size="sm"
            variant="default"
            className="hidden h-9 rounded-lg px-3 sm:inline-flex"
            asChild
          >
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              Apply
            </a>
          </Button>
        </div>
      </div>
    </li>
  );
}

function JobsPageContent() {
  const [filter, setFilter] = useState<JobQuickFilter>("all");
  const [view, setView] = useState<JobView>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<JobListing | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const { toggleFlag, getFlags } = useJobFlags();
  const { category, remote } = filterToParams(filter);

  const jobsQuery = useInfiniteQuery({
    queryKey: ["jobs", category, remote, debouncedSearch],
    queryFn: ({ pageParam }) =>
      fetchJobs({
        category,
        remote: remote || undefined,
        search: debouncedSearch || undefined,
        limit: DISCOVERY_PAGE_SIZE,
        skip: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.jobs.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: 60_000,
    retry: 1,
  });

  const allJobs = useMemo(() => {
    const list = jobsQuery.data?.pages.flatMap((page) => page.jobs) ?? [];
    return list.filter((job) => !getFlags(job.jobIdentityKey).hidden);
  }, [jobsQuery.data?.pages, getFlags]);

  const jobs = useMemo(() => {
    if (view === "saved") {
      return allJobs.filter((job) => getFlags(job.jobIdentityKey).interesting);
    }
    return allJobs;
  }, [allJobs, view, getFlags]);

  const savedCount = useMemo(
    () =>
      allJobs.filter((job) => getFlags(job.jobIdentityKey).interesting).length,
    [allJobs, getFlags],
  );

  const total = jobsQuery.data?.pages[0]?.total ?? 0;
  const hasMore = allJobs.length < total;
  const isInitialLoading = jobsQuery.isLoading;
  const isLoadingMore = jobsQuery.isFetchingNextPage;

  const selectedFlags = selected ? getFlags(selected.jobIdentityKey) : null;

  return (
    <div className={cn(pageContent, "pb-20")}>
      {/* Header */}
      <header className="mb-10 flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-3">
            <Briefcase className="h-4 w-4" aria-hidden />
            Jobs
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Open roles in <span className="text-gradient">web3 & tech</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Curated listings updated daily. Save roles you like, then apply on the
            original site.
          </p>
        </div>
        {!isInitialLoading && total > 0 ? (
          <div className="shrink-0 border-t border-border/60 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0 lg:text-right">
            <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
              {total}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 1 ? "opening" : "openings"} available
            </p>
          </div>
        ) : null}
      </header>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-fit">
          {(
            [
              { id: "all" as const, label: "All roles" },
              { id: "saved" as const, label: "Saved", count: savedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              aria-pressed={view === tab.id}
              className={cn(
                "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                view === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {"count" in tab && tab.count > 0 ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <DiscoverySearchBar
          id="jobs-search"
          value={search}
          onChange={setSearch}
          placeholder="Search by title, company, or keyword…"
        />

        <DiscoveryFilterPills
          options={JOB_FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {/* Results */}
      <div>
        {isInitialLoading ? (
          <JobListSkeleton />
        ) : jobsQuery.isError ? (
          <DiscoveryEmptyState
            icon={Briefcase}
            title="Jobs aren't available yet"
            description="We're still gathering listings. Check back soon — new roles are added daily."
          />
        ) : jobs.length === 0 ? (
          <DiscoveryEmptyState
            icon={view === "saved" ? Star : Search}
            title={
              view === "saved"
                ? "No saved jobs yet"
                : "No jobs match your search"
            }
            description={
              view === "saved"
                ? "Tap the star on any role to save it here for later."
                : "Try a different keyword or filter."
            }
            action={
              view === "saved" ? (
                <Button
                  variant="heroOutline"
                  className="rounded-full"
                  onClick={() => setView("all")}
                >
                  Browse all roles
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-card">
              {jobs.map((job) => {
                const flags = getFlags(job.jobIdentityKey);
                return (
                  <JobRow
                    key={job.jobIdentityKey}
                    job={job}
                    isInteresting={flags.interesting}
                    isApplied={flags.applied}
                    onSelect={() => setSelected(job)}
                    onToggleFlag={toggleFlag}
                  />
                );
              })}
            </ul>

            <DiscoveryLoadMore
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loadedCount={allJobs.length}
              totalCount={total}
              onLoadMore={() => void jobsQuery.fetchNextPage()}
              itemLabel="openings"
            />
          </>
        )}
      </div>

      {/* Job detail */}
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full overflow-y-auto border-border/60 sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader className="pr-8 text-left">
                <SheetDescription className="flex items-center gap-2">
                  <DiscoveryListThumb
                    size="sm"
                    imageUrl={faviconFromPageUrl(selected.url)}
                    label={selected.company || "?"}
                  />
                  {selected.company || "Company not listed"}
                </SheetDescription>
                <SheetTitle className="text-xl leading-snug">
                  {selected.title}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {CATEGORY_LABEL[selected.category]}
                  </Badge>
                  {selected.remote ? (
                    <Badge variant="outline">Remote</Badge>
                  ) : selected.location ? (
                    <Badge variant="outline">{selected.location}</Badge>
                  ) : null}
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Location
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {selected.remote
                          ? "Remote"
                          : selected.location || "Not listed"}
                      </dd>
                    </div>
                  </div>
                  {selected.salaryLabel ? (
                    <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                      <DollarSign
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <div>
                        <dt className="text-xs text-muted-foreground">
                          Compensation
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium">
                          {selected.salaryLabel}
                        </dd>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <Building2
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div>
                      <dt className="text-xs text-muted-foreground">Source</dt>
                      <dd className="mt-0.5 text-sm font-medium capitalize">
                        {selected.source}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <Briefcase
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div>
                      <dt className="text-xs text-muted-foreground">Posted</dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {formatRelativeDate(
                          selected.lastSeenAt ?? selected.publishedAt,
                        )}
                      </dd>
                    </div>
                  </div>
                </dl>

                {selected.description ? (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-foreground">
                      About this role
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {selected.description}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 border-t border-border/50 pt-5">
                  <Button
                    type="button"
                    variant={selectedFlags?.interesting ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg"
                    onClick={() =>
                      toggleFlag(selected.jobIdentityKey, "interesting")
                    }
                  >
                    <Star
                      className={cn(
                        "mr-1.5 h-4 w-4",
                        selectedFlags?.interesting && "fill-current",
                      )}
                    />
                    {selectedFlags?.interesting ? "Saved" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant={selectedFlags?.applied ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg"
                    onClick={() =>
                      toggleFlag(selected.jobIdentityKey, "applied")
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {selectedFlags?.applied ? "Applied" : "Mark applied"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-muted-foreground"
                    onClick={() => {
                      toggleFlag(selected.jobIdentityKey, "hidden");
                      setSelected(null);
                    }}
                  >
                    <EyeOff className="mr-1.5 h-4 w-4" />
                    Hide
                  </Button>
                </div>

                <Button
                  variant="hero"
                  className="w-full gap-2 rounded-xl"
                  asChild
                >
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply on {selected.source}
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const JobsPage = () => (
  <SitePageShell>
    <JobsPageContent />
  </SitePageShell>
);

export default JobsPage;
