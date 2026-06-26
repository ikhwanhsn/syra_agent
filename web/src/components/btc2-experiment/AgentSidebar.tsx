import { motion } from "framer-motion";
import { Wallet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { PriceChart } from "./charts/PriceChart";
import type { AgentRuntime, SparklinePoint } from "@/lib/btc2/types";
import { formatUsd } from "@/lib/btc2/format";

function SidebarTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/25 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function AgentSidebar({
  runtime,
  priceHistory,
}: {
  runtime: AgentRuntime;
  priceHistory: SparklinePoint[];
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
        <p className={cn(overviewKickerClass, "mb-3 text-[10px]")}>Agent Runtime</p>
        <div className="grid grid-cols-2 gap-2">
          <SidebarTile label="Runs Today" value={String(runtime.transactionsToday)} />
          <SidebarTile label="Signals Today" value={String(runtime.predictionsToday)} />
        </div>
      </div>

      <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
        <p className={cn(overviewKickerClass, "mb-3 text-[10px]")}>Wallet & Treasury</p>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-500" />
          <span className="font-mono text-sm">{runtime.wallet}</span>
        </div>
        <p className="mt-3 text-[10px] uppercase text-muted-foreground">Leader Equity</p>
        <p className="font-mono text-xl font-semibold tabular-nums">
          {formatUsd(runtime.treasuryBalance, true)}
        </p>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          BTC Price (Onchain OHLCV)
        </p>
        <PriceChart data={priceHistory} />
      </div>
    </motion.aside>
  );
}
