import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function LabsTableSkeleton({
  columns,
  rows = 4,
}: {
  columns: { label: string; align?: "left" | "right" }[];
  rows?: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.label} className={col.align === "right" ? "text-right" : undefined}>
              <Skeleton className={cn("h-3 w-14", col.align === "right" && "ml-auto")} />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {columns.map((col) => (
              <TableCell key={col.label} className={col.align === "right" ? "text-right" : undefined}>
                <Skeleton
                  className={cn(
                    "h-4",
                    col.align === "right" ? "ml-auto w-16" : "w-24",
                    col.label === "Label" && "w-28",
                    col.label === "Address" && "w-20",
                  )}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function WalletListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className={cn(overviewCardShell, "overflow-hidden animate-in fade-in duration-300")}
      aria-busy="true"
      aria-label="Loading wallets"
    >
      <LabsTableSkeleton
        rows={rows}
        columns={[
          { label: "Label" },
          { label: "Role" },
          { label: "Address" },
          { label: "SOL", align: "right" },
          { label: "USDC", align: "right" },
          { label: "Actions", align: "right" },
        ]}
      />
    </div>
  );
}

export function AutoCallSettingsSkeleton() {
  return (
    <div
      className={cn(overviewCardShell, "space-y-5 p-5 animate-in fade-in duration-300")}
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-full max-w-md" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn("space-y-2", i === 2 && "sm:col-span-2")}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
            {i === 2 ? <Skeleton className="h-3 w-full max-w-sm" /> : null}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>

      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  );
}

export function CallLogTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className={cn(overviewCardShell, "overflow-hidden animate-in fade-in duration-300")}
      aria-busy="true"
      aria-label="Loading call log"
    >
      <LabsTableSkeleton
        rows={rows}
        columns={[
          { label: "Time" },
          { label: "Endpoint" },
          { label: "Payer" },
          { label: "Price", align: "right" },
          { label: "Status" },
          { label: "Trigger" },
        ]}
      />
    </div>
  );
}

export function EndpointsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300"
      aria-busy="true"
      aria-label="Loading endpoints"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border/60 bg-card/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
