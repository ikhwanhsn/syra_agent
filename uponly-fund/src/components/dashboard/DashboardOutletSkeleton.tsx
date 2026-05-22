import { matchPath, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

/** Eyebrow + title lines aligned with `DashboardPageHeader` (emphasis default). */
function SkeletonDefaultHeader() {
  return (
    <div className="mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-7 w-[min(100%,11rem)] rounded-full" aria-hidden />
        <Skeleton className="h-8 max-w-[min(100%,20rem)] rounded-lg sm:h-9" aria-hidden />
        <Skeleton className="h-4 max-w-[min(100%,42rem)] rounded-md" aria-hidden />
        <Skeleton className="hidden h-4 max-w-[min(100%,32rem)] rounded-md sm:block" aria-hidden />
      </div>
    </div>
  );
}

/** Larger title stack ~ `DashboardPageHeader` emphasis=&quot;hero&quot;. */
function SkeletonHeroHeader() {
  return (
    <div className="mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-7 w-[min(100%,14rem)] rounded-full" aria-hidden />
        <Skeleton className="h-10 max-w-[min(100%,22rem)] rounded-lg sm:h-11" aria-hidden />
        <Skeleton className="h-4 max-w-[min(100%,44rem)] rounded-md" aria-hidden />
        <Skeleton className="h-4 max-w-[min(100%,36rem)] rounded-md" aria-hidden />
      </div>
    </div>
  );
}

/** Tabs strip matching Markets / Simulator / Insights `TabsList` chrome. */
function SkeletonTabsRow({ pills }: { pills: number }) {
  return (
    <div
      className="flex h-auto w-full flex-wrap gap-1 rounded-xl border border-border/50 bg-card/50 p-1"
      aria-hidden
    >
      {Array.from({ length: pills }).map((_, i) => (
        <Skeleton key={i} className="h-9 min-w-[5.5rem] flex-1 rounded-lg sm:h-10 sm:min-w-[6rem]" />
      ))}
    </div>
  );
}

function TerminalPageSkeleton() {
  return (
    <div className="relative flex flex-col gap-6 overflow-x-clip lg:gap-8" aria-busy aria-label="Loading">
      <SkeletonHeroHeader />
      <section className="rounded-2xl border border-border/40 bg-card/25 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-3">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-7 w-[min(100%,10rem)] rounded-full" />
        </div>
        <div className="grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="min-h-[5.75rem] w-full rounded-xl" />
          ))}
        </div>
      </section>
      <Skeleton className="min-h-[min(70vh,36rem)] w-full rounded-2xl" />
      <div className="grid w-full min-w-0 gap-5 md:grid-cols-2 md:items-stretch lg:gap-6">
        <Skeleton className="min-h-[18rem] w-full rounded-2xl md:min-h-[20rem]" />
        <Skeleton className="min-h-[18rem] w-full rounded-2xl md:min-h-[20rem]" />
      </div>
    </div>
  );
}

function TrendingPageSkeleton() {
  return (
    <div className="relative flex flex-col gap-8 overflow-x-clip" aria-busy aria-label="Loading">
      <SkeletonDefaultHeader />
      {/* RiseTrendingMarkets rails + table region */}
      <div className="space-y-4">
        <div className="-mx-1 flex gap-3 overflow-hidden px-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[8.5rem] w-[16rem] shrink-0 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="min-h-[14rem] w-full rounded-2xl sm:min-h-[16rem]" />
      </div>
      <Skeleton className="aspect-[4/5] w-full rounded-2xl sm:aspect-video" />
    </div>
  );
}

function MarketPageSkeleton() {
  return (
    <div className="relative flex flex-col gap-8" aria-busy aria-label="Loading">
      <SkeletonDefaultHeader />
      <div className="w-full space-y-4">
        <SkeletonTabsRow pills={4} />
        <Skeleton className="min-h-[min(75vh,40rem)] w-full rounded-2xl" />
      </div>
    </div>
  );
}

