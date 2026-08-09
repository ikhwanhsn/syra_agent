import { MarketplaceBrowseHeaderSkeleton } from "@/components/marketplace/MarketplaceBrowseHeader";
import {
  PLAYGROUND_PAGE_CLASS,
  playgroundSkeletonCardClass,
} from "@/components/playground/playgroundStyles";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import { cn } from "@/lib/utils";

interface PlaygroundCatalogSkeletonProps {
  count?: number;
}

export function PlaygroundCatalogSkeleton({ count = 10 }: PlaygroundCatalogSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading API catalog"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            playgroundSkeletonCardClass,
            "relative flex min-h-[15.5rem] flex-col overflow-hidden",
          )}
          style={playgroundStaggerStyle(index, 24, 8)}
        >
          <div className="relative flex flex-1 flex-col p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <div className="h-5 w-16 rounded-md bg-muted/45" />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="h-6 w-14 rounded-md bg-muted/40" />
                <div className="h-6 w-10 rounded-md bg-muted/45" />
              </div>
            </div>

            <div className="h-[15px] w-4/5 rounded-md bg-muted/50" />
            <div className="mt-1.5 space-y-1">
              <div className="h-3 w-full rounded-md bg-muted/35" />
              <div className="h-3 w-11/12 rounded-md bg-muted/30" />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 min-w-0 flex-1 rounded-lg border border-border/40 bg-muted/25" />
              <div className="h-4 w-4 shrink-0 rounded-sm bg-muted/30" />
            </div>

            <div className="mt-3 flex min-h-[2.25rem] flex-wrap gap-1.5">
              <div className="h-6 w-20 rounded-md border border-border/40 bg-background/60" />
              <div className="h-6 w-16 rounded-md border border-border/40 bg-background/60" />
            </div>

            <div className="mt-4 h-10 w-full rounded-xl bg-muted/45" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-page Suspense fallback matching SyraApiCatalog shell + header + cards. */
export function PlaygroundCatalogPageSkeleton({ count = 8 }: PlaygroundCatalogSkeletonProps) {
  return (
    <div
      className={cn(PLAYGROUND_PAGE_CLASS, "space-y-5 sm:space-y-6")}
      aria-busy="true"
      aria-label="Loading API catalog"
      role="status"
    >
      <MarketplaceBrowseHeaderSkeleton />
      <PlaygroundCatalogSkeleton count={count} />
    </div>
  );
}
