import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  AutoCallSettingsSkeleton,
  CallLogTableSkeleton,
  EndpointsGridSkeleton,
  WalletListSkeleton,
} from "@/components/labs/LabsSkeleton";
import { cn } from "@/lib/utils";

function DepositHubSkeleton() {
  return (
    <div className={cn(overviewCardShell, "space-y-4 p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border/40 p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function VolumeCardSkeleton() {
  return (
    <div className={cn(overviewCardShell, "space-y-3 p-5")}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

/** Full Labs page Suspense shell: header + chain tabs + X402 lab body. */
export function LabsPageSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 pb-12"
      aria-busy="true"
      aria-label="Loading labs"
      role="status"
    >
      <div className="mb-2 space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border/40 bg-muted/30 p-1 w-fit">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <DepositHubSkeleton />
        <WalletListSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <VolumeCardSkeleton />
          <AutoCallSettingsSkeleton />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <EndpointsGridSkeleton />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <CallLogTableSkeleton />
        </div>
      </div>
    </div>
  );
}
