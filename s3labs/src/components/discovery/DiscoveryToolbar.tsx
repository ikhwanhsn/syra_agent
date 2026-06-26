import type { ReactNode } from "react";

import { DiscoveryFilterPills, type DiscoveryPillOption } from "@/components/discovery/DiscoveryFilterPills";
import { DiscoverySearchBar } from "@/components/discovery/DiscoverySearchBar";
import { cn } from "@/lib/utils";

interface DiscoveryToolbarProps<T extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchId?: string;
  filters: DiscoveryPillOption<T>[];
  filterValue: T;
  onFilterChange: (value: T) => void;
  trailing?: ReactNode;
  className?: string;
}

export function DiscoveryToolbar<T extends string>({
  search,
  onSearchChange,
  searchPlaceholder,
  searchId,
  filters,
  filterValue,
  onFilterChange,
  trailing,
  className,
}: DiscoveryToolbarProps<T>) {
  return (
    <section className={cn("panel-glass mb-6 space-y-3 rounded-2xl p-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DiscoverySearchBar
          id={searchId}
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {trailing}
      </div>
      <DiscoveryFilterPills options={filters} value={filterValue} onChange={onFilterChange} />
    </section>
  );
}
