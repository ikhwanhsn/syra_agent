import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  Search,
  Star,
  Trophy,
  Gift,
  EyeOff,
} from "lucide-react";

import { DISCOVERY_PAGE_SIZE } from "@/components/discovery/constants";
import { DiscoveryEmptyState } from "@/components/discovery/DiscoveryEmptyState";
import { DiscoveryListSkeleton, DiscoveryLoadMore } from "@/components/discovery/DiscoveryLoadMore";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { DiscoveryViewTabs } from "@/components/discovery/DiscoveryViewTabs";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchHackathonLatestRun,
  fetchHackathons,
  patchHackathon,
  type HackathonRecord,
  type HackathonStatus,
} from "@/lib/hackathonApi";
import { isAdminWallet } from "@/lib/adminWallet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useHackathonSaves } from "@/hooks/useDiscoverySaves";

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

const HACKATHON_STATUSES: HackathonStatus[] = [
  "new",
  "interested",
  "joined",
  "in_progress",
  "submitted",
  "skipped",
  "archived",
];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function openStateLabel(openState: string | null | undefined): string | null {
  if (!openState) return null;
  if (openState === "open") return "Open now";
  if (openState === "closed") return "Closed";
  return openState.charAt(0).toUpperCase() + openState.slice(1);
}

function hackathonMetaLine(item: HackathonRecord): string {
  const parts: string[] = [];
  const organizer = item.organizer || item.source;
  if (organizer) parts.push(organizer);
  if (item.deadline) parts.push(`Deadline ${item.deadline}`);
  else if (item.location) parts.push(item.location);
  else parts.push(item.isIndonesia ? "Indonesia" : "Global");
  if (item.prizePool) parts.push(item.prizePool);
  return parts.join(" · ");
}

interface HackathonRowProps {
  item: HackathonRecord;
  isSaved: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
}

