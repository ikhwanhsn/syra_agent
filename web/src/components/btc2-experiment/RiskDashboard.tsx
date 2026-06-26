import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Gauge } from "./shared/Gauge";
import { SectionHeader } from "./shared/SectionHeader";
import type { RiskMetrics } from "@/lib/btc2/types";
import { formatBtcPrice, formatPct } from "@/lib/btc2/format";

export function RiskDashboard({ risk }: { risk: RiskMetrics }) {
  const tiles = [
    { label: "Kelly Fraction", value: `${(risk.kellyFraction * 100).toFixed(1)}%` },
    { label: "Position Size", value: `${(risk.positionSize * 100).toFixed(1)}%` },
    { label: "Sharpe", value: risk.sharpe.toFixed(2) },
    { label: "Sortino", value: risk.sortino.toFixed(2) },
    { label: "CVaR", value: formatPct(risk.cvar) },
    { label: "VaR (95%)", value: formatPct(risk.var95) },
    { label: "Expected Value", value: risk.expectedValue.toFixed(2) },
    { label: "Drawdown", value: formatPct(risk.drawdown) },
    { label: "Portfolio Exposure", value: `${(risk.portfolioExposure * 100).toFixed(0)}%` },
    { label: "Volatility Target", value: `${risk.volatilityTarget.toFixed(1)}%` },
    { label: "Cash Reserve", value: `${(risk.cashReservePct * 100).toFixed(0)}%` },
    {
      label: "Stop Loss",
      value: risk.stopLossPrice > 0 ? formatBtcPrice(risk.stopLossPrice) : "—",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 05"
        title="Risk Engine"
        description="Spot-only risk controls — position sizing, cash reserves, and stop-loss levels. No leverage."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className={cn(overviewCardShell, "flex flex-col items-center justify-center rounded-2xl p-5")}>
          <Gauge
            value={risk.portfolioExposure * 100}
            label={`${(risk.portfolioExposure * 100).toFixed(0)}%`}
            sublabel="cbBTC Exposure"
            color="amber"
            size={120}
          />
        </div>
        <div className={cn(overviewCardShell, "flex flex-col items-center justify-center rounded-2xl p-5")}>
          <Gauge
            value={risk.cashReservePct * 100}
            label={`${(risk.cashReservePct * 100).toFixed(0)}%`}
            sublabel="USDC Reserve"
            color="emerald"
            size={120}
          />
        </div>
        <div className={cn(overviewCardShell, "flex flex-col items-center justify-center rounded-2xl p-5 lg:col-span-2")}>
          <div className="grid w-full grid-cols-2 gap-4">
            <div className="text-center">
              <Gauge
                value={Math.min(risk.sharpe / 3 * 100, 100)}
                label={risk.sharpe.toFixed(2)}
                sublabel="Sharpe"
                color="emerald"
                size={100}
              />
            </div>
            <div className="text-center">
              <Gauge
                value={Math.abs(risk.drawdown) / 20 * 100}
                label={formatPct(risk.drawdown)}
                sublabel="Drawdown"
                color="red"
                size={100}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.02 }}
            className={cn(overviewCardShell, "rounded-2xl p-4")}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
              {t.label}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums">{t.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
