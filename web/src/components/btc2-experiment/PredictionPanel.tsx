import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Gauge } from "./shared/Gauge";
import { SectionHeader } from "./shared/SectionHeader";
import { SignalBadge } from "./shared/SignalBadge";
import { ProbabilityDistribution } from "./charts/ProbabilityDistribution";
import type { EnsemblePrediction } from "@/lib/btc2/types";
import { formatPct } from "@/lib/btc2/format";

function dominantSignal(p: EnsemblePrediction) {
  const max = Math.max(p.bullish, p.neutral, p.bearish);
  if (max === p.bullish) return "bullish" as const;
  if (max === p.bearish) return "bearish" as const;
  return "neutral" as const;
}

export function PredictionPanel({ prediction }: { prediction: EnsemblePrediction }) {
  const signal = dominantSignal(prediction);
  const gaugeColor = signal === "bullish" ? "emerald" : signal === "bearish" ? "red" : "amber";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 04"
        title="Signal & Strategy Cohort"
        description="Live onchain signal from CryptoAnalysisEngine plus top sim strategy agents ranked by cohort performance."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={cn(overviewCardShell, "flex flex-col items-center justify-center rounded-2xl p-6 lg:col-span-1")}>
          <Gauge
            value={prediction.confidence}
            label={`${Math.round(prediction.confidence)}%`}
            sublabel="Model Confidence"
            color={gaugeColor}
            size={140}
          />
          <div className="mt-4 flex gap-3">
            <div className="text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Bullish</p>
              <p className="font-mono text-sm font-semibold text-emerald-500">
                {prediction.bullish.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Neutral</p>
              <p className="font-mono text-sm font-semibold text-amber-500">
                {prediction.neutral.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Bearish</p>
              <p className="font-mono text-sm font-semibold text-red-500">
                {prediction.bearish.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <SignalBadge signal={signal} />
          </div>
        </div>

        <div className={cn(overviewCardShell, "rounded-2xl p-4 lg:col-span-2")}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Horizon", value: prediction.horizon },
              { label: "Expected Return", value: formatPct(prediction.expectedReturn, true) },
              { label: "Expected Drawdown", value: formatPct(prediction.expectedDrawdown) },
              { label: "Risk / Reward", value: prediction.riskReward.toFixed(2) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/40 bg-background/25 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Strategy Cohort
          </p>
          <div className="space-y-2">
            {prediction.models.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/35 bg-background/20 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{m.name}</span>
                  <SignalBadge signal={m.prediction} />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono tabular-nums text-muted-foreground">
                    conf {Math.round(m.confidence)}%
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    w {(m.weight * 100).toFixed(0)}%
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatPct(m.expectedReturn, true)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trade PnL Distribution
          </p>
          <ProbabilityDistribution data={prediction.distribution} />
        </div>
      </div>
    </motion.section>
  );
}
