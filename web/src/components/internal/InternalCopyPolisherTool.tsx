"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Copy, Loader2, Sparkles, Trash2, Wand2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  deleteCopyPolish,
  fetchRecentCopyPolishes,
  generateCopyPolish,
  type CopyPolishItem,
  type CopyPolishToneId,
} from "@/lib/internalToolsApi";

const TONE_OPTIONS: Array<{ id: CopyPolishToneId | "auto"; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "polish", label: "Light polish" },
  { id: "hype", label: "More hype" },
  { id: "narrative", label: "Narrative" },
  { id: "punchy", label: "Punchy" },
  { id: "syra-brand", label: "Syra voice" },
  { id: "cta", label: "Stronger CTA" },
];

function formatTone(tone: string): string {
  return tone.replace(/-/g, " ") || "auto";
}

interface InternalCopyPolisherToolProps {
  wallet?: string | null;
}

export function InternalCopyPolisherTool({ wallet }: InternalCopyPolisherToolProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [direction, setDirection] = useState("");
  const [tone, setTone] = useState<CopyPolishToneId | "auto">("auto");
  const [activeItem, setActiveItem] = useState<CopyPolishItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "copy-polisher-recent"],
    queryFn: () => fetchRecentCopyPolishes(15),
    staleTime: 30_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "copy-polisher-recent"] });
  }, [queryClient]);

  const polishM = useMutation({
    mutationFn: () =>
      generateCopyPolish(draft, wallet, tone === "auto" ? null : tone, direction || undefined),
    onSuccess: (res) => {
      setActiveItem(res.data);
      setCopied(false);
      invalidateRecent();
      toast.success("Draft polished — same context, better copy");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to polish draft"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteCopyPolish(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setActiveItem((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Polish deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayItem = activeItem ?? recentQ.data?.data[0] ?? null;
  const isBusy = polishM.isPending || deleteM.isPending;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied — ready to post on X");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="copy-polish-draft" className="text-xs font-medium text-muted-foreground">
          Your draft post
        </label>
        <Textarea
          id="copy-polish-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste your own X post draft here — we'll keep your message, improve the copy…"
          className="min-h-[7rem] resize-y rounded-xl border-border/60 bg-background/60 text-[13px] leading-relaxed"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="copy-polish-direction" className="text-xs font-medium text-muted-foreground">
          Optional direction
        </label>
        <Input
          id="copy-polish-direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="e.g. shorter, stronger hook, mention $SYRA, less formal"
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TONE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTone(opt.id)}
            disabled={isBusy}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
              tone === opt.id
                ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
        onClick={() => polishM.mutate()}
        disabled={isBusy || draft.trim().length < 10}
      >
        {polishM.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" aria-hidden />
        )}
        {polishM.isPending ? "Polishing…" : "Polish my draft"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-3">
          {displayItem ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                  {formatTone(displayItem.tone)}
                </span>
                {displayItem.createdAt ? (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(displayItem.createdAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-stretch">
                <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-3">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    Your draft
                  </p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{displayItem.originalText}</p>
                </div>
                <div className="hidden items-center justify-center sm:flex">
                  <ArrowRight className="h-4 w-4 text-[#F3BA2F]/70" aria-hidden />
                </div>
                <div className="rounded-xl border border-[#F3BA2F]/25 bg-[#F3BA2F]/5 px-3 py-3">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#F3BA2F]/80">
                    Polished
                  </p>
                  <p className="text-[13px] leading-relaxed text-foreground/95">{displayItem.polishedText}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                  onClick={() => void handleCopy(displayItem.polishedText)}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy polished"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border/60"
                  onClick={() => {
                    setDraft(displayItem.polishedText);
                    toast.message("Draft updated — polish again to iterate");
                  }}
                  disabled={isBusy}
                >
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                  Iterate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isBusy}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Same context as your draft — better hooks, hype, rhythm, and Syra brand voice when you want it.
            </p>
          )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5">
              {recentQ.data.data.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setDraft(item.originalText);
                    setCopied(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    activeItem?.id === item.id
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/35",
                  )}
                >
                  <span className="line-clamp-2 text-xs leading-relaxed text-foreground/85">
                    {item.polishedText}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {formatTone(item.tone)}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this polish?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes it from saved history. Your original draft stays in the textarea if you need it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending || !displayItem}
              onClick={() => displayItem && deleteM.mutate(displayItem.id)}
            >
              {deleteM.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
