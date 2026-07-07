import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import {
  SCALPER_SOURCE_LABELS,
  type ScalperLearningSnapshot,
  type ScalperOpportunitySource,
} from "@/lib/scalperApi";

interface ScalperLearningPanelProps {
  learning: ScalperLearningSnapshot | null | undefined;
  loading?: boolean;
  className?: string;
}

function formatWinRate(winRate: number | undefined): string {
  if (winRate == null || !Number.isFinite(winRate)) return "—";
  return `${Math.round(winRate * 100)}%`;
}

export function ScalperLearningPanel({
  learning,
  loading = false,
  className,
}: ScalperLearningPanelProps) {
  const lessons = learning?.lessons ?? [];
  const sourceStats = learning?.sourceStats ?? {};
  const sourceEntries = Object.entries(sourceStats) as Array<
    [ScalperOpportunitySource, (typeof sourceStats)[string]]
  >;
  const hasOverrides =
    learning?.baseConfig &&
    learning?.effectiveConfig &&
    JSON.stringify(learning.baseConfig) !== JSON.stringify(learning.effectiveConfig);
  const hasContent =
    lessons.length > 0 ||
    learning?.lastEvolutionSummary ||
    sourceEntries.length > 0 ||
    hasOverrides ||
    (learning?.sourceCooldowns?.length ?? 0) > 0 ||
    (learning?.symbolCooldowns?.length ?? 0) > 0;

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
          Lessons from closed scalps — adaptive thresholds, source weights, and cooldowns.
        </p>
      </div>

      {learning?.lastEvolutionSummary ? (
        <p className="mt-4 text-sm text-muted-foreground">{learning.lastEvolutionSummary}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {learning?.lastEvolutionAt ? (
          <span>Last evolution: {new Date(learning.lastEvolutionAt).toLocaleString()}</span>
        ) : null}
        {(learning?.runsAnalyzed ?? 0) > 0 ? (
          <span>{learning?.runsAnalyzed} trades analyzed</span>
        ) : null}
        {(learning?.sourceCooldowns?.length ?? 0) > 0 ? (
          <span>{learning?.sourceCooldowns?.length} source cooldowns</span>
        ) : null}
        {(learning?.symbolCooldowns?.length ?? 0) > 0 ? (
          <span>{learning?.symbolCooldowns?.length} symbol cooldowns</span>
        ) : null}
      </div>

      {hasOverrides && learning?.effectiveConfig ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-background/35 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active overrides
          </p>
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <span>Min score: {learning.effectiveConfig.minOpportunityScore.toFixed(2)}</span>
            <span>TP: {learning.effectiveConfig.takeProfitPct.toFixed(2)}%</span>
            <span>SL: {learning.effectiveConfig.stopLossPct.toFixed(2)}%</span>
            <span>Max hold: {learning.effectiveConfig.maxHoldMinutes}m</span>
            <span>Size cap: {(learning.effectiveConfig.notionalSlicePct * 100).toFixed(0)}%</span>
            <span>Edge buffer: {learning.effectiveConfig.minEdgeBufferPct.toFixed(2)}%</span>
          </div>
        </div>
      ) : null}

      {sourceEntries.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-background/35 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Source performance
          </p>
          <div className="space-y-2">
            {sourceEntries.map(([source, stat]) => (
              <div
                key={source}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium text-foreground/90">
                  {SCALPER_SOURCE_LABELS[source] ?? source}
                </span>
                <span className="text-xs text-muted-foreground">
                  WR {formatWinRate(stat.winRate)} · {stat.decided} trades · ×
                  {stat.scoreMultiplier?.toFixed(2) ?? "1.00"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
