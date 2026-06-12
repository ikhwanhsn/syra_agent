"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Newspaper, Pencil, Sparkles, Trash2, Wand2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deleteNarrativePost,
  fetchRecentNarrativePosts,
  fetchTrendingNarrativePreview,
  generateNarrativePost,
  rewriteNarrativePost,
  type NarrativePost,
  type NarrativeSourceMode,
} from "@/lib/internalToolsApi";

function formatTheme(post: Pick<NarrativePost, "theme" | "sourceMode">): string {
  if (post.sourceMode === "trending" || post.theme === "trending-news") return "trending news";
  return post.theme.replace(/-/g, " ");
}

interface InternalNarrativeToolProps {
  wallet?: string | null;
}

export function InternalNarrativeTool({ wallet }: InternalNarrativeToolProps) {
  const queryClient = useQueryClient();
  const [activePost, setActivePost] = useState<NarrativePost | null>(null);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "narrative-recent"],
    queryFn: () => fetchRecentNarrativePosts(15),
    staleTime: 30_000,
  });

  const trendingPreviewQ = useQuery({
    queryKey: ["internal-tools", "narrative-trending-preview"],
    queryFn: fetchTrendingNarrativePreview,
    staleTime: 120_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "narrative-recent"] });
  }, [queryClient]);

  const [generatingMode, setGeneratingMode] = useState<NarrativeSourceMode | null>(null);

  const generateM = useMutation({
    mutationFn: (mode: NarrativeSourceMode) => generateNarrativePost(wallet, mode),
    onSuccess: (res, mode) => {
      setActivePost(res.data);
      setCopied(false);
      setGeneratingMode(null);
      invalidateRecent();
      if (mode === "trending") {
        void queryClient.invalidateQueries({ queryKey: ["internal-tools", "narrative-trending-preview"] });
      }
      toast.success(
        mode === "trending" ? "Trending narrative generated" : "Syra narrative generated",
      );
    },
    onError: (err: Error) => {
      setGeneratingMode(null);
      toast.error(err.message || "Failed to generate narrative");
    },
  });

  const rewriteM = useMutation({
    mutationFn: ({ id, instruction }: { id: string; instruction: string }) =>
      rewriteNarrativePost(id, instruction),
    onSuccess: (res) => {
      setActivePost(res.data);
      setEditOpen(false);
      setEditInstruction("");
      invalidateRecent();
      toast.success("Narrative rewritten with AI");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to rewrite narrative");
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteNarrativePost(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setEditOpen(false);
      setActivePost((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Narrative deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete narrative");
    },
  });

  const displayPost = activePost ?? recentQ.data?.data[0] ?? null;

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied — paste on X");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  const openEditModal = () => {
    if (!displayPost) return;
    setEditInstruction("");
    setEditOpen(true);
  };

  const submitRewrite = () => {
    if (!displayPost) return;
    const trimmed = editInstruction.trim();
    if (trimmed.length < 3) {
      toast.error("Describe what to change (at least 3 characters)");
      return;
    }
    rewriteM.mutate({ id: displayPost.id, instruction: trimmed });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !rewriteM.isPending) {
      e.preventDefault();
      submitRewrite();
    }
  };

  const isBusy = generateM.isPending || rewriteM.isPending || deleteM.isPending;

  const runGenerate = (mode: NarrativeSourceMode) => {
    setGeneratingMode(mode);
    generateM.mutate(mode);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
          onClick={() => runGenerate("syra")}
          disabled={isBusy}
        >
          {generateM.isPending && generatingMode === "syra" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" aria-hidden />
          )}
          {generateM.isPending && generatingMode === "syra" ? "Generating…" : "Generate · Syra"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-border/60"
          onClick={() => runGenerate("trending")}
          disabled={isBusy}
        >
          {generateM.isPending && generatingMode === "trending" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Newspaper className="mr-2 h-4 w-4" aria-hidden />
          )}
          {generateM.isPending && generatingMode === "trending" ? "Matching news…" : "Generate · Trending"}
        </Button>
      </div>

      {trendingPreviewQ.data?.data ? (
        <div className="rounded-xl border border-border/50 bg-muted/15 px-3 py-3 sm:px-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
            Trending now · feeds Generate · Trending
          </p>
          {trendingPreviewQ.data.data.suggestedHook ? (
            <p className="mt-2 text-xs leading-relaxed text-foreground/85">
              <span className="font-medium text-[#F3BA2F]">Next hook:</span>{" "}
              {trendingPreviewQ.data.data.suggestedHook}
            </p>
          ) : null}
          {trendingPreviewQ.data.data.headlines.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {trendingPreviewQ.data.data.headlines.slice(0, 4).map((h) => (
                <li key={h.headline} className="line-clamp-1 text-[11px] text-muted-foreground">
                  → {h.headline}
                  {h.source ? <span className="opacity-60"> · {h.source}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">No headlines cached yet — Syra mode still works.</p>
          )}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-3">
      {displayPost ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {displayPost.theme || displayPost.sourceMode ? (
              <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                {formatTheme(displayPost)}
              </span>
            ) : null}
            {displayPost.newsHook ? (
              <span className="max-w-full truncate text-[11px] text-muted-foreground" title={displayPost.newsHook}>
                Hook: {displayPost.newsHook}
              </span>
            ) : null}
            {displayPost.createdAt ? (
              <span className="text-[11px] text-muted-foreground">
                {new Date(displayPost.createdAt).toLocaleString()}
              </span>
            ) : null}
          </div>

          <pre className="post-share-modal-body max-h-[min(40vh,16rem)] text-[13px] leading-relaxed">
            {displayPost.text}
          </pre>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
              onClick={() => void handleCopy(displayPost.text)}
            >
              {copied ? <Check className="mr-2 h-4 w-4" aria-hidden /> : <Copy className="mr-2 h-4 w-4" aria-hidden />}
              {copied ? "Copied" : "Copy post text"}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl border-border/60" asChild>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(displayPost.text)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on X
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-border/60"
              onClick={openEditModal}
              disabled={isBusy}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden />
              Edit
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
          Pick Syra for product themes, or Trending to newsjack today&apos;s headlines.
        </p>
      )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5 lg:max-h-[min(60dvh,32rem)]">
              {recentQ.data.data.slice(0, 12).map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => {
                    setActivePost(post);
                    setCopied(false);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    activePost?.id === post.id
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/35",
                  )}
                >
                  <span className="line-clamp-2 text-xs leading-relaxed text-foreground/85">{post.text}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {formatTheme(post)}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditInstruction("");
        }}
      >
        <DialogContent className="border-border/60 bg-background sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wand2 className="h-4 w-4 text-[#F3BA2F]" aria-hidden />
              Edit with AI
            </DialogTitle>
            <DialogDescription>
              Describe what to change. The LLM rewrites the post, saves it, and keeps it unique.
            </DialogDescription>
          </DialogHeader>

          {displayPost ? (
            <pre className="post-share-modal-body max-h-32 text-[12px] leading-relaxed">{displayPost.text}</pre>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="narrative-edit-instruction" className="text-xs font-medium text-muted-foreground">
              What should change?
            </label>
            <Input
              id="narrative-edit-instruction"
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              onKeyDown={handleEditKeyDown}
              placeholder="e.g. make it shorter, add $SYRA staking, more hype"
              disabled={rewriteM.isPending}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">Press Enter to rewrite</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-border/60"
              onClick={() => setEditOpen(false)}
              disabled={rewriteM.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
              onClick={submitRewrite}
              disabled={rewriteM.isPending || editInstruction.trim().length < 3}
            >
              {rewriteM.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" aria-hidden />
              )}
              {rewriteM.isPending ? "Rewriting…" : "Rewrite with AI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this narrative?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the post from your saved library. You can generate a new one anytime, but this exact text
              won&apos;t be recoverable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending || !displayPost}
              onClick={() => displayPost && deleteM.mutate(displayPost.id)}
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
