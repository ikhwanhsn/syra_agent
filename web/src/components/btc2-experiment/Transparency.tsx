import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { SectionHeader } from "./shared/SectionHeader";
import { SignalBadge } from "./shared/SignalBadge";
import type { OnchainPrediction } from "@/lib/btc2/types";
import { formatHash } from "@/lib/btc2/format";

const statusStyles = {
  verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function Transparency({ predictions }: { predictions: OnchainPrediction[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 08"
        title="Onchain Transparency"
        description="Every prediction recorded on Solana — verifiable hashes, model versions, and transaction proofs."
      />

      <div className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="space-y-3">
          {predictions.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col gap-2 rounded-xl border border-border/40 bg-background/25 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SignalBadge signal={p.decision} />
                <span className="text-xs text-muted-foreground">
                  {new Date(p.timestamp).toLocaleString()}
                </span>
                <Badge variant="outline" className="rounded-md text-[10px]">
                  {p.modelVersion}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  conf {Math.round(p.confidence)}%
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Hash</span>
                  <span className="font-mono">{formatHash(p.predictionHash, 6)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">Tx</span>
                  <span className="font-mono">{formatHash(p.txHash, 6)}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 rounded-md text-[10px] uppercase",
                    statusStyles[p.status],
                  )}
                >
                  {p.status === "verified" ? (
                    <BadgeCheck className="h-3 w-3" />
                  ) : null}
                  {p.status}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
