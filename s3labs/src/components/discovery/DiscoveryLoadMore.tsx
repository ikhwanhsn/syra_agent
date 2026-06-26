import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DiscoveryLoadMoreProps {
  hasMore: boolean;
  isLoadingMore: boolean;
  loadedCount: number;
  totalCount: number;
  onLoadMore: () => void;
  itemLabel?: string;
  className?: string;
}

export function DiscoveryLoadMore({
  hasMore,
  isLoadingMore,
  loadedCount,
  totalCount,
  onLoadMore,
  itemLabel = "results",
  className,
}: DiscoveryLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (totalCount === 0) return null;

  return (
    <div className={cn("mt-8 space-y-4", className)}>
      <p className="text-center text-sm text-muted-foreground">
        Showing {loadedCount} of {totalCount} {itemLabel}
      </p>

      {hasMore ? (
        <>
          <div ref={sentinelRef} className="h-px" aria-hidden />
          <div className="flex justify-center">
            <Button
              type="button"
              variant="heroOutline"
              className="min-h-11 gap-2 rounded-full px-6"
              disabled={isLoadingMore}
              onClick={onLoadMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        </>
      ) : loadedCount < totalCount ? null : (
        <p className="text-center text-xs text-muted-foreground">You&apos;ve reached the end</p>
      )}

      {isLoadingMore ? (
        <DiscoveryListSkeleton count={3} />
      ) : null}
    </div>
  );
}

export function DiscoveryListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border/40 px-5 py-4 last:border-b-0"
        >
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 max-w-xs" />
            <Skeleton className="h-3 w-2/5 max-w-[10rem]" />
          </div>
          <Skeleton className="hidden h-8 w-16 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function DiscoveryGridSkeleton({
  count = 6,
  columns = "md:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}
