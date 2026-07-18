import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Search, Star, Trophy } from "lucide-react";

import {
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_REFETCH_MS,
  DISCOVERY_STALE_MS,
} from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryFilterSelect } from "@/components/discovery/DiscoveryFilterSelect";
import { DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoveryHackathonSkeleton } from "@/components/discovery/DiscoverySkeletons";
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
import { HackathonArenaCard } from "@/components/discovery/hackathons/HackathonCards";
import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { useDiscoveryControlPending } from "@/hooks/useDiscoveryControlPending";
import { useHackathonSaves } from "@/hooks/useDiscoverySaves";
import { formatDate } from "@/lib/discoveryFormatters";
import {
  DEFAULT_HACKATHON_SORT,
  HACKATHON_SORT_OPTIONS,
  type HackathonSortKey,
} from "@/lib/discoverySort";
import {
  fetchHackathonLatestRun,
  fetchHackathons,
  type HackathonRecord,
} from "@/lib/hackathonApi";
import { isAdminWallet } from "@/lib/adminWallet";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

type HackathonView = "all" | "saved";

const ADMIN_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "interested", label: "Interested" },
  { value: "joined", label: "Joined" },
  { value: "in_progress", label: "In progress" },
  { value: "submitted", label: "Submitted" },
  { value: "skipped", label: "Skipped" },
  { value: "archived", label: "Archived" },
] as const;

