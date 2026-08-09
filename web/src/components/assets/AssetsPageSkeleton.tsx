import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { AssetsTableSkeleton } from "@/components/assets/AssetsTableSkeleton";
import { cn } from "@/lib/utils";

/** Full Assets page Suspense shell: header + search + filters + table. */
export function AssetsPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 pb-10"
      aria-busy="true"
      aria-label="Loading assets"
      role="status"
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28 sm:h-9" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full flex-1 rounded-md" />
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-md" />
          ))}
        </div>
      </div>

      <div className={cn(overviewCardShell, "overflow-hidden")}>
        <AssetsTableSkeleton />
      </div>
    </div>
  );
}
