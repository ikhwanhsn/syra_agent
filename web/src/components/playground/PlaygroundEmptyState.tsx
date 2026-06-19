import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { playgroundEmptyStateClass } from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";

interface PlaygroundEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function PlaygroundEmptyState({
  title,
  description,
  action,
  icon,
  className,
}: PlaygroundEmptyStateProps) {
  return (
    <div className={cn(playgroundEmptyStateClass, className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 ring-1 ring-border/40">
        {icon ?? <SearchX className="h-6 w-6 text-muted-foreground" aria-hidden />}
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
