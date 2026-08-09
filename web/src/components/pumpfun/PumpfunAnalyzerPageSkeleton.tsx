import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PumpfunListPanelSkeleton } from "@/components/pumpfun/PumpfunListPanelSkeleton";
import { cn } from "@/lib/utils";

export type PumpfunAnalyzerSkeletonTab = "scan" | "live" | "history" | "callers";

function SearchHeroSkeleton() {
  return (
    <section className={cn(overviewCardShell, "overflow-hidden rounded-3xl p-5 sm:p-7")}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64 max-w-full sm:h-9 sm:w-80" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-11 w-full flex-1 rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl sm:w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
    </section>
  );
}

function PrimaryTabsSkeleton() {
  return (
    <div
      className="grid h-10 w-full max-w-2xl grid-cols-4 gap-1 rounded-lg border border-border/40 bg-muted/30 p-1"
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-full rounded-md" />
      ))}
    </div>
  );
}

function ScanEmptyShellSkeleton() {
  return (
    <div className={cn(overviewCardShell, "flex flex-col items-center gap-3 px-6 py-16 text-center")}>
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="mt-2 h-4 w-56 max-w-full" />
    </div>
  );
}

/** Suspense shell for /analyzer: hero + 4 tabs + tab-shaped body (not post-scan results). */
export function PumpfunAnalyzerPageSkeleton({
  tab = "scan",
}: {
  tab?: PumpfunAnalyzerSkeletonTab;
} = {}) {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading token analyzer"
      role="status"
    >
      <SearchHeroSkeleton />
      <PrimaryTabsSkeleton />
      {tab === "scan" ? (
        <ScanEmptyShellSkeleton />
      ) : tab === "callers" ? (
        <PumpfunListPanelSkeleton variant="leaderboard" rows={8} />
      ) : (
        <PumpfunListPanelSkeleton rows={8} />
      )}
    </div>
  );
}
