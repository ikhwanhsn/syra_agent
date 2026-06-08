import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface TradeFeedItem {
  id: string;
  timeLabel: string;
  strategyLabel: string;
  tokenLabel: string;
  reasonLabel: string;
  pnlLabel: string;
  pnlPositive: boolean;
  pnlNegative: boolean;
  href?: string | null;
  hrefLabel?: string;
}

export interface ExperimentTradeFeedProps {
  items: TradeFeedItem[];
  emptyMessage: string;
  className?: string;
}

export function ExperimentTradeFeed({ items, emptyMessage, className }: ExperimentTradeFeedProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          overviewCardShell,
          "rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            overviewCardShell,
            "rounded-2xl p-4 transition-[border-color] duration-200 hover:border-border/70",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-tight text-foreground">{item.tokenLabel}</p>
                <span className="text-xs text-muted-foreground">{item.timeLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.strategyLabel}</p>
              <p className="text-xs leading-relaxed text-muted-foreground/90">{item.reasonLabel}</p>
              {item.href ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {item.hrefLabel ?? "View token"}
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </div>
            <p
              className={cn(
                "shrink-0 font-mono text-base font-semibold tabular-nums",
                item.pnlPositive && "text-emerald-600 dark:text-emerald-400",
                item.pnlNegative && "text-red-600 dark:text-red-400",
                !item.pnlPositive && !item.pnlNegative && "text-muted-foreground",
              )}
            >
              {item.pnlLabel}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
