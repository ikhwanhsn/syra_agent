import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  openPositions: number;
  className?: string;
};

/**
 * Shown when an agent has open experiment runs: the server continues TP/SL checks on a schedule
 * even when this UI tab is in the background.
 */
export function AgentBackgroundLiveIndicator({ openPositions, className }: Props) {
  if (openPositions <= 0) return null;
  const label = `Live: ${openPositions} open position${openPositions === 1 ? "" : "s"} tracked in the background`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/[0.12] px-2 py-0.5 text-emerald-600 shadow-sm dark:text-emerald-400",
            className,
          )}
          tabIndex={0}
          role="status"
          aria-live="polite"
          aria-label={label}
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        Open position: the experiment service keeps validating TP/SL in the background while you use other pages.
      </TooltipContent>
    </Tooltip>
  );
}
