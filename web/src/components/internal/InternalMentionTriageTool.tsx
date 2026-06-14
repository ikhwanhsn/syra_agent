"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSign, Check, Copy, ExternalLink, Loader2, MessageCircle, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildReplyOnXUrl,
  deleteMentionReply,
  draftMentionReply,
  fetchRecentMentionReplies,
  scanMentionTriage,
  type MentionCategory,
  type MentionReplyItem,
  type MentionReplyToneId,
  type MentionTriageItem,
} from "@/lib/internalToolsApi";

const TONE_OPTIONS: Array<{ id: MentionReplyToneId | "auto"; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "helpful", label: "Helpful" },
  { id: "hype", label: "Hype" },
  { id: "builder", label: "Builder" },
  { id: "clarify", label: "Clarify FUD" },
];

const CAT_COLORS: Record<MentionCategory, string> = {
  question: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  opportunity: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  fud: "text-red-400 border-red-400/30 bg-red-400/10",
  praise: "text-[#F3BA2F] border-[#F3BA2F]/30 bg-[#F3BA2F]/10",
  spam: "text-muted-foreground border-border/50 bg-muted/20",
};

interface InternalMentionTriageToolProps {
  wallet?: string | null;
}

export function InternalMentionTriageTool({ wallet }: InternalMentionTriageToolProps) {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState("");
  const [tone, setTone] = useState<MentionReplyToneId | "auto">("auto");
  const [mentions, setMentions] = useState<MentionTriageItem[]>([]);
  const [activeMention, setActiveMention] = useState<MentionTriageItem | null>(null);
  const [activeReply, setActiveReply] = useState<MentionReplyItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "mention-triage-recent"],
    queryFn: () => fetchRecentMentionReplies(15),
    staleTime: 30_000,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "mention-triage-recent"] });
  }, [queryClient]);

  const scanM = useMutation({
    mutationFn: () => scanMentionTriage(handle.trim() || undefined),
    onSuccess: (res) => {
      setMentions(res.data.mentions);
      setActiveMention(res.data.mentions[0] ?? null);
      setActiveReply(null);
      toast.success(`Found ${res.data.mentions.length} mentions to triage`);
    },
    onError: (err: Error) => toast.error(err.message || "Scan failed"),
  });

  const draftM = useMutation({
    mutationFn: (m: MentionTriageItem) =>
      draftMentionReply(m.id, m.text, m.author.userName, m.category, wallet, tone === "auto" ? null : tone),
    onSuccess: (res) => {
      setActiveReply(res.data);
      setCopied(false);
      invalidate();
      toast.success("Reply draft ready");
    },
    onError: (err: Error) => toast.error(err.message || "Draft failed"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteMentionReply(id),
    onSuccess: (_res, id) => {
      setDeleteOpen(false);
      setActiveReply((p) => (p?.id === id ? null : p));
      invalidate();
      toast.success("Deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayReply = activeReply ?? recentQ.data?.data[0] ?? null;
  const isBusy = scanM.isPending || draftM.isPending || deleteM.isPending;

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
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <label htmlFor="mention-handle" className="text-xs font-medium text-muted-foreground">Your X handle</label>
          <Input id="mention-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle" className="rounded-xl border-border/60 bg-background/60 text-[13px]" disabled={isBusy} />
        </div>
        <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25" onClick={() => scanM.mutate()} disabled={isBusy}>
          {scanM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AtSign className="mr-2 h-4 w-4" />}
          {scanM.isPending ? "Scanning…" : "Scan mentions"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TONE_OPTIONS.map((opt) => (
          <button key={opt.id} type="button" onClick={() => setTone(opt.id)} disabled={isBusy} className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em]", tone === opt.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]" : "border-border/50 text-muted-foreground")}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)]">
        <div className="min-w-0 space-y-3">
          {mentions.length > 0 ? (
            mentions.map((m) => (
              <div key={m.id} className={cn("rounded-xl border p-3", activeMention?.id === m.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/15")}>
                <button type="button" className="w-full text-left" onClick={() => { setActiveMention(m); setActiveReply(null); }}>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">@{m.author.userName}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase", CAT_COLORS[m.category])}>{m.category}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{m.priority} priority</span>
                  </div>
                  <p className="line-clamp-3 text-[12px] leading-relaxed text-foreground/90">{m.text}</p>
                  {m.summary ? <p className="mt-1 text-[11px] text-muted-foreground">{m.summary}</p> : null}
                </button>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg text-xs" asChild>
                    <a href={m.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 h-3 w-3" />Open</a>
                  </Button>
                  <Button type="button" size="sm" className="rounded-lg border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-xs text-[#F3BA2F]" onClick={() => { setActiveMention(m); draftM.mutate(m); }} disabled={isBusy}>
                    {draftM.isPending && activeMention?.id === m.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageCircle className="mr-1 h-3 w-3" />}
                    Draft reply
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Fetch mentions of you and $SYRA, classify by priority, draft replies you post manually.</p>
          )}

          {displayReply ? (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <pre className="post-share-modal-body text-[13px] leading-relaxed">{displayReply.text}</pre>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F]" onClick={() => void handleCopy(displayReply.text)}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy reply"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" asChild>
                  <a href={buildReplyOnXUrl(displayReply.sourceTweetId, displayReply.text)} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Reply on X</a>
                </Button>
                <Button type="button" variant="outline" className="rounded-xl border-border/60" onClick={() => setDeleteOpen(true)} disabled={isBusy}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
              </div>
            </div>
          ) : null}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">Recent replies</p>
            <div className="grid gap-2 overflow-y-auto">
              {recentQ.data.data.slice(0, 8).map((item) => (
                <button key={item.id} type="button" onClick={() => { setActiveReply(item); setCopied(false); }} className={cn("rounded-xl border px-3 py-2 text-left text-xs", activeReply?.id === item.id ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8" : "border-border/50 bg-muted/20")}>
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader><AlertDialogTitle>Delete reply draft?</AlertDialogTitle><AlertDialogDescription>Removes from saved library.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleteM.isPending || !displayReply} onClick={() => displayReply && deleteM.mutate(displayReply.id)}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
