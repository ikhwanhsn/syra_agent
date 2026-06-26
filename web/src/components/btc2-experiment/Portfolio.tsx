import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { AllocationPie } from "./charts/AllocationPie";
import { SectionHeader } from "./shared/SectionHeader";
import type { PortfolioState } from "@/lib/btc2/types";
import { formatPct, formatUsd } from "@/lib/btc2/format";

export function Portfolio({ portfolio }: { portfolio: PortfolioState }) {
  const returnTiles = [
    { label: "Daily Return", value: portfolio.dailyReturn },
    { label: "Weekly Return", value: portfolio.weeklyReturn },
    { label: "Monthly Return", value: portfolio.monthlyReturn },
    { label: "Max Drawdown", value: portfolio.maxDrawdown },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="space-y-4"
    >
      <SectionHeader
        kicker="Section 07"
        title="Portfolio"
        description="Multi-asset allocation across BTC, SOL, and USDC treasury positions."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(overviewCardShell, "rounded-2xl p-4")}>
          <AllocationPie assets={portfolio.assets} />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Available Balance", value: formatUsd(portfolio.availableBalance) },
              {
                label: "Unrealized PnL",
                value: formatUsd(portfolio.unrealizedPnl),
                positive: portfolio.unrealizedPnl >= 0,
              },
              {
                label: "Realized PnL",
                value: formatUsd(portfolio.realizedPnl),
                positive: portfolio.realizedPnl >= 0,
              },
              { label: "Total Value", value: formatUsd(portfolio.totalValue, true) },
            ].map((item) => (
              <div key={item.label} className={cn(overviewCardShell, "rounded-2xl p-4")}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                  {item.label}
                </p>
                <p
                  className={cn(
                    "mt-2 font-mono text-lg font-semibold tabular-nums",
                    item.positive === true && "text-emerald-500",
                    item.positive === false && "text-red-500",
                  )}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {returnTiles.map((t) => (
              <div key={t.label} className={cn(overviewCardShell, "rounded-2xl p-3")}>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                  {t.label}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-sm font-semibold tabular-nums",
                    t.value >= 0 ? "text-emerald-500" : "text-red-500",
                  )}
                >
                  {formatPct(t.value, true)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
