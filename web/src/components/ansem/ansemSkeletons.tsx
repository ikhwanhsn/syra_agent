import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

export function AnsemSectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-56 max-w-full sm:h-8 sm:w-72" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

export function AnsemTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border/40 bg-background/30 p-4", className)}>
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export function AnsemTileGridSkeleton({
  count = 4,
  className,
  tileClassName,
}: {
  count?: number;
  className?: string;
  tileClassName?: string;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <AnsemTileSkeleton key={i} className={tileClassName} />
      ))}
    </div>
  );
}

export function AnsemListRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/40 bg-background/20 p-3 sm:p-4",
        className,
      )}
    >
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-36 max-w-full" />
        <Skeleton className="h-3 w-full max-w-md" />
        <Skeleton className="h-3 w-2/3 max-w-xs" />
      </div>
      <Skeleton className="hidden h-8 w-14 shrink-0 sm:block" />
    </div>
  );
}

export function AnsemSectionCardSkeleton({
  header = true,
  tiles = 4,
  rows = 3,
  className,
}: {
  header?: boolean;
  tiles?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {header ? <AnsemSectionHeaderSkeleton /> : null}
      <div className={cn(overviewCardShell, "space-y-5 p-5 sm:p-6")}>
        {tiles > 0 ? <AnsemTileGridSkeleton count={tiles} /> : null}
        {rows > 0 ? (
          <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
              <AnsemListRowSkeleton key={i} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AnsemStatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(overviewCardShell, "p-4 sm:p-5", className)}>
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
