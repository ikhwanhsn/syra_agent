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
    <div className={cn("flex items-center gap-2", className)}>
      <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="sr-only">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "h-10 w-full min-w-[10.5rem] rounded-full border-border/70 bg-card/50 sm:w-[11.5rem]",
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
