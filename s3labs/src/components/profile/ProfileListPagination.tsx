import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import {
  PROFILE_LIST_PAGE_SIZE,
  getVisiblePageNumbers,
} from "@/components/profile/profileListUtils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileListPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
}

export function ProfileListPagination({
  page,
  totalPages,
  totalCount,
  pageSize = PROFILE_LIST_PAGE_SIZE,
  onPageChange,
  label = "List pagination",
  className,
}: ProfileListPaginationProps) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const visible = getVisiblePageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-border/60 bg-muted/15 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4",
        className,
      )}
      role="navigation"
      aria-label={label}
    >
      <p className="order-2 text-center text-sm tabular-nums text-muted-foreground sm:order-1 sm:text-left">
        Showing {from}–{to} of {totalCount}
      </p>
      {totalPages > 1 ? (
        <div className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 min-h-9 gap-1 px-2.5"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Prev</span>
          </Button>
          <div className="mx-1 flex items-center gap-0.5">
            {visible.map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                  aria-hidden
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  key={item}
                  type="button"
                  variant={item === page ? "default" : "ghost"}
                  size="icon"
                  className={cn("h-9 w-9", item === page && "pointer-events-none")}
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Button>
              ),
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 min-h-9 gap-1 px-2.5"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
