import { useLocation } from "react-router-dom";
import { AboutPageSkeleton } from "@/components/about/AboutPageSkeleton";
import { ArticleDetailSkeleton, ArticlesPageSkeleton } from "@/components/marketing/ArticlesSkeleton";
import { LegalPageSkeleton } from "@/components/legal/LegalPageSkeleton";
import { TokenPageSkeleton } from "@/components/token/TokenPageSkeleton";
import { AssetsPageSkeleton } from "@/components/assets/AssetsPageSkeleton";
import { AssetDetailSkeleton } from "@/components/assets/AssetDetailSkeleton";
import {
  EarnPageSkeleton,
  EarnYieldDetailSkeleton,
  type EarnSkeletonTrack,
} from "@/components/earn/EarnSkeleton";
import { OrganizeSummarySkeleton, OrganizeTableSkeleton } from "@/components/organize/OrganizeSkeleton";
import {
  GrowPageSkeleton,
  InvestPageSkeleton,
  SpendPageSkeleton,
} from "@/components/pillars/PillarPageSkeletons";
import { PlaygroundCatalogPageSkeleton } from "@/components/playground/PlaygroundCatalogSkeleton";
import { PumpfunAnalysisSkeleton } from "@/components/pumpfun/PumpfunAnalysisSkeleton";
import {
  PumpfunAnalyzerPageSkeleton,
  type PumpfunAnalyzerSkeletonTab,
} from "@/components/pumpfun/PumpfunAnalyzerPageSkeleton";
import { TreasuryPanelSkeleton } from "@/components/treasury/TreasurySkeleton";
import { ExperimentPageSkeleton } from "@/components/experiment/shared/ExperimentPageSkeleton";
import { LabsPageSkeleton } from "@/components/labs/LabsPageSkeleton";
import { LlmPageSkeleton } from "@/components/llm/LlmPageSkeleton";
import { LpPoolsContentSkeleton } from "@/components/lp/LpPoolsContentSkeleton";
import { OverviewPageSkeleton } from "@/components/dashboard/overview/OverviewPageSkeleton";
import { BtcPageSkeleton } from "@/components/btc/BtcPageSkeleton";
import { AgentSetupPageSkeleton } from "@/components/settings/AgentSetupPageSkeleton";
import { StakingPageSkeleton } from "@/components/staking/StakingPageSkeleton";
import { SwapPageSkeleton } from "@/components/swap/SwapPageSkeleton";
import {
  PostDeckPageSkeleton,
  PostPhotoPageSkeleton,
  PostStudioSkeleton,
} from "@/components/post/PostStudioSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  dashboardFallbackShellClass,
  isDashboardLayoutRoute,
} from "@/lib/dashboardLayoutRoutes";
import {
  growthFallbackShellClass,
  isGrowthContentRoute,
} from "@/lib/growthLayoutRoutes";
import { cn } from "@/lib/utils";

export { StakingPageSkeleton as StreamflowPageSkeleton };
export { SwapPageSkeleton };

export { LpPoolsContentSkeleton };

/** Generic content skeleton when no path-specific match exists. */
export function GenericPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 animate-in fade-in duration-300 sm:px-6"
      aria-busy="true"
      aria-label="Loading page"
      role="status"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "p-4")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function EarnTokenDetailSkeleton() {
  const surface = "rounded-[1.35rem] border border-border/40 bg-card/40";
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading token"
      role="status"
    >
      <header className={cn(surface, "p-5 sm:p-7")}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
            <div className="min-w-0 flex-1 space-y-2.5 pt-0.5">
              <Skeleton className="h-8 w-48 max-w-full sm:h-9" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <Skeleton className="h-11 w-40 rounded-full lg:w-full" />
            <Skeleton className="h-11 w-28 rounded-full lg:w-full" />
          </div>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-8">
        <section className={cn(surface, "order-2 p-3 sm:p-4 lg:order-1")}>
          <div className="mb-3 flex items-center justify-between px-1 sm:mb-4 sm:px-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-[1.1rem] sm:h-[360px]" />
        </section>
        <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:gap-5">
          <section className={cn(surface, "p-5 sm:p-6")}>
            <Skeleton className="h-10 w-36 sm:h-11" />
            <Skeleton className="mt-2 h-4 w-24" />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/30 pt-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </section>
          <section className={cn(surface, "space-y-4 p-5 sm:p-6")}>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-2 border-t border-border/30 pt-4">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-4 w-40" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function RewardsStatsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading rewards">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-0 space-y-2">
            <Skeleton className="h-2.5 w-20 rounded-sm" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-3 w-full max-w-sm" />
      <Skeleton className="h-11 w-36 rounded-xl" />
    </div>
  );
}

export function RewardsPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading rewards"
      role="status"
    >
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-2 p-5")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      <div className={cn(overviewCardShell, "p-6 sm:p-8")}>
        <RewardsStatsSkeleton />
      </div>
    </div>
  );
}

export function ProfileDetailSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading profile"
      role="status"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export { PostStudioSkeleton };

