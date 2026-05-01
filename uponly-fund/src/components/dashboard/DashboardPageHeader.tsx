import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPageHeader({
  title,
  description,
  right,
  eyebrow = "Dashboard",
  className,
  emphasis = "default",
}: {
  title: string;
  description: ReactNode;
  right?: ReactNode;
  eyebrow?: string;
  className?: string;
  /** `hero` — larger type and richer chrome for flagship views (e.g. Terminal). */
  emphasis?: "default" | "hero";
}) {
  const isHero = emphasis === "hero";
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
            isHero
              ? "border-border/40 bg-muted/25 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06)] backdrop-blur-sm dark:bg-muted/15"
              : "border-border/55 bg-background/50",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success/80 shadow-[0_0_8px_hsl(var(--success)/0.45)]" aria-hidden />
          {eyebrow}
        </p>
        <h1
          className={cn(
            "mt-2 text-balance font-semibold tracking-[-0.02em] text-foreground",
            isHero
              ? "text-2xl leading-[1.15] sm:text-3xl sm:tracking-[-0.03em]"
              : "text-xl tracking-[-0.01em] sm:text-2xl",
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "mt-2 max-w-3xl leading-relaxed text-muted-foreground",
            isHero ? "text-[0.9375rem] sm:text-base text-muted-foreground/90" : "mt-1 text-sm",
          )}
        >
          {description}
        </p>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
