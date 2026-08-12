import { useMemo, useState, useEffect } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReasoningStep, ReasoningStepKind } from "@/lib/chatStructuredUi";
import { TaskRows } from "@/components/chat/TaskRows";

const KIND_TABS: Array<{ id: ReasoningStepKind | "all"; label: string }> = [
  { id: "all", label: "Steps" },
  { id: "reasoning", label: "Reasoning" },
  { id: "search", label: "Search" },
  { id: "tool", label: "Tools" },
];

export function AgentThinkingTrace({
  steps,
  defaultOpen = false,
  className,
}: {
  steps: ReasoningStep[];
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<ReasoningStepKind | "all">("all");

  const available = useMemo(() => {
    const kinds = new Set(steps.map((s) => s.kind));
    return KIND_TABS.filter((t) => t.id === "all" || kinds.has(t.id));
  }, [steps]);

  const visible = useMemo(
    () => (tab === "all" ? steps : steps.filter((s) => s.kind === tab)),
    [steps, tab],
  );

  if (!steps.length) return null;

  const running = steps.some((s) => s.status === "running");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/45 bg-muted/15",
        className,
      )}
    >
      <button
        type="button"
        className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2 text-left touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {running ? "Thinking" : "Trace"}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/80">
          {steps.length} step{steps.length === 1 ? "" : "s"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border/35 px-3 pb-3 pt-2">
          {available.length > 2 ? (
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Trace categories">
              {available.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "min-h-[36px] rounded-full px-2.5 py-1 text-[11px] font-medium touch-manipulation",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tab === t.id
                      ? "bg-foreground text-background"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}
          <TaskRows steps={visible} />
        </div>
      ) : null}
    </div>
  );
}

export function HeuristicLoadingTasks({ labels }: { labels: string[] }) {
  const safeLabels = labels.length > 0 ? labels : ["Thinking…"];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [safeLabels.join("|")]);

  useEffect(() => {
    if (safeLabels.length <= 1) return;
    const interval = window.setInterval(() => {
      setStepIndex((i) => (i + 1) % safeLabels.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [safeLabels.length]);

  const steps: ReasoningStep[] = safeLabels.map((label, i) => ({
    id: `heuristic-${i}`,
    label,
    kind: i === 0 ? "reasoning" : "search",
    status:
      i === stepIndex ? "running" : i < stepIndex ? "complete" : "skipped",
  }));

  return <TaskRows steps={steps} />;
}
