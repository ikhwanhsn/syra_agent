import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

const LLM_TAB_WIDTHS = ["w-16", "w-24", "w-16", "w-16", "w-16", "w-36"] as const;

/** Full LLM playground Suspense shell: header + 6 tabs + form panel. */
export function LlmPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 pb-12"
      aria-busy="true"
      aria-label="Loading LLM playground"
      role="status"
    >
      <div className="mb-2 space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="flex h-auto flex-wrap gap-1 rounded-lg border border-border/40 bg-muted/30 p-1">
        {LLM_TAB_WIDTHS.map((w, i) => (
          <Skeleton key={i} className={cn("h-9 rounded-md", w)} />
        ))}
      </div>

      <div className={cn(overviewCardShell, "mt-6 space-y-6 p-6")}>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full max-w-md rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-28 w-full rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
