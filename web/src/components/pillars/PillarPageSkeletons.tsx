import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function OpportunityCardSkeleton() {
  return (
    <li className={cn(overviewCardShell, "min-w-0 p-4 sm:p-5")}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5 max-w-[16rem]" />
        <Skeleton className="mt-2 h-4 w-20" />
      </div>
    </li>
  );
}

function SidePanelSkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-4 sm:p-6")}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-5 h-10 w-full rounded-full" />
      <Skeleton className="mt-2 h-10 w-full rounded-full" />
    </div>
  );
}

function SpendToolCardSkeleton() {
  return (
    <li className={cn(overviewCardShell, "min-w-0 p-4 sm:p-5")}>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-36 max-w-full" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-4/5" />
      <Skeleton className="mt-4 h-3 w-28" />
    </li>
  );
}

function GlassMetricSkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <Skeleton className="h-3 w-14" />
      <Skeleton className="mt-3 h-7 w-20 sm:h-8" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

function ProgressRowSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-1 w-full rounded-full" />
    </div>
  );
}

function SuggestionCardSkeleton() {
  return (
    <li className={cn(overviewCardShell, "min-w-0 p-4 sm:p-5")}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-5 w-3/4 max-w-[14rem]" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-5/6" />
    </li>
  );
}

/** Full Invest page body skeleton. */
export function InvestPageSkeleton() {
  return (
    <div
      className="w-full space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading invest page"
    >
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <GlassMetricSkeleton />
        <GlassMetricSkeleton />
        <GlassMetricSkeleton />
      </div>
      <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="min-w-0 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-12 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
            <OpportunityCardSkeleton />
          </ul>
        </section>
        <aside className="min-w-0 lg:col-span-4">
          <SidePanelSkeleton />
        </aside>
      </div>
    </div>
  );
}

/** Full Spend page body skeleton. */
export function SpendPageSkeleton() {
  return (
    <div
      className="w-full space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading spend page"
    >
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <GlassMetricSkeleton />
        <GlassMetricSkeleton />
        <GlassMetricSkeleton />
      </div>
      <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="min-w-0 order-1 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-10 w-full rounded-full sm:h-9 sm:w-64" />
          </div>
          <div className="mb-4 flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 shrink-0 rounded-full" />
            ))}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SpendToolCardSkeleton key={i} />
            ))}
          </ul>
        </section>
        <aside className="flex min-w-0 order-2 flex-col gap-6 lg:col-span-4">
          <div className={cn(overviewCardShell, "p-4 sm:p-6")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-4 w-full" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-full" />
              <Skeleton className="h-9 flex-1 rounded-full" />
              <Skeleton className="h-9 flex-1 rounded-full" />
            </div>
            <div className={cn(overviewCardShell, "mt-5 space-y-2 p-3.5 sm:p-4")}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className={cn(overviewCardShell, "p-4 sm:p-6")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-4 h-16 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Compact skeleton for Spend free-preview panel. */
export function SpendPreviewSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading preview">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** Grow portfolio analysis skeleton (shown after address submit). */
export function GrowAnalysisSkeleton() {
  return (
    <div
      className="w-full space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading portfolio analysis"
    >
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
        <div className={cn(overviewCardShell, "p-4 sm:p-5 lg:col-span-5 lg:p-6")}>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-3 h-10 w-40 sm:h-12" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-3 lg:col-span-7 lg:gap-4">
          <GlassMetricSkeleton />
          <GlassMetricSkeleton />
          <GlassMetricSkeleton />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className={cn(overviewCardShell, "p-4 sm:p-6")}>
            <Skeleton className="mb-1 h-5 w-24" />
            <Skeleton className="mb-4 h-4 w-36" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <ProgressRowSkeleton key={j} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <section>
        <Skeleton className="mb-1 h-5 w-28" />
        <Skeleton className="mb-4 h-4 w-48" />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
        </ul>
      </section>
    </div>
  );
}
