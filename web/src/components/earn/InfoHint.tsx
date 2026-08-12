import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/interior/tooltip-group";
import { cn } from "@/lib/utils";

type InfoHintProps = {
  /** Accessible name for the trigger button (e.g. "What does win rate mean?"). */
  label: string;
  /** Plain-language explanation shown in the tooltip. */
  text: string;
  className?: string;
  /** Interior Tooltip supports top|bottom only; other values fall back to top. */
  side?: "top" | "right" | "bottom" | "left";
};

/**
 * Compact info affordance for jargon on Earn yield surfaces.
 * Keyboard-focusable; Esc dismisses via interior Tooltip.
 */
export function InfoHint({ label, text, className, side = "top" }: InfoHintProps) {
  const tooltipSide = side === "bottom" ? "bottom" : "top";

  return (
    <Tooltip
      label={text}
      side={tooltipSide}
      openDelay={200}
      contentClassName="max-w-xs whitespace-normal px-3 py-2 text-xs leading-relaxed"
    >
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
    </Tooltip>
  );
}
