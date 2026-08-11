import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

const thumbClass =
  "relative aspect-video w-full shrink-0 overflow-hidden rounded-t-2xl border-b border-border/40 bg-muted/20";

function ArticleCardSkeleton() {
  return (
    <div
      className={cn(overviewCardShell, "h-full overflow-hidden")}
      aria-hidden
    >
      <Skeleton className={cn(thumbClass, "rounded-none")} />
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
    </div>
  );
}

function FeaturedArticleSkeleton() {
  return (
    <div
      className={cn(overviewCardShell, "overflow-hidden md:grid md:grid-cols-2")}
      aria-hidden
    >
      <Skeleton className={cn(thumbClass, "md:rounded-none md:border-b-0 md:border-r")} />
      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-full max-w-lg" />
        <Skeleton className="h-8 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="mt-2 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
    </div>
  );
}

export function ArticlesPageSkeleton() {
  return (
    <div
      className="animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading articles"
    >
      <div className="mb-10 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-12 w-full max-w-md sm:hidden" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-4/5 max-w-xl" />
      </div>

      <div className="mb-10">
        <Skeleton className="mb-4 h-4 w-28" />
        <FeaturedArticleSkeleton />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Matches ArticlePage: cover + body column + right rail. */
export function ArticleDetailSkeleton() {
  return (
    <div
      className="animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading article"
      role="status"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full max-w-3xl sm:h-12" />
        <Skeleton className="h-10 w-4/5 max-w-2xl sm:hidden" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="mt-6 min-w-0 sm:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start lg:gap-6 xl:gap-8">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-4", i % 3 === 2 ? "w-2/3" : "w-full")} />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <aside className="mt-8 hidden min-w-0 space-y-4 lg:mt-0 lg:block">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
