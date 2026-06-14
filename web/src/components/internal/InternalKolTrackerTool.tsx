"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2, Sparkles, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  buildReplyOnXUrl,
  deleteKolEngagement,
  draftKolEngagement,
  fetchRecentKolEngagements,
  trackKolOpportunities,
  type KolEngagementItem,
  type KolEngagementModeId,
  type KolOpportunity,
} from "@/lib/internalToolsApi";

const MODE_OPTIONS: Array<{ id: KolEngagementModeId | "auto"; label: string }> = [
  { id: "auto", label: "Reply" },
  { id: "reply", label: "Reply" },
  { id: "quote", label: "Quote" },
  { id: "amplify", label: "Amplify" },
];

const DEFAULT_HANDLES = "aeyakovenko,mert,ansem,JupiterExchange,heliuslabs";

interface InternalKolTrackerToolProps {
  wallet?: string | null;
}

export function InternalKolTrackerTool({ wallet }: InternalKolTrackerToolProps) {
  const queryClient = useQueryClient();
  const [handlesText, setHandlesText] = useState(DEFAULT_HANDLES);
  const [mode, setMode] = useState<KolEngagementModeId | "auto">("auto");
  const [opportunities, setOpportunities] = useState<KolOpportunity[]>([]);
  const [activeOpp, setActiveOpp] = useState<KolOpportunity | null>(null);
  const [activeDraft, setActiveDraft] = useState<KolEngagementItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "kol-tracker-recent"],
    queryFn: () => fetchRecentKolEngagements(15),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "kol-tracker-recent"] });
  }, [queryClient]);

  const trackM = useMutation({
    mutationFn: () => {
      const handles = handlesText.split(/[,\s]+/).map((h) => h.trim().replace(/^@/, "")).filter(Boolean);
      return trackKolOpportunities(handles.length ? handles : undefined);
    },
    onSuccess: (res) => {
      setOpportunities(res.data.opportunities);
      setActiveOpp(res.data.opportunities[0] ?? null);
      setActiveDraft(null);
      toast.success(`Tracked ${res.data.opportunities.length} KOL tweets`);
    },
    onError: (err: Error) => toast.error(err.message || "Track failed"),
  });

  const draftM = useMutation({
    mutationFn: (opp: KolOpportunity) =>
      draftKolEngagement(opp.id, opp.text, opp.author.userName, wallet, mode === "auto" ? "reply" : mode),
    onSuccess: (res) => {
      setActiveDraft(res.data);
      setCopied(false);
      invalidate();
      toast.success("Engagement draft ready");
    },
    onError: (err: Error) => toast.error(err.message || "Draft failed"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteKolEngagement(id),
    onSuccess: (_res, id) => {
      setDeleteOpen(false);
      setActiveDraft((p) => (p?.id === id ? null : p));
      invalidate();
      toast.success("Deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayDraft = activeDraft ?? recentQ.data?.data[0] ?? null;
  const isBusy = trackM.isPending || draftM.isPending || deleteM.isPending;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy");
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="kol-handles" className="text-xs font-medium text-muted-foreground">KOL handles (comma-separated, max 12)</label>
        <Textarea id="kol-handles" value={handlesText} onChange={(e) => setHandlesText(e.target.value)} className="min-h-[4rem] resize-y rounded-xl border-border/60 bg-background/60 text-[13px]" disabled={isBusy} placeholder="aeyakovenko, mert, ansem…" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {MODE_OPTIONS.filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i).map((opt) => (
          <button key={opt.id} type="button" onClick={() => setMode(opt.id)} disabled={isBusy} className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]", mode === opt.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]" : "border-border/50 text-muted-foreground")}>
            {opt.label}
          </button>
        ))}
      </div>

      <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25" onClick={() => trackM.mutate()} disabled={isBusy}>
        {trackM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
        {trackM.isPending ? "Tracking…" : "Track KOLs"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)]">
        <div className="min-w-0 space-y-3">
          {opportunities.length > 0 ? (
            opportunities.map((opp) => (
              <div key={opp.id} className={cn("rounded-xl border p-3", activeOpp?.id === opp.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/15")}>
                <button type="button" className="w-full text-left" onClick={() => { setActiveOpp(opp); setActiveDraft(null); }}>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">@{opp.author.userName}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">via @{opp.kolHandle}</span>
                    <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2 py-0.5 font-mono text-[9px] text-[#F3BA2F]">score {opp.score}</span>
                  </div>
                  <p className="line-clamp-3 text-[12px] leading-relaxed">{opp.text}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{opp.metrics.likeCount} likes · {opp.metrics.retweetCount} RTs</p>
                </button>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs" asChild>
                    <a href={opp.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3 w-3" />Open</a>
                  </Button>
                  <Button type="button" size="sm" className="rounded-lg border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-xs text-[#F3BA2F]" onClick={() => { setActiveOpp(opp); draftM.mutate(opp); }} disabled={isBusy}>
                    {draftM.isPending && activeOpp?.id === opp.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Draft engagement
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Watch crypto KOLs, surface their best tweets, draft replies for founder visibility.</p>
          )}

          {displayDraft ? (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <pre className="post-share-modal-body text-[13px] leading-relaxed">{displayDraft.text}</pre>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F]" onClick={() => void handleCopy(displayDraft.text)}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy draft"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" asChild>
                  <a href={buildReplyOnXUrl(displayDraft.sourceTweetId, displayDraft.text)} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Reply on X</a>
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" onClick={() => setDeleteOpen(true)} disabled={isBusy}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </div>
            </div>
          ) : null}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">Recent drafts</p>
            <div className="grid gap-2 overflow-y-auto">
              {recentQ.data.data.slice(0, 8).map((item) => (
                <button key={item.id} type="button" onClick={() => { setActiveDraft(item); setCopied(false); }} className={cn("rounded-xl border px-3 py-2 text-left text-xs", activeDraft?.id === item.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/20")}>
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader><AlertDialogTitle>Delete draft?</AlertDialogTitle><AlertDialogDescription>Removes from saved library.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleteM.isPending || !displayDraft} onClick={() => displayDraft && deleteM.mutate(displayDraft.id)}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
