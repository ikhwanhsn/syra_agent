import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { intelligencePanelShell } from "@/components/assets/intelligence/intelligenceStyles";

function IntelligencePanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(intelligencePanelShell, className)}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="space-y-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-3 w-44 rounded-md" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IntelligenceSignalSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn(intelligencePanelShell, className)}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <Skeleton className="h-6 w-12 shrink-0 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-3">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function IntelligenceListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <Card className={cn(overviewCardShell, className)}>
      <CardHeader className="pb-3">
        <Skeleton className="mb-2 h-5 w-20 rounded-md" />
        <Skeleton className="h-3 w-48 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-full max-w-md rounded-md" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AssetIntelligenceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 animate-in fade-in duration-300", className)}>
      <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
        <IntelligencePanelSkeleton />
        <IntelligenceSignalSkeleton />
      </div>
      <IntelligenceListSkeleton rows={4} />
      <IntelligenceListSkeleton rows={3} />
    </div>
  );
}
