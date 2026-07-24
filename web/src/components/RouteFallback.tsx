import { useLocation } from "react-router-dom";
import { ArticlesPageSkeleton } from "@/components/marketing/ArticlesSkeleton";
import { AssetsTableSkeleton } from "@/components/assets/AssetsTableSkeleton";
import { AssetDetailSkeleton } from "@/components/assets/AssetDetailSkeleton";
import { EarnPageSkeleton } from "@/components/earn/EarnSkeleton";
import { OrganizeSummarySkeleton, OrganizeTableSkeleton } from "@/components/organize/OrganizeSkeleton";
import {
  GrowAnalysisSkeleton,
  InvestPageSkeleton,
  SpendPageSkeleton,
} from "@/components/pillars/PillarPageSkeletons";
import { PlaygroundCatalogSkeleton } from "@/components/playground/PlaygroundCatalogSkeleton";
import { PumpfunAnalysisSkeleton } from "@/components/pumpfun/PumpfunAnalysisSkeleton";
import { TreasuryPanelSkeleton } from "@/components/treasury/TreasurySkeleton";
import { BtcAgentExperimentPageSkeleton } from "@/components/experiment/btc/BtcExperimentSkeletons";
import { EndpointsGridSkeleton } from "@/components/labs/LabsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

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

export function LpPoolsContentSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-2xl space-y-4 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading pools"
      role="status"
    >
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function EarnTokenDetailSkeleton() {
  return (
    <div
      className="space-y-10 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading token"
      role="status"
    >
      <header className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <div className="flex min-w-0 items-start gap-5 sm:gap-6">
          <Skeleton className="h-20 w-20 shrink-0 rounded-[1.25rem] sm:h-24 sm:w-24" />
          <div className="min-w-0 space-y-2 pt-0.5">
            <Skeleton className="h-9 w-48 max-w-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "p-4")}>
            <Skeleton className="h-3 w-14" />
            <Skeleton className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[280px] w-full rounded-[1.35rem]" />
    </div>
  );
}

export function RewardsStatsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading rewards">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
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
      className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 animate-in fade-in duration-300 sm:px-6"
      aria-busy="true"
      aria-label="Loading rewards"
      role="status"
    >
      <RewardsStatsSkeleton />
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function StreamflowPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 animate-in fade-in duration-300 sm:px-6"
      aria-busy="true"
      aria-label="Loading staking"
      role="status"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function InternalTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="space-y-4 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading"
      role="status"
    >
      <Skeleton className="h-10 w-full max-w-sm rounded-full" />
      <div className={cn(overviewCardShell, "space-y-2 p-4")}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
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

export function PostStudioSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading ship log"
      role="status"
    >
      <Skeleton className="h-24 w-full rounded-xl bg-white/10" />
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Skeleton className="h-32 w-full rounded-xl bg-white/10" />
        <Skeleton className="h-32 w-full rounded-xl bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-2xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}

function skeletonForPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const root = parts[0] ?? "";

  if (root === "earn" && parts[1] === "token") return <EarnTokenDetailSkeleton />;
  if (root === "earn") return <EarnPageSkeleton />;
  if (root === "invest") return <InvestPageSkeleton />;
  if (root === "spend") return <SpendPageSkeleton />;
  if (root === "grow") return <GrowAnalysisSkeleton />;
  if (root === "treasury") return <TreasuryPanelSkeleton />;
  if (root === "assets" && parts[1]) return <AssetDetailSkeleton />;
  if (root === "assets") return <AssetsTableSkeleton />;
  if (root === "analyzer" && parts[1] === "call") return <PumpfunAnalysisSkeleton />;
  if (root === "analyzer" || root === "pumpfun") return <PumpfunAnalysisSkeleton />;
  if (root === "lp") return <LpPoolsContentSkeleton />;
  if (root === "articles") return <ArticlesPageSkeleton />;
  if (root === "marketplace" || root === "playground") return <PlaygroundCatalogSkeleton />;
  if (root === "rewards") return <RewardsPageSkeleton />;
  if (root === "staking") return <StreamflowPageSkeleton />;
  if (root === "organize") {
    return (
      <div className="space-y-6">
        <OrganizeSummarySkeleton />
        <OrganizeTableSkeleton />
      </div>
    );
  }
  if (root === "labs" || root === "llm") return <EndpointsGridSkeleton />;
  if (root === "internal" && parts[1] === "wallets") return <InternalTableSkeleton />;
  if (root === "internal" && parts[1]) return <ProfileDetailSkeleton />;
  if (root === "internal") return <InternalTableSkeleton />;
  if (root === "lp-experiment" && parts[1] === "agent") return <ProfileDetailSkeleton />;
  if (
    root === "btc-experiment" ||
    root === "btc2-experiment" ||
    root === "btc3-experiment"
  ) {
    return <BtcAgentExperimentPageSkeleton />;
  }
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

/**
 * Suspense fallback for lazy route chunks.
 * Keeps shell chrome visible; shows a path-matched content skeleton.
 */
export function RouteFallback() {
  const { pathname } = useLocation();
  return (
    <div className="w-full flex-1 py-4 sm:py-6" role="status" aria-live="polite" aria-busy="true">
      {skeletonForPath(pathname)}
    </div>
  );
}
