import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { cn } from "@/lib/utils";

interface DiscoveryPageHeaderProps {
  icon?: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description: string;
  meta?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function DiscoveryPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  meta,
  aside,
  className,
}: DiscoveryPageHeaderProps) {
  return (
    <FadeIn>
      <section
        className={cn(
          "relative mb-8 overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/40",
          "p-6 sm:p-8 lg:p-10",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-90"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-primary/[0.08] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
          aria-hidden
        />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="eyebrow mb-4">
              {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
              {eyebrow}
            </p>
            <h1 className="heading-display">{title}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            {meta ? (
              <div className="mt-3 text-xs text-muted-foreground">{meta}</div>
            ) : null}
          </div>

          {aside ? (
            <div className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-col lg:items-end">
              {aside}
            </div>
          ) : null}
        </div>
      </section>
    </FadeIn>
  );
}

interface DiscoveryCountStatProps {
  value: number | string;
  label: string;
  className?: string;
}

export function DiscoveryCountStat({
  value,
  label,
  className,
}: DiscoveryCountStatProps) {
  return (
    <div
      className={cn(
        "min-w-[9rem] rounded-2xl border border-primary/20 bg-primary/[0.06] px-5 py-4 text-center backdrop-blur-sm",
        className,
      )}
    >
      <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2.75rem]">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
