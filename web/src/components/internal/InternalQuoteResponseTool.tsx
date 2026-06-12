"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, MessageSquareQuote, Sparkles, Trash2 } from "lucide-react";
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
  deleteQuoteResponse,
  fetchRecentQuoteResponses,
  generateQuoteResponse,
  type QuoteResponseItem,
  type QuoteToneId,
} from "@/lib/internalToolsApi";

const TONE_OPTIONS: Array<{ id: QuoteToneId | "auto"; label: string }> = [
  { id: "auto", label: "Auto tone" },
  { id: "amplify", label: "Amplify + bridge" },
  { id: "bullish", label: "Full hype" },
  { id: "contrast", label: "Smart contrast" },
  { id: "builder", label: "Builder peer" },
  { id: "token", label: "$SYRA utility" },
  { id: "question", label: "Question hook" },
];

function formatTone(tone: string): string {
  return tone.replace(/-/g, " ") || "auto";
}

interface InternalQuoteResponseToolProps {
  wallet?: string | null;
}

export function InternalQuoteResponseTool({ wallet }: InternalQuoteResponseToolProps) {
  const queryClient = useQueryClient();
  const [sourcePost, setSourcePost] = useState("");
  const [tone, setTone] = useState<QuoteToneId | "auto">("auto");
  const [activeItem, setActiveItem] = useState<QuoteResponseItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "quote-response-recent"],
    queryFn: () => fetchRecentQuoteResponses(15),
    staleTime: 30_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "quote-response-recent"] });
  }, [queryClient]);

  const generateM = useMutation({
    mutationFn: () =>
      generateQuoteResponse(sourcePost, wallet, tone === "auto" ? null : tone),
    onSuccess: (res) => {
      setActiveItem(res.data);
      setCopied(false);
      invalidateRecent();
      toast.success("Quote caption ready — paste on X when quoting");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to generate quote response");
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteQuoteResponse(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setActiveItem((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Quote response deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  const displayItem = activeItem ?? recentQ.data?.data[0] ?? null;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied — quote the post on X and paste this as your caption");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  const isBusy = generateM.isPending || deleteM.isPending;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="quote-source-post" className="text-xs font-medium text-muted-foreground">
          Paste the post you want to quote
        </label>
        <Textarea
          id="quote-source-post"
          value={sourcePost}
          onChange={(e) => setSourcePost(e.target.value)}
          placeholder="Copy text from another project's X post and paste here…"
          className="min-h-[7rem] resize-y rounded-xl border-border/60 bg-background/60 text-[13px] leading-relaxed"
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
      </div>

      <Button
        type="button"
        className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
        onClick={() => generateM.mutate()}
        disabled={isBusy || sourcePost.trim().length < 20}
      >
        {generateM.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" aria-hidden />
        )}
        {generateM.isPending ? "Writing caption…" : "Generate quote caption"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-3">
          {displayItem ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {displayItem.tone ? (
                  <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                    {formatTone(displayItem.tone)}
                  </span>
                ) : null}
                {displayItem.createdAt ? (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(displayItem.createdAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              {displayItem.sourcePost ? (
                <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-2.5">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    Quoted post
                  </p>
                  <p className="line-clamp-4 text-[12px] leading-relaxed text-muted-foreground">
                    {displayItem.sourcePost}
                  </p>
                </div>
              ) : null}

              <pre className="post-share-modal-body max-h-[min(36vh,14rem)] text-[13px] leading-relaxed">
                {displayItem.text}
              </pre>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                  onClick={() => void handleCopy(displayItem.text)}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy caption"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border/60"
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
              Paste a post, pick a tone, and generate a Syra-branded quote caption that drives hype and $SYRA
              curiosity.
            </p>
          )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              <MessageSquareQuote className="h-3 w-3" aria-hidden />
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5 lg:max-h-[min(60dvh,32rem)]">
              {recentQ.data.data.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setSourcePost(item.sourcePost);
                    setCopied(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    activeItem?.id === item.id
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/35",
                  )}
                >
                  <span className="line-clamp-2 text-xs leading-relaxed text-foreground/85">{item.text}</span>
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
            <AlertDialogTitle>Delete this quote caption?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your saved library. You can regenerate from the same source post anytime.
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
