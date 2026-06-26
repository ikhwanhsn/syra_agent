import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bitcoin, Pause, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
import { AnimatedNumber } from "./shared/AnimatedNumber";
import { SignalBadge } from "./shared/SignalBadge";
import type { HeroKpis } from "@/lib/btc2/types";
import { formatBtcPrice, formatPct, formatUsd } from "@/lib/btc2/format";

export interface HeroProps {
  hero: HeroKpis;
  paused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
}

function KpiTile({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-background/30 px-3 py-2.5 backdrop-blur-sm",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function Hero({ hero, paused, onTogglePause, onRefresh }: HeroProps) {
  const regimeLabel = hero.marketRegime.charAt(0).toUpperCase() + hero.marketRegime.slice(1);
  const pnlPositive = hero.currentPnl >= 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-amber-500/15")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: overviewAccentBackground("experiment") }}
        aria-hidden
      />

      <div className="relative px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/overview" aria-label="Back to dashboard overview">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-border/55 bg-background/45 backdrop-blur-md"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div
                  className={cn(
                    overviewKickerClass,
                    "inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1 backdrop-blur-md",
                  )}
                >
                  <Bitcoin className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  Institutional · Solana
                </div>
                <Badge
                  variant="outline"
                  className="rounded-lg border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300"
                >
                  Spot only
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-lg border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300"
                >
                  Experimental
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300"
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-lg border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300"
                >
                  {paused ? "Paused" : "Running"}
                </Badge>
              </div>

              <div className="space-y-2">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
                  Bitcoin Quant Agent
                </h1>
                <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
                  Spot-only autonomous Bitcoin intelligence on Solana — cbBTC/USDC via Jupiter swaps.
                  No perps, no leverage, no futures.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-2 rounded-xl border-border/55 bg-background/45 px-4 font-medium backdrop-blur-md"
                onClick={onTogglePause}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-2 rounded-xl border-border/55 bg-background/45 px-4 font-medium backdrop-blur-md"
                onClick={onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <KpiTile label="BTC Price · Realtime">
              <p className={overviewMetricValueClass}>
                <AnimatedNumber value={hero.btcPrice} format={formatBtcPrice} />
              </p>
            </KpiTile>
            <KpiTile label="Current PnL">
              <p
                className={cn(
                  overviewMetricValueClass,
                  pnlPositive ? "text-emerald-500" : "text-red-500",
                )}
              >
                <AnimatedNumber value={hero.currentPnl} format={(v) => formatUsd(v)} />
              </p>
            </KpiTile>
            <KpiTile label="Agent Status">
              <p className="text-sm font-semibold capitalize text-foreground">
                {hero.agentStatus}
              </p>
            </KpiTile>
            <KpiTile label="Market Regime">
              <p className="text-sm font-semibold text-foreground">{regimeLabel}</p>
            </KpiTile>
            <KpiTile label="Confidence">
              <p className={overviewMetricValueClass}>
                <AnimatedNumber value={hero.confidence} format={(v) => `${Math.round(v)}%`} decimals={0} />
              </p>
            </KpiTile>
            <KpiTile label="Position">
              <div className="pt-0.5">
                <SignalBadge signal={hero.position} />
              </div>
            </KpiTile>
            <KpiTile label="Portfolio Value" className="col-span-2 sm:col-span-1 lg:col-span-1">
              <p className={overviewMetricValueClass}>
                <AnimatedNumber value={hero.portfolioValue} format={(v) => formatUsd(v, true)} decimals={0} />
              </p>
            </KpiTile>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
