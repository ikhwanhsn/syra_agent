import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { lpTableHead } from "./lpExperimentStyles";
import type { LpRunStatus } from "@/lib/lpAgentExperimentApi";

type SortDirection = "asc" | "desc";

export function LpSortableHead({
  label,
  active,
  direction,
  align = "left",
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  align?: "left" | "right";
  onClick: () => void;
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      className={cn(
        lpTableHead,
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground",
        align === "right" && "ml-auto",
      )}
      onClick={onClick}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")} aria-hidden />
    </button>
  );
}

export function LpTableEmpty({ colSpan, title, description }: { colSpan: number; title: string; description?: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-14">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Inbox className="h-5 w-5 text-muted-foreground/70" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground/90">{title}</p>
          {description ? <p className="max-w-sm text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LpTableSkeletonRows({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="pointer-events-none">
          <TableCell colSpan={colSpan} className="py-3.5">
            <div className="h-4 animate-pulse rounded-md bg-muted/50" style={{ width: `${68 + (i % 3) * 8}%` }} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function RunStatusBadge({ status }: { status: LpRunStatus }) {
  const tone =
    status === "win"
      ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300"
      : status === "loss" || status === "error"
        ? "bg-destructive/12 text-destructive ring-1 ring-destructive/20"
        : status === "open"
          ? "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300"
          : "bg-violet-500/12 text-violet-800 ring-1 ring-violet-500/15 dark:text-violet-200";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", tone)}>
      {status}
    </span>
  );
}

export function LpPaginationBar({
  page,
  totalPages,
  totalRowsLabel,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalRowsLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-muted/[0.06] px-4 py-3 text-xs text-muted-foreground sm:px-5">
      <span className="tabular-nums">
        Page <span className="font-medium text-foreground/80">{page}</span> of{" "}
        <span className="font-medium text-foreground/80">{totalPages}</span>
        <span className="mx-1.5 text-border">·</span>
        {totalRowsLabel}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={onPrev}
          className="h-8 gap-1 rounded-lg border-border/50 bg-background/60 px-2.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={onNext}
          className="h-8 gap-1 rounded-lg border-border/50 bg-background/60 px-2.5"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