function parseEarnTrack(search: string): EarnSkeletonTrack {
  const track = new URLSearchParams(search).get("track");
  if (track === "token" || track === "prompts" || track === "skills") return track;
  return "yield";
}

function parseAnalyzerTab(search: string): PumpfunAnalyzerSkeletonTab {
  const tab = new URLSearchParams(search).get("tab");
  if (tab === "live" || tab === "history" || tab === "callers") return tab;
  return "scan";
}

function skeletonForPath(pathname: string, search = "") {
  const parts = pathname.split("/").filter(Boolean);
  const root = parts[0] ?? "";

  if (root === "overview") return <OverviewPageSkeleton />;
  if (root === "earn" && parts[1] === "token") return <EarnTokenDetailSkeleton />;
  if (root === "earn" && parts[1] === "yield") return <EarnYieldDetailSkeleton />;
  if (root === "earn") return <EarnPageSkeleton track={parseEarnTrack(search)} />;
  if (root === "invest") return <InvestPageSkeleton />;
  if (root === "spend") return <SpendPageSkeleton />;
  if (root === "grow") return <GrowPageSkeleton />;
  if (root === "treasury") return <TreasuryPanelSkeleton />;
  if (root === "assets" && parts[1]) return <AssetDetailSkeleton />;
  if (root === "assets") return <AssetsPageSkeleton />;
  if (root === "analyzer" && parts[1] === "call") return <PumpfunAnalysisSkeleton />;
  if (root === "analyzer" || root === "pumpfun") {
    return <PumpfunAnalyzerPageSkeleton tab={parseAnalyzerTab(search)} />;
  }
  if (root === "btc") return <BtcPageSkeleton />;
  if (root === "agent-setup") return <AgentSetupPageSkeleton />;
  if (root === "lp") return <LpPoolsContentSkeleton />;
  if (root === "articles" && parts[1]) return <ArticleDetailSkeleton />;
  if (root === "articles") return <ArticlesPageSkeleton />;
  if (root === "about") return <AboutPageSkeleton />;
  if (root === "token") return <TokenPageSkeleton />;
  if (root === "marketplace" || root === "playground") return <PlaygroundCatalogPageSkeleton />;
  if (root === "rewards") return <RewardsPageSkeleton />;
  if (root === "privacy" || root === "terms" || root === "cookies") return <LegalPageSkeleton />;
  if (root === "swap") return <SwapPageSkeleton />;
  if (root === "staking") return <StakingPageSkeleton />;
  if (root === "organize") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading organize">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <OrganizeSummarySkeleton />
        <OrganizeTableSkeleton />
      </div>
    );
  }
  if (root === "labs") return <LabsPageSkeleton />;
  if (root === "llm") return <LlmPageSkeleton />;
  if (root === "lp-experiment" && parts[1] === "agent") return <ProfileDetailSkeleton />;
  if (root === "lp-experiment") return <ExperimentPageSkeleton accent="neutral" panelCount={3} />;
  if (
    root === "stocks" ||
    root === "momentum-rotator" ||
    root === "lst-loop" ||
    root === "alpha-sniper" ||
    root === "meridian"
  ) {
    return <ExperimentPageSkeleton accent="neutral" panelCount={2} />;
  }
  if (root === "multiwallet") return <AgentSetupPageSkeleton />;
  if (root === "post" && parts[1] === "video") return <PostDeckPageSkeleton />;
  if (root === "post" && parts[1] === "photo") return <PostPhotoPageSkeleton />;
  if (root === "post" && parts[1] === "announce") return <PostPhotoPageSkeleton />;
  if (root === "post") return <PostStudioSkeleton />;
  if (
    root === "brand" ||
    root === "identity" ||
    root === "teams" ||
    root === "partner" ||
    root === "analytics" ||
    root === "leaderboard"
  ) {
    return <GenericPageSkeleton />;
  }

  return <GenericPageSkeleton />;
}

function pathUsesSelfPaddedSkeleton(pathname: string) {
  const root = pathname.split("/").filter(Boolean)[0] ?? "";
  return (
    root === "marketplace" ||
    root === "playground" ||
    root === "swap" ||
    root === "staking" ||
    root === "post"
  );
}

/**
 * Suspense fallback for lazy route chunks.
 * Dashboard routes keep the real sidebar mounted and only skeleton the main column.
 * Growth More pages use the same GROWTH_CONTENT_SHELL as the live page.
 */
export function RouteFallback() {
  const { pathname, search } = useLocation();
  const dashboard = isDashboardLayoutRoute(pathname);
  const growth = !dashboard && isGrowthContentRoute(pathname);
  const selfPadded = pathUsesSelfPaddedSkeleton(pathname);
  return (
    <div
      className={cn(
        "w-full flex-1",
        dashboard && dashboardFallbackShellClass(pathname),
        growth && growthFallbackShellClass(),
        !dashboard && !growth && !selfPadded && "py-4 sm:py-6",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {skeletonForPath(pathname, search)}
    </div>
  );
}
