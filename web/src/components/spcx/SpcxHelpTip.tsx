import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SpcxHelpTip({
  term,
  children,
  className,
}: {
  term: string;
  children: string;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 border-b border-dotted border-muted-foreground/40 text-inherit",
              "cursor-help transition-colors hover:border-muted-foreground/70",
              className,
            )}
            aria-label={`What is ${term}?`}
          >
            {children}
            <CircleHelp className="h-3 w-3 shrink-0 opacity-50" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left leading-relaxed">
          <p className="font-medium text-foreground">{term}</p>
          <p className="mt-1 text-muted-foreground">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
