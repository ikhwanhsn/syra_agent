import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import {
  MM_STRATEGY_LABELS,
  formatMmUsd,
  type MmLearningSnapshot,
  type MmStrategyId,
} from "@/lib/mmApi";

interface MmLearningPanelProps {
  learning: MmLearningSnapshot | null | undefined;
  loading?: boolean;
  className?: string;
}

export function MmLearningPanel({ learning, loading = false, className }: MmLearningPanelProps) {
  const lessons = learning?.lessons ?? [];
  const strategyStats = learning?.strategyStats ?? {};
  const strategyEntries = Object.entries(strategyStats) as Array<
    [MmStrategyId, (typeof strategyStats)[string]]
  >;
  const hasOverrides =
    learning?.baseConfig &&
    learning?.effectiveConfig &&
    JSON.stringify(learning.baseConfig) !== JSON.stringify(learning.effectiveConfig);
  const hasContent =
    lessons.length > 0 ||
    learning?.lastEvolutionSummary ||
    strategyEntries.length > 0 ||
    hasOverrides ||
    (learning?.strategyCooldowns?.length ?? 0) > 0;

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
          Maximizes volume while keeping PnL ≥ 0 · tunes spread, size, and grid daily.
        </p>
      </div>

      {learning?.promotedStrategyId ? (
        <p className="mt-3 text-sm">
          Promoted strategy:{" "}
          <span className="font-medium text-violet-400">
            {MM_STRATEGY_LABELS[learning.promotedStrategyId]}
          </span>
        </p>
      ) : null}

      {learning?.lastEvolutionSummary ? (
        <p className="mt-4 text-sm text-muted-foreground">{learning.lastEvolutionSummary}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {learning?.lastEvolutionAt ? (
          <span>Last evolution: {new Date(learning.lastEvolutionAt).toLocaleString()}</span>
        ) : null}
        {(learning?.runsAnalyzed ?? 0) > 0 ? (
          <span>{learning?.runsAnalyzed} round trips analyzed</span>
        ) : null}
      </div>

      {hasOverrides && learning?.effectiveConfig ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-background/35 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active overrides
          </p>
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <span>Spread: {learning.effectiveConfig.spreadBps} bps</span>
            <span>Order size: {formatMmUsd(learning.effectiveConfig.orderSizeUsd)}</span>
            <span>Grid levels: {learning.effectiveConfig.gridLevels}</span>
            <span>Max inventory: {formatMmUsd(learning.effectiveConfig.maxInventoryUsd)}</span>
            <span>Edge buffer: {learning.effectiveConfig.minEdgeBufferPct.toFixed(2)}%</span>
            <span>Deploy slice: {(learning.effectiveConfig.deploySlicePct * 100).toFixed(0)}%</span>
          </div>
        </div>
      ) : null}

      {strategyEntries.length > 0 ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-background/35 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Strategy performance
          </p>
          <div className="space-y-2">
            {strategyEntries.map(([id, stat]) => (
              <div key={id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground/90">{MM_STRATEGY_LABELS[id] ?? id}</span>
                <span className="text-xs text-muted-foreground">
                  Vol {formatMmUsd(stat.volumeUsd)} · PnL {formatMmUsd(stat.pnlUsd)} ·{" "}
                  {stat.roundTrips} trips
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
