import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KolScoreBreakdown } from "@/lib/kolApi";
import { cn } from "@/lib/utils";

const METRIC_LABELS: Record<string, string> = {
  like: "Likes",
  reply: "Replies",
  retweet: "Retweets",
  quote: "Quotes",
  view: "Views",
};

const INTEGRITY_FLAG_LABELS: Record<string, string> = {
  high_engagement_to_view_ratio: "High engagement vs views",
  low_engagement_to_view_ratio: "Low engagement vs views",
  engagement_without_views: "Engagement without views",
};

interface ScoreBreakdownTooltipProps {
  score: number;
  breakdown?: KolScoreBreakdown | null;
  className?: string;
}

export function ScoreBreakdownTooltip({ score, breakdown, className }: ScoreBreakdownTooltipProps) {
  if (!breakdown || breakdown.version < 2) {
    return (
      <span className={cn("font-mono font-medium tabular-nums", className)}>
        {score.toFixed(1)} pts
      </span>
    );
  }

  const metricEntries = Object.entries(breakdown.metrics).filter(
    ([, m]) => m && (m.weighted > 0 || m.raw > 0),
  );

  const hasDiscount =
    breakdown.credibilityMultiplier < 0.999 ||
    breakdown.integrityFactor < 0.999 ||
    breakdown.integrityFlags.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 font-mono font-medium tabular-nums text-left",
              "hover:text-primary transition-colors cursor-help",
              className,
            )}
            aria-label="View score breakdown"
          >
            {score.toFixed(1)} pts
            <Info className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="max-w-xs p-3 text-xs space-y-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-semibold text-foreground">Fair score breakdown</p>

          {metricEntries.length > 0 ? (
            <ul className="space-y-1">
              {metricEntries.map(([key, m]) => (
                <li key={key} className="flex justify-between gap-3 tabular-nums">
                  <span className="text-muted-foreground">
                    {METRIC_LABELS[key] ?? key}
                    {m!.raw !== m!.afterFollowerCap ? " (capped)" : ""}
                  </span>
                  <span className="text-foreground font-medium">
                    +{m!.weighted.toFixed(1)}
                    <span className="text-muted-foreground font-normal ml-1">
                      ×{m!.weight}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="border-t border-border/60 pt-2 space-y-1 tabular-nums">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Base score</span>
              <span>{breakdown.baseScore.toFixed(1)}</span>
            </div>
            {breakdown.credibilityMultiplier < 0.999 ? (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Credibility</span>
                <span>×{breakdown.credibilityMultiplier.toFixed(2)}</span>
              </div>
            ) : null}
            {breakdown.integrityFactor < 0.999 ? (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Integrity</span>
                <span>×{breakdown.integrityFactor.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 font-semibold text-foreground">
              <span>Final</span>
              <span>{breakdown.finalScore.toFixed(1)} pts</span>
            </div>
          </div>

          {hasDiscount && breakdown.integrityFlags.length > 0 ? (
            <p className="text-muted-foreground leading-relaxed border-t border-border/60 pt-2">
              {breakdown.integrityFlags
                .map((f) => INTEGRITY_FLAG_LABELS[f] ?? f)
                .join(" · ")}
            </p>
          ) : hasDiscount ? (
            <p className="text-muted-foreground leading-relaxed border-t border-border/60 pt-2">
              Soft adjustments applied to keep scoring fair and resist bought engagement.
            </p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
