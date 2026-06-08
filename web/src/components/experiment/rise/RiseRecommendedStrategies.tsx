import { ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RISE_EXIT_STRATEGIES,
  RISE_PERSONALITIES,
  entrySolForPersonality,
} from "@/lib/riseExperimentModel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

const BEGINNER_PICKS = [
  { p: 1, e: 0, label: "Best for beginners", reason: "Only verified tokens — takes profit at 2×" },
  { p: 4, e: 2, label: "Balanced", reason: "Momentum plays with scaled exits at 1.5× and 3×" },
  { p: 6, e: 4, label: "Conservative", reason: "Established tokens with trailing stop protection" },
] as const;

export interface RiseRecommendedStrategiesProps {
  selectedPersonalityId: number;
  selectedExitId: number;
  onSelect: (personalityId: number, exitId: number) => void;
  className?: string;
}

export function RiseRecommendedStrategies({
  selectedPersonalityId,
  selectedExitId,
  onSelect,
  className,
}: RiseRecommendedStrategiesProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(overviewCardShell, "flex gap-4 rounded-2xl p-4 sm:p-5")}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">Recommended starting points</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            These combos balance quality filters with sensible exits. Tap one to follow it in Live results.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {BEGINNER_PICKS.map(({ p, e, label, reason }) => {
          const buy = RISE_PERSONALITIES[p];
          const sell = RISE_EXIT_STRATEGIES[e];
          const active = selectedPersonalityId === p && selectedExitId === e;

          return (
            <button
              key={`${p}-${e}`}
              type="button"
              onClick={() => onSelect(p, e)}
              className={cn(
                overviewCardShell,
                "flex flex-col gap-3 rounded-2xl p-4 text-left transition-all duration-200",
                "hover:-translate-y-px hover:border-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "border-sky-500/40 ring-1 ring-sky-500/25",
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="rounded-md border-sky-500/35 bg-sky-500/10 px-1.5 py-0 text-[10px] font-semibold uppercase text-sky-700 dark:text-sky-300"
                >
                  {label}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {entrySolForPersonality(p)} SOL per trade
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{buy?.name}</p>
              <p className="text-xs text-muted-foreground">Sells with: {sell?.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{reason}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Want more risk? Try sniper agents below, or browse all 64 combos in Live results.</span>
      </div>
    </div>
  );
}
