import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AgentSortKey, AgentSortOrder } from "@/lib/agentWalletUi";

export function AgentsSortableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: AgentSortKey;
  activeKey: AgentSortKey;
  order: AgentSortOrder;
  onSort: (key: AgentSortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={cn("h-10 px-3", align === "right" && "text-right", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200",
          isActive
            ? "bg-primary/[0.09] text-foreground shadow-sm ring-1 ring-border/70"
            : "text-muted-foreground/85 hover:bg-muted/45 hover:text-foreground",
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
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-35" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
