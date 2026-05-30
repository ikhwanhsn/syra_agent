import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

export interface OverviewGroupLabelProps {
  icon?: LucideIcon;
  children: string;
  className?: string;
}

export function OverviewGroupLabel({ icon: Icon, children, className }: OverviewGroupLabelProps) {
  return (
    <div className={cn("flex items-center gap-2.5 pt-2", className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-border/80 via-border/40 to-transparent" aria-hidden />
      <span className={cn(overviewKickerClass, "flex shrink-0 items-center gap-1.5 px-1")}>
        {Icon ? <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden /> : null}
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-border/80 via-border/40 to-transparent" aria-hidden />
    </div>
  );
}
