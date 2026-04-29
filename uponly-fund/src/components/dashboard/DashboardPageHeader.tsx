import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPageHeader({
  title,
  description,
  right,
  eyebrow = "Dashboard",
  className,
}: {
  title: string;
  description: ReactNode;
  right?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/50 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success/80" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="mt-2 text-balance text-xl font-semibold tracking-[-0.01em] text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