function WalletPageSkeleton() {
  return (
    <div className="relative flex flex-col gap-8" aria-busy aria-label="Loading">
      <SkeletonDefaultHeader />
      <Skeleton className="min-h-[min(70vh,36rem)] w-full rounded-2xl" />
    </div>
  );
}

function TabsHeavyPageSkeleton({ tabPills }: { tabPills: number }) {
  return (
    <div className="relative flex flex-col gap-8" aria-busy aria-label="Loading">
      <SkeletonDefaultHeader />
      <div className="w-full space-y-4">
        <SkeletonTabsRow pills={tabPills} />
        <Skeleton className="min-h-[min(72vh,38rem)] w-full rounded-2xl" />
      </div>
    </div>
  );
}

function TokenDetailSkeleton() {
  return (
    <div className="relative flex flex-col gap-6" aria-busy aria-label="Loading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-9 max-w-xs rounded-lg sm:h-10" />
          <Skeleton className="h-4 max-w-2xl rounded-md" />
        </div>
        <Skeleton className="h-9 w-[min(100%,7rem)] shrink-0 rounded-xl sm:self-start" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl sm:h-44" />
      <Skeleton className="h-12 w-full max-w-3xl rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <Skeleton className="min-h-[28rem] rounded-2xl lg:col-span-2" />
        <Skeleton className="min-h-[18rem] rounded-2xl lg:min-h-[28rem]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="min-h-[6rem] rounded-xl" />
        ))}
      </div>
      <Skeleton className="min-h-[14rem] w-full rounded-2xl" />
    </div>
  );
}

function GenericDashboardSkeleton() {
  return (
    <div className="relative flex flex-col gap-8" aria-busy aria-label="Loading">
      <SkeletonDefaultHeader />
      <Skeleton className="min-h-[min(70vh,34rem)] w-full rounded-2xl" />
    </div>
  );
}

/**
 * Shown while lazy dashboard routes load. Matches real page shells so layout does not jump.
 * Must render under `BrowserRouter` (uses `useLocation`).
 */
export function DashboardOutletSkeleton() {
  const { pathname } = useLocation();

  if (matchPath("/token/:address", pathname)) {
    return <TokenDetailSkeleton />;
  }
  if (pathname === "/terminal") {
    return <TerminalPageSkeleton />;
  }
  if (pathname === "/overview") {
    return <TrendingPageSkeleton />;
  }
  if (pathname === "/market") {
    return <MarketPageSkeleton />;
  }
  if (pathname === "/wallet") {
    return <WalletPageSkeleton />;
  }
  if (pathname === "/simulator") {
    return <TabsHeavyPageSkeleton tabPills={3} />;
  }
  if (pathname === "/insights") {
    return <TabsHeavyPageSkeleton tabPills={4} />;
  }

  return <GenericDashboardSkeleton />;
}

/** Landing (`/landing`) lazy boundary — full-width marketing shell. */
export function LandingRouteFallback() {
  return (
    <div className="min-h-dvh bg-background" aria-busy aria-label="Loading">
      <div className="border-b border-border/40 px-4 py-3 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Skeleton className="h-9 w-36 rounded-lg sm:w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-14">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-full max-w-3xl rounded-xl" />
          <Skeleton className="mx-auto h-5 w-full max-w-xl rounded-md" />
          <Skeleton className="mx-auto h-5 w-full max-w-lg rounded-md" />
        </div>
        <Skeleton className="h-[min(52vh,440px)] w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="min-h-[12rem] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 404 lazy boundary — centered card proportions ~ real NotFound page. */
export function NotFoundRouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" aria-busy aria-label="Loading">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Skeleton className="h-14 w-28 rounded-xl" />
        <Skeleton className="h-7 w-full max-w-[16rem] rounded-md" />
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>
    </div>
  );
}
