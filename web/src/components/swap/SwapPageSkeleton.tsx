import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

const swapShellClass = cn(
  "overflow-hidden rounded-[22px] border border-border/45",
  "bg-gradient-to-b from-card via-card to-muted/[0.12]",
  "shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset,0_24px_48px_-28px_rgba(0,0,0,0.65)]",
);

const fieldShellClass = cn(
  "rounded-2xl bg-muted/[0.22] p-4 ring-1 ring-inset ring-border/35",
);

function SwapCardSkeleton() {
  return (
    <div className={swapShellClass}>
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 sm:px-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>

      <div className="space-y-0 px-3 pb-4 pt-3 sm:px-4">
        <div className={cn(fieldShellClass, "rounded-b-md")}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Skeleton className="h-7 w-12 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>

        <div className="relative z-[1] -my-3 flex justify-center" aria-hidden>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>

        <div className={cn(fieldShellClass, "rounded-b-2xl rounded-t-md pt-6 sm:pt-7")}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <div className="space-y-2 rounded-xl border border-border/40 bg-muted/10 p-3">
            <Skeleton className="h-3.5 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-28 rounded-md" />
            <Skeleton className="h-3.5 w-44 rounded-md" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SwapMarketPanelSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className={cn(overviewCardShell, "p-0")}>
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-14 rounded-md" />
                <Skeleton className="h-7 w-40 max-w-full rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-40 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-xl" />
            ))}
          </div>

          <Skeleton className="h-[280px] w-full rounded-xl sm:h-[320px]" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "p-6")}>
            <Skeleton className="mb-2 h-5 w-16 rounded-md" />
            <Skeleton className="mb-4 h-3 w-40 rounded-md" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="space-y-2 border-b border-border/40 pb-3 last:border-0"
                >
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Route Suspense fallback matching live `/swap` layout. */
export function SwapPageSkeleton() {
  return (
    <div
      className="relative flex min-h-full flex-col animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading swap"
      role="status"
    >
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative z-[1] flex flex-1 flex-col",
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
        )}
      >
        <div className="mb-6 max-w-2xl space-y-2 sm:mb-8">
          <Skeleton className="h-8 w-44 max-w-full sm:h-9" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <div className="grid w-full flex-1 gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] xl:gap-8">
          <aside className="min-w-0">
            <SwapCardSkeleton />
          </aside>
          <SwapMarketPanelSkeleton />
        </div>
      </div>
    </div>
  );
}
