import { Skeleton } from "@/components/ui/skeleton";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

const widgetShellClass = cn(
  "overflow-hidden rounded-[22px] border border-border/45",
  "bg-gradient-to-b from-card via-card to-muted/[0.12]",
  "shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset,0_24px_48px_-28px_rgba(0,0,0,0.65)]",
);

/** Route Suspense fallback matching live `/bridge` layout. */
export function BridgePageSkeleton() {
  return (
    <div
      className="relative flex min-h-full flex-col animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading bridge"
      role="status"
    >
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative z-[1] flex flex-1 flex-col",
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
        )}
      >
        <div className="mb-6 max-w-2xl space-y-2 sm:mb-8">
          <Skeleton className="h-8 w-44 max-w-full sm:h-9" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <div className="flex w-full flex-1 justify-center lg:justify-start">
          <div className={cn(widgetShellClass, "w-full max-w-md p-4 sm:p-5")}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="mx-auto h-10 w-10 rounded-xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
