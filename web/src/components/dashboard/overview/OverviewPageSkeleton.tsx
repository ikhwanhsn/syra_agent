import { Skeleton } from "@/components/ui/skeleton";
import {
  overviewCardShell,
  overviewChartPanelShell,
} from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

function PillarShortcutSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/45 bg-background/25 px-1.5 py-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <Skeleton className="h-2.5 w-10" />
    </div>
  );
}

function PillarRowSkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-4 sm:p-5")}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="mt-1 h-6 w-24" />
        </div>
        <Skeleton className="mt-1 h-8 w-8 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

/** Matches DashboardPillarsHub: hero + compact chart + 5 pillar rows + how-it-flows. */
export function OverviewPageSkeleton() {
  return (
    <div
      className="space-y-10 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading overview"
      role="status"
    >
      <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl p-6 sm:p-8")}>
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-10">
          <div className="flex min-h-0 flex-col justify-between gap-8 lg:min-h-[340px] lg:py-1">
            <div className="space-y-6">
              <Skeleton className="h-3 w-28" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-64 max-w-full sm:h-12 sm:w-80" />
                <Skeleton className="h-10 w-56 max-w-full sm:h-12 sm:w-72" />
                <Skeleton className="h-4 w-full max-w-lg" />
                <Skeleton className="h-4 w-4/5 max-w-md" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <PillarShortcutSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>

          <div className={cn(overviewChartPanelShell, "flex flex-col gap-4 p-4 sm:p-5")}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PillarRowSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className={cn(overviewCardShell, "overflow-hidden rounded-2xl p-5 sm:p-6")}>
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          </div>
          <ol className="grid gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex h-full flex-col rounded-xl border border-border/40 bg-background/30 p-3"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3 w-5" />
                </div>
                <Skeleton className="mt-2 h-3 w-16" />
                <Skeleton className="mt-1 h-3 w-full" />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
