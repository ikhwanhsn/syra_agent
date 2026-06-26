import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "./shared/SectionHeader";
import { SignalBadge } from "./shared/SignalBadge";
import type { TradeRecord } from "@/lib/btc2/types";
import { formatBtcPrice, formatDuration, formatHash, formatUsd } from "@/lib/btc2/format";

export function RecentTrades({ trades }: { trades: TradeRecord[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 11"
        title="Recent Decisions"
        description="Closed and active trade decisions with entry, exit, PnL, and onchain verification."
      />

      <div className={cn(overviewCardShell, "overflow-hidden rounded-2xl")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase">Time</TableHead>
                <TableHead className="text-[10px] uppercase">Signal</TableHead>
                <TableHead className="text-[10px] uppercase">Conf</TableHead>
                <TableHead className="text-[10px] uppercase">Entry</TableHead>
                <TableHead className="text-[10px] uppercase">Exit</TableHead>
                <TableHead className="text-[10px] uppercase">PnL</TableHead>
                <TableHead className="text-[10px] uppercase">Duration</TableHead>
                <TableHead className="text-[10px] uppercase">Risk</TableHead>
                <TableHead className="text-[10px] uppercase">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.slice(0, 12).map((t) => (
                <TableRow key={t.id} className="border-border/40">
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <SignalBadge signal={t.signal} />
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {Math.round(t.confidence)}%
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {formatBtcPrice(t.entry)}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {formatBtcPrice(t.exit)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      t.pnl >= 0 ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    {formatUsd(t.pnl)}
                  </TableCell>
                  <TableCell className="text-xs">{formatDuration(t.durationMin)}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {(t.riskScore * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="font-mono text-[10px]">{formatHash(t.hash, 4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.section>
  );
}
