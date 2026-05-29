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
        "sticky top-0 z-20 h-11 border-b border-border/50 bg-card/95 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/90",
        align === "right" && "text-right",
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150",
          isActive
            ? "bg-primary/[0.08] text-foreground ring-1 ring-border/60"
            : "text-muted-foreground/90 hover:bg-muted/50 hover:text-foreground",
          align === "right" ? "ml-auto" : "",
        )}
        onClick={() => onSort(sortKey)}
        aria-sort={isActive ? (order === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {isActive ? (
          order === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
