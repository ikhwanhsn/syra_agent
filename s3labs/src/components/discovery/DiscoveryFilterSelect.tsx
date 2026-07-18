import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiscoveryPillOption } from "@/components/discovery/DiscoveryFilterPills";
import { cn } from "@/lib/utils";

interface DiscoveryFilterSelectProps<T extends string> {
  options: DiscoveryPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  triggerClassName?: string;
}

export function DiscoveryFilterSelect<T extends string>({
  options,
  value,
  onChange,
  label = "Filter",
  className,
  triggerClassName,
}: DiscoveryFilterSelectProps<T>) {
  return (
    <div className={cn("shrink-0", className)}>
      <span className="sr-only">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "h-10 w-auto min-w-[7.5rem] rounded-full border-border/70 bg-card/50 px-3.5",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
              {typeof option.count === "number" ? ` (${option.count})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
