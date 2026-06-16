import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { PostXStatusLabel } from "@/components/post/PostXStatusControl";
import type { PostUpdateBundle } from "@/content/posts";
import { useDeletePosts } from "@/lib/postDeleted";
import {
  getLatestVisiblePostUpdateNumber,
  isBundlePostedForDisplay,
} from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { cn } from "@/lib/utils";

interface PostFundUpdateListProps {
  updates: PostUpdateBundle[];
  /** Hub page uses terminal-style rows inside the glass panel. */
  variant?: "default" | "hub";
}

function formatDeleteList(numbers: number[], updates: PostUpdateBundle[]): string {
  const byNumber = new Map(updates.map((bundle) => [bundle.video.meta.updateNumber, bundle]));
  return numbers
    .map((n) => {
      const title = byNumber.get(n)?.video.meta.title ?? `Update ${n}`;
      return `#${n} · ${title}`;
    })
    .join(", ");
}

export function PostFundUpdateList({ updates, variant = "default" }: PostFundUpdateListProps) {
  const isHub = variant === "hub";
  const refreshTick = usePostRegistryRefresh();
  const deleteM = useDeletePosts();
  const latestVisible = useMemo(() => getLatestVisiblePostUpdateNumber(), [refreshTick, updates]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<PostUpdateBundle | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const postedUpdates = useMemo(
    () => updates.filter((bundle) => isBundlePostedForDisplay(bundle)),
    [updates],
  );

  const selectedPosted = useMemo(
    () => [...selected].filter((n) => postedUpdates.some((bundle) => bundle.video.meta.updateNumber === n)),
    [selected, postedUpdates],
  );

  const toggleSelected = (updateNumber: number, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(updateNumber);
      else next.delete(updateNumber);
      return next;
    });
  };

  const selectAllPosted = () => {
    setSelected(new Set(postedUpdates.map((bundle) => bundle.video.meta.updateNumber)));
  };

  const clearSelection = () => setSelected(new Set());

  const confirmSingleDelete = async () => {
    if (!singleDeleteTarget || deleteM.isPending) return;
    try {
      await deleteM.mutateAsync([singleDeleteTarget.video.meta.updateNumber]);
      setSelected((current) => {
        const next = new Set(current);
        next.delete(singleDeleteTarget.video.meta.updateNumber);
        return next;
      });
      setSingleDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedPosted.length === 0 || deleteM.isPending) return;
    try {
      await deleteM.mutateAsync(selectedPosted);
      clearSelection();
      setBulkDeleteOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk delete failed");
    }
  };

  if (updates.length === 0) return null;

  return (
    <>
      <div className={cn("text-left", !isHub && "mt-8")}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.16em]",
              isHub ? "text-cyan-400/70" : "text-white/35",
            )}
          >
            Fund updates
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
              <span className="text-cyan-400/80">● Posted</span>
              <span className="mx-1.5 text-white/20">·</span>
              <span className="text-amber-300/70">● Not posted</span>
            </p>
            {postedUpdates.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={selectAllPosted}
                  className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70"
                >
                  Select all posted
                </button>
                {selectedPosted.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70"
                  >
                    Clear
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {selectedPosted.length > 0 ? (
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]"
              disabled={deleteM.isPending}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete selected ({selectedPosted.length})
            </Button>
          </div>
        ) : null}

        <ul className="space-y-2">
          {updates.map((bundle) => {
            const { meta } = bundle.video;
            const isLatest = meta.updateNumber === latestVisible;
            const posted = isBundlePostedForDisplay(bundle);
            const isSelected = selected.has(meta.updateNumber);

            return (
              <li key={meta.updateNumber}>
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 border px-3 py-2.5",
                    isHub ? "post-hub-update-row" : "rounded-lg",
                    isSelected
                      ? "border-red-500/25 bg-red-500/[0.04]"
                      : isHub
                        ? undefined
                        : "border-white/8 bg-white/[0.02]",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {posted ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSelected(meta.updateNumber, checked === true)}
                        className="border-white/25 data-[state=checked]:border-red-500/50 data-[state=checked]:bg-red-500/80"
                        aria-label={`Select update #${meta.updateNumber} for bulk delete`}
                      />
                    ) : (
                      <span className="inline-flex h-4 w-4 shrink-0" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white/85">
                        #{meta.updateNumber} · {meta.title}
                        {isLatest ? (
                          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary/80">
                            Latest
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate font-mono text-[10px] text-white/35">{meta.published}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PostXStatusLabel updateNumber={meta.updateNumber} defaultPosted={meta.postedOnX} />
                    <Link
                      to={`/post/video/${meta.updateNumber}`}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-primary/80"
                    >
                      Video
                    </Link>
                    <Link
                      to={`/post/photo/${meta.updateNumber}`}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-primary/80"
                    >
                      Photo
                    </Link>
                    {posted ? (
                      <button
                        type="button"
                        onClick={() => setSingleDeleteTarget(bundle)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-400/90"
                        aria-label={`Delete update #${meta.updateNumber}`}
                        title="Delete from studio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <AlertDialog open={singleDeleteTarget !== null} onOpenChange={(open) => !open && setSingleDeleteTarget(null)}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this growth brief?</AlertDialogTitle>
            <AlertDialogDescription>
              {singleDeleteTarget
                ? `Removes #${singleDeleteTarget.video.meta.updateNumber} · ${singleDeleteTarget.video.meta.title} from the studio. Video and photo routes will no longer be available until you restore from source.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending}
              onClick={() => void confirmSingleDelete()}
            >
              {deleteM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedPosted.length} growth brief{selectedPosted.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Removes {formatDeleteList(selectedPosted, updates)} from the studio. This cannot be undone from the UI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending}
              onClick={() => void confirmBulkDelete()}
            >
              {deleteM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete {selectedPosted.length}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
