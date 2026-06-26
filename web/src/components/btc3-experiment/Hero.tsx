import { Link } from "@/lib/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Pause, Play, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
import type { Btc3Hero } from "@/lib/btc3/types";
import { formatConfidence, formatPct, formatRegime, formatRelativeTime, formatUsd } from "@/lib/btc3/format";

export function Hero({
  hero,
  paused,
  onTogglePause,
  onRefresh,
}: {
  hero: Btc3Hero;
  paused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-blue-500/15")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/overview" aria-label="Back to dashboard overview">
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div
                  className={cn(
                    overviewKickerClass,
                    "inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1",
                  )}
                >
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  Macro Intelligence
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">
                  Paper sim
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase">
                  Spot only
                </Badge>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {hero.pipelineStatus}
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.85rem]">
                  {hero.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Evidence-based macro news analysis for Bitcoin spot allocation. Paper sim first —
                  $1,000 auto-rebalance desk; real Jupiter execution requires approval.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onTogglePause}>
                {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {paused ? "Resume" : "Pause"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "BTC Allocation", value: formatPct(hero.currentRecommendation.btcPct) },
              { label: "USDC Allocation", value: formatPct(hero.currentRecommendation.usdcPct) },
              { label: "Confidence", value: formatConfidence(hero.confidence) },
              { label: "Macro Regime", value: formatRegime(hero.macroRegime) },
              { label: "Market Regime", value: formatRegime(hero.marketRegime) },
              { label: "Last Scan", value: formatRelativeTime(hero.lastScanAt) },
              { label: "Articles", value: `${hero.articlesProcessed} / ${hero.articlesTotal}` },
              { label: "Predictions", value: String(hero.predictionsGenerated) },
              { label: "Paper Equity", value: hero.paperEquityUsd != null ? formatUsd(hero.paperEquityUsd) : "—" },
              { label: "Paper Return", value: hero.paperReturnPct != null ? `${hero.paperReturnPct >= 0 ? "+" : ""}${hero.paperReturnPct.toFixed(2)}%` : "—" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-border/40 bg-background/30 px-3 py-2.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {kpi.label}
                </p>
                <p className={cn("mt-1", overviewMetricValueClass, "text-base")}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
