import type { ReactNode } from "react";
import { Check, ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface BrowseOption<T extends string> {
  value: T;
  label: string;
}

interface ProfileListToolbarProps<TFilter extends string, TSort extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  filter: TFilter;
  onFilterChange: (value: TFilter) => void;
  filterOptions: BrowseOption<TFilter>[];
  filterLabel?: string;
  sort: TSort;
  onSortChange: (value: TSort) => void;
  sortOptions: BrowseOption<TSort>[];
  sortLabel?: string;
  resultCount?: number;
  className?: string;
}

function ControlTrigger({
  icon,
  eyebrow,
  value,
  className,
}: {
  icon: ReactNode;
  eyebrow: string;
  value: string;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15 group-data-[state=open]:bg-primary/15">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col items-start gap-0.5 text-left leading-none">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </span>
        <span className="truncate text-sm font-semibold tracking-tight text-foreground">
          {value}
        </span>
      </span>
    </span>
  );
}

const triggerClassName = cn(
  "group h-11 w-full justify-between gap-3 rounded-full border-border/50 bg-gradient-to-b from-background via-background to-muted/35 px-2.5 pr-3.5 shadow-sm backdrop-blur-sm",
  "hover:border-primary/35 hover:bg-background hover:shadow-md",
  "data-[state=open]:border-primary/40 data-[state=open]:shadow-md data-[state=open]:ring-2 data-[state=open]:ring-primary/15",
  "min-[400px]:w-auto min-[400px]:min-w-[10.5rem]",
);

export function ProfileListToolbar<TFilter extends string, TSort extends string>({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  searchLabel = "Search",
  filter,
  onFilterChange,
  filterOptions,
  filterLabel = "Filter",
  sort,
  onSortChange,
  sortOptions,
  sortLabel = "Sort",
  resultCount,
  className,
}: ProfileListToolbarProps<TFilter, TSort>) {
  const filterActiveLabel =
    filterOptions.find((option) => option.value === filter)?.label ?? "All";
  const sortActiveLabel =
    sortOptions.find((option) => option.value === sort)?.label ?? "Default";

  return (
    <div className={cn("flex flex-col gap-3 min-w-0", className)}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[14rem] sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel}
            className="h-11 rounded-full border-border/50 bg-background/70 pl-10 pr-10 shadow-sm"
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={triggerClassName}
              aria-label={`${filterLabel}: ${filterActiveLabel}`}
            >
              <ControlTrigger
                icon={<Filter className="h-3.5 w-3.5" aria-hidden />}
                eyebrow={filterLabel}
                value={filterActiveLabel}
              />
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[min(100vw-2rem,15.5rem)] rounded-2xl border-border/60 bg-popover/95 p-1.5 shadow-elevated backdrop-blur-md"
          >
            <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {filterLabel}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-1 bg-border/60" />
            {filterOptions.map((option) => {
              const active = option.value === filter;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={cn(
                    "cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium",
                    "focus:bg-primary/10 focus:text-foreground",
                    active && "bg-primary/8 text-foreground",
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{option.label}</span>
                    {active ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    ) : null}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={triggerClassName}
              aria-label={`${sortLabel}: ${sortActiveLabel}`}
            >
              <ControlTrigger
                icon={<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />}
                eyebrow={sortLabel}
                value={sortActiveLabel}
              />
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[min(100vw-2rem,15.5rem)] rounded-2xl border-border/60 bg-popover/95 p-1.5 shadow-elevated backdrop-blur-md"
          >
            <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {sortLabel}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-1 bg-border/60" />
            {sortOptions.map((option) => {
              const active = option.value === sort;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium",
                    "focus:bg-primary/10 focus:text-foreground",
                    active && "bg-primary/8 text-foreground",
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{option.label}</span>
                    {active ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    ) : null}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {typeof resultCount === "number" ? (
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
