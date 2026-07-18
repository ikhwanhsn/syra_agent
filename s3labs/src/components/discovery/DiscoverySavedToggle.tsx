import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface DiscoverySavedToggleProps {
  saved: boolean;
  count?: number;
  onChange: (saved: boolean) => void;
  className?: string;
}

/** Compact All / Saved control for one-line discovery toolbars. */
export function DiscoverySavedToggle({
  saved,
  count = 0,
  onChange,
  className,
}: DiscoverySavedToggleProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-full border border-border/50 bg-muted/25 p-0.5",
        className,
      )}
      role="group"
      aria-label="Saved filter"
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!saved}
        className={cn(
          "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !saved
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          saved
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Star className={cn("h-3.5 w-3.5", saved && "fill-current text-primary")} aria-hidden />
        Saved
        {count > 0 ? (
          <span className="tabular-nums text-xs text-muted-foreground">{count}</span>
        ) : null}
      </button>
    </div>
  );
}
