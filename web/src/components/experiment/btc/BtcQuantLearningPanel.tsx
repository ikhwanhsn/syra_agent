import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import type { BtcQuantLearningSnapshot } from "@/lib/btcQuantApi";

interface BtcQuantLearningPanelProps {
  learning: BtcQuantLearningSnapshot | null | undefined;
  loading?: boolean;
  className?: string;
}

export function BtcQuantLearningPanel({
  learning,
  loading = false,
  className,
}: BtcQuantLearningPanelProps) {
  const lessons = learning?.lessons ?? [];
  const hasContent =
    lessons.length > 0 ||
    learning?.lastEvolutionSummary ||
    (learning?.overrideCount ?? 0) > 0;

  if (loading && !learning) {
    return (
      <div className={cn(overviewCardShell, "animate-pulse rounded-2xl p-6", className)}>
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-4 h-16 rounded bg-muted/60" />
      </div>
    );
  }

  if (!hasContent) return null;

  return (
    <section className={cn(overviewCardShell, "rounded-2xl p-5 sm:p-6", className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Agent learning</h3>
        <p className="text-xs text-muted-foreground">
          Lessons from closed trades and evolved strategy parameters.
        </p>
      </div>

      {learning?.lastEvolutionSummary ? (
        <p className="mt-4 text-sm text-muted-foreground">{learning.lastEvolutionSummary}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {learning?.lastEvolutionAt ? (
          <span>Last evolution: {new Date(learning.lastEvolutionAt).toLocaleString()}</span>
        ) : null}
        {(learning?.overrideCount ?? 0) > 0 ? (
          <span>{learning?.overrideCount} evolved strategies</span>
        ) : null}
        {(learning?.strategyCooldowns?.length ?? 0) > 0 ? (
          <span>{learning?.strategyCooldowns?.length} on cooldown</span>
        ) : null}
      </div>

      {lessons.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-background/35 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lessons
          </p>
          <ul className="space-y-2 text-sm text-foreground/90">
            {lessons.slice(0, 5).map((lesson) => (
              <li key={lesson} className="leading-snug">
                {lesson}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
