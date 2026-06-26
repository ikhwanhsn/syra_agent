import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { FactorBar } from "./shared/FactorBar";
import { SectionHeader } from "./shared/SectionHeader";
import { SignalBadge } from "./shared/SignalBadge";
import type { QuantFactor } from "@/lib/btc2/types";
import { formatConfidence, formatScore } from "@/lib/btc2/format";

function aggregateSignal(factors: QuantFactor[]) {
  const bullish = factors.filter((f) => f.signal === "bullish").length;
  const bearish = factors.filter((f) => f.signal === "bearish").length;
  if (bullish > bearish + 2) return "bullish" as const;
  if (bearish > bullish + 2) return "bearish" as const;
  return "neutral" as const;
}

export function SignalEngine({ factors }: { factors: QuantFactor[] }) {
  const signal = aggregateSignal(factors);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          kicker="Section 02"
          title="Quant Signal Engine"
          description="Multi-factor scoring with weighted confidence across market microstructure signals."
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Composite Signal</span>
          <SignalBadge signal={signal} />
        </div>
      </div>

      <div className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factors.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="space-y-2 rounded-xl border border-border/40 bg-background/25 p-3 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{f.label}</span>
                <SignalBadge signal={f.signal} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {formatScore(f.score)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  w {(f.weight * 100).toFixed(0)}% · {formatConfidence(f.confidence)}
                </span>
              </div>
              <FactorBar score={f.score} signal={f.signal} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
