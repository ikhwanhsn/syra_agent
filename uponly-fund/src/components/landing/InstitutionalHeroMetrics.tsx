import { motion, useReducedMotion } from "framer-motion";
import { FUND_STATS } from "@/data/fundStats";
import { formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { LANDING_EASE } from "./landingMotion";

const deployedPct = Math.round((FUND_STATS.deployedUsd / FUND_STATS.aumUsd) * 1000) / 10;
const winRatePct = Math.round(FUND_STATS.winRate30d * 1000) / 10;

type InstitutionalHeroMetricsProps = {
  className?: string;
};

export function InstitutionalHeroMetrics({ className }: InstitutionalHeroMetricsProps) {
  const reduceMotion = useReducedMotion() ?? false;

  const metrics = [
    { label: "Assets under management", value: formatUsd(FUND_STATS.aumUsd, { compact: true }) },
    { label: "Capital deployed", value: `${deployedPct}%` },
    { label: "30-day win rate", value: `${winRatePct}%` },
    { label: "Unrealized P&L", value: formatUsd(FUND_STATS.unrealizedPnlUsd, { compact: true }) },
  ] as const;

  return (
    <div className={cn("landing-institutional-panel w-full", className)}>
      <div className="landing-institutional-panel-header flex items-center justify-between gap-4 border-b border-border/50 px-6 py-4 sm:px-8">
        <div>
          <p className="landing-eyebrow">Fund overview</p>
          <p className="mt-1 text-xs text-muted-foreground">
            As of{" "}
            {new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(
              new Date(FUND_STATS.asOfIso),
            )}
          </p>
        </div>
        <span className="rounded border border-uof/30 bg-uof/[0.08] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-uof">
          Live book
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border/40 sm:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="bg-card/60 px-5 py-6 sm:px-6 sm:py-7"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.15 + i * 0.07, ease: LANDING_EASE }}
          >
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {m.label}
            </p>
            <p className="landing-stat-numeral mt-2 text-foreground">{m.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-border/50 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Allocation thesis
          </p>
          <p className="text-xs text-muted-foreground">Target sleeve weights</p>
        </div>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-sm bg-muted/60">
          <motion.div
            className="h-full bg-uof/90"
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? false : { width: "80%" }}
            transition={{ duration: 0.9, delay: reduceMotion ? 0 : 0.4, ease: LANDING_EASE }}
            aria-hidden
          />
          <motion.div
            className="h-full bg-foreground/25"
            initial={reduceMotion ? false : { width: 0 }}
            animate={reduceMotion ? false : { width: "20%" }}
            transition={{ duration: 0.9, delay: reduceMotion ? 0 : 0.55, ease: LANDING_EASE }}
            aria-hidden
          />
        </div>
        <div className="mt-3 flex justify-between text-xs">
          <span className="font-medium text-foreground/90">
            <span className="tabular-nums font-semibold text-uof">80%</span> High conviction
          </span>
          <span className="font-medium text-muted-foreground">
            <span className="tabular-nums font-semibold text-foreground/80">20%</span> Asymmetric
          </span>
        </div>
      </div>
    </div>
  );
}
