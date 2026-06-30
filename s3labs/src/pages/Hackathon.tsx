import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Search, Star, Trophy } from "lucide-react";

import { DISCOVERY_PAGE_SIZE } from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryListSkeleton, DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { DiscoveryViewTabs } from "@/components/discovery/DiscoveryViewTabs";
import { HackathonArenaCard } from "@/components/discovery/hackathons/HackathonCards";
import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useHackathonSaves } from "@/hooks/useDiscoverySaves";
import { formatDate } from "@/lib/discoveryFormatters";
import {
  fetchHackathonLatestRun,
  fetchHackathons,
  type HackathonRecord,
} from "@/lib/hackathonApi";
import { isAdminWallet } from "@/lib/adminWallet";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

type HackathonView = "all" | "saved";

const ADMIN_STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "joined", label: "Joined" },
  { id: "in_progress", label: "In progress" },
  { id: "submitted", label: "Submitted" },
  { id: "skipped", label: "Skipped" },
  { id: "archived", label: "Archived" },
] as const;

function pickFeaturedHackathon(items: HackathonRecord[]): HackathonRecord | null {
  const openItems = items.filter((item) => item.openState === "open");
  const pool = openItems.length > 0 ? openItems : items;
  if (pool.length === 0) return null;

  return [...pool].sort((a, b) => {
    const prizeDiff = (b.prizeAmountUsd ?? 0) - (a.prizeAmountUsd ?? 0);
    if (prizeDiff !== 0) return prizeDiff;
    const aDeadline = new Date(a.deadline ?? 0).getTime();
    const bDeadline = new Date(b.deadline ?? 0).getTime();
    if (aDeadline && bDeadline && aDeadline !== bDeadline) return aDeadline - bDeadline;
    return 0;
  })[0];
}

function HackathonPageContent() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);

  const [statusTab, setStatusTab] = useState("all");
  const [view, setView] = useState<HackathonView>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { toggleFlag, getFlags } = useHackathonSaves();

  const listQuery = useInfiniteQuery({
    queryKey: ["hackathons", address, statusTab, debouncedSearch, isAdmin],
    queryFn: ({ pageParam }) =>
      fetchHackathons(address, {
        status: isAdmin ? statusTab : "all",
        region: "all",
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
    queryKey: ["hackathon-latest-run", address],
    queryFn: () => fetchHackathonLatestRun(address),
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

  const featured = useMemo(() => pickFeaturedHackathon(items), [items]);
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

  const openHackathon = (item: HackathonRecord) => {
    void navigate(`/hackathon/${encodeURIComponent(item._id)}`, {
      state: { record: item },
    });
  };

  return (
    <div className={cn(pageContent, "pb-20")}>
      <FadeIn className="mb-10 flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-3">
            <Trophy className="h-4 w-4" aria-hidden />
            Hackathons
          </p>
          <h1 className="heading-display">
            Build, compete, <span className="text-gradient">win</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Hand-picked hackathons from Indonesia and worldwide. Review details and apply on the official page.
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
              {total === 1 ? "hackathon" : "hackathons"} available
            </p>
          </div>
        ) : null}
      </FadeIn>

      <FadeIn className="mb-8 space-y-4" delay={0.05}>
        <DiscoveryViewTabs
          tabs={[
            { id: "all" as const, label: "All hackathons" },
            { id: "saved" as const, label: "Saved", count: savedCount },
          ]}
          value={view}
          onChange={setView}
        />
        <DiscoverySearchBar
          id="hackathon-search"
          value={search}
          onChange={setSearch}
          placeholder="Search hackathons by name, organizer, or keyword…"
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
        <>
          {featured ? (
            <FadeIn className="mb-6">
              <HackathonArenaCard
                item={featured}
                isSaved={getFlags(featured._id).saved}
                featured
                onSelect={() => openHackathon(featured)}
                onToggleSaved={() => toggleFlag(featured._id, "saved")}
              />
            </FadeIn>
          ) : null}

          <Stagger className="grid gap-5 md:grid-cols-2">
            {gridItems.map((item) => {
              const flags = getFlags(item._id);
              return (
                <StaggerItem key={item._id}>
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

          <DiscoveryLoadMore
            hasMore={hasMore}
            isLoadingMore={listQuery.isFetchingNextPage}
            loadedCount={allItems.length}
            totalCount={total}
            onLoadMore={() => void listQuery.fetchNextPage()}
            itemLabel="hackathons"
          />
        </>
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
