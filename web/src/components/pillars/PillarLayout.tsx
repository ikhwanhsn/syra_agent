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
  tagline?: string;
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
        <header className="mb-5 sm:mb-7 lg:mb-8">
          {tagline ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary/80 sm:text-sm">
              {tagline}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1 space-y-1.5">
              <h1
                className={cn(
                  "font-semibold tracking-tight text-foreground",
                  embedded ? "text-2xl sm:text-3xl lg:text-4xl" : "text-3xl sm:text-4xl",
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
