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

export function OrganizeSummarySkeleton() {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading summary">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn(overviewCardShell, "space-y-2 p-4")}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export function OrganizeTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300" aria-busy="true" aria-label="Loading entries">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-full rounded-md sm:w-[180px]" />
        <Skeleton className="h-10 w-full rounded-md sm:w-[180px]" />
      </div>

      <div className={cn(overviewCardShell, "overflow-x-auto")}>
        <Table>
          <TableHeader>
            <TableRow>
              {["Title", "Type", "Status", "Organizer", "Deadline", "Event", "Amount", ""].map(
                (label) => (
                  <TableHead key={label}>
                    <Skeleton className="h-3 w-14" />
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 max-w-full" />
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-12 rounded-full" />
                      <Skeleton className="h-4 w-14 rounded-full" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3 w-16" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-3 w-12" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
