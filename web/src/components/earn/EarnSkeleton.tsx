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
    <div className="grid h-auto w-full max-w-xl grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-9 rounded-md" />
      ))}
    </div>
  );
}

function EarnPanelHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-9 w-20 rounded-md" />
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

function EarnPanelContentSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading earn panel">
      <EarnPanelHeaderSkeleton />
      <Skeleton className="h-4 w-full max-w-lg" />
      <EarnPanelListSkeleton rows={rows} />
    </div>
  );
}

export function EarnPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading earn page">
      <EarnSummarySkeleton />
      <div className="space-y-6">
        <EarnTabListSkeleton />
        <EarnPanelContentSkeleton rows={4} />
      </div>
    </div>
  );
}
