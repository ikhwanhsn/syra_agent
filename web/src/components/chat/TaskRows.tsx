import { Check, Circle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReasoningStep, ReasoningStepStatus } from "@/lib/chatStructuredUi";

function StatusGlyph({ status }: { status: ReasoningStepStatus }) {
  if (status === "complete") {
    return <Check className="h-3.5 w-3.5 text-foreground" aria-hidden />;
  }
  if (status === "error") {
    return <X className="h-3.5 w-3.5 text-destructive" aria-hidden />;
  }
  if (status === "skipped") {
    return <Circle className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />;
  }
  return (
    <Loader2
      className="h-3.5 w-3.5 animate-spin text-primary motion-reduce:animate-none"
      aria-hidden
    />
  );
}

export function TaskRows({
  steps,
  className,
}: {
  steps: Array<Pick<ReasoningStep, "id" | "label" | "status" | "costUsd" | "included">>;
  className?: string;
}) {
  if (!steps.length) return null;
  return (
    <ul className={cn("space-y-1.5", className)} aria-label="Agent tasks">
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn(
            "flex min-h-[40px] items-center gap-2.5 rounded-xl border border-border/50 bg-background/[0.12] px-3 py-2",
            step.status === "running" && "border-primary/30",
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/40">
            <StatusGlyph status={step.status} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
            {step.label}
          </span>
          {step.included ? (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Included
            </span>
          ) : typeof step.costUsd === "number" && step.costUsd > 0 ? (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              ${step.costUsd.toFixed(4)}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
