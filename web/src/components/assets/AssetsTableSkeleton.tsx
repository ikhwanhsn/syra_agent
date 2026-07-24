import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AssetsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden" aria-busy="true" aria-label="Loading assets">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="h-11 min-w-[180px] pl-4">
              <Skeleton className="h-3 w-12 rounded-md" />
            </TableHead>
            <TableHead className="hidden h-11 sm:table-cell">
              <Skeleton className="h-3 w-10 rounded-md" />
            </TableHead>
            <TableHead className="h-11 text-right">
              <Skeleton className="ml-auto h-3 w-10 rounded-md" />
            </TableHead>
            <TableHead className="h-11 text-right">
              <Skeleton className="ml-auto h-3 w-8 rounded-md" />
            </TableHead>
            <TableHead className="hidden h-11 text-right md:table-cell">
              <Skeleton className="ml-auto h-3 w-14 rounded-md" />
            </TableHead>
            <TableHead className="hidden h-11 pr-4 text-right lg:table-cell">
              <Skeleton className="ml-auto h-3 w-12 rounded-md" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i} className="border-border/40">
              <TableCell className="py-2.5 pl-4">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-12 rounded-md" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-16 rounded-md" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-12 rounded-md" />
              </TableCell>
              <TableCell className="hidden text-right md:table-cell">
                <Skeleton className="ml-auto h-4 w-16 rounded-md" />
              </TableCell>
              <TableCell className="hidden pr-4 text-right lg:table-cell">
                <Skeleton className="ml-auto h-4 w-16 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
