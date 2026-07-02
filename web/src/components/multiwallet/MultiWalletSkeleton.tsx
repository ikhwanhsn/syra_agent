import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

function PanelHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-3/4 max-w-md" />
      </div>
      <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
    </div>
  );
}

export function MultiWalletTableBodySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-6" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-3 w-16" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-14" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function MultiWalletPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Generate panel */}
      <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
        <PanelHeaderSkeleton />
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-10 w-44 rounded-md" />
        </div>
      </div>

      {/* Fund & buy panel */}
      <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
        <PanelHeaderSkeleton />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-10 w-56 rounded-md" />
      </div>

      {/* Wallets table */}
      <div className={cn(overviewCardShell, "overflow-hidden")}>
        <div className="border-b border-border/40 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["#", "Address", "SOL", "$ANSEM", "Status", "Actions"].map((col) => (
                  <th key={col} className="h-10 px-4 text-left">
                    <Skeleton className="h-3 w-12" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <MultiWalletTableBodySkeleton rows={6} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
