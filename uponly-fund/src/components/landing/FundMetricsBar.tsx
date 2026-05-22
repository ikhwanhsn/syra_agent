import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { FUND_STATS } from "@/data/fundStats";
import { getPortfolioTotals, FUND_PORTFOLIO } from "@/data/fundPortfolio";
import { formatPctSigned, formatUsd } from "@/lib/marketDisplayFormat";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { cn } from "@/lib/utils";
import { landingViewport, staggerContainerRaise, staggerItem } from "./landingMotion";

const portfolioTotals = getPortfolioTotals(FUND_PORTFOLIO);

const metrics = [
  {
    label: "Assets under management",
    value: FUND_STATS.aumUsd,
    format: "usd" as const,
    hint: "Program capital · Solana-native",
  },
  {
    label: "Portfolio return",
    value: portfolioTotals.blendedReturnPct * 100,
    format: "pct" as const,
    hint: "Mark-to-model · active book",
  },
  {
    label: "Active positions",
    value: portfolioTotals.activeCount,
    format: "int" as const,
    hint: "Deployed & compounding",
  },
  {
    label: "30d realized P&L",
    value: FUND_STATS.realizedPnl30dUsd,
    format: "usd" as const,
    hint: "Profitable operating history",
  },
] as const;

function MetricValue({
  format,
  value,
  disabled,
}: {
  format: "usd" | "pct" | "int";
  value: number;
  disabled: boolean;
}) {
  const animated = useAnimatedNumber(value, { disabled });
  if (format === "usd") {
    return (
      <span className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.75rem] md:text-[2rem]">
        {formatUsd(animated, { compact: true })}
      </span>
    );
  }
  if (format === "pct") {
    return (
      <span className="inline-flex items-center gap-2 font-display text-2xl font-semibold tracking-[-0.03em] text-[hsl(var(--ds-positive))] sm:text-[1.75rem] md:text-[2rem]">
        <TrendingUp className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
        {formatPctSigned(animated)}
      </span>
    );
  }
  return (
    <span className="font-display text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-[1.75rem] md:text-[2rem]">
      {Math.round(animated)}
    </span>
  );
}

type FundMetricsBarProps = {
  className?: string;
};

/** Institutional KPI strip — Binance Labs–style fund metrics. */
export function FundMetricsBar({ className }: FundMetricsBarProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={cn(
        "landing-fund-metrics grid grid-cols-1 overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.05)] backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      variants={reduce ? undefined : staggerContainerRaise}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={landingViewport}
    >
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          variants={reduce ? undefined : staggerItem}
          className={cn(
            "relative flex flex-col justify-center px-6 py-8 sm:px-8 md:py-10",
            i > 0 && "border-t border-border/45 sm:border-l sm:border-t-0",
            i >= 2 && "lg:border-t-0",
            i === 2 && "sm:border-t lg:border-l lg:border-t-0",
          )}
        >
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            {m.label}
          </p>
          <div className="mt-3">
            <MetricValue format={m.format} value={m.value} disabled={reduce} />
          </div>
          <p className="mt-2.5 text-sm leading-snug text-muted-foreground/90">{m.hint}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
