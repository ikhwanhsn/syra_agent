import type { ReactNode } from "react";

import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { cn } from "@/lib/utils";

interface DiscoveryToolbarProps {
  children: ReactNode;
  className?: string;
  /** Skip sticky positioning (e.g. nested toolbars). */
  sticky?: boolean;
}

/**
 * Glass control strip for discovery browse pages.
 * Sticky by default so filters stay reachable while scrolling results.
 */
export function DiscoveryToolbar({
  children,
  className,
  sticky = true,
}: DiscoveryToolbarProps) {
  return (
    <FadeIn
      delay={0.05}
      className={cn(sticky && "sticky top-[5.5rem] z-20 mb-8", !sticky && "mb-8", className)}
    >
      <div className="panel-glass p-3 sm:p-3.5">{children}</div>
    </FadeIn>
  );
}

interface DiscoveryToolbarRowProps {
  children: ReactNode;
  className?: string;
}

/** Single horizontal control row — scrolls on narrow screens instead of wrapping. */
export function DiscoveryToolbarRow({ children, className }: DiscoveryToolbarRowProps) {
  return (
    <div
      className={cn(
        "scrollbar-hide flex min-w-0 items-center gap-2 overflow-x-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DiscoverySectionLabelProps {
  title: string;
  meta?: string;
  className?: string;
}

export function DiscoverySectionLabel({
  title,
  meta,
  className,
}: DiscoverySectionLabelProps) {
  return (
    <div className={cn("mb-5 flex items-baseline justify-between gap-4", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      {meta ? (
        <p className="text-xs tabular-nums text-muted-foreground">{meta}</p>
      ) : null}
    </div>
  );
}
