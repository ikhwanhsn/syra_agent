import { Activity, Droplets, PauseCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatUsdCompact,
  highestLiquidityVenue,
  summarizeVenueStatus,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { spcxCardClass, spcxSectionTitleClass } from "@/components/spcx/spcxStyles";

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "live" | "halted" | "scam" | "muted";
}) {
  const toneClass =
    tone === "live"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "halted"
        ? "border-amber-500/30 bg-amber-500/5"
        : tone === "scam"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border/45 bg-muted/[0.04]";

  return (
    <div className={cn("rounded-xl border px-3 py-3 text-center sm:text-left", toneClass)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function SpcxVenueStatusSummary({ report }: { report: SpcxIntelligenceReport }) {
  const summary = summarizeVenueStatus(report);
  const bestLiquidity = highestLiquidityVenue(report);

  return (
    <Card className={spcxCardClass}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Market status
          </p>
          <h3 className={cn("mt-1 flex items-center gap-2", spcxSectionTitleClass)}>
            <Activity className="h-4 w-4 text-primary" />
            Where you can buy right now
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatusChip label="Open" value={String(summary.live)} tone="live" />
          <StatusChip label="Paused" value={String(summary.halted)} tone="halted" />
          <StatusChip label="Coming soon" value={String(summary.pending)} />
          <StatusChip label="Scams blocked" value={String(summary.scam)} tone="scam" />
        </div>

        {bestLiquidity ? (
          <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/[0.04] px-4 py-3.5 text-sm">
            <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                Easiest to buy: {bestLiquidity.symbol} via {bestLiquidity.venue}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatUsdCompact(bestLiquidity.liquidityUsd)} available to trade
                {bestLiquidity.spreadPct != null
                  ? ` · ${Math.abs(bestLiquidity.spreadPct).toFixed(1)}% ${bestLiquidity.spreadLabel ?? "gap"} vs stock`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 text-sm text-amber-800 dark:text-amber-200">
            <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              No live buying pool yet — this is normal during the IPO window. Check the 3 ways to
              buy above for exchange and brokerage options.
            </p>
          </div>
        )}

        {summary.scam > 0 ? (
          <p className="flex items-center gap-2 text-xs text-destructive">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            We blocked {summary.scam} fake token{summary.scam === 1 ? "" : "s"} — always verify before buying.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
