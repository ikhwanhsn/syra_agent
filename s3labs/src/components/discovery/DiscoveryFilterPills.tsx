import { cn } from "@/lib/utils";

export interface DiscoveryPillOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface DiscoveryFilterPillsProps<T extends string> {
  options: DiscoveryPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  scrollable?: boolean;
}

export function DiscoveryFilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  scrollable = false,
}: DiscoveryFilterPillsProps<T>) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}
      <div
        className={cn(
          "flex gap-2",
          scrollable
            ? "scrollbar-hide-md -mx-1 flex-nowrap overflow-x-auto pb-0.5"
            : "flex-wrap",
        )}
        role="group"
        aria-label={label ?? "Filters"}
      >
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "border-primary/35 bg-primary/10 text-foreground"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:border-border/60 hover:text-foreground",
              )}
            >
              {option.label}
              {typeof option.count === "number" ? (
                <span className="tabular-nums text-xs text-muted-foreground">
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
