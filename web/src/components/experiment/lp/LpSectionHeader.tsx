import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

export interface LpSectionHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function LpSectionHeader({ kicker, title, description, action, id, className }: LpSectionHeaderProps) {
  return (
    <div id={id} className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <p className={overviewKickerClass}>{kicker}</p>
        <h2 className="text-balance text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
