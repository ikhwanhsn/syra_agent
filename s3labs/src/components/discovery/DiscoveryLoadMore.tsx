import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

import { DiscoveryListSkeleton } from "@/components/discovery/DiscoverySkeletons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export { DiscoveryListSkeleton } from "@/components/discovery/DiscoverySkeletons";
export {
  DiscoveryEventSkeleton,
  DiscoveryHackathonSkeleton,
  DiscoveryJobSkeleton,
} from "@/components/discovery/DiscoverySkeletons";

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

      {isLoadingMore ? <DiscoveryListSkeleton count={3} /> : null}
    </div>
  );
}
