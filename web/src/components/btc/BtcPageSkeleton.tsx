import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

/** Matches BtcPage: hero + stats + section panels (section nav is aside chrome). */
export function BtcPageSkeleton() {
  return (
    <div
      className="relative space-y-8 animate-in fade-in duration-300 xl:pr-48"
      aria-busy="true"
      aria-label="Loading Bitcoin dashboard"
      role="status"
    >
      <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl p-6 sm:p-8")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-48 max-w-full sm:h-12 sm:w-64" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-3 p-4")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="h-3 w-40" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn(overviewCardShell, "space-y-4 p-5")}>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
        <div className={cn(overviewCardShell, "space-y-4 p-5")}>
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className={cn(overviewCardShell, "space-y-4 p-5")}>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    </div>
  );
}
