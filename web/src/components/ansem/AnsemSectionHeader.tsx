import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

export function AnsemSectionHeader({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0 flex-1 space-y-1">
        {kicker ? <p className={overviewKickerClass}>{kicker}</p> : null}
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
