import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { BtcExperimentHeroSkeleton } from "@/components/experiment/btc/BtcExperimentSkeletons";
import { cn } from "@/lib/utils";

/** Suspense shell matching ExperimentTabShell: hero + 3 tabs + active panel. */
export function ExperimentPageSkeleton({
  accent = "amber",
  panelCount = 2,
}: {
  accent?: "amber" | "blue" | "neutral";
  panelCount?: number;
} = {}) {
  const ringClass =
    accent === "blue"
      ? "ring-blue-500/15"
      : accent === "neutral"
        ? "ring-border/40"
        : "ring-amber-500/15";

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading experiment"
      role="status"
    >
      <BtcExperimentHeroSkeleton ringClass={ringClass} />

      <div
        className={cn(
          "grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5",
        )}
        aria-hidden
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="hidden h-2.5 w-24 sm:block" />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {Array.from({ length: panelCount }).map((_, i) => (
          <section key={i} className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-52 max-w-full" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <div className={cn(overviewCardShell, "rounded-2xl p-5 sm:p-6")}>
              <Skeleton className={cn("w-full rounded-xl", i === 0 ? "h-56" : "h-48")} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
