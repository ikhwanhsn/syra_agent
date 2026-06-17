import { DollarSign, Droplets, LineChart, TrendingDown, TrendingUp } from "lucide-react";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import { formatPortfolioTokenAmount } from "@/lib/format";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function formatPrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  return `$${formatPortfolioTokenAmount(price).display}`;
}

export interface PumpfunStatGridProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunStatGrid({ data, className }: PumpfunStatGridProps) {
  const { market } = data;
  const change24 = market.priceChange24hPercent;
  const change1h = market.priceChange1hPercent;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      <OverviewStatCard
        label="Price"
        value={formatPrice(market.priceUsd)}
        icon={DollarSign}
        accent="neutral"
        compact
      />
      <OverviewStatCard
        label="Market cap"
        value={formatCompactUsd(market.marketCapUsd)}
        icon={LineChart}
        accent="marketplace"
        compact
      />
      <OverviewStatCard
        label="Liquidity"
        value={formatCompactUsd(market.liquidityUsd)}
        icon={Droplets}
        accent="alpha"
        compact
      />
      <OverviewStatCard
        label="24h volume"
        value={formatCompactUsd(market.volume24hUsd)}
        icon={TrendingUp}
        accent="experiment"
        compact
      />
      <OverviewStatCard
        label="24h change"
        value={change24 != null ? formatPct(change24) : "—"}
        icon={change24 != null && change24 < 0 ? TrendingDown : TrendingUp}
        accent={change24 != null && change24 < 0 ? "internal" : "alpha"}
        compact
      />
      <OverviewStatCard
        label="1h change"
        value={change1h != null ? formatPct(change1h) : "—"}
        icon={change1h != null && change1h < 0 ? TrendingDown : TrendingUp}
        accent={change1h != null && change1h < 0 ? "internal" : "alpha"}
        compact
      />
    </div>
  );
}
