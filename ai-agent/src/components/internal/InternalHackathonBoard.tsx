import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Calendar,
  Check,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  fetchHackathonLatestRun,
  fetchHackathonLeads,
  patchHackathonLead,
  runHackathonScoutPipeline,
  type HackathonLead,
  type HackathonLeadStatus,
} from "@/lib/hackathonScoutApi";
import {
  collectHackathonTags,
  defaultHackathonSortOrder,
  filterHackathonLeads,
  sortHackathonLeads,
  type HackathonSortKey,
  type HackathonSortOrder,
} from "@/lib/hackathonLeadTable";
import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTablePagination } from "@/hooks/useTablePagination";
import { cn } from "@/lib/utils";

const STALE_MS = 30_000;
const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
const SEARCH_DEBOUNCE_MS = 280;

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "participate", label: "Participate" },
  { id: "applied", label: "Applied" },
  { id: "skip", label: "Skip" },
  { id: "archived", label: "Archived" },
];

const RELEVANCE_FILTER_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "40", label: "40+" },
  { value: "60", label: "60+" },
  { value: "75", label: "75+" },
] as const;

function formatShortDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: HackathonLeadStatus): string {
  switch (status) {
    case "new":
      return "bg-primary/15 text-primary border-primary/30";
    case "participate":
      return "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/30";
    case "interested":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
    case "applied":
      return "bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-600/30";
    case "skip":
      return "bg-muted text-muted-foreground border-border";
    case "archived":
      return "bg-muted/50 text-muted-foreground border-border/60";
    default:
      return "";
  }
}

function RelevanceMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className="h-1.5 flex-1 max-w-[72px] rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground w-6 text-right">{pct}</span>
    </div>
  );
}

function HackathonSortableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: HackathonSortKey;
  activeKey: HackathonSortKey;
  order: HackathonSortOrder;
  onSort: (key: HackathonSortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={cn("h-10 px-3", align === "right" && "text-right", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200",
          isActive
            ? "bg-primary/[0.09] text-foreground shadow-sm ring-1 ring-border/70"
            : "text-muted-foreground/85 hover:bg-muted/45 hover:text-foreground",
          align === "right" ? "ml-auto" : "",
        )}
        onClick={() => onSort(sortKey)}
        aria-sort={isActive ? (order === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {isActive ? (
          order === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-35" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}

function KpiTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-muted/10 shadow-sm">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function HackathonLeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onStatus,
  onSaveNotes,
  busy,
}: {
  lead: HackathonLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatus: (id: string, status: HackathonLeadStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
  busy: boolean;
}) {
  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (lead) setNotesDraft(lead.notes || "");
  }, [lead?._id, lead?.notes]);

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left space-y-2 pr-8">
          <SheetTitle className="text-lg leading-snug">{lead.title}</SheetTitle>
          {lead.organizer ? (
            <SheetDescription>{lead.organizer}</SheetDescription>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className={cn("capitalize", statusBadgeClass(lead.status))}>
              {lead.status}
            </Badge>
            <RelevanceMeter score={lead.relevanceScore} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {lead.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{lead.description}</p>
          ) : null}
          {lead.relevanceReason ? (
            <p className="text-xs text-muted-foreground/90 italic border-l-2 border-primary/40 pl-3">
              {lead.relevanceReason}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {lead.tags?.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                {t}
              </Badge>
            ))}
          </div>

          <dl className="grid gap-2 text-sm">
            {lead.deadline ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">Deadline</dt>
                <dd className="font-medium">{lead.deadline}</dd>
              </div>
            ) : null}
            {lead.prizePool ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">Prize</dt>
                <dd>{lead.prizePool}</dd>
              </div>
            ) : null}
            {lead.authorHandle ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground shrink-0">Source</dt>
                <dd>{lead.authorHandle}</dd>
              </div>
            ) : null}
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Found</dt>
              <dd className="font-mono text-xs tabular-nums">{formatShortDate(lead.discoveredAt)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => onStatus(lead._id, "participate")}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Participate
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onStatus(lead._id, "interested")}>
              Interested
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(lead._id, "applied")}>
              Applied
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(lead._id, "skip")}>
              Skip
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onStatus(lead._id, "archived")}>
              Archive
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={lead.tweetUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                X post
              </a>
            </Button>
            {lead.applicationUrl ? (
              <Button size="sm" variant="outline" asChild>
                <a href={lead.applicationUrl} target="_blank" rel="noopener noreferrer">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                  Apply
                </a>
              </Button>
            ) : null}
          </div>

          <div className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-4">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team notes</Label>
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Prize track, teammates, deadline reminders…"
              className="min-h-[96px] text-sm bg-background/80"
            />
            <Button
              size="sm"
              disabled={busy}
              onClick={() => {
                onSaveNotes(lead._id, notesDraft);
              }}
            >
              Save notes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Hackathon Scout lead board — table with search, sort, and pagination. */
export function InternalHackathonBoard() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [minRelevance, setMinRelevance] = useState("0");
  const [sortKey, setSortKey] = useState<HackathonSortKey>("discovered");
  const [sortOrder, setSortOrder] = useState<HackathonSortOrder>("desc");
  const [detailLead, setDetailLead] = useState<HackathonLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setTagFilter("all");
  }, [tab]);

  const leadsQ = useQuery({
    queryKey: ["hackathon-scout", "leads", tab],
    queryFn: () => fetchHackathonLeads({ status: tab, limit: 100 }),
    staleTime: STALE_MS,
  });

  const runQ = useQuery({
    queryKey: ["hackathon-scout", "latest-run"],
    queryFn: fetchHackathonLatestRun,
    staleTime: STALE_MS,
  });

  const patchMutation = useMutation({
    mutationFn: (args: { id: string; status?: HackathonLeadStatus; notes?: string }) =>
      patchHackathonLead(args.id, { status: args.status, notes: args.notes }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["hackathon-scout"] });
      if (detailLead && res.data) {
        setDetailLead(res.data);
      }
    },
  });

  const scanMutation = useMutation({
    mutationFn: runHackathonScoutPipeline,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hackathon-scout"] });
    },
  });

  const counts = leadsQ.data?.counts ?? {};
  const rawItems = leadsQ.data?.items ?? [];
  const apiTotal = leadsQ.data?.total ?? 0;

  const allTags = useMemo(() => collectHackathonTags(rawItems), [rawItems]);

  const filteredItems = useMemo(() => {
    const min = Number(minRelevance) || 0;
    let rows = filterHackathonLeads(rawItems, debouncedSearch, min);
    if (tagFilter !== "all") {
      rows = rows.filter((l) => l.tags?.includes(tagFilter));
    }
    return rows;
  }, [rawItems, debouncedSearch, minRelevance, tagFilter]);

  const sortedItems = useMemo(
    () => sortHackathonLeads(filteredItems, sortKey, sortOrder),
    [filteredItems, sortKey, sortOrder],
  );

  const pagination = useTablePagination(sortedItems, DEFAULT_PAGE_SIZE);

  const onSort = useCallback((key: HackathonSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortOrder(defaultHackathonSortOrder(key));
      return key;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setTagFilter("all");
    setMinRelevance("0");
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedSearch) n += 1;
    if (tagFilter !== "all") n += 1;
    if (minRelevance !== "0") n += 1;
    return n;
  }, [debouncedSearch, tagFilter, minRelevance]);

  const kpis = useMemo(
    () => [
      { label: "New", value: counts.new ?? 0, hint: "Needs review" },
      { label: "Participate", value: counts.participate ?? 0, hint: "Committed" },
      { label: "Interested", value: counts.interested ?? 0 },
      { label: "Total", value: counts.all ?? 0 },
    ],
    [counts],
  );

  const runMeta = runQ.data?.data;
  const busy = patchMutation.isPending || scanMutation.isPending;
  const truncatedFetch = apiTotal > rawItems.length;

  const openDetail = (lead: HackathonLead) => {
    setDetailLead(lead);
    setSheetOpen(true);
  };

  const handleStatus = (id: string, status: HackathonLeadStatus) => {
    patchMutation.mutate({ id, status });
  };

  return (
    <section id="hackathon-board" className="scroll-mt-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <Trophy className="h-5 w-5 text-primary" />
            Hackathon Scout
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Discovers Solana / AI / web3 hackathons on X (one search per day, 12h cache). New leads save to DB
            and notify Telegram.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            disabled={leadsQ.isFetching || busy}
            onClick={() => void leadsQ.refetch()}
          >
            {leadsQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" className="gap-2 rounded-xl" disabled={busy} onClick={() => scanMutation.mutate()}>
            {scanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Scan X now
          </Button>
        </div>
      </div>

      {scanMutation.isSuccess && scanMutation.data?.data ? (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>Scan complete</AlertTitle>
          <AlertDescription>
            Tweets sampled: {scanMutation.data.data.tweetsSampled} · Extracted:{" "}
            {scanMutation.data.data.extracted} · New saved: {scanMutation.data.data.newSaved}
            {scanMutation.data.data.skippedExisting
              ? ` · Skipped (in DB): ${scanMutation.data.data.skippedExisting}`
              : ""}
            {scanMutation.data.data.fromCache ? " (X cache)" : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      {scanMutation.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Scan failed</AlertTitle>
          <AlertDescription>
            {scanMutation.error instanceof Error ? scanMutation.error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <KpiTile key={k.label} label={k.label} value={k.value} hint={k.hint} />
        ))}
      </div>

      {runMeta ? (
        <p className="text-xs text-muted-foreground">
          Last pipeline: {formatShortDate(runMeta.ranAt)} · {runMeta.tweetsSampled} tweets ·{" "}
          {runMeta.newSaved} new · X {runMeta.xConfigured ? "on" : "off"}
          {runMeta.fromCache ? " · cached search" : ""}
        </p>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/40 p-1 rounded-xl">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm rounded-lg">
              {t.label}
              {counts[t.id] != null ? (
                <span className="ml-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                  {counts[t.id]}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className={cn(overviewCardShell, "overflow-hidden")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{ background: overviewAccentBackground("internal") }}
          aria-hidden
        />

        <div className="relative border-b border-border/45 px-4 py-4 sm:px-5">
          <div className="mb-4 flex items-start gap-2">
            <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Filter leads</h3>
              <p className="text-xs text-muted-foreground/90">
                Search across title, organizer, tags, and description — then sort columns in the table.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-5">
              <Label htmlFor="hackathon-search" className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                Search
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="hackathon-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hackathon, organizer, tag, prize…"
                  className="h-10 border-border/80 bg-background/80 pl-10 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary/25"
                />
              </div>
            </div>

            <div className="space-y-1.5 lg:col-span-3">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">Tag</Label>
              <Select value={tagFilter} onValueChange={setTagFilter} disabled={allTags.length === 0}>
                <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 max-h-[240px]">
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                Min relevance
              </Label>
              <Select value={minRelevance} onValueChange={setMinRelevance}>
                <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  {RELEVANCE_FILTER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 flex-1 rounded-xl border-dashed border-border/80 text-muted-foreground hover:text-foreground lg:flex-none"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {activeFilterCount > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={overviewKickerClass}>Active</span>
              {debouncedSearch ? (
                <Badge variant="secondary" className="gap-1 rounded-lg font-normal">
                  Search: {debouncedSearch.slice(0, 28)}
                  {debouncedSearch.length > 28 ? "…" : ""}
                  <button
                    type="button"
                    className="ml-0.5 rounded-sm hover:bg-muted"
                    onClick={() => {
                      setSearch("");
                      setDebouncedSearch("");
                    }}
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {tagFilter !== "all" ? (
                <Badge variant="secondary" className="gap-1 rounded-lg font-normal">
                  Tag: {tagFilter}
                  <button
                    type="button"
                    className="ml-0.5 rounded-sm hover:bg-muted"
                    onClick={() => setTagFilter("all")}
                    aria-label="Clear tag filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {minRelevance !== "0" ? (
                <Badge variant="secondary" className="gap-1 rounded-lg font-normal">
                  Score {minRelevance}+
                  <button
                    type="button"
                    className="ml-0.5 rounded-sm hover:bg-muted"
                    onClick={() => setMinRelevance("0")}
                    aria-label="Clear relevance filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {truncatedFetch ? (
          <p className="relative border-b border-border/40 px-5 py-2 text-xs text-amber-700/90 dark:text-amber-400/90 bg-amber-500/5">
            Showing latest {rawItems.length} of {apiTotal} leads in this bucket. Narrow status or use search within loaded rows.
          </p>
        ) : null}

        {leadsQ.isLoading ? (
          <div className="relative flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading hackathons…
          </div>
        ) : leadsQ.isError ? (
          <div className="relative px-5 py-8">
            <Alert variant="destructive">
              <AlertTitle>Could not load leads</AlertTitle>
              <AlertDescription>
                {leadsQ.error instanceof Error ? leadsQ.error.message : "Error"}
              </AlertDescription>
            </Alert>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="relative px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
              <Trophy className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-4 font-medium text-foreground">No hackathons match</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {activeFilterCount > 0
                ? "Try clearing filters or a different search."
                : 'No leads in this bucket. Run "Scan X now" or wait for the daily 06:30 WIB job.'}
            </p>
            {activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/45 bg-muted/[0.14] hover:bg-muted/[0.14]">
                    <HackathonSortableHeader
                      label="Hackathon"
                      sortKey="title"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={onSort}
                      className="min-w-[200px]"
                    />
                    <HackathonSortableHeader
                      label="Organizer"
                      sortKey="organizer"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={onSort}
                      className="min-w-[120px] hidden md:table-cell"
                    />
                    <HackathonSortableHeader
                      label="Status"
                      sortKey="status"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={onSort}
                      className="w-[100px]"
                    />
                    <HackathonSortableHeader
                      label="Score"
                      sortKey="relevance"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={onSort}
                      className="w-[110px]"
                    />
                    <HackathonSortableHeader
                      label="Deadline"
                      sortKey="deadline"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={onSort}
                      className="min-w-[100px] hidden lg:table-cell"
                    />
                    <HackathonSortableHeader
                      label="Found"
                      sortKey="discovered"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={onSort}
                      className="w-[120px] hidden sm:table-cell"
                    />
                    <TableHead className="h-10 w-[120px] px-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.slice.map((lead) => (
                    <TableRow
                      key={lead._id}
                      className="group/row cursor-pointer border-border/35 transition-colors hover:bg-muted/30"
                      onClick={() => openDetail(lead)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDetail(lead);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${lead.title}`}
                    >
                      <TableCell className="py-3 max-w-[280px]">
                        <p className="font-medium text-sm leading-snug truncate">{lead.title}</p>
                        {lead.tags?.length ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lead.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="inline-block rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {t}
                              </span>
                            ))}
                            {lead.tags.length > 3 ? (
                              <span className="text-[10px] text-muted-foreground">+{lead.tags.length - 3}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground hidden md:table-cell max-w-[140px] truncate">
                        {lead.organizer || "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn("capitalize text-[10px]", statusBadgeClass(lead.status))}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <RelevanceMeter score={lead.relevanceScore} />
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {lead.deadline ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0 opacity-60" />
                            {lead.deadline}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs tabular-nums text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {formatShortDate(lead.discoveredAt)}
                      </TableCell>
                      <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
                            disabled={busy}
                            onClick={() => handleStatus(lead._id, "participate")}
                            aria-label="Mark participate"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={busy}
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => handleStatus(lead._id, "interested")}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Interested
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatus(lead._id, "applied")}>
                                Applied
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatus(lead._id, "skip")}>
                                <SkipForward className="h-4 w-4 mr-2" />
                                Skip
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatus(lead._id, "archived")}>
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <a href={lead.tweetUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  X post
                                </a>
                              </DropdownMenuItem>
                              {lead.applicationUrl ? (
                                <DropdownMenuItem asChild>
                                  <a href={lead.applicationUrl} target="_blank" rel="noopener noreferrer">
                                    <ArrowUpRight className="h-4 w-4 mr-2" />
                                    Apply
                                  </a>
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem onClick={() => openDetail(lead)}>View details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PremiumTablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
              loading={leadsQ.isFetching}
              itemLabel="leads"
              className="relative rounded-b-2xl"
            />
          </>
        )}
      </div>

      <HackathonLeadDetailSheet
        lead={detailLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatus={handleStatus}
        onSaveNotes={(id, notes) => patchMutation.mutate({ id, notes })}
        busy={busy}
      />
    </section>
  );
}
