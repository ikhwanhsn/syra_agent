import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

export function PumpfunAnalysisSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 animate-in fade-in duration-300", className)}>
      <Skeleton className="h-12 rounded-xl" />

      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-lg" />
        ))}
      </div>

      <section className={cn(overviewCardShell, "p-5 sm:p-6")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </section>

      <article className={cn(overviewCardShell, "p-6")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="mx-auto h-32 w-32 rounded-full lg:mx-0" />
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-[340px] rounded-2xl" />
    </div>
  );
}
