import { Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function healthTone(ratio: number | null): "safe" | "warning" | "danger" {
  if (ratio == null) return "warning";
  if (ratio >= 5) return "safe";
  if (ratio >= 2) return "warning";
  return "danger";
}

function toneClass(tone: "safe" | "warning" | "danger"): string {
  if (tone === "safe") return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
  if (tone === "danger") return "border-red-500/30 text-red-600 dark:text-red-400";
  return "border-amber-500/30 text-amber-700 dark:text-amber-400";
}

export interface PumpfunLiquidityPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunLiquidityPanel({ data, className }: PumpfunLiquidityPanelProps) {
  const pumpfun = data.pumpfun.ok ? data.pumpfun.data : null;
  const market = data.market;
  const liquidityUsd = market.liquidityUsd ?? pumpfun?.bondingLiquidityUsd ?? null;
  const mcapUsd = market.marketCapUsd ?? pumpfun?.marketCapUsd ?? null;
  const volume24h = market.volume24hUsd ?? pumpfun?.dexPair?.volume24hUsd ?? null;
  const liqRatio = liquidityUsd != null && mcapUsd != null && mcapUsd > 0 ? (liquidityUsd / mcapUsd) * 100 : null;
  const volLiqRatio =
    volume24h != null && liquidityUsd != null && liquidityUsd > 0 ? volume24h / liquidityUsd : null;
  const tone = healthTone(liqRatio);
  const isBonding = pumpfun?.complete === false;
  const isGraduated = pumpfun?.complete === true;

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Droplets className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Liquidity health</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            Depth, launch stage, and liquidity-to-mcap ratio
          </h3>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {isGraduated ? (
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Graduated — DEX liquidity
            </Badge>
          ) : isBonding ? (
            <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400">
              Bonding curve — virtual liquidity
            </Badge>
          ) : (
            <Badge variant="outline">Stage unknown</Badge>
          )}
          <Badge variant="outline" className={cn("font-mono tabular-nums", toneClass(tone))}>
            {liqRatio != null ? `${liqRatio.toFixed(1)}% liq/mcap` : "Ratio unknown"}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Liquidity", value: formatCompactUsd(liquidityUsd) },
            { label: "Market cap", value: formatCompactUsd(mcapUsd) },
            { label: "24h volume", value: formatCompactUsd(volume24h) },
            {
              label: "Vol / Liq",
              value: volLiqRatio != null ? `${volLiqRatio.toFixed(1)}x` : "—",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{row.value}</p>
            </div>
          ))}
        </div>

        {liqRatio != null ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Liquidity vs market cap</span>
              <span className="font-mono tabular-nums">{liqRatio.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(liqRatio, 20) * 5} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Healthy memecoins typically maintain 5%+ liquidity-to-mcap. LP lock/burn status is best-effort when provider data is available.
            </p>
          </div>
        ) : null}

        {market.dexPair?.dexId ? (
          <div className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-sm text-muted-foreground">
            Primary DEX: <span className="font-medium text-foreground">{market.dexPair.dexId}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
