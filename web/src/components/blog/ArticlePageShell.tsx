import type { ReactNode } from "react";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import {
  PLAYGROUND_PAGE_CLASS,
  PLAYGROUND_SIDEBAR_STICKY_CLASS,
} from "@/components/playground/playgroundStyles";
import { PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

/** Sticky offset for article sidebars — matches playground history panel. */
export const ARTICLE_SIDEBAR_STICKY = PLAYGROUND_SIDEBAR_STICKY_CLASS;

interface ArticlePageShellProps {
  children: ReactNode;
  className?: string;
}

/** Article pages use the same width shell as marketplace / playground routes. */
export function ArticlePageShell({ children, className }: ArticlePageShellProps) {
  return (
    <PlaygroundPageShell>
      <OverviewPageBackdrop />
      <div
        className={cn(
          PLAYGROUND_PAGE_CLASS,
          PAGE_SAFE_AREA_BOTTOM,
          "min-w-0 w-full",
          className,
        )}
      >
        {children}
      </div>
    </PlaygroundPageShell>
  );
}
