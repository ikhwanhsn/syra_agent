import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Handshake,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  fetchPartnershipLatestRun,
  fetchPartnershipLeads,
  patchPartnershipLead,
  runPartnershipScoutPipeline,
  type PartnershipLead,
  type PartnershipLeadStatus,
} from "@/lib/partnershipScoutApi";
import {
  collectPartnershipProjectTypes,
  defaultPartnershipSortOrder,
  filterPartnershipLeads,
  filterQuickIntegrations,
  sortPartnershipLeadTargets,
  type PartnershipSortOrder,
  type PartnershipTargetSortKey,
} from "@/lib/partnershipTargetTable";
import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useTablePagination } from "@/hooks/useTablePagination";
import { cn } from "@/lib/utils";

const STALE_MS = 30_000;
const SEARCH_DEBOUNCE_MS = 280;
const DEFAULT_PAGE_SIZE = 12;
const PAGE_SIZE_OPTIONS = [8, 12, 20, 40] as const;

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "participate", label: "In progress" },
  { id: "applied", label: "Applied" },
  { id: "skip", label: "Skip" },
  { id: "archived", label: "Archived" },
];

const PRIORITY_TABS = [
  { id: "all", label: "All priorities" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
] as const;

function statusBadgeClass(status: PartnershipLeadStatus): string {
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

const VIEW_TABS = [
  { id: "targets", label: "Partnership targets" },
  { id: "integrations", label: "Quick integrations" },
] as const;

type ViewTab = (typeof VIEW_TABS)[number]["id"];

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

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/30";
    case "medium":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
    case "low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "";
  }
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

function PartnershipSortableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: PartnershipTargetSortKey;
  activeKey: PartnershipTargetSortKey;
  order: PartnershipSortOrder;
  onSort: (key: PartnershipTargetSortKey) => void;
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

function PartnershipTargetDetailSheet({
  lead,
  open,
  onOpenChange,
  onStatus,
  busy,
}: {
  lead: PartnershipLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatus: (id: string, status: PartnershipLeadStatus) => void;
  busy: boolean;
}) {
  if (!lead || lead.kind !== "target") return null;
  const target = lead;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left space-y-2 pr-8">
          <SheetTitle className="text-lg leading-snug">{target.name}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("capitalize", priorityBadgeClass(target.priority))}>
              {target.priority}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {target.projectType}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {target.utility ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Utility
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{target.utility}</p>
            </div>
          ) : null}

          {target.whyFitForSyra ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Fit for Syra
              </p>
              <p className="text-sm leading-relaxed">{target.whyFitForSyra}</p>
            </div>
          ) : null}

          {target.collaborationIdea ? (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                Collaboration idea
              </p>
              <p className="text-sm leading-relaxed">{target.collaborationIdea}</p>
            </div>
          ) : null}

          {target.onchainSignals?.length ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                On-chain signals
              </p>
              <ul className="space-y-1.5">
                {target.onchainSignals.map((s) => (
                  <li
                    key={s}
                    className="text-xs text-muted-foreground border-l-2 border-border/60 pl-2 leading-relaxed"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => onStatus(lead._id, "participate")}>
              In progress
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
          </div>

          {target.link ? (
            <Button variant="outline" size="sm" asChild>
              <a href={target.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Open project link
              </a>
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Partnership Scout — targets & integration ideas from latest on-chain scan. */
export function InternalPartnershipBoard() {
  const [viewTab, setViewTab] = useState<ViewTab>("targets");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [priorityTab, setPriorityTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<PartnershipTargetSortKey>("priority");
  const [sortOrder, setSortOrder] = useState<PartnershipSortOrder>("desc");
  const [detailLead, setDetailLead] = useState<PartnershipLead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [search]);

  const leadsQ = useQuery({
    queryKey: ["partnership-scout", "leads", statusTab, viewTab],
    queryFn: () =>
      fetchPartnershipLeads({
        status: statusTab,
        kind: viewTab === "targets" ? "target" : "integration",
        limit: 100,
      }),
    staleTime: STALE_MS,
  });

  const runQ = useQuery({
    queryKey: ["partnership-scout", "latest-run"],
    queryFn: fetchPartnershipLatestRun,
    staleTime: STALE_MS,
  });

  const patchMutation = useMutation({
    mutationFn: (args: { id: string; status?: PartnershipLeadStatus }) =>
      patchPartnershipLead(args.id, { status: args.status }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["partnership-scout"] });
      if (detailLead && res.data) setDetailLead(res.data);
    },
  });

  const scanMutation = useMutation({
    mutationFn: runPartnershipScoutPipeline,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["partnership-scout"] });
      void queryClient.invalidateQueries({ queryKey: ["internal-team-agents", "partnership-scout"] });
    },
  });

  const counts = leadsQ.data?.counts ?? {};
  const allItems = leadsQ.data?.items ?? [];
  const payload = runQ.data?.data;
  const savedAt = runQ.data?.savedAt;

  const targetLeads = useMemo(() => allItems.filter((l) => l.kind === "target"), [allItems]);
  const integrationLeads = useMemo(() => allItems.filter((l) => l.kind === "integration"), [allItems]);

  const projectTypes = useMemo(
    () =>
      collectPartnershipProjectTypes(
        targetLeads.map((l) => ({
          name: l.name,
          projectType: l.projectType,
          utility: l.utility,
          whyFitForSyra: l.whyFitForSyra,
          collaborationIdea: l.collaborationIdea,
          onchainSignals: l.onchainSignals,
          priority: l.priority,
          link: l.link,
        })),
      ),
    [targetLeads],
  );

  const filteredTargets = useMemo(
    () => filterPartnershipLeads(targetLeads, debouncedSearch, priorityTab, typeFilter),
    [targetLeads, debouncedSearch, priorityTab, typeFilter],
  );

  const sortedTargets = useMemo(
    () => sortPartnershipLeadTargets(filteredTargets, sortKey, sortOrder),
    [filteredTargets, sortKey, sortOrder],
  );

  const integrationTexts = useMemo(
    () => integrationLeads.map((l) => l.integrationText || l.name),
    [integrationLeads],
  );

  const filteredIntegrationLeads = useMemo(() => {
    const texts = new Set(filterQuickIntegrations(integrationTexts, debouncedSearch));
    return integrationLeads.filter((l) => texts.has(l.integrationText || l.name));
  }, [integrationLeads, integrationTexts, debouncedSearch]);

  const targetsPagination = useTablePagination(sortedTargets, DEFAULT_PAGE_SIZE);
  const integrationsPagination = useTablePagination(filteredIntegrationLeads, DEFAULT_PAGE_SIZE);

  const onSort = useCallback((key: PartnershipTargetSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortOrder(defaultPartnershipSortOrder(key));
      return key;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setPriorityTab("all");
    setTypeFilter("all");
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedSearch) n += 1;
    if (priorityTab !== "all" && viewTab === "targets") n += 1;
    if (typeFilter !== "all" && viewTab === "targets") n += 1;
    return n;
  }, [debouncedSearch, priorityTab, typeFilter, viewTab]);

  const kpis = useMemo(
    () => [
      {
        label: "Partnership targets",
        value: counts.target ?? 0,
        hint: "Saved in database",
      },
      {
        label: "Quick integrations",
        value: counts.integration ?? 0,
        hint: "Saved ideas",
      },
      {
        label: "New",
        value: counts.new ?? 0,
        hint: "Needs review",
      },
      {
        label: "In progress",
        value: counts.participate ?? 0,
      },
    ],
    [counts],
  );

  const busy = scanMutation.isPending || patchMutation.isPending;

  const openDetail = (lead: PartnershipLead) => {
    setDetailLead(lead);
    setSheetOpen(true);
  };

  const handleStatus = (id: string, status: PartnershipLeadStatus) => {
    patchMutation.mutate({ id, status });
  };

  return (
    <section id="partnership-board" className="scroll-mt-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <Handshake className="h-5 w-5 text-primary" />
            Partnership Scout
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Surfaces AI agents, x402 APIs, and on-chain utility projects for Syra partnerships and quick
            integrations — sourced from 8004, Jupiter, pay.sh, and registry feeds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            disabled={leadsQ.isFetching || runQ.isFetching || busy}
            onClick={() => {
              void leadsQ.refetch();
              void runQ.refetch();
            }}
          >
            {leadsQ.isFetching || runQ.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button size="sm" className="gap-2 rounded-xl" disabled={busy} onClick={() => scanMutation.mutate()}>
            {scanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Run scout now
          </Button>
        </div>
      </div>

      {scanMutation.isSuccess && scanMutation.data?.data ? (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>Scout complete</AlertTitle>
          <AlertDescription>
            {scanMutation.data.data.newSaved ?? 0} new saved ·{" "}
            {scanMutation.data.data.skippedExisting ?? 0} skipped (already in DB) ·{" "}
            {scanMutation.data.data.candidatesScanned ?? 0} candidates scanned
          </AlertDescription>
        </Alert>
      ) : null}

      {scanMutation.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Scout failed</AlertTitle>
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

      {savedAt || payload?.generatedAt ? (
        <p className="text-xs text-muted-foreground">
          Last saved: {formatShortDate(savedAt)}
          {payload?.generatedAt ? <> · Generated {formatShortDate(payload.generatedAt)}</> : null}
        </p>
      ) : null}

      {payload?.ecosystemSummary ? (
        <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            Ecosystem summary
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{payload.ecosystemSummary}</p>
          {payload.onchainThemes?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {payload.onchainThemes.map((theme) => (
                <Badge key={theme} variant="secondary" className="text-[10px] font-normal">
                  {theme}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/40 p-1 rounded-xl">
          {VIEW_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm rounded-lg gap-1.5">
              {t.id === "targets" ? (
                <Handshake className="h-3.5 w-3.5 hidden sm:inline" />
              ) : (
                <Zap className="h-3.5 w-3.5 hidden sm:inline" />
              )}
              {t.label}
              <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums">
                {t.id === "targets" ? counts.target ?? 0 : counts.integration ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
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

      {viewTab === "targets" ? (
        <Tabs value={priorityTab} onValueChange={setPriorityTab}>
          <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/25 p-1 rounded-lg">
            {PRIORITY_TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs rounded-md">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

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
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {viewTab === "targets" ? "Filter partnership targets" : "Filter integration ideas"}
              </h3>
              <p className="text-xs text-muted-foreground/90">
                {viewTab === "targets"
                  ? "Search project name, utility, collaboration idea, or on-chain signals."
                  : "Search quick integration ideas Syra can ship without a full partnership."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-5">
              <Label htmlFor="partnership-search" className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                Search
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="partnership-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    viewTab === "targets"
                      ? "Project, utility, x402, agent…"
                      : "API wire, agent tool, docs…"
                  }
                  className="h-10 border-border/80 bg-background/80 pl-10 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-primary/25"
                />
              </div>
            </div>

            {viewTab === "targets" ? (
              <div className="space-y-1.5 lg:col-span-3">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-foreground/80">
                  Project type
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter} disabled={projectTypes.length === 0}>
                  <SelectTrigger className="h-10 border-border/80 bg-background/80 shadow-sm">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/60">
                    <SelectItem value="all">All types</SelectItem>
                    {projectTypes.map((pt) => (
                      <SelectItem key={pt} value={pt} className="capitalize">
                        {pt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

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
              {typeFilter !== "all" && viewTab === "targets" ? (
                <Badge variant="secondary" className="gap-1 rounded-lg font-normal capitalize">
                  Type: {typeFilter}
                  <button
                    type="button"
                    className="ml-0.5 rounded-sm hover:bg-muted"
                    onClick={() => setTypeFilter("all")}
                    aria-label="Clear type filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {leadsQ.isLoading ? (
          <div className="relative flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading partnership leads…
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
        ) : viewTab === "targets" ? (
          sortedTargets.length === 0 ? (
            <div className="relative px-6 py-14 text-center">
              <p className="font-medium text-foreground">No partnership targets match</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {activeFilterCount > 0
                  ? "Try clearing filters."
                  : 'No targets in this bucket. Run "Run scout now" to discover new projects.'}
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
                      <PartnershipSortableHeader
                        label="Project"
                        sortKey="name"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="min-w-[160px]"
                      />
                      <PartnershipSortableHeader
                        label="Type"
                        sortKey="projectType"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="w-[100px] hidden sm:table-cell"
                      />
                      <PartnershipSortableHeader
                        label="Priority"
                        sortKey="priority"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="w-[90px]"
                      />
                      <PartnershipSortableHeader
                        label="Utility"
                        sortKey="utility"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="min-w-[180px] hidden md:table-cell"
                      />
                      <TableHead className="h-10 min-w-[140px] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85 hidden lg:table-cell">
                        Collaboration
                      </TableHead>
                      <TableHead className="h-10 w-[72px] px-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
                        Link
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targetsPagination.slice.map((row) => (
                      <TableRow
                        key={row._id}
                        className="group/row cursor-pointer border-border/35 transition-colors hover:bg-muted/30"
                        onClick={() => openDetail(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail(row);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`View ${row.name}`}
                      >
                        <TableCell className="py-3 max-w-[220px]">
                          <p className="font-medium text-sm leading-snug">{row.name}</p>
                          {row.onchainSignals?.length ? (
                            <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                              {row.onchainSignals[0]}
                              {row.onchainSignals.length > 1 ? ` +${row.onchainSignals.length - 1}` : ""}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="py-3 hidden sm:table-cell">
                          <Badge variant="secondary" className="text-[10px] capitalize font-normal">
                            {row.projectType}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={cn("capitalize text-[10px] w-fit", statusBadgeClass(row.status))}
                            >
                              {row.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn("capitalize text-[10px] w-fit", priorityBadgeClass(row.priority))}
                            >
                              {row.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground hidden md:table-cell max-w-[240px]">
                          <span className="line-clamp-2">{row.utility || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-[200px]">
                          <span className="line-clamp-2">{row.collaborationIdea || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {row.link ? (
                            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                              <a
                                href={row.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${row.name}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PremiumTablePagination
                page={targetsPagination.page}
                pageSize={targetsPagination.pageSize}
                totalItems={targetsPagination.totalItems}
                onPageChange={targetsPagination.setPage}
                onPageSizeChange={targetsPagination.setPageSize}
                pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
                loading={leadsQ.isFetching}
                itemLabel="targets"
                className="relative rounded-b-2xl"
              />
            </>
          )
        ) : filteredIntegrationLeads.length === 0 ? (
          <div className="relative px-6 py-14 text-center">
            <p className="font-medium text-foreground">No quick integrations match</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {activeFilterCount > 0
                  ? "Try clearing filters."
                  : 'No integration ideas saved yet. Run "Run scout now".'}
            </p>
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/45 bg-muted/[0.14] hover:bg-muted/[0.14]">
                    <TableHead className="h-10 w-12 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
                      #
                    </TableHead>
                    <TableHead className="h-10 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/85">
                      Integration idea
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrationsPagination.slice.map((lead, idx) => {
                    const rowNum = (integrationsPagination.page - 1) * integrationsPagination.pageSize + idx + 1;
                    const text = lead.integrationText || lead.name;
                    return (
                      <TableRow key={lead._id} className="border-border/35">
                        <TableCell className="py-3 font-mono text-xs tabular-nums text-muted-foreground">
                          {rowNum}
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm leading-relaxed">{text}</p>
                          <Badge
                            variant="outline"
                            className={cn("mt-1 capitalize text-[10px]", statusBadgeClass(lead.status))}
                          >
                            {lead.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PremiumTablePagination
              page={integrationsPagination.page}
              pageSize={integrationsPagination.pageSize}
              totalItems={integrationsPagination.totalItems}
              onPageChange={integrationsPagination.setPage}
              onPageSizeChange={integrationsPagination.setPageSize}
              pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
                loading={leadsQ.isFetching}
                itemLabel="ideas"
              className="relative rounded-b-2xl"
            />
          </>
        )}
      </div>

      {payload?.risksOrCaveats?.length ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">
            Caveats
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {payload.risksOrCaveats.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="text-amber-600/80 shrink-0">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <PartnershipTargetDetailSheet
        lead={detailLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatus={handleStatus}
        busy={busy}
      />
    </section>
  );
}
