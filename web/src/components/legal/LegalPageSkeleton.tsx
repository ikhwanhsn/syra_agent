import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

/** Matches LegalDocumentLayout inner body (shell comes from RouteFallback). */
export function LegalPageSkeleton() {
  return (
    <div
      className="space-y-8 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading document"
      role="status"
    >
      <Skeleton className="h-5 w-28" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-3 p-5")}>
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
