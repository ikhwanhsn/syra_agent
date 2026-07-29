import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type InfoHintProps = {
  /** Accessible name for the trigger button (e.g. "What does win rate mean?"). */
  label: string;
  /** Plain-language explanation shown in the tooltip. */
  text: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
};

/**
 * Compact info affordance for jargon on Earn yield surfaces.
 * Keyboard-focusable; Esc dismisses via Radix Tooltip.
 */
export function InfoHint({ label, text, className, side = "top" }: InfoHintProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
            "text-muted-foreground transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
