import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

export function AssetDetailSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading asset">
      <div className={cn(overviewCardShell, "p-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-8 w-48 max-w-full rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border/40 p-3">
              <Skeleton className="h-3 w-14 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-[280px] w-full rounded-2xl sm:h-[400px]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border/55 bg-muted/20 p-4">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-3/4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className={cn(overviewCardShell, "p-5")}>
        <Skeleton className="mb-4 h-5 w-32 rounded-md" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
