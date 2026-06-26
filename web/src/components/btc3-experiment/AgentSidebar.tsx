import { motion } from "framer-motion";
import { Activity, Brain, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { Btc3PaperTrading, Btc3Runtime } from "@/lib/btc3/types";
import { formatPct, formatRegime, formatUsd } from "@/lib/btc3/format";

export function AgentSidebar({
  runtime,
  paper,
}: {
  runtime: Btc3Runtime;
  paper: Btc3PaperTrading | null;
}) {
  return (
    <motion.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
        <p className={cn(overviewKickerClass, "mb-3 text-[10px]")}>Paper Sim</p>
        {paper ? (
          <div className="space-y-2 text-sm">
            <p className="font-mono text-lg font-semibold">{formatUsd(paper.equityUsd)}</p>
            <p className="text-xs text-muted-foreground">
              {paper.returnPct != null ? `${paper.returnPct >= 0 ? "+" : ""}${paper.returnPct.toFixed(2)}%` : "—"} ·{" "}
              {paper.rebalanceCount} rebalances
            </p>
            <p className="text-xs">
              {formatPct(paper.allocation.btcPct)} BTC / {formatPct(paper.allocation.usdcPct)} USDC
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Awaiting bootstrap</p>
        )}
      </div>

      <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
        <p className={cn(overviewKickerClass, "mb-3 text-[10px]")}>Agent Runtime</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span>Pipeline: {formatRegime(runtime.pipelineStatus)}</span>
          </div>
          {runtime.lastPipelineRunId ? (
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              Run: {runtime.lastPipelineRunId.slice(0, 8)}…
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
        <p className={cn(overviewKickerClass, "mb-3 text-[10px]")}>Services</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant={runtime.llmConfigured ? "default" : "outline"}>
            <Brain className="mr-1 h-3 w-3" />
            LLM
          </Badge>
          <Badge variant={runtime.embeddingConfigured ? "default" : "outline"}>
            Embeddings
          </Badge>
          <Badge variant={runtime.qdrantConfigured ? "default" : "outline"}>
            <Database className="mr-1 h-3 w-3" />
            Qdrant
          </Badge>
        </div>
      </div>
    </motion.aside>
  );
}
