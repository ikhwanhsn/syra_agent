import { cn } from "@/lib/utils";

type DiscoveryViewTab<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

interface DiscoveryViewTabsProps<T extends string> {
  tabs: readonly DiscoveryViewTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function DiscoveryViewTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: DiscoveryViewTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-xl border border-border/50 bg-muted/25 p-1 sm:w-fit",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={value === tab.id}
          className={cn(
            "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors duration-150 sm:flex-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            value === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && tab.count > 0 ? (
            <span className="tabular-nums text-xs text-muted-foreground">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
