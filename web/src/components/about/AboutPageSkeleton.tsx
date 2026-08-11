import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

/** Matches AboutSinglePage: hero + 5 pillars + platforms + community. */
export function AboutPageSkeleton() {
  return (
    <div
      className="space-y-14 animate-in fade-in duration-300 sm:space-y-16"
      aria-busy="true"
      aria-label="Loading about"
      role="status"
    >
      <header className="space-y-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="min-w-0 w-full space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full max-w-xl sm:h-10" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-4/5 max-w-xl" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </header>

      <section>
        <div className="mb-6 max-w-xl space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(overviewCardShell, "p-5")}>
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-4 w-20" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-4/5" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(overviewCardShell, "flex items-start gap-3.5 p-4 sm:p-5")}>
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={cn(overviewCardShell, "p-6 sm:p-8")}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-6 w-40" />
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
