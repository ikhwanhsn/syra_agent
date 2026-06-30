import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Calendar, Search, Star } from "lucide-react";

import { DISCOVERY_PAGE_SIZE } from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryFilterPills } from "@/components/discovery/DiscoveryFilterPills";
import { DiscoveryListSkeleton, DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { DiscoveryViewTabs } from "@/components/discovery/DiscoveryViewTabs";
import { EventBentoCard } from "@/components/discovery/events/EventCards";
import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useEventSaves } from "@/hooks/useDiscoverySaves";
import { formatDate } from "@/lib/discoveryFormatters";
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
  { value: "all", label: "All events" },
  { value: "tech", label: "Tech" },
  { value: "crypto", label: "Crypto" },
  { value: "web3", label: "Web3" },
];

const ADMIN_STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "registered", label: "Registered" },
  { id: "attended", label: "Attended" },
  { id: "skipped", label: "Skipped" },
] as const;

function filterToParams(filter: EventQuickFilter) {
  if (filter === "tech" || filter === "crypto" || filter === "web3") {
    return { region: "all" as const, category: filter };
  }
  return { region: "all" as const, category: "all" as const };
}

function pickFeaturedEvent(items: EventRecord[]): EventRecord | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) => {
    const aTime = new Date(a.startAt ?? 0).getTime();
    const bTime = new Date(b.startAt ?? 0).getTime();
    if (aTime && bTime && aTime !== bTime) return aTime - bTime;
    if (a.thumbnailUrl && !b.thumbnailUrl) return -1;
    if (!a.thumbnailUrl && b.thumbnailUrl) return 1;
    return 0;
  })[0];
}

function EventsAdminPageContent() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);
  const [statusTab, setStatusTab] = useState("all");
  const [view, setView] = useState<EventView>("all");
  const [filter, setFilter] = useState<EventQuickFilter>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { toggleFlag, getFlags } = useEventSaves();
  const { region, category } = filterToParams(filter);

  const listQuery = useInfiniteQuery({
    queryKey: ["events", address, statusTab, region, category, debouncedSearch, isAdmin],
    queryFn: ({ pageParam }) =>
      fetchEvents(address, {
        status: isAdmin ? statusTab : "all",
        region,
        category,
        search: debouncedSearch || undefined,
        limit: DISCOVERY_PAGE_SIZE,
        skip: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: 30_000,
  });

  const runQuery = useQuery({
    queryKey: ["event-latest-run", address],
    queryFn: () => fetchEventLatestRun(address),
    staleTime: 60_000,
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

  const featured = useMemo(() => pickFeaturedEvent(items), [items]);
  const gridItems = useMemo(
    () => (featured ? items.filter((item) => item._id !== featured._id) : items),
    [items, featured],
  );

  const total = listQuery.data?.pages[0]?.total ?? 0;
  const hasMore = allItems.length < total;
  const lastRun = runQuery.data?.data;

  const statusOptions = useMemo(
    () =>
      ADMIN_STATUS_TABS.map((tab) => ({
        ...tab,
        count: tab.id === "all" ? counts.all : counts[tab.id],
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
      <FadeIn className="mb-10 flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-3">
            <Calendar className="h-4 w-4" aria-hidden />
            Events
          </p>
          <h1 className="heading-display">
            Meetups, workshops, <span className="text-gradient">conferences</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tech, crypto, and web3 events from Indonesia and worldwide. Find something near you or online.
          </p>
          {isAdmin && lastRun ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated {formatDate(lastRun.ranAt)} · {lastRun.totalNew ?? 0} new,{" "}
              {lastRun.totalUpdated ?? 0} updated
            </p>
          ) : null}
        </div>
        {!listQuery.isLoading && total > 0 ? (
          <div className="panel-glass shrink-0 px-6 py-5 text-center lg:text-right">
            <p className="text-4xl font-semibold tabular-nums text-foreground sm:text-5xl">
              {total}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 1 ? "event" : "events"} available
            </p>
          </div>
        ) : null}
      </FadeIn>

      <FadeIn className="mb-8 space-y-4" delay={0.05}>
        <DiscoveryViewTabs
          tabs={[
            { id: "all" as const, label: "All events" },
            { id: "saved" as const, label: "Saved", count: savedCount },
          ]}
          value={view}
          onChange={setView}
        />
        <DiscoverySearchBar
          id="events-search"
          value={search}
          onChange={setSearch}
          placeholder="Search events by name, organizer, or keyword…"
        />
        <DiscoveryFilterPills
          options={EVENT_FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </FadeIn>

      {isAdmin ? (
        <FadeIn className="mb-8" delay={0.08}>
          <Tabs value={statusTab} onValueChange={setStatusTab} className="min-w-0">
            <TabsList className="scrollbar-hide-md h-auto w-full justify-start overflow-x-auto rounded-xl border border-border/60 bg-muted/30 p-1 sm:w-fit">
              {statusOptions.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="shrink-0 gap-1.5 rounded-lg text-xs">
                  {tab.label}
                  {typeof tab.count === "number" ? (
                    <span className="tabular-nums text-muted-foreground">{tab.count}</span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </FadeIn>
      ) : null}

      {listQuery.isLoading ? (
        <DiscoveryListSkeleton />
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
        <>
          {featured ? (
            <FadeIn className="mb-5">
              <EventBentoCard
                item={featured}
                isSaved={getFlags(featured._id).saved}
                featured
                onSelect={() => openEvent(featured)}
                onToggleSaved={() => toggleFlag(featured._id, "saved")}
              />
            </FadeIn>
          ) : null}

          <Stagger className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

          <DiscoveryLoadMore
            hasMore={hasMore}
            isLoadingMore={listQuery.isFetchingNextPage}
            loadedCount={allItems.length}
            totalCount={total}
            onLoadMore={() => void listQuery.fetchNextPage()}
            itemLabel="events"
          />
        </>
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
