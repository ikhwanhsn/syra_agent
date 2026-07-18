import type { ReactNode } from "react";
import { Info } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface InfoHintProps {
  /** Longer explanation shown on hover. */
  content: ReactNode;
  /** Accessible name for the trigger button. */
  label?: string;
  className?: string;
  /** Card side relative to the icon. */
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Inline ⓘ control: hover to show a short explanation (closes when the pointer leaves).
 */
export function InfoHint({
  content,
  label = "More information",
  className,
  side = "top",
}: InfoHintProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            "transition-colors cursor-help align-middle",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label={label}
          onClick={(e) => e.preventDefault()}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="start"
        className="w-[min(18rem,calc(100vw-2rem))] p-3 text-xs leading-relaxed text-muted-foreground"
      >
        <div className="space-y-1.5 text-left">{content}</div>
      </HoverCardContent>
    </HoverCard>
  );
}

/** Label row with an optional info hint beside the text. */
export function LabelWithHint({
  children,
  hint,
  hintLabel,
  htmlFor,
  className,
}: {
  children: ReactNode;
  hint: ReactNode;
  hintLabel?: string;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-start gap-1.5 min-w-0", className)}>
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className="text-sm font-normal leading-snug cursor-pointer"
        >
          {children}
        </label>
      ) : (
        <span className="text-sm font-normal leading-snug">{children}</span>
      )}
      <InfoHint content={hint} label={hintLabel} className="mt-0.5" />
    </div>
  );
}
