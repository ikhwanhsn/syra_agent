import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AssetSortKey, AssetSortOrder } from "@/lib/assetsHub";

export function AssetsSortableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: AssetSortKey;
  activeKey: AssetSortKey;
  order: AssetSortOrder;
  onSort: (key: AssetSortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead
      className={cn(
        "h-10 border-b border-border/50 bg-muted/20 px-3 text-xs font-medium text-muted-foreground",
        align === "right" && "text-right",
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          isActive && "text-foreground",
          align === "right" ? "ml-auto" : "",
        )}
        onClick={() => onSort(sortKey)}
        aria-sort={isActive ? (order === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {isActive ? (
          order === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-30" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
