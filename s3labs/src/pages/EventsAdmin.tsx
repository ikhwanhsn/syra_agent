import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Calendar, Search, Star } from "lucide-react";

import {
  DISCOVERY_PAGE_SIZE,
  DISCOVERY_REFETCH_MS,
  DISCOVERY_STALE_MS,
} from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryFilterSelect } from "@/components/discovery/DiscoveryFilterSelect";
import { DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoveryEventSkeleton } from "@/components/discovery/DiscoverySkeletons";
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
import { EventBentoCard } from "@/components/discovery/events/EventCards";
import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { useDiscoveryControlPending } from "@/hooks/useDiscoveryControlPending";
import { useEventSaves } from "@/hooks/useDiscoverySaves";
import { formatDate } from "@/lib/discoveryFormatters";
import {
  DEFAULT_EVENT_SORT,
  EVENT_SORT_OPTIONS,
  type EventSortKey,
} from "@/lib/discoverySort";
import {
  fetchEventLatestRun,
  fetchEvents,
  type EventRecord,
} from "@/lib/eventsApi";
import { isAdminWallet } from "@/lib/adminWallet";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

type EventQuickFilter = "all" | "tech" | "crypto" | "web3";
type EventView = "all" | "saved";

const EVENT_FILTERS: { value: EventQuickFilter; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "tech", label: "Tech" },
  { value: "crypto", label: "Crypto" },
  { value: "web3", label: "Web3" },
];

const ADMIN_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "interested", label: "Interested" },
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "skipped", label: "Skipped" },
] as const;

function filterToParams(filter: EventQuickFilter) {
  if (filter === "tech" || filter === "crypto" || filter === "web3") {
    return { region: "all" as const, category: filter };
  }
  return { region: "all" as const, category: "all" as const };
}

function EventsAdminPageContent() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);
  const [statusTab, setStatusTab] = useState("all");
  const [view, setView] = useState<EventView>("all");
  const [filter, setFilter] = useState<EventQuickFilter>("all");
  const [sort, setSort] = useState<EventSortKey>(DEFAULT_EVENT_SORT);
  const [search, setSearch] = useState("");

  const { toggleFlag, getFlags } = useEventSaves();

  const controlPending = useDiscoveryControlPending(
    { search, filter, sort, status: statusTab },
    false,
  );
  const debouncedFilter = (controlPending.debouncedFilter || "all") as EventQuickFilter;
  const debouncedSort = (controlPending.debouncedSort || DEFAULT_EVENT_SORT) as EventSortKey;
  const debouncedStatus = controlPending.debouncedStatus || "all";
  const { region, category } = filterToParams(debouncedFilter);

  const listQuery = useInfiniteQuery({
    queryKey: [
      "events",
      address,
      debouncedStatus,
      region,
      category,
      controlPending.debouncedSearch,
      debouncedSort,
      isAdmin,
    ],
    queryFn: ({ pageParam }) =>
      fetchEvents(address, {
        status: isAdmin ? debouncedStatus : "all",
        region,
        category,
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
    queryKey: ["event-latest-run", address],
    queryFn: () => fetchEventLatestRun(address),
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

  const featured: EventRecord | null = items[0] ?? null;
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

  const openEvent = (item: EventRecord) => {
    void navigate(`/events/${encodeURIComponent(item._id)}`, {
      state: { record: item },
    });
  };

  return (
    <div className={cn(pageContent, "pb-20")}>
      <DiscoveryPageHeader
        icon={Calendar}
        eyebrow="Events"
        title={
          <>
            Meetups, workshops, <span className="text-gradient">conferences</span>
          </>
        }
        description="Tech, crypto, and web3 events from Indonesia and worldwide. Find something near you or online."
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
              label={total === 1 ? "event" : "events"}
            />
          ) : null
        }
      />

      <DiscoveryToolbar>
        <DiscoveryToolbarRow>
          <DiscoverySearchBar
            id="events-search"
            value={search}
            onChange={setSearch}
            placeholder="Search events…"
            className="min-w-[12rem]"
          />
          <DiscoveryFilterSelect
            options={EVENT_FILTERS}
            value={filter}
            onChange={setFilter}
            label="Category"
          />
          <DiscoverySortSelect
            value={sort}
            onChange={setSort}
            options={EVENT_SORT_OPTIONS}
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
        <DiscoveryEventSkeleton />
      ) : listQuery.isError ? (
        <DiscoveryEmptyState
          icon={Calendar}
          title="Couldn't load events"
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
          title={view === "saved" ? "No saved events yet" : "No events match your search"}
          description={
            view === "saved"
              ? "Tap the star on any event to save it here for later."
              : "Try a different keyword or filter."
          }
          action={
            view === "saved" ? (
              <Button variant="heroOutline" className="rounded-full" onClick={() => setView("all")}>
                Browse all events
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {featured ? (
            <FadeIn>
              <EventBentoCard
                item={featured}
                isSaved={getFlags(featured._id).saved}
                featured
                onSelect={() => openEvent(featured)}
                onToggleSaved={() => toggleFlag(featured._id, "saved")}
              />
            </FadeIn>
          ) : null}

          {gridItems.length > 0 ? (
            <div>
              <DiscoverySectionLabel
                title={view === "saved" ? "Saved events" : "Upcoming"}
                meta={`Showing ${gridItems.length}${hasMore ? "+" : ""} of ${total}`}
              />
              <Stagger className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gridItems.map((item) => {
                  const flags = getFlags(item._id);
                  return (
                    <StaggerItem key={item._id} className="h-full">
                      <EventBentoCard
                        item={item}
                        isSaved={flags.saved}
                        onSelect={() => openEvent(item)}
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
            itemLabel="events"
          />
        </div>
      )}
    </div>
  );
}

const EventsAdmin = () => (
  <SitePageShell>
    <EventsAdminPageContent />
  </SitePageShell>
);

export default EventsAdmin;
