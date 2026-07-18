import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DiscoveryEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function DiscoveryEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: DiscoveryEmptyStateProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden panel-glass flex flex-col items-center rounded-[1.75rem] px-6 py-16 text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50"
        aria-hidden
      />
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="relative text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action ? <div className="relative mt-7">{action}</div> : null}
    </div>
  );
}
