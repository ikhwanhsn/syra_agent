import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PumpfunListFilterOption = {
  value: string;
  label: string;
};

export interface PumpfunListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions: readonly PumpfunListFilterOption[];
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

export function PumpfunListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search symbol, name, or address…",
  filter,
  onFilterChange,
  filterOptions,
  resultCount,
  totalCount,
  className,
}: PumpfunListToolbarProps) {
  const showCount =
    typeof resultCount === "number" &&
    typeof totalCount === "number" &&
    (search.trim().length > 0 || filter !== filterOptions[0]?.value);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 border-border/50 bg-background/50 pl-9 font-mono text-sm"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="h-10 w-full shrink-0 border-border/50 bg-background/50 sm:w-[160px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showCount ? (
        <p className="text-[11px] text-muted-foreground">
          Showing {resultCount} of {totalCount}
        </p>
      ) : null}
    </div>
  );
}

export function matchesTokenSearch(
  query: string,
  fields: Array<string | null | undefined>,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => typeof f === "string" && f.toLowerCase().includes(q));
}
