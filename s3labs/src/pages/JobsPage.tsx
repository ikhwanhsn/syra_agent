import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Briefcase, Search, Star } from "lucide-react";

import {
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_REFETCH_MS,
  DISCOVERY_STALE_MS,
} from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryFilterSelect } from "@/components/discovery/DiscoveryFilterSelect";
import { DiscoveryJobSkeleton } from "@/components/discovery/DiscoverySkeletons";
import { DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import {
  DiscoveryCountStat,
  DiscoveryPageHeader,
} from "@/components/discovery/DiscoveryPageHeader";
import { DiscoverySavedToggle } from "@/components/discovery/DiscoverySavedToggle";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { DiscoverySortSelect } from "@/components/discovery/DiscoverySortSelect";
import {
  DiscoverySectionLabel,
  DiscoveryToolbar,
  DiscoveryToolbarRow,
} from "@/components/discovery/DiscoveryToolbar";
import { JobSpotlightCard, JobTicketCard } from "@/components/discovery/jobs/JobCards";
import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { useDiscoveryControlPending } from "@/hooks/useDiscoveryControlPending";
import { useJobFlags } from "@/hooks/useJobFlags";
import {
  DEFAULT_JOB_SORT,
  JOB_SORT_OPTIONS,
  type JobSortKey,
} from "@/lib/discoverySort";
import { fetchJobs, type JobCategory, type JobListing } from "@/lib/jobsApi";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

type JobQuickFilter = "all" | JobCategory | "remote";
type JobView = "all" | "saved";

const JOB_FILTERS: { value: JobQuickFilter; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "web3", label: "Web3" },
  { value: "crypto", label: "Crypto" },
  { value: "tech", label: "Tech" },
  { value: "remote", label: "Remote" },
];

function filterToParams(filter: JobQuickFilter) {
  if (filter === "remote") return { category: "all" as const, remote: true };
  if (filter === "all") return { category: "all" as const, remote: false };
  return { category: filter, remote: false };
}

function JobsPageContent() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<JobQuickFilter>("all");
  const [view, setView] = useState<JobView>("all");
  const [sort, setSort] = useState<JobSortKey>(DEFAULT_JOB_SORT);
  const [search, setSearch] = useState("");

  const { toggleFlag, getFlags } = useJobFlags();

  const controlPending = useDiscoveryControlPending(
    { search, filter, sort },
    false,
  );
  const debouncedFilter = (controlPending.debouncedFilter || "all") as JobQuickFilter;
  const debouncedSort = (controlPending.debouncedSort || DEFAULT_JOB_SORT) as JobSortKey;
  const { category, remote } = filterToParams(debouncedFilter);

  const jobsQuery = useInfiniteQuery({
    queryKey: [
      "jobs",
      category,
      remote,
      controlPending.debouncedSearch,
      debouncedSort,
    ],
    queryFn: ({ pageParam }) =>
      fetchJobs({
        category,
        remote: remote || undefined,
        search: controlPending.debouncedSearch || undefined,
        sort: debouncedSort,
        limit: DISCOVERY_PAGE_SIZE,
        skip: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.jobs.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: DISCOVERY_STALE_MS,
    refetchOnMount: "always",
    refetchInterval: DISCOVERY_REFETCH_MS,
    retry: 1,
  });

  const showSkeleton =
    controlPending.isControlsPending || jobsQuery.isLoading;

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

  const spotlight: JobListing | null = jobs[0] ?? null;
  const feedJobs = useMemo(
    () =>
      spotlight
        ? jobs.filter((job) => job.jobIdentityKey !== spotlight.jobIdentityKey)
        : jobs,
    [jobs, spotlight],
  );

  const total = jobsQuery.data?.pages[0]?.total ?? 0;
  const animatedTotal = useCountUp(total, {
    enabled: !showSkeleton && total > 0,
  });
  const hasMore = allJobs.length < total;

  const openJob = (job: JobListing) => {
    void navigate(`/jobs/${encodeURIComponent(job.jobIdentityKey)}`, {
      state: { record: job },
    });
  };

  return (
    <div className={cn(pageContent, "pb-20")}>
      <DiscoveryPageHeader
        icon={Briefcase}
        eyebrow="Jobs"
        title={
          <>
            Open roles in <span className="text-gradient">web3 & tech</span>
          </>
        }
        description="Curated listings updated daily. Save roles you like, then apply on the original site."
        aside={
          !showSkeleton && total > 0 ? (
            <>
              <DiscoveryCountStat
                value={animatedTotal}
                label={total === 1 ? "opening" : "openings"}
              />
              {savedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setView("saved")}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    view === "saved"
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Star className={cn("h-4 w-4", view === "saved" && "fill-current text-primary")} />
                  {savedCount} saved
                </button>
              ) : null}
            </>
          ) : null
        }
      />

      <DiscoveryToolbar>
        <DiscoveryToolbarRow>
          <DiscoverySearchBar
            id="jobs-search"
            value={search}
            onChange={setSearch}
            placeholder="Search jobs…"
            className="min-w-[12rem]"
          />
          <DiscoveryFilterSelect
            options={JOB_FILTERS}
            value={filter}
            onChange={setFilter}
            label="Category"
          />
          <DiscoverySortSelect
            value={sort}
            onChange={setSort}
            options={JOB_SORT_OPTIONS}
          />
          <DiscoverySavedToggle
            saved={view === "saved"}
            count={savedCount}
            onChange={(saved) => setView(saved ? "saved" : "all")}
          />
        </DiscoveryToolbarRow>
      </DiscoveryToolbar>

      {showSkeleton ? (
        <DiscoveryJobSkeleton />
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
        <div className="space-y-8">
          {spotlight ? (
            <FadeIn>
              <JobSpotlightCard
                job={spotlight}
                isInteresting={getFlags(spotlight.jobIdentityKey).interesting}
                onNavigate={() => openJob(spotlight)}
              />
            </FadeIn>
          ) : null}

          {feedJobs.length > 0 ? (
            <div>
              <DiscoverySectionLabel
                title={view === "saved" ? "Saved roles" : "All openings"}
                meta={`Showing ${feedJobs.length}${hasMore ? "+" : ""} of ${total}`}
              />
              <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {feedJobs.map((job) => {
                  const flags = getFlags(job.jobIdentityKey);
                  return (
                    <StaggerItem key={job.jobIdentityKey} className="h-full">
                      <JobTicketCard
                        job={job}
                        isInteresting={flags.interesting}
                        isApplied={flags.applied}
                        onNavigate={() => openJob(job)}
                        onToggleSaved={() =>
                          toggleFlag(job.jobIdentityKey, "interesting")
                        }
                      />
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </div>
          ) : null}

          <DiscoveryLoadMore
            hasMore={hasMore}
            isLoadingMore={jobsQuery.isFetchingNextPage}
            loadedCount={allJobs.length}
            totalCount={total}
            onLoadMore={() => void jobsQuery.fetchNextPage()}
            itemLabel="openings"
          />
        </div>
      )}
    </div>
  );
}

const JobsPage = () => (
  <SitePageShell>
    <JobsPageContent />
  </SitePageShell>
);

export default JobsPage;
