import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import type { AlphaTechScreeningRow, AlphaTechSortKey, AlphaTechSortOrder } from "@/lib/alphaTechScreenerApi";
import { cn } from "@/lib/utils";

function AlphaTechSortableHeader({
  label,
  sortKey,
  activeKey,
  order,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: AlphaTechSortKey;
  activeKey: AlphaTechSortKey;
  order: AlphaTechSortOrder;
  onSort: (key: AlphaTechSortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead
      className={cn(
        "h-10 border-b border-border/50 bg-muted/20 px-3 text-xs font-medium text-muted-foreground",
        align === "right" && "text-right",
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

function priceLabel(price: number | null): string {
  if (price == null || !Number.isFinite(price)) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  if (price >= 0.0001) return `$${price.toFixed(6)}`;
  return `$${price.toExponential(2)}`;
}

function AlphaTechRow({ row }: { row: AlphaTechScreeningRow }) {
  const change = row.priceChange24h;
  const changeClass =
    change == null
      ? "text-muted-foreground"
      : change >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400";

  return (
    <TableRow className="border-border/40 hover:bg-muted/25">
      <TableCell className="py-3.5 font-medium">{row.teamName}</TableCell>
      <TableCell className="py-3.5">
        {row.matched ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-lg border border-border/50">
              {row.imageUrl ? <AvatarImage src={row.imageUrl} alt="" /> : null}
              <AvatarFallback className="rounded-lg text-xs">
                {(row.symbol ?? row.teamName).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{row.symbol ?? "—"}</p>
              <p className="truncate text-xs text-muted-foreground">{row.name ?? "—"}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No token found</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{priceLabel(row.priceUsd)}</TableCell>
      <TableCell className={cn("text-right tabular-nums", changeClass)}>
        {change == null ? "—" : formatPct(change)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCompactUsd(row.marketCap)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCompactUsd(row.liquidityUsd)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCompactUsd(row.volume24h)}</TableCell>
      <TableCell className="text-right">
        {row.pairUrl ? (
          <a
            href={row.pairUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`View ${row.teamName} on DexScreener`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AlphaTechTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/55 bg-muted/15 hover:bg-muted/15">
            {["Team", "Token", "Price", "24h", "Market cap", "Liquidity", "Vol 24h", ""].map((label) => (
              <TableHead key={label} className="h-11 px-3">
                <Skeleton className="h-3 w-16 rounded-md" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="border-border/40">
              <TableCell className="py-3.5">
                <Skeleton className="h-4 w-24 rounded-md" />
              </TableCell>
              <TableCell className="py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
              </TableCell>
              {Array.from({ length: 5 }).map((__, j) => (
                <TableCell key={j} className="text-right">
                  <Skeleton className="ml-auto h-4 w-16 rounded-md" />
                </TableCell>
              ))}
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type AlphaTechTableProps = {
  rows: AlphaTechScreeningRow[];
  sortKey: AlphaTechSortKey;
  sortOrder: AlphaTechSortOrder;
  onSort: (key: AlphaTechSortKey) => void;
};

export function AlphaTechTable({ rows, sortKey, sortOrder, onSort }: AlphaTechTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
      <Table>
        <TableHeader>
          <TableRow className="border-border/55 bg-muted/15 hover:bg-muted/15">
            <AlphaTechSortableHeader
              label="Team"
              sortKey="teamName"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
            />
            <AlphaTechSortableHeader
              label="Token"
              sortKey="symbol"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
            />
            <AlphaTechSortableHeader
              label="Price"
              sortKey="priceUsd"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
              align="right"
            />
            <AlphaTechSortableHeader
              label="24h"
              sortKey="priceChange24h"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
              align="right"
            />
            <AlphaTechSortableHeader
              label="Market cap"
              sortKey="marketCap"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
              align="right"
            />
            <AlphaTechSortableHeader
              label="Liquidity"
              sortKey="liquidityUsd"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
              align="right"
            />
            <AlphaTechSortableHeader
              label="Vol 24h"
              sortKey="volume24h"
              activeKey={sortKey}
              order={sortOrder}
              onSort={onSort}
              align="right"
            />
            <TableHead className="h-10 w-12 border-b border-border/50 bg-muted/20 px-3" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                No teams match your filters.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => <AlphaTechRow key={row.teamId} row={row} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
