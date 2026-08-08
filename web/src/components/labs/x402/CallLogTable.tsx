import { CallLogTableSkeleton } from "@/components/labs/LabsSkeleton";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
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
import type { LabChain, LabX402Call } from "@/lib/labsX402Api";

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

function shortenTx(tx: string): string {
  if (tx.length <= 14) return tx;
  return `${tx.slice(0, 6)}…${tx.slice(-4)}`;
}

function shortenError(error: string | null): string {
  if (!error) return "-";
  const cleaned = error.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 72) return cleaned;
  return `${cleaned.slice(0, 69)}…`;
}

function explorerTxUrl(chain: LabChain, tx: string): string {
  const id = encodeURIComponent(tx);
  switch (chain) {
    case "algorand":
      return `https://allo.info/tx/${id}`;
    case "base":
      return `https://basescan.org/tx/${id}`;
    case "xlayer":
      return `https://www.oklink.com/xlayer/tx/${id}`;
    default:
      return `https://solscan.io/tx/${id}`;
  }
}

function facilitatorLabel(
  facilitator: LabX402Call["facilitator"] | undefined,
  chain: LabChain,
  endpoint: string,
): string {
  // Synthetic treasury / funding rows are not settled payments.
  if (endpoint === "(treasury)" || endpoint === "(funding)") return "-";
  switch (facilitator) {
    case "payai":
      return "PayAI";
    case "okx":
      return "OKX";
    case "goplausible":
      return "GoPlausible";
    case "dexter":
      return "Dexter";
    default:
      break;
  }
  // Legacy rows without facilitator: infer from endpoint / chain rail.
  if (endpoint.includes("ecosystem-brief")) return "PayAI";
  if (chain === "xlayer") return "OKX";
  if (chain === "algorand") return "GoPlausible";
  return "Dexter";
}

function facilitatorBadgeClass(label: string): string {
  switch (label) {
    case "-":
      return "bg-muted text-muted-foreground";
    case "PayAI":
      return "bg-violet-500/15 text-violet-600 dark:text-violet-400";
    case "OKX":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "GoPlausible":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    default:
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400";
  }
}

interface CallLogTableProps {
  calls: LabX402Call[];
  isLoading: boolean;
  chain?: LabChain;
}

/** Only the latest calls are shown; older entries are intentionally hidden. */
const MAX_VISIBLE_CALLS = 10;

export function CallLogTable({ calls, isLoading, chain = "solana" }: CallLogTableProps) {
  const showSkeleton = useMinimumSkeleton(isLoading);
  const visibleCalls = calls.slice(0, MAX_VISIBLE_CALLS);

  if (showSkeleton) {
    return <CallLogTableSkeleton />;
  }

  if (visibleCalls.length === 0) {
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
            <TableHead>Facilitator</TableHead>
            <TableHead>Tx</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Trigger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleCalls.map((c) => {
            const rowChain = c.chain ?? chain;
            const paymentTx = c.paymentTx?.trim() || null;
            const refundTx = c.refundTx?.trim() || null;
            const facLabel = facilitatorLabel(c.facilitator, rowChain, c.endpoint);
            return (
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
                <TableCell>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      facilitatorBadgeClass(facLabel),
                    )}
                  >
                    {facLabel}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {paymentTx || refundTx ? (
                    <div className="flex flex-col gap-0.5">
                      {paymentTx ? (
                        <a
                          href={explorerTxUrl(rowChain, paymentTx)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                          title={paymentTx}
                        >
                          {shortenTx(paymentTx)}
                        </a>
                      ) : null}
                      {refundTx ? (
                        <a
                          href={explorerTxUrl(rowChain, refundTx)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground underline-offset-2 hover:underline"
                          title={`Refund: ${refundTx}`}
                        >
                          r:{shortenTx(refundTx)}
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell
                  className="max-w-[220px] truncate text-xs text-muted-foreground"
                  title={c.error ?? undefined}
                >
                  {shortenError(c.error)}
                </TableCell>
                <TableCell className="text-xs capitalize text-muted-foreground">
                  {c.trigger}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
