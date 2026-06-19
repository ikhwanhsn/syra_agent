import type { ReactNode } from "react";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

type PillarLayoutProps = {
  title: string;
  tagline: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** When true, renders inside dashboard shell (no full-page backdrop). */
  embedded?: boolean;
};

export function PillarLayout({
  title,
  tagline,
  description,
  children,
  actions,
  className,
  embedded = false,
}: PillarLayoutProps) {
  return (
    <div className={cn(embedded ? "relative flex flex-col min-h-0" : "relative min-h-screen", className)}>
      {!embedded ? <OverviewPageBackdrop /> : null}
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          embedded ? "space-y-6 py-4 sm:py-6" : PAGE_PADDING_TOP_MEDIUM,
          !embedded && PAGE_SAFE_AREA_BOTTOM,
          "relative z-10",
          embedded ? "pb-8" : "pb-16",
        )}
      >
        <header className={cn("space-y-3", embedded ? "mb-6" : "mb-8")}>
          <p className="text-sm font-medium uppercase tracking-wider text-primary/80">{tagline}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h1
                className={cn(
                  "font-semibold tracking-tight text-foreground",
                  embedded ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
