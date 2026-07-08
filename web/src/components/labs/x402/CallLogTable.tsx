import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import type { LabX402Call } from "@/lib/labsX402Api";

function statusVariant(status: LabX402Call["status"]) {
  switch (status) {
    case "success":
      return "default" as const;
    case "refund_failed":
    case "payment_failed":
    case "error":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

interface CallLogTableProps {
  calls: LabX402Call[];
  isLoading: boolean;
}

export function CallLogTable({ calls, isLoading }: CallLogTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        Loading call log…
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className={cn(overviewCardShell, "p-8 text-center text-sm text-muted-foreground")}>
        No x402 calls yet. Run a payment manually or enable auto-calls.
      </div>
    );
  }

  return (
    <div className={cn(overviewCardShell, "overflow-hidden")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Payer</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trigger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="font-mono text-xs">{c.endpoint}</TableCell>
              <TableCell className="font-mono text-xs" title={c.payerAddress}>
                {shortenAddress(c.payerAddress)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                ${c.priceUsd.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              </TableCell>
              <TableCell className="text-xs capitalize text-muted-foreground">{c.trigger}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
