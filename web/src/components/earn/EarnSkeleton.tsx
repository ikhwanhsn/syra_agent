import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function EarnSummarySkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
      <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EarnTabListSkeleton() {
  return (
    <div
      className={cn(
        "grid h-auto w-full max-w-2xl grid-cols-4 gap-1 rounded-full border border-border/40 bg-muted/15 p-1",
      )}
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-full" />
      ))}
    </div>
  );
}

function EarnListItemSkeleton() {
  return (
    <li className={cn(overviewCardShell, "flex flex-wrap items-center justify-between gap-3 p-4")}>
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-9 w-20 shrink-0 rounded-md" />
    </li>
  );
}

export function EarnPanelListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <EarnListItemSkeleton key={i} />
      ))}
    </ul>
  );
}

export function EarnStatsGridSkeleton({ cols = 2 }: { cols?: 2 | 3 }) {
  return (
    <div
      className={cn(
        overviewCardShell,
        "grid gap-4 p-4",
        cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
      )}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Yield-shaped default panel (matches EarnYieldPanel: header + 4 stats + product cards). */
export function EarnYieldPanelSkeleton({
  count = 2,
  includeHeader = true,
}: {
  count?: number;
  includeHeader?: boolean;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading yield">
      {includeHeader ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full max-w-2xl" />
        </>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-2 p-4")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-4 p-4 sm:p-5")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-40 max-w-full" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-16 shrink-0 rounded-md" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1.5 rounded-lg border border-border/40 p-3">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-full sm:w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EarnCardGridSkeleton({
  count = 6,
  heightClass = "h-[14rem]",
}: {
  count?: number;
  heightClass?: string;
}) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading cards"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(heightClass, "w-full rounded-[1.35rem]")}
        />
      ))}
    </div>
  );
}

export function EarnPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading earn page"
    >
      <EarnSummarySkeleton />
      <div className="space-y-8">
        <EarnTabListSkeleton />
        <EarnYieldPanelSkeleton />
      </div>
    </div>
  );
}
