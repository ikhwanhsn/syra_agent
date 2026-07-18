import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

function ListRowSkeleton({ variant = "list" }: { variant?: "list" | "leaderboard" }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/30 py-4 last:border-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {variant === "leaderboard" ? <Skeleton className="h-8 w-8 shrink-0 rounded-lg" /> : null}
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48 max-w-[70%]" />
          <Skeleton className="h-2.5 w-32 max-w-[50%]" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export interface PumpfunListPanelSkeletonProps {
  rows?: number;
  variant?: "list" | "leaderboard";
  className?: string;
}

export function PumpfunListPanelSkeleton({
  rows = 10,
  variant = "list",
  className,
}: PumpfunListPanelSkeletonProps) {
  return (
    <Card className={cn(overviewCardShell, "animate-in fade-in duration-300", className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {variant === "leaderboard" ? (
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
            ) : null}
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md sm:w-[160px]" />
        </div>

        <div>
          {Array.from({ length: rows }).map((_, i) => (
            <ListRowSkeleton key={i} variant={variant} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
