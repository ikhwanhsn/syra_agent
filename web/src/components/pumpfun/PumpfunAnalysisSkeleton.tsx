import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

export function PumpfunAnalysisSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-300", className)}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
