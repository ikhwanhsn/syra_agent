import { Search } from "lucide-react";
import { Dropdown } from "@/components/interior/dropdown";
import { Input } from "@/components/ui/input";
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

  const selectedLabel =
    filterOptions.find((opt) => opt.value === filter)?.label ?? "Filter";

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
        <Dropdown
          items={filterOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
          value={filter}
          onChange={onFilterChange}
          label={selectedLabel}
          placeholder="Filter"
          className="w-full shrink-0 sm:w-[160px] [&_button]:h-10 [&_button]:w-full [&_button]:border-border/50 [&_button]:bg-background/50"
        />
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
