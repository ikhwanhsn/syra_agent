import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buildPageTokens } from "@/lib/pagination";

const DEFAULT_PAGE_SIZES = [10, 20, 50] as const;

export type PremiumTablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  loading?: boolean;
  itemLabel?: string;
  className?: string;
};

export function PremiumTablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  loading = false,
  itemLabel = "rows",
  className,
}: PremiumTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);
  const pageTokens = useMemo(() => buildPageTokens(safePage, totalPages), [safePage, totalPages]);

  useEffect(() => {
    if (page !== safePage) onPageChange(safePage);
  }, [page, safePage, onPageChange]);

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-border/50 bg-gradient-to-r from-muted/25 via-background/90 to-muted/25 px-4 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5",
        className,
      )}
      role="navigation"
      aria-label="Table pagination"
    >
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
        <p className="text-sm font-medium tabular-nums text-foreground">
          <span className="font-semibold">{rangeStart.toLocaleString()}</span>
          <span className="text-muted-foreground">–</span>
          <span className="font-semibold">{rangeEnd.toLocaleString()}</span>
          <span className="text-muted-foreground"> of </span>
          <span className="font-semibold">{totalItems.toLocaleString()}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {itemLabel}
          {totalPages > 1 ? ` · page ${safePage} of ${totalPages}` : null}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              Per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                const next = Number(v);
                if (Number.isFinite(next) && next > 0) onPageSizeChange(next);
              }}
              disabled={loading}
            >
              <SelectTrigger className="h-9 w-[4.5rem] rounded-xl border-border/60 bg-background/60 text-sm font-semibold tabular-nums shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60">
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)} className="rounded-lg font-medium tabular-nums">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div
            className="flex items-center justify-center gap-0.5 rounded-2xl border border-border/55 bg-background/50 p-1 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)]"
            aria-label="Page navigation"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              disabled={loading || safePage <= 1}
              onClick={() => onPageChange(1)}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              disabled={loading || safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="hidden items-center gap-0.5 px-0.5 sm:flex">
              {pageTokens.map((token, idx) =>
                token === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground/70"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={token}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 min-w-9 rounded-xl px-2 text-sm font-semibold tabular-nums transition-all",
                      token === safePage
                        ? "border border-primary/35 bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                    disabled={loading}
                    onClick={() => onPageChange(token)}
                    aria-label={`Page ${token}`}
                    aria-current={token === safePage ? "page" : undefined}
                  >
                    {token}
                  </Button>
                ),
              )}
            </div>

            <span className="min-w-[4.5rem] px-2 text-center text-xs font-semibold tabular-nums text-muted-foreground sm:hidden">
              {safePage} / {totalPages}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              disabled={loading || safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              disabled={loading || safePage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
