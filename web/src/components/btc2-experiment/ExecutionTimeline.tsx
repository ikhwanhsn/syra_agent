import { motion } from "framer-motion";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "./shared/SectionHeader";
import type { ExecutionEvent } from "@/lib/btc2/types";
import { formatBtcPrice, formatHash, formatMs, formatUsd } from "@/lib/btc2/format";

const decisionLabels: Record<ExecutionEvent["decision"], string> = {
  buy: "Buy cbBTC",
  sell: "Sell cbBTC",
  scale_in: "Scale In",
  scale_out: "Scale Out",
  close: "Close",
};

const decisionColors: Record<ExecutionEvent["decision"], string> = {
  buy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  sell: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  scale_in: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  scale_out: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  close: "border-muted-foreground/30 bg-muted/30 text-muted-foreground",
};

export function ExecutionTimeline({ executions }: { executions: ExecutionEvent[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 06"
        title="Execution Engine"
        description="Spot execution via Jupiter — USDC ↔ cbBTC swaps with slippage and onchain tx proofs."
      />

      <div className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="relative space-y-0">
          {executions.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {i < executions.length - 1 ? (
                <div className="absolute left-[11px] top-6 h-full w-px bg-border/60" />
              ) : null}
              <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15">
                {e.status === "confirmed" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-border/40 bg-background/25 p-3 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("rounded-md text-[10px] uppercase", decisionColors[e.decision])}
                  >
                    {decisionLabels[e.decision]}
                  </Badge>
                  <Badge variant="outline" className="rounded-md text-[10px] uppercase">
                    {e.venue}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">Price </span>
                    <span className="font-mono">{formatBtcPrice(e.executionPrice)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Slippage </span>
                    <span className="font-mono">{e.slippage.toFixed(3)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fees </span>
                    <span className="font-mono">{formatUsd(e.fees)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Profit </span>
                    <span
                      className={cn(
                        "font-mono",
                        e.estimatedProfit >= 0 ? "text-emerald-500" : "text-red-500",
                      )}
                    >
                      {formatUsd(e.estimatedProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency </span>
                    <span className="font-mono">{formatMs(e.latencyMs)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence </span>
                    <span className="font-mono">{Math.round(e.confidence)}%</span>
                  </div>
                  <div className="flex items-center gap-1 sm:col-span-2">
                    <span className="text-muted-foreground">Tx </span>
                    <span className="font-mono text-[10px]">{formatHash(e.txHash, 8)}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
