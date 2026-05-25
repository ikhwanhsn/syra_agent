import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  SkipForward,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  fetchHackathonLatestRun,
  fetchHackathonLeads,
  patchHackathonLead,
  runHackathonScoutPipeline,
  type HackathonLead,
  type HackathonLeadStatus,
} from "@/lib/hackathonScoutApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STALE_MS = 30_000;

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "interested", label: "Interested" },
  { id: "participate", label: "Participate" },
  { id: "applied", label: "Applied" },
  { id: "skip", label: "Skip" },
  { id: "archived", label: "Archived" },
];

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

function relevanceBar(score: number) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums text-muted-foreground">{pct}</span>
    </div>
  );
}

function KpiTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-muted/10">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function HackathonLeadCard({
  lead,
  onStatus,
  onSaveNotes,
  busy,
}: {
  lead: HackathonLead;
  onStatus: (id: string, status: HackathonLeadStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
  busy: boolean;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(lead.notes || "");

  return (
    <Card className="border-border/70 overflow-hidden">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-snug">{lead.title}</CardTitle>
            {lead.organizer ? (
              <CardDescription className="mt-0.5">{lead.organizer}</CardDescription>
            ) : null}
          </div>
          <Badge variant="outline" className={cn("shrink-0 capitalize", statusBadgeClass(lead.status))}>
            {lead.status}
          </Badge>
        </div>
        {relevanceBar(lead.relevanceScore)}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {lead.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{lead.description}</p>
        ) : null}
        {lead.relevanceReason ? (
          <p className="text-xs text-muted-foreground/90 italic border-l-2 border-primary/40 pl-2">
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
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {lead.deadline ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {lead.deadline}
            </span>
          ) : null}
          {lead.prizePool ? <span>Prize: {lead.prizePool}</span> : null}
          {lead.authorHandle ? <span>{lead.authorHandle}</span> : null}
          <span>Found {formatShortDate(lead.discoveredAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="default" disabled={busy} onClick={() => onStatus(lead._id, "participate")}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Participate
          </Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => onStatus(lead._id, "interested")}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Interested
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onStatus(lead._id, "skip")}>
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onStatus(lead._id, "archived")}>
            Archive
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={lead.tweetUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              X post
            </a>
          </Button>
          {lead.applicationUrl ? (
            <Button size="sm" variant="ghost" asChild>
              <a href={lead.applicationUrl} target="_blank" rel="noopener noreferrer">
                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                Apply
              </a>
            </Button>
          ) : null}
        </div>
        {notesOpen ? (
          <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Team notes (prize track, teammates, deadline reminders…)"
              className="min-h-[72px] text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  onSaveNotes(lead._id, notesDraft);
                  setNotesOpen(false);
                }}
              >
                Save notes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNotesOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            onClick={() => setNotesOpen(true)}
          >
            {lead.notes ? `Notes: ${lead.notes.slice(0, 60)}…` : "Add notes"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/** Hackathon Scout lead board — rendered inside Internal agents page. */
export function InternalHackathonBoard() {
  const [tab, setTab] = useState("all");
  const queryClient = useQueryClient();

  const leadsQ = useQuery({
    queryKey: ["hackathon-scout", "leads", tab],
    queryFn: () => fetchHackathonLeads(tab),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hackathon-scout"] });
    },
  });

  const scanMutation = useMutation({
    mutationFn: runHackathonScoutPipeline,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hackathon-scout"] });
    },
  });

  const counts = leadsQ.data?.counts ?? {};
  const items = leadsQ.data?.items ?? [];

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
            className="gap-2"
            disabled={leadsQ.isFetching || busy}
            onClick={() => void leadsQ.refetch()}
          >
            {leadsQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" className="gap-2" disabled={busy} onClick={() => scanMutation.mutate()}>
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
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/40 p-1">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">
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

      {leadsQ.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading hackathons…
        </div>
      ) : leadsQ.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load leads</AlertTitle>
          <AlertDescription>
            {leadsQ.error instanceof Error ? leadsQ.error.message : "Error"}
          </AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No hackathons in this bucket. Run &quot;Scan X now&quot; or wait for the daily 06:30 WIB job.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((lead) => (
            <HackathonLeadCard
              key={lead._id}
              lead={lead}
              busy={busy}
              onStatus={(id, status) => patchMutation.mutate({ id, status })}
              onSaveNotes={(id, notes) => patchMutation.mutate({ id, notes })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
