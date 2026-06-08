import { ChevronRight, Medal, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface LeaderboardRow {
  key: string;
  rank: number;
  label: string;
  equityLabel: string;
  retPct: number;
  openCount: number;
  badge?: { text: string; className: string } | null;
  selected?: boolean;
}

export interface ExperimentLeaderboardListProps {
  rows: LeaderboardRow[];
  emptyMessage: string;
  accentRingClass?: string;
  onSelect: (key: string) => void;
  className?: string;
}

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function rankIcon(rank: number) {
  if (rank === 1) return <Medal className="h-4 w-4 text-amber-500" aria-hidden />;
  return (
    <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
      {rank}
    </span>
  );
}

export function ExperimentLeaderboardList({
  rows,
  emptyMessage,
  accentRingClass = "ring-violet-500/30 border-violet-500/35",
  onSelect,
  className,
}: ExperimentLeaderboardListProps) {
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          overviewCardShell,
          "rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {rows.map((row) => {
        const positive = row.retPct > 0;
        const negative = row.retPct < 0;

        return (
          <li key={row.key}>
            <button
              type="button"
              onClick={() => onSelect(row.key)}
              className={cn(
                overviewCardShell,
                "flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200",
                "hover:-translate-y-px hover:border-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                row.selected && cn("ring-1", accentRingClass),
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/30">
                {rankIcon(row.rank)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {row.label}
                  </p>
                  {row.badge ? (
                    <Badge
                      variant="outline"
                      className={cn("rounded-md px-1.5 py-0 text-[10px] font-semibold uppercase", row.badge.className)}
                    >
                      {row.badge.text}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.equityLabel} · {row.openCount} open
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right">
                  <p
                    className={cn(
                      "flex items-center justify-end gap-1 font-mono text-sm font-semibold tabular-nums",
                      positive && "text-emerald-600 dark:text-emerald-400",
                      negative && "text-red-600 dark:text-red-400",
                      !positive && !negative && "text-muted-foreground",
                    )}
                  >
                    {positive ? (
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    ) : negative ? (
                      <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                    ) : null}
                    {formatPct(row.retPct)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
