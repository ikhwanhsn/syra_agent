import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Trophy,
} from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

const STATUS_TABS = [
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

function statusBadgeClass(status: HackathonStatus): string {
  switch (status) {
    case "new":
      return "border-primary/40 text-primary bg-primary/10";
    case "interested":
      return "border-amber-500/40 text-amber-400 bg-amber-500/10";
    case "joined":
    case "in_progress":
      return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10";
    case "submitted":
      return "border-blue-500/40 text-blue-400 bg-blue-500/10";
    default:
      return "border-border text-muted-foreground";
  }
}

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

function HackathonCard({
  item,
  onSelect,
}: {
  item: HackathonRecord;
  onSelect: () => void;
}) {
  const link = item.applicationUrl || item.url;

  return (
    <article
      className="card-premium-hover p-5 flex flex-col gap-3 cursor-pointer"
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow mb-1">{item.organizer || item.source}</p>
          <h3 className="font-semibold tracking-tight line-clamp-2">{item.title}</h3>
        </div>
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="w-14 h-14 rounded-lg object-cover ring-1 ring-border/60 shrink-0"
          />
        ) : null}
      </div>

      {item.description ? (
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("capitalize text-[10px]", statusBadgeClass(item.status))}>
          {item.status.replace("_", " ")}
        </Badge>
        {item.isIndonesia ? (
          <Badge variant="outline" className="text-[10px]">
            Indonesia
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Globe className="w-3 h-3" />
            Global
          </Badge>
        )}
        {item.openState ? (
          <Badge variant="outline" className="text-[10px] capitalize">
            {item.openState}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {item.deadline ? <span>Deadline: {item.deadline}</span> : null}
        {item.prizePool ? <span>Prize: {item.prizePool}</span> : null}
        {item.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
        ) : null}
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline w-fit"
          onClick={(e) => e.stopPropagation()}
        >
          View event
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : null}
    </article>
  );
}

function HackathonPageContent() {
  const wallet = useWallet();
  const address = wallet.publicKey!.toBase58();
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState("all");
  const [region, setRegion] = useState<"all" | "indonesia" | "global">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HackathonRecord | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const listQuery = useQuery({
    queryKey: ["hackathons", address, statusTab, region, search],
    queryFn: () =>
      fetchHackathons(address, {
        status: statusTab,
        region,
        search: search.trim() || undefined,
        limit: 60,
      }),
    staleTime: 30_000,
  });

  const runQuery = useQuery({
    queryKey: ["hackathon-latest-run", address],
    queryFn: () => fetchHackathonLatestRun(address),
    staleTime: 60_000,
  });

  const patchMutation = useMutation({
    mutationFn: (patch: { status?: HackathonStatus; notes?: string }) =>
      patchHackathon(address, selected!._id, patch),
    onSuccess: (data) => {
      setSelected(data.data);
      setNotesDraft(data.data.notes ?? "");
      void queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });

  const counts = listQuery.data?.counts ?? {};
  const items = listQuery.data?.items ?? [];
  const lastRun = runQuery.data?.data;

  const statusOptions = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
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
    <div className="relative z-[1] container pt-28 pb-20">
      <section className="mb-8 max-w-3xl">
        <p className="eyebrow mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Admin · Hackathon Scout
        </p>
        <h1 className="heading-display">
          Technology <span className="text-gradient">hackathons</span>
        </h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          Devpost + Exa aggregator for Indonesia and global tech hackathons. Internal team only.
        </p>
      </section>

      {lastRun ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Last scout run</p>
            <p className="font-medium">{formatDate(lastRun.ranAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">New / updated</p>
            <p className="font-medium tabular-nums">
              {lastRun.totalNew ?? 0} / {lastRun.totalUpdated ?? 0}
            </p>
          </div>
          {runQuery.data?.savedAt ? (
            <div className="text-xs text-muted-foreground ml-auto">
              Saved {formatDate(runQuery.data.savedAt)}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <Tabs value={statusTab} onValueChange={setStatusTab} className="flex-1 min-w-0">
          <TabsList className="panel-glass rounded-full p-1 h-auto flex-wrap w-full justify-start">
            {statusOptions.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="rounded-full text-xs gap-1.5">
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span className="text-muted-foreground tabular-nums">({tab.count})</span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 rounded-xl"
            placeholder="Search title, organizer, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={region} onValueChange={(v) => setRegion(v as typeof region)}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            <SelectItem value="indonesia">Indonesia</SelectItem>
            <SelectItem value="global">Global</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="heroOutline"
          className="rounded-full gap-2 shrink-0"
          disabled={listQuery.isFetching}
          onClick={() => {
            void listQuery.refetch();
            void runQuery.refetch();
          }}
        >
          <RefreshCw className={cn("w-4 h-4", listQuery.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading hackathons…
        </div>
      ) : listQuery.isError ? (
        <div className="panel-glass rounded-2xl border border-destructive/30 p-6 text-sm text-muted-foreground">
          {(listQuery.error as Error).message}
        </div>
      ) : items.length === 0 ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-10 text-center text-muted-foreground">
          No hackathons match your filters. The daily scout pipeline may not have run yet.
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            Showing {items.length} of {listQuery.data?.total ?? items.length}
          </p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <HackathonCard key={item._id} item={item} onSelect={() => openDetail(item)} />
            ))}
          </div>
        </>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto panel-glass border-border/60">
          {selected ? (
            <>
              <SheetHeader className="text-left pr-8">
                <SheetDescription>{selected.organizer || selected.source}</SheetDescription>
                <SheetTitle className="text-xl leading-snug">{selected.title}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {selected.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                ) : null}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p>{selected.deadline || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prize</p>
                    <p>{selected.prizePool || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="capitalize">{selected.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Discovered</p>
                    <p>{formatDate(selected.discoveredAt)}</p>
                  </div>
                </div>

                {selected.themes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.themes.map((theme) => (
                      <Badge key={theme} variant="outline" className="text-[10px]">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) =>
                      patchMutation.mutate({ status: v as HackathonStatus })
                    }
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
                  <Label htmlFor="hackathon-notes">Notes</Label>
                  <Textarea
                    id="hackathon-notes"
                    rows={4}
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Internal notes…"
                  />
                  <Button
                    variant="hero"
                    size="sm"
                    className="rounded-full"
                    disabled={patchMutation.isPending || notesDraft === (selected.notes ?? "")}
                    onClick={() => patchMutation.mutate({ notes: notesDraft })}
                  >
                    Save notes
                  </Button>
                </div>

                {(selected.applicationUrl || selected.url) && (
                  <Button variant="heroOutline" className="rounded-full w-full gap-2" asChild>
                    <a
                      href={selected.applicationUrl || selected.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open application
                      <ExternalLink className="w-4 h-4" />
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
