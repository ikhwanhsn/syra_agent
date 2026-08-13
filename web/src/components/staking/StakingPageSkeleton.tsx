import {
  stakingActionPanel,
  stakingCardBody,
} from "@/components/staking/stakingStyles";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

function StakingHeroSkeleton() {
  return (
    <header className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-2xl sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-48 max-w-full sm:h-9" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
    </header>
  );
}

function StakingStatsSkeleton() {
  return (
    <div className="glass-card rounded-2xl border border-foreground/[0.08]">
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border/45">
        {[0, 1].map((group) => (
          <div
            key={group}
            className={cn(
              "p-5 sm:p-6",
              group === 0 && "border-b border-border/45 lg:border-b-0",
            )}
          >
            <Skeleton className="mb-4 h-3 w-16" />
            <div className="grid grid-cols-2 gap-5 sm:gap-6">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-7 w-28 sm:h-8" />
                  <Skeleton className="h-3 w-32 max-w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LockFormSkeleton() {
  return (
    <section className={stakingActionPanel}>
      <div className={cn(stakingCardBody, "flex flex-col")}>
        <div className="mb-5 space-y-2 sm:mb-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-28" />
            </div>
            <Skeleton className="h-14 w-full rounded-xl sm:h-16" />
          </div>
          <div className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-4 sm:p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </section>
  );
}

function PortfolioSkeleton() {
  return (
    <section className={stakingActionPanel}>
      <div className={cn(stakingCardBody, "flex min-w-0 flex-col")}>
        <div className="mb-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl sm:w-56" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-muted/15 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-36 max-w-full" />
                  <Skeleton className="h-3 w-44 max-w-full" />
                </div>
                <Skeleton className="h-9 w-full rounded-md sm:w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border/50 bg-muted/10 p-5"
          >
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[80%]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Route Suspense fallback matching live `/staking` Streamflow layout. */
export function StakingPageSkeleton() {
  return (
    <div
      className={cn(
        DASHBOARD_CONTENT_SHELL,
        PAGE_PADDING_TOP_MEDIUM,
        PAGE_SAFE_AREA_BOTTOM,
        "relative z-[1] min-w-0 max-w-6xl animate-in fade-in duration-300",
      )}
      aria-busy="true"
      aria-label="Loading staking"
      role="status"
    >
      <div className="flex min-w-0 flex-col gap-7 sm:gap-8">
        <StakingHeroSkeleton />
        <StakingStatsSkeleton />
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2 lg:items-start lg:gap-6">
          <LockFormSkeleton />
          <PortfolioSkeleton />
        </div>
        <BenefitsSkeleton />
      </div>
    </div>
  );
}
