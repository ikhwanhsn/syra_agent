import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export function BtcExperimentHeroSkeleton({ ringClass = "ring-amber-500/15" }: { ringClass?: string }) {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1", ringClass)}>
      <div className="relative px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-72 max-w-full rounded-lg" />
                <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
                <Skeleton className="h-4 w-[80%] max-w-xl rounded-md" />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BtcExperimentPanelSkeleton({
  height = "h-48",
  rows = 0,
}: {
  height?: string;
  rows?: number;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-6 w-52 max-w-full rounded-md" />
        <Skeleton className="h-3 w-80 max-w-full rounded-md" />
      </div>
      <div className={cn(overviewCardShell, "rounded-2xl p-5 sm:p-6")}>
        {rows > 0 ? (
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <Skeleton className={cn("w-full rounded-xl", height)} />
        )}
      </div>
    </section>
  );
}

export function BtcExperimentSidebarSkeleton() {
  return (
    <aside className="space-y-4">
      <div className={cn(overviewCardShell, "space-y-3 rounded-2xl p-4")}>
        <Skeleton className="h-3 w-24 rounded-md" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
      <div className={cn(overviewCardShell, "space-y-3 rounded-2xl p-4")}>
        <Skeleton className="h-3 w-32 rounded-md" />
        <Skeleton className="h-5 w-full rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40 rounded-md" />
        <Skeleton className="h-[200px] rounded-2xl" />
      </div>
    </aside>
  );
}

const PANEL_HEIGHTS = ["h-56", "h-64", "h-48", "h-72", "h-52", "h-60", "h-48", "h-64"] as const;

export function BtcAgentExperimentPageSkeleton({
  accent = "amber",
  panelCount = 6,
}: {
  accent?: "amber" | "blue";
  panelCount?: number;
}) {
  const ringClass = accent === "blue" ? "ring-blue-500/15" : "ring-amber-500/15";

  return (
    <div className="grid animate-in fade-in gap-8 duration-300 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-8">
        <BtcExperimentHeroSkeleton ringClass={ringClass} />
        {Array.from({ length: panelCount }).map((_, i) => (
          <BtcExperimentPanelSkeleton
            key={i}
            height={PANEL_HEIGHTS[i % PANEL_HEIGHTS.length]}
            rows={i % 3 === 1 ? 4 : 0}
          />
        ))}
        <div className="xl:hidden">
          <BtcExperimentSidebarSkeleton />
        </div>
      </div>
      <div className="hidden xl:block">
        <div className="sticky top-6">
          <BtcExperimentSidebarSkeleton />
        </div>
      </div>
    </div>
  );
}

export function BtcQuantExperimentStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn(overviewCardShell, "space-y-3 rounded-2xl p-4")}>
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-4 w-4 rounded-md" />
          </div>
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function BtcQuantStrategyCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(overviewCardShell, "space-y-3 rounded-2xl p-4")}>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
            <Skeleton className="h-5 w-10 shrink-0 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-[80%] rounded-md" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BtcQuantLeaderboardSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(overviewCardShell, "flex items-center gap-4 rounded-2xl px-4 py-3.5")}
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function BtcQuantTradeFeedSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(overviewCardShell, "flex items-center gap-3 rounded-2xl px-4 py-3.5")}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
          <Skeleton className="h-5 w-14 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function BtcQuantBalancePanelSkeleton() {
  return (
    <article className={cn(overviewCardShell, "overflow-hidden rounded-2xl")}>
      <div className="border-b border-border/45 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-3">
            <Skeleton className="h-3 w-40 rounded-md" />
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-14 w-24 rounded-xl" />
            <Skeleton className="h-14 w-24 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 sm:px-7 sm:py-5">
        <Skeleton className="h-[220px] rounded-2xl sm:h-[240px]" />
      </div>
    </article>
  );
}
