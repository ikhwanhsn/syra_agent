import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[4.5rem] w-full rounded-2xl" />
      ))}
    </div>
  );
}

function PoolCardSkeleton() {
  return (
    <div
      className={cn(
        overviewCardShell,
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-44 max-w-full" />
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="space-y-1.5 text-right">
          <Skeleton className="ml-auto h-3 w-12" />
          <Skeleton className="ml-auto h-6 w-16" />
        </div>
        <Skeleton className="h-10 w-[8.5rem] rounded-xl" />
      </div>
    </div>
  );
}

/** Shared LP pools content skeleton (page load + route Suspense). */
export function LpPoolsContentSkeleton({ poolCount = 3 }: { poolCount?: number }) {
  return (
    <div
      className="mx-auto w-full max-w-2xl animate-in fade-in duration-300 space-y-8"
      aria-busy="true"
      aria-label="Loading pools"
      role="status"
    >
      <StatsSkeleton />
      <div className="space-y-3">
        {Array.from({ length: poolCount }).map((_, i) => (
          <PoolCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
