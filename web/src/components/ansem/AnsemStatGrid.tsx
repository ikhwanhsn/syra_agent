import { Activity, BarChart3, Droplets, TrendingUp, Users, Wallet } from "lucide-react";
import { AnsemStatCardSkeleton } from "@/components/ansem/ansemSkeletons";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import type { AnsemMarketSnapshot } from "@/lib/ansemMarketApi";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | null | undefined;
  format: (n: number) => string;
  icon: typeof Activity;
  deltaMode?: boolean;
  sublabel?: string;
}

function StatCard({ label, value, format, icon: Icon, deltaMode, sublabel }: StatCardProps) {
  return (
    <div className={cn(overviewCardShell, "p-4 sm:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {label}
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            <AnimatedMetric value={value} format={format} deltaMode={deltaMode} />
          </p>
          {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted/40 ring-1 ring-border/40">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </span>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return <AnsemStatCardSkeleton />;
}

function formatPrice(n: number): string {
  if (n >= 0.01) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  return `$${n.toExponential(2)}`;
}

function formatHolders(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function AnsemStatGrid({
  market,
  holderCount,
  holdersLoading,
  isLoading,
  className,
}: {
  market?: AnsemMarketSnapshot;
  holderCount?: number | null;
  holdersLoading?: boolean;
  isLoading: boolean;
  className?: string;
}) {
  if (isLoading && !market) {
    return (
      <div className={cn("grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      <StatCard
        label="Price"
        value={market?.priceUsd}
        format={formatPrice}
        icon={Activity}
        deltaMode
      />
      <StatCard
        label="Market cap"
        value={market?.marketCapUsd}
        format={formatCompactUsd}
        icon={BarChart3}
        deltaMode
      />
      <StatCard
        label="Liquidity"
        value={market?.liquidityUsd}
        format={formatCompactUsd}
        icon={Droplets}
        deltaMode
      />
      <StatCard
        label="24h volume"
        value={market?.volume24hUsd}
        format={formatCompactUsd}
        icon={Wallet}
        deltaMode
      />
      <StatCard
        label="24h change"
        value={market?.priceChange24hPercent}
        format={formatPct}
        icon={TrendingUp}
        deltaMode
        sublabel={
          market?.priceChange1hPercent != null
            ? `${formatPct(market.priceChange1hPercent)} 1h`
            : undefined
        }
      />
      {holdersLoading && holderCount == null ? (
        <AnsemStatCardSkeleton />
      ) : (
        <StatCard
          label="Holders"
          value={holderCount}
          format={formatHolders}
          icon={Users}
          sublabel={holdersLoading && holderCount == null ? "Fetching on-chain…" : undefined}
        />
      )}
    </div>
  );
}
