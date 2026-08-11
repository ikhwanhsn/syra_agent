import { AlertCircle, Check, Loader2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolChip = {
  name: string;
  status: "running" | "complete" | "error" | "skipped";
  costUsd?: number;
  included?: boolean;
};

function StatusIcon({ status }: { status: ToolChip["status"] }) {
  if (status === "complete") {
    return <Check className="h-3 w-3" aria-hidden />;
  }
  if (status === "error") {
    return <AlertCircle className="h-3 w-3" aria-hidden />;
  }
  if (status === "skipped") {
    return <MinusCircle className="h-3 w-3" aria-hidden />;
  }
  return (
    <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden />
  );
}

export function ToolCallChips({ tools }: { tools: ToolChip[] }) {
  if (!tools.length) return null;
  const complete = tools.filter((t) => t.status === "complete").length;
  return (
    <div className="space-y-2" aria-label="Tool calls">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {tools.length} tool call{tools.length === 1 ? "" : "s"}
        {complete !== tools.length ? ` · ${complete} complete` : ""}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {tools.map((tool, i) => (
          <li
            key={`${tool.name}-${i}`}
            className={cn(
              "inline-flex min-h-[32px] max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
              tool.status === "error"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border/60 bg-muted/30 text-foreground/90",
            )}
          >
            <StatusIcon status={tool.status} />
            <span className="truncate">{tool.name}</span>
            {tool.included ? (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Included
              </span>
            ) : typeof tool.costUsd === "number" && tool.costUsd > 0 ? (
              <span className="tabular-nums text-muted-foreground">
                ${tool.costUsd.toFixed(4)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
