import { useLocation } from "react-router-dom";
import { ArticlesPageSkeleton } from "@/components/marketing/ArticlesSkeleton";
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
import {
  InternalAgentDetailSkeleton,
  InternalMonitorPageSkeleton,
} from "@/components/internal/InternalPageSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

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
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </header>
      <section className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Skeleton className="h-12 w-40 sm:h-14 sm:w-48" />
          <Skeleton className="h-7 w-20 sm:h-8" />
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-border/30 pt-6 sm:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3 border-t border-border/30 pt-6">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-[280px] w-full rounded-[1.25rem] sm:h-[340px]" />
      </section>
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
      className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 animate-in fade-in duration-300 sm:px-6"
      aria-busy="true"
      aria-label="Loading rewards"
      role="status"
    >
      <div className="space-y-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <RewardsStatsSkeleton />
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "space-y-2 p-4")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20 shrink-0 rounded-md" />
          </div>
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
      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-white/10" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-56 max-w-full bg-white/10" />
                <Skeleton className="h-3 w-24 bg-white/10" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
              <Skeleton className="h-4 w-12 bg-white/10" />
              <Skeleton className="h-4 w-12 bg-white/10" />
              <Skeleton className="h-7 w-7 rounded-md bg-white/10" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  if (root === "articles") return <ArticlesPageSkeleton />;
  if (root === "marketplace" || root === "playground") return <PlaygroundCatalogPageSkeleton />;
  if (root === "rewards") return <RewardsPageSkeleton />;
  if (root === "staking") return <StreamflowPageSkeleton />;
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
  if (root === "internal" && parts[1] === "wallets") return <InternalTableSkeleton />;
  if (root === "internal" && parts[1]) return <InternalAgentDetailSkeleton />;
  if (root === "internal") return <InternalMonitorPageSkeleton />;
  if (root === "lp-experiment" && parts[1] === "agent") return <ProfileDetailSkeleton />;
  if (root === "lp-experiment") return <ExperimentPageSkeleton accent="neutral" panelCount={3} />;
  if (root === "lp-robinhood") return <ExperimentPageSkeleton accent="amber" panelCount={3} />;
  if (root === "btc-experiment" || root === "btc2-experiment" || root === "btc3-experiment") {
    return <ExperimentPageSkeleton accent="amber" panelCount={3} />;
  }
  if (
    root === "stocks" ||
    root === "momentum-rotator" ||
    root === "lst-loop" ||
    root === "alpha-sniper" ||
    root === "scalper" ||
    root === "mm"
  ) {
    return <ExperimentPageSkeleton accent="neutral" panelCount={2} />;
  }
  if (root === "multiwallet") return <AgentSetupPageSkeleton />;
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
  return root === "marketplace" || root === "playground";
}

/**
 * Suspense fallback for lazy route chunks.
 * Keeps shell chrome visible; shows a path-matched content skeleton.
 */
export function RouteFallback() {
  const { pathname, search } = useLocation();
  const selfPadded = pathUsesSelfPaddedSkeleton(pathname);
  return (
    <div
      className={cn("w-full flex-1", !selfPadded && "py-4 sm:py-6")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {skeletonForPath(pathname, search)}
    </div>
  );
}