function HackathonPageContent() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);

  const [statusTab, setStatusTab] = useState("all");
  const [view, setView] = useState<HackathonView>("all");
  const [sort, setSort] = useState<HackathonSortKey>(DEFAULT_HACKATHON_SORT);
  const [search, setSearch] = useState("");

  const { toggleFlag, getFlags } = useHackathonSaves();

  const controlPending = useDiscoveryControlPending(
    { search, sort, status: statusTab },
    false,
  );
  const debouncedSort = (controlPending.debouncedSort ||
    DEFAULT_HACKATHON_SORT) as HackathonSortKey;
  const debouncedStatus = controlPending.debouncedStatus || "all";

  const listQuery = useInfiniteQuery({
    queryKey: [
      "hackathons",
      address,
      debouncedStatus,
      controlPending.debouncedSearch,
      debouncedSort,
      isAdmin,
    ],
    queryFn: ({ pageParam }) =>
      fetchHackathons(address, {
        status: isAdmin ? debouncedStatus : "all",
        region: "all",
        search: controlPending.debouncedSearch || undefined,
        sort: debouncedSort,
        limit: DISCOVERY_PAGE_SIZE,
        skip: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: DISCOVERY_STALE_MS,
    refetchOnMount: "always",
    refetchInterval: DISCOVERY_REFETCH_MS,
  });

  const showSkeleton = controlPending.isControlsPending || listQuery.isLoading;
  const runQuery = useQuery({
    queryKey: ["hackathon-latest-run", address],
    queryFn: () => fetchHackathonLatestRun(address),
    staleTime: DISCOVERY_STALE_MS,
    refetchInterval: DISCOVERY_REFETCH_MS,
    enabled: isAdmin,
  });

  const counts = listQuery.data?.pages[0]?.counts ?? {};
  const allItems = useMemo(() => {
    const list = listQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return list.filter((item) => !getFlags(item._id).hidden);
  }, [listQuery.data?.pages, getFlags]);

  const items = useMemo(() => {
    if (view === "saved") {
      return allItems.filter((item) => getFlags(item._id).saved);
    }
    return allItems;
  }, [allItems, view, getFlags]);

  const savedCount = useMemo(
    () => allItems.filter((item) => getFlags(item._id).saved).length,
    [allItems, getFlags],
  );

  const featured: HackathonRecord | null = items[0] ?? null;
  const gridItems = useMemo(
    () => (featured ? items.filter((item) => item._id !== featured._id) : items),
    [items, featured],
  );

  const total = listQuery.data?.pages[0]?.total ?? 0;
  const animatedTotal = useCountUp(total, {
    enabled: !showSkeleton && total > 0,
  });
  const hasMore = allItems.length < total;
  const lastRun = runQuery.data?.data;

  const statusOptions = useMemo(
    () =>
      ADMIN_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        count: option.value === "all" ? counts.all : counts[option.value],
      })),
    [counts],
  );

  const openHackathon = (item: HackathonRecord) => {
    void navigate(`/hackathon/${encodeURIComponent(item._id)}`, {
      state: { record: item },
    });
  };

  return (
    <div className={cn(pageContent, "pb-20")}>
      <DiscoveryPageHeader
        icon={Trophy}
        eyebrow="Hackathons"
        title={
          <>
            Build, compete, <span className="text-gradient">win</span>
          </>
        }
        description="Hand-picked hackathons from Indonesia and worldwide. Review details and apply on the official page."
        meta={
          isAdmin && lastRun ? (
            <>
              Last updated {formatDate(lastRun.ranAt)} · {lastRun.totalNew ?? 0} new,{" "}
              {lastRun.totalUpdated ?? 0} updated
            </>
          ) : null
        }
        aside={
          !showSkeleton && total > 0 ? (
            <DiscoveryCountStat
              value={animatedTotal}
              label={total === 1 ? "hackathon" : "hackathons"}
            />
          ) : null
        }
      />

      <DiscoveryToolbar>
        <DiscoveryToolbarRow>
          <DiscoverySearchBar
            id="hackathon-search"
            value={search}
            onChange={setSearch}
            placeholder="Search hackathons…"
            className="min-w-[12rem]"
          />
          <DiscoverySortSelect
            value={sort}
            onChange={setSort}
            options={HACKATHON_SORT_OPTIONS}
          />
          {isAdmin ? (
            <DiscoveryFilterSelect
              options={statusOptions}
              value={statusTab}
              onChange={setStatusTab}
              label="Status"
            />
          ) : null}
          <DiscoverySavedToggle
            saved={view === "saved"}
            count={savedCount}
            onChange={(saved) => setView(saved ? "saved" : "all")}
          />
        </DiscoveryToolbarRow>
      </DiscoveryToolbar>

      {showSkeleton ? (
        <DiscoveryHackathonSkeleton />
      ) : listQuery.isError ? (
        <DiscoveryEmptyState
          icon={Trophy}
          title="Couldn't load hackathons"
          description={(listQuery.error as Error).message}
          action={
            <Button variant="heroOutline" className="rounded-full" onClick={() => void listQuery.refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <DiscoveryEmptyState
          icon={view === "saved" ? Star : Search}
          title={view === "saved" ? "No saved hackathons yet" : "No hackathons match your search"}
          description={
            view === "saved"
              ? "Tap the star on any hackathon to save it here for later."
              : "Try a different keyword."
          }
          action={
            view === "saved" ? (
              <Button variant="heroOutline" className="rounded-full" onClick={() => setView("all")}>
                Browse all hackathons
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {featured ? (
            <FadeIn>
              <HackathonArenaCard
                item={featured}
                isSaved={getFlags(featured._id).saved}
                featured
                onSelect={() => openHackathon(featured)}
                onToggleSaved={() => toggleFlag(featured._id, "saved")}
              />
            </FadeIn>
          ) : null}

          {gridItems.length > 0 ? (
            <div>
              <DiscoverySectionLabel
                title={view === "saved" ? "Saved hackathons" : "Open arenas"}
                meta={`Showing ${gridItems.length}${hasMore ? "+" : ""} of ${total}`}
              />
              <Stagger className="grid gap-4 md:grid-cols-2">
                {gridItems.map((item) => {
                  const flags = getFlags(item._id);
                  return (
                    <StaggerItem key={item._id} className="h-full">
                      <HackathonArenaCard
                        item={item}
                        isSaved={flags.saved}
                        onSelect={() => openHackathon(item)}
                        onToggleSaved={() => toggleFlag(item._id, "saved")}
                      />
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </div>
          ) : null}

          <DiscoveryLoadMore
            hasMore={hasMore}
            isLoadingMore={listQuery.isFetchingNextPage}
            loadedCount={allItems.length}
            totalCount={total}
            onLoadMore={() => void listQuery.fetchNextPage()}
            itemLabel="hackathons"
          />
        </div>
      )}
    </div>
  );
}

const Hackathon = () => (
  <SitePageShell>
    <HackathonPageContent />
  </SitePageShell>
);

export default Hackathon;
