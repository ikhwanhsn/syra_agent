import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function ConnectBannerSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border/40 bg-muted/15 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="h-3.5 w-full max-w-sm" />
      </div>
      <Skeleton className="h-9 w-full shrink-0 rounded-full sm:h-8 sm:w-28" />
    </div>
  );
}

function OpportunityCardSkeleton() {
  return (
    <li className={cn(overviewCardShell, "min-w-0")}>
      <div className="relative z-[1] flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="shrink-0 space-y-1 text-right">
              <Skeleton className="ml-auto h-3 w-8" />
              <Skeleton className="ml-auto h-6 w-14 sm:h-7" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5 max-w-[16rem]" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-10 w-full rounded-full sm:h-9 sm:w-28" />
      </div>
    </li>
  );
}

function SidePanelSkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-4 sm:p-6")}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-5 h-10 w-full rounded-full sm:h-9" />
      <Skeleton className="mx-auto mt-3 h-3 w-40" />
    </div>
  );
}

/** Matches InvestPositionsPanel loading shell (connected wallet). */
function PositionsPanelSkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-4 sm:p-6")}>
      <Skeleton className="h-3 w-24" />
      <div className="mt-4 space-y-3" aria-hidden>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function SpendToolCardSkeleton() {
  return (
    <li className={cn(overviewCardShell, "min-h-[9.5rem] min-w-0")}>
      <div className="flex h-full flex-col p-4 sm:p-5">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-5 w-36 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-4/5" />
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3.5 w-3.5 rounded-sm" />
        </div>
      </div>
    </li>
  );
}

function GlassMetricSkeleton() {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-20 sm:h-8" />
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
    <li className={cn(overviewCardShell, "min-h-[10rem] min-w-0")}>
      <div className="flex h-full flex-col justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4 max-w-[14rem]" />
          <Skeleton className="mt-1 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-5/6" />
        </div>
      </div>
    </li>
  );
}

/** Full Invest page body skeleton. */
export function InvestPageSkeleton({
  connected = false,
}: {
  connected?: boolean;
} = {}) {
  return (
    <div
      className="w-full space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading invest page"
    >
      <ConnectBannerSkeleton />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <GlassMetricSkeleton />
        <GlassMetricSkeleton />
        <GlassMetricSkeleton />
      </div>
      <div className="grid w-full gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="min-w-0 lg:col-span-8">
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-8 w-12 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-28 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
              <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
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
          {connected ? <PositionsPanelSkeleton /> : <SidePanelSkeleton />}
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
      <ConnectBannerSkeleton />
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
          <div className="mb-4 flex gap-1.5 overflow-hidden">
            {["w-12", "w-24", "w-16", "w-20", "w-16", "w-14"].map((w, i) => (
              <Skeleton key={i} className={cn("h-8 shrink-0 rounded-full", w)} />
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

/** Grow portfolio analysis skeleton (shown after address submit; address form stays mounted). */
export function GrowAnalysisSkeleton() {
  return (
    <div
      className="w-full space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading portfolio analysis"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
        <div
          className={cn(
            overviewCardShell,
            "flex flex-col justify-end p-4 sm:col-span-2 sm:p-5 lg:col-span-5 lg:p-6",
          )}
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-10 w-44 max-w-full sm:h-12 sm:w-52" />
          <Skeleton className="mt-2 h-3 w-40" />
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
        <Skeleton className="mb-1 h-5 w-28 sm:h-6" />
        <Skeleton className="mb-3 h-4 w-56 sm:mb-4" />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
        </ul>
      </section>
    </div>
  );
}

function GrowAddressFormSkeleton() {
  return (
    <section className={cn(overviewCardShell, "p-4 sm:p-5")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-11 w-full rounded-full sm:h-12" />
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Skeleton className="h-11 flex-1 rounded-full sm:h-12 sm:w-28 sm:flex-none" />
          <Skeleton className="h-11 flex-1 rounded-full sm:h-12 sm:w-24 sm:flex-none" />
        </div>
      </div>
    </section>
  );
}

/** Full Grow page Suspense shell: address form + analysis body (no duplicate connect banner). */
export function GrowPageSkeleton() {
  return (
    <div
      className="w-full space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading grow page"
    >
      <GrowAddressFormSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
        <div
          className={cn(
            overviewCardShell,
            "flex flex-col justify-end p-4 sm:col-span-2 sm:p-5 lg:col-span-5 lg:p-6",
          )}
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-10 w-44 max-w-full sm:h-12 sm:w-52" />
          <Skeleton className="mt-2 h-3 w-40" />
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
        <Skeleton className="mb-1 h-5 w-28 sm:h-6" />
        <Skeleton className="mb-3 h-4 w-56 sm:mb-4" />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
          <SuggestionCardSkeleton />
        </ul>
      </section>
    </div>
  );
}
