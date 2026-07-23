import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Trash2 } from "lucide-react";
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
import { isLockedShipLogUpdate } from "@/lib/postLocked";
import {
  getLatestVisiblePostUpdateNumber,
} from "@/lib/postRegistryVisibility";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { cn } from "@/lib/utils";

interface PostShipLogUpdateListProps {
  updates: PostUpdateBundle[];
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

export function PostShipLogUpdateList({ updates }: PostShipLogUpdateListProps) {
  const refreshTick = usePostRegistryRefresh();
  const deleteM = useDeletePosts();
  const latestVisible = useMemo(() => getLatestVisiblePostUpdateNumber(), [refreshTick, updates]);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<PostUpdateBundle | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const deletableUpdates = useMemo(
    () =>
      updates.filter(
        (bundle) =>
          !isLockedShipLogUpdate(bundle.video.meta.updateNumber) && !bundle.video.meta.locked,
      ),
    [updates],
  );

  const selectedVisible = useMemo(
    () =>
      [...selected].filter((n) =>
        deletableUpdates.some((bundle) => bundle.video.meta.updateNumber === n),
      ),
    [selected, deletableUpdates],
  );

  const toggleSelected = (updateNumber: number, checked: boolean) => {
    if (isLockedShipLogUpdate(updateNumber)) return;
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(updateNumber);
      else next.delete(updateNumber);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const confirmSingleDelete = async () => {
    if (!singleDeleteTarget || deleteM.isPending) return;
    if (isLockedShipLogUpdate(singleDeleteTarget.video.meta.updateNumber)) {
      toast.error("Format Template cannot be deleted");
      setSingleDeleteTarget(null);
      return;
    }
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
    if (selectedVisible.length === 0 || deleteM.isPending) return;
    try {
      await deleteM.mutateAsync(selectedVisible);
      clearSelection();
      setBulkDeleteOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk delete failed");
    }
  };

  if (updates.length === 0) return null;

  return (
    <>
      <div className="mt-8 w-full min-w-0 text-left sm:mt-10">
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            Ship log updates
            <span className="ml-2 text-white/25">({updates.length})</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
              <span className="text-emerald-400/80">● Posted</span>
              <span className="mx-1.5 text-white/20">·</span>
              <span className="text-amber-300/70">● Not posted</span>
            </p>
            {deletableUpdates.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(new Set(deletableUpdates.map((bundle) => bundle.video.meta.updateNumber)))
                  }
                  className="min-h-9 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70 sm:min-h-0"
                >
                  Select all
                </button>
                {selectedVisible.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="min-h-9 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white/70 sm:min-h-0"
                  >
                    Clear
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {selectedVisible.length > 0 ? (
          <div className="mb-3 flex justify-stretch sm:justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 w-full gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] sm:h-8 sm:w-auto"
              disabled={deleteM.isPending}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete selected ({selectedVisible.length})
            </Button>
          </div>
        ) : null}

        <ul className="space-y-2 sm:space-y-2.5">
          {updates.map((bundle) => {
            const { meta } = bundle.video;
            const isLatest = meta.updateNumber === latestVisible;
            const isLocked = isLockedShipLogUpdate(meta.updateNumber) || meta.locked === true;
            const isSelected = selected.has(meta.updateNumber);

            return (
              <li key={meta.updateNumber}>
                <div
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3",
                    isLocked
                      ? "border-[#F3BA2F]/25 bg-[#F3BA2F]/[0.05]"
                      : isSelected
                        ? "border-red-500/25 bg-red-500/[0.04]"
                        : "border-white/8 bg-white/[0.02]",
                  )}
                >
                  <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
                    {isLocked ? (
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#F3BA2F]/80 sm:mt-0 sm:h-4 sm:w-4"
                        title="Locked format template"
                        aria-label="Locked format template"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSelected(meta.updateNumber, checked === true)}
                        className="mt-0.5 border-white/25 data-[state=checked]:border-red-500/50 data-[state=checked]:bg-red-500/80 sm:mt-0"
                        aria-label={`Select update #${meta.updateNumber} for bulk delete`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-white/85 break-words">
                        #{meta.updateNumber} · {meta.title}
                        {isLocked ? (
                          <span className="ml-2 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]/80">
                            Template
                          </span>
                        ) : null}
                        {isLatest ? (
                          <span className="ml-2 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]/80">
                            Latest
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-white/35">{meta.published}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-7 sm:shrink-0 sm:pl-0">
                    {!isLocked ? (
                      <PostXStatusLabel updateNumber={meta.updateNumber} defaultPosted={meta.postedOnX} />
                    ) : null}
                    <Link
                      to={`/post/video/${meta.updateNumber}`}
                      className="inline-flex min-h-9 items-center font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-[#F3BA2F]/80 sm:min-h-0"
                    >
                      Video
                    </Link>
                    <Link
                      to={`/post/photo/${meta.updateNumber}`}
                      className="inline-flex min-h-9 items-center font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-[#F3BA2F]/80 sm:min-h-0"
                    >
                      Photo
                    </Link>
                    {isLocked ? (
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/20 sm:h-7 sm:w-7"
                        title="Cannot delete format template"
                        aria-hidden
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSingleDeleteTarget(bundle)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-400/90 sm:h-7 sm:w-7"
                        aria-label={`Delete update #${meta.updateNumber}`}
                        title="Delete from studio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
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
            <AlertDialogTitle>Delete this ship log?</AlertDialogTitle>
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
              Delete {selectedVisible.length} ship log{selectedVisible.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Removes {formatDeleteList(selectedVisible, updates)} from the studio. This cannot be undone from the UI.
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
              Delete {selectedVisible.length}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
