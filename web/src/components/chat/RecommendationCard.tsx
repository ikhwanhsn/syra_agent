import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatRecommendation } from "@/lib/chatStructuredUi";
import { cn } from "@/lib/utils";

export function RecommendationCard({
  recommendation,
  onAction,
  readOnly,
}: {
  recommendation: ChatRecommendation;
  onAction?: (label: string) => void;
  readOnly?: boolean;
}) {
  const pct =
    typeof recommendation.confidence === "number"
      ? Math.round(Math.max(0, Math.min(1, recommendation.confidence)) * 100)
      : null;
  const actions = recommendation.actions ?? [];

  return (
    <div
      className="space-y-3 rounded-2xl border border-border/55 bg-muted/15 px-4 py-3.5"
      aria-label="Recommendation"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">{recommendation.title}</p>
          {recommendation.detail ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {recommendation.detail}
            </p>
          ) : null}
        </div>
      </div>
      {pct != null ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Confidence</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted/50"
            role="meter"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Confidence"
          >
            <div
              className="h-full rounded-full bg-foreground/80"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}
      {actions.length > 0 && !readOnly && onAction ? (
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-9 min-h-[40px] rounded-full text-xs touch-manipulation")}
              onClick={() => onAction(action.label)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
