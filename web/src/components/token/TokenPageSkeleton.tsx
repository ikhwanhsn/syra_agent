import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

/** Matches TokenPageView: header + proof + benefits + token bar + token section. */
export function TokenPageSkeleton() {
  return (
    <div
      className="animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading token"
      role="status"
    >
      <header className="mb-8 max-w-2xl space-y-3 sm:mb-10">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-56 max-w-full sm:h-10" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>
      </header>

      <div className={cn(overviewCardShell, "mb-8 p-5 sm:p-6")}>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-8 w-40" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>

      <div className={cn(overviewCardShell, "mb-8 p-5 sm:p-6")}>
        <Skeleton className="h-5 w-44" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-2 p-4")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