function HackathonRow({ item, isSaved, onSelect, onToggleSaved }: HackathonRowProps) {
  const organizer = item.organizer || item.source || "Organizer";
  const openLabel = openStateLabel(item.openState);
  const link = item.applicationUrl || item.url;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-4 px-4 py-4 transition-colors sm:px-5",
          "hover:bg-muted/40",
          isSaved && "bg-primary/[0.03]",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          <DiscoveryListThumb imageUrl={item.thumbnailUrl} label={organizer} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold leading-snug text-foreground sm:text-base">
                {item.title}
              </h2>
              {openLabel ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 shrink-0 px-1.5 text-[10px]",
                    item.openState === "open"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {openLabel}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {hackathonMetaLine(item)}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "h-9 w-9 rounded-lg text-muted-foreground",
              isSaved && "text-primary",
            )}
            onClick={onToggleSaved}
            aria-label={isSaved ? "Remove from saved" : "Save hackathon"}
            aria-pressed={isSaved}
          >
            <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
          </Button>
          {link ? (
            <Button size="sm" variant="default" className="hidden h-9 rounded-lg px-3 sm:inline-flex" asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                Apply
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function HackathonPageContent() {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState("all");
  const [view, setView] = useState<HackathonView>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const [selected, setSelected] = useState<HackathonRecord | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

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

  const patchMutation = useMutation({
    mutationFn: (patch: { status?: HackathonStatus; notes?: string }) =>
      patchHackathon(address!, selected!._id, patch),
    onSuccess: (data) => {
      setSelected(data.data);
      setNotesDraft(data.data.notes ?? "");
      void queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
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

  const total = listQuery.data?.pages[0]?.total ?? 0;
  const hasMore = allItems.length < total;
  const lastRun = runQuery.data?.data;
  const selectedFlags = selected ? getFlags(selected._id) : null;

  const statusOptions = useMemo(
    () =>
      ADMIN_STATUS_TABS.map((tab) => ({
        ...tab,
        count: tab.id === "all" ? counts.all : counts[tab.id],
      })),
    [counts],
  );

  const openDetail = (item: HackathonRecord) => {
    setSelected(item);
    setNotesDraft(item.notes ?? "");
  };

  return (
    <div className={cn(pageContent, "pb-20")}>
      <header className="mb-10 flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-3">
            <Trophy className="h-4 w-4" aria-hidden />
            Hackathons
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Build, compete, <span className="text-gradient">win</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
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
          <div className="shrink-0 border-t border-border/60 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0 lg:text-right">
            <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">{total}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total === 1 ? "hackathon" : "hackathons"} available
            </p>
          </div>
        ) : null}
      </header>

      <div className="mb-6 space-y-4">
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
      </div>

      {isAdmin ? (
        <div className="mb-6">
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
        </div>
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
          <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-card">
            {items.map((item) => {
              const flags = getFlags(item._id);
              return (
                <HackathonRow
                  key={item._id}
                  item={item}
                  isSaved={flags.saved}
                  onSelect={() => openDetail(item)}
                  onToggleSaved={() => toggleFlag(item._id, "saved")}
                />
              );
            })}
          </ul>

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

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto border-border/60 sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader className="pr-8 text-left">
                <SheetDescription className="flex items-center gap-2">
                  <DiscoveryListThumb
                    size="sm"
                    imageUrl={selected.thumbnailUrl}
                    label={selected.organizer || selected.source}
                  />
                  {selected.organizer || selected.source}
                </SheetDescription>
                <SheetTitle className="text-xl leading-snug">{selected.title}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {openStateLabel(selected.openState) ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        selected.openState === "open"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "",
                      )}
                    >
                      {openStateLabel(selected.openState)}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="gap-1">
                    {selected.isIndonesia ? (
                      "Indonesia"
                    ) : (
                      <>
                        <Globe className="h-3 w-3" aria-hidden />
                        Global
                      </>
                    )}
                  </Badge>
                </div>

                {selected.description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {selected.description}
                  </p>
                ) : null}

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs text-muted-foreground">Deadline</dt>
                      <dd className="mt-0.5 text-sm font-medium">{selected.deadline || "Not listed"}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <Gift className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs text-muted-foreground">Prize pool</dt>
                      <dd className="mt-0.5 text-sm font-medium">{selected.prizePool || "Not listed"}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs text-muted-foreground">Region</dt>
                      <dd className="mt-0.5 text-sm font-medium">
                        {selected.isIndonesia ? "Indonesia" : "Global"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <dt className="text-xs text-muted-foreground">Location</dt>
                      <dd className="mt-0.5 text-sm font-medium">{selected.location || "Online / TBD"}</dd>
                    </div>
                  </div>
                </dl>

                {selected.themes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.themes.map((theme) => (
                      <Badge key={theme} variant="outline" className="text-[11px]">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {isAdmin ? (
                  <div className="space-y-4 border-t border-border/50 pt-5">
                    <div className="space-y-2">
                      <Label>Pipeline status</Label>
                      <Select
                        value={selected.status}
                        onValueChange={(v) => patchMutation.mutate({ status: v as HackathonStatus })}
                        disabled={patchMutation.isPending}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HACKATHON_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hackathon-notes">Internal notes</Label>
                      <Textarea
                        id="hackathon-notes"
                        rows={4}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Team notes…"
                      />
                      <Button
                        variant="hero"
                        size="sm"
                        className="rounded-lg"
                        disabled={patchMutation.isPending || notesDraft === (selected.notes ?? "")}
                        onClick={() => patchMutation.mutate({ notes: notesDraft })}
                      >
                        Save notes
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 border-t border-border/50 pt-5">
                  <Button
                    type="button"
                    variant={selectedFlags?.saved ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg"
                    onClick={() => toggleFlag(selected._id, "saved")}
                  >
                    <Star
                      className={cn("mr-1.5 h-4 w-4", selectedFlags?.saved && "fill-current")}
                    />
                    {selectedFlags?.saved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-muted-foreground"
                    onClick={() => {
                      toggleFlag(selected._id, "hidden");
                      setSelected(null);
                    }}
                  >
                    <EyeOff className="mr-1.5 h-4 w-4" />
                    Hide
                  </Button>
                </div>

                {(selected.applicationUrl || selected.url) && (
                  <Button variant="hero" className="w-full gap-2 rounded-xl" asChild>
                    <a
                      href={selected.applicationUrl || selected.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open application page
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const Hackathon = () => (
  <SitePageShell>
    <HackathonPageContent />
  </SitePageShell>
);

export default Hackathon;
