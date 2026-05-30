import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OverviewSectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  href?: string;
  linkLabel?: string;
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
}

export function OverviewSection({
  id,
  title,
  description,
  icon: Icon,
  href,
  linkLabel = "Open",
  isLoading,
  children,
  className,
}: OverviewSectionProps) {
  return (
    <section id={id} className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden /> : null}
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading section" />
            ) : null}
          </div>
          {description ? <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{description}</p> : null}
        </div>
        {href ? (
          <Link
            to={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
          >
            {linkLabel} <ArrowRight className="w-3 h-3" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
