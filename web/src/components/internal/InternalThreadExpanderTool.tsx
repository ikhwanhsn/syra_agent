"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Layers, Loader2, Sparkles, Trash2 } from "lucide-react";
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
  deleteThreadExpand,
  fetchRecentThreadExpands,
  generateThreadExpand,
  type ThreadExpandItem,
} from "@/lib/internalToolsApi";

const TWEET_COUNT_OPTIONS: Array<{ count: number | null; label: string }> = [
  { count: null, label: "Auto" },
  { count: 3, label: "3 tweets" },
  { count: 4, label: "4 tweets" },
  { count: 5, label: "5 tweets" },
];

interface InternalThreadExpanderToolProps {
  wallet?: string | null;
}

export function InternalThreadExpanderTool({ wallet }: InternalThreadExpanderToolProps) {
  const queryClient = useQueryClient();
  const [sourceText, setSourceText] = useState("");
  const [tweetCount, setTweetCount] = useState<number | null>(null);
  const [activeItem, setActiveItem] = useState<ThreadExpandItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "thread-expander-recent"],
    queryFn: () => fetchRecentThreadExpands(15),
    staleTime: 30_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "thread-expander-recent"] });
  }, [queryClient]);

  const generateM = useMutation({
    mutationFn: () => generateThreadExpand(sourceText, wallet, tweetCount),
    onSuccess: (res) => {
      setActiveItem(res.data);
      setCopied(false);
      invalidateRecent();
      toast.success(`Thread ready — ${res.data.tweetCount} tweets`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to expand thread");
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteThreadExpand(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setActiveItem((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Thread deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayItem = activeItem ?? recentQ.data?.data[0] ?? null;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Thread copied — paste tweets in order on X");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  const isBusy = generateM.isPending || deleteM.isPending;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="thread-source" className="text-xs font-medium text-muted-foreground">
          Hook or single post to expand
        </label>
        <Textarea
          id="thread-source"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste a narrative, quote caption, or draft tweet — AI expands into a full Syra thread…"
          className="min-h-[6rem] resize-y rounded-xl border-border/60 bg-background/60 text-[13px] leading-relaxed"
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TWEET_COUNT_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setTweetCount(opt.count)}
            disabled={isBusy}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
              tweetCount === opt.count
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
        onClick={() => generateM.mutate()}
        disabled={isBusy || sourceText.trim().length < 20}
      >
        {generateM.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" aria-hidden />
        )}
        {generateM.isPending ? "Expanding…" : "Expand to thread"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-3">
          {displayItem ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                  {displayItem.tweetCount} tweets
                </span>
                {displayItem.createdAt ? (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(displayItem.createdAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                {displayItem.tweets.map((tweet, i) => (
                  <div
                    key={`${displayItem.id}-${i}`}
                    className="rounded-xl border border-border/50 bg-muted/10 px-3 py-2.5"
                  >
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#F3BA2F]/80">
                      {i + 1}/{displayItem.tweetCount}
                    </p>
                    <p className="text-[13px] leading-relaxed text-foreground/90">{tweet}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
                  onClick={() => void handleCopy(displayItem.fullText)}
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy full thread"}
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
              Turn any Syra hook into a 3–5 tweet thread with hype, thesis, and $SYRA CTA.
            </p>
          )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              <Layers className="h-3 w-3" aria-hidden />
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5">
              {recentQ.data.data.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setSourceText(item.sourceText);
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
                    {item.tweets[0] ?? item.sourceText}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {item.tweetCount} tweets
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
            <AlertDialogTitle>Delete this thread?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes it from your saved library. You can regenerate from the same hook anytime.
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
