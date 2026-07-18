import { ArrowUpDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DiscoverySortOption<T extends string> {
  value: T;
  label: string;
}

interface DiscoverySortSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly DiscoverySortOption<T>[];
  label?: string;
  className?: string;
  triggerClassName?: string;
}

export function DiscoverySortSelect<T extends string>({
  value,
  onChange,
  options,
  label = "Sort by",
  className,
  triggerClassName,
}: DiscoverySortSelectProps<T>) {
  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <ArrowUpDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" aria-hidden />
      <span className="sr-only">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "h-10 w-auto min-w-[8.5rem] rounded-full border-border/70 bg-card/50 px-3.5",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
