import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMachineMoneyPreview } from "@/contexts/MachineMoneyPreviewContext";
import { cn } from "@/lib/utils";

type MachineMoneyPreviewToggleProps = {
  className?: string;
  /** Compact icon-only control for the dashboard topbar. */
  compact?: boolean;
};

export function MachineMoneyPreviewToggle({
  className,
  compact = false,
}: MachineMoneyPreviewToggleProps) {
  const { previewComingSoon, togglePreviewComingSoon } = useMachineMoneyPreview();

  const label = previewComingSoon ? "Show full Machine Money pages" : "Preview coming soon pages";
  const Icon = previewComingSoon ? EyeOff : Eye;

  if (compact) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={previewComingSoon ? "secondary" : "outline"}
              size="icon"
              className={cn("h-8 w-8 shrink-0 rounded-lg", className)}
              onClick={togglePreviewComingSoon}
              aria-pressed={previewComingSoon}
              aria-label={label}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      type="button"
      variant={previewComingSoon ? "secondary" : "outline"}
      size="sm"
      className={cn("rounded-xl gap-1.5", className)}
      onClick={togglePreviewComingSoon}
      aria-pressed={previewComingSoon}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {previewComingSoon ? "Exit preview" : "Preview coming soon"}
    </Button>
  );
}
