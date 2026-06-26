import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DiscoveryStep {
  label: string;
  description: string;
}

interface DiscoveryPageHeaderProps {
  icon?: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description: string;
  steps?: DiscoveryStep[];
  className?: string;
}

export function DiscoveryPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  steps,
  className,
}: DiscoveryPageHeaderProps) {
  return (
    <section className={cn("mb-10 max-w-3xl", className)}>
      <p className="eyebrow mb-3">
        {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
        {eyebrow}
      </p>
      <h1 className="heading-display">{title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>

      {steps && steps.length > 0 ? (
        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className="panel-glass flex gap-3 rounded-xl p-4"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
