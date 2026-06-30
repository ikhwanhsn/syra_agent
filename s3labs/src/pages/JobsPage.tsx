import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Briefcase, Search, Star } from "lucide-react";

import { DISCOVERY_PAGE_SIZE } from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryFilterPills } from "@/components/discovery/DiscoveryFilterPills";
import { DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { JobSpotlightCard, JobTicketCard } from "@/components/discovery/jobs/JobCards";
import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useJobFlags } from "@/hooks/useJobFlags";
import { fetchJobs, type JobCategory, type JobListing } from "@/lib/jobsApi";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

type JobQuickFilter = "all" | JobCategory | "remote";
type JobView = "all" | "saved";

const JOB_FILTERS: { value: JobQuickFilter; label: string }[] = [
  { value: "all", label: "All" },
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

function JobGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}

function pickSpotlightJob(jobs: JobListing[]): JobListing | null {
  if (jobs.length === 0) return null;
  return [...jobs].sort((a, b) => {
    const scoreDiff = (b.salaryScore ?? 0) - (a.salaryScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const aTime = new Date(a.lastSeenAt ?? a.publishedAt ?? 0).getTime();
    const bTime = new Date(b.lastSeenAt ?? b.publishedAt ?? 0).getTime();
    return bTime - aTime;
  })[0];
}

function JobsPageContent() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<JobQuickFilter>("all");
  const [view, setView] = useState<JobView>("all");
  const [search, setSearch] = useState("");
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

  const spotlight = useMemo(() => pickSpotlightJob(jobs), [jobs]);
  const feedJobs = useMemo(
    () =>
      spotlight
        ? jobs.filter((job) => job.jobIdentityKey !== spotlight.jobIdentityKey)
        : jobs,
    [jobs, spotlight],
  );

  const total = jobsQuery.data?.pages[0]?.total ?? 0;
  const animatedTotal = useCountUp(total, { enabled: !jobsQuery.isLoading && total > 0 });
  const hasMore = allJobs.length < total;
  const isInitialLoading = jobsQuery.isLoading;

  const openJob = (job: JobListing) => {
    void navigate(`/jobs/${encodeURIComponent(job.jobIdentityKey)}`, {
      state: { record: job },
    });
  };

  return (
    <div className={cn(pageContent, "pb-20")}>
      {/* Hero band */}
      <FadeIn>
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80"
            aria-hidden
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-4">
                <Briefcase className="h-4 w-4" aria-hidden />
                Jobs
              </p>
              <h1 className="heading-display">
                Open roles in <span className="text-gradient">web3 & tech</span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Curated listings updated daily. Save roles you like, then apply on the
                original site.
              </p>
            </div>

            {!isInitialLoading && total > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-col lg:items-end">
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] px-5 py-4 text-center lg:min-w-[9rem]">
                  <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                    {animatedTotal}
                  </p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {total === 1 ? "opening" : "openings"}
                  </p>
                </div>
                {savedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setView("saved")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      view === "saved"
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Star className={cn("h-4 w-4", view === "saved" && "fill-current text-primary")} />
                    {savedCount} saved
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </FadeIn>

      {/* Sticky toolbar */}
      <FadeIn delay={0.05} className="sticky top-[5.5rem] z-20 mb-8">
        <div className="panel-glass space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-fit">
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
              className="lg:max-w-md"
            />
          </div>

          <DiscoveryFilterPills
            options={JOB_FILTERS}
            value={filter}
            onChange={setFilter}
            scrollable
          />
        </div>
      </FadeIn>

      {/* Results */}
      {isInitialLoading ? (
        <JobGridSkeleton />
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
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {view === "saved" ? "Saved roles" : "All openings"}
                </h2>
                <p className="text-xs tabular-nums text-muted-foreground">
                  Showing {feedJobs.length}
                  {hasMore ? "+" : ""} of {total}
                </p>
              </div>

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
