import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
  type OverviewAccent,
} from "@/components/dashboard/overview/overviewStyles";

export interface OverviewPanelProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  accent?: OverviewAccent;
  className?: string;
  contentClassName?: string;
  headerExtra?: ReactNode;
}

export function OverviewPanel({
  title,
  description,
  children,
  accent = "neutral",
  className,
  contentClassName,
  headerExtra,
}: OverviewPanelProps) {
  return (
    <section className={cn(overviewCardShell, "flex flex-col", className)}>
      <div className={overviewCardGlow} style={{ background: overviewAccentBackground(accent) }} aria-hidden />
      <header className="relative flex flex-col gap-1 border-b border-border/45 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/85">{description}</p>
          ) : null}
        </div>
        {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
      </header>
      <div className={cn("relative min-h-0 flex-1", contentClassName)}>{children}</div>
    </section>
  );
}

export function OverviewPanelEmpty({ message }: { message: string }) {
  return (
    <p className={cn("px-4 py-8 text-center text-sm text-muted-foreground sm:px-5", overviewKickerClass)}>{message}</p>
  );
}

export function OverviewPanelError({ message }: { message: string }) {
  return <p className="px-4 py-6 text-sm text-destructive sm:px-5">{message}</p>;
}
