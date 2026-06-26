import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bitcoin,
  Gauge,
  Layers,
  LineChart,
  Percent,
  Scale,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MetricCard } from "./shared/MetricCard";
import { SectionHeader } from "./shared/SectionHeader";
import type { MarketMetric } from "@/lib/btc2/types";

const ICONS: Record<string, LucideIcon> = {
  btc: Bitcoin,
  chg24: TrendingUp,
  vol24: BarChart3,
  mcap: Layers,
  funding: Percent,
  oi: Activity,
  vol: Waves,
  fg: Gauge,
  oracle: Zap,
  regime: LineChart,
  liq: Scale,
  spread: TrendingDown,
};

export function MarketOverview({ metrics }: { metrics: MarketMetric[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 01"
        title="Live Market Overview"
        description="Real-time onchain cbBTC/USDC spot market telemetry from Birdeye and Jupiter."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
          >
            <MetricCard
              label={m.label}
              value={m.displayValue}
              changePct={m.changePct}
              sparkline={m.sparkline}
              icon={ICONS[m.id]}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
